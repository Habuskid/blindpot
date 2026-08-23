// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, eaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
import {BlindDraw} from "../BlindDraw.sol";

/**
 * @title BlindpotVault
 * @notice Vault for confidential deposits on the fhEVM.
 */
contract BlindpotVault is ZamaEthereumConfig, IERC7984Receiver {
    
    ERC7984 public immutable confidentialToken;
    BlindDraw public immutable draw;

    uint256 public memberCount;

    // We cap at 25 members due to HCU depth limits on the Sepolia coprocessor
    uint256 public constant MAX_MEMBERS = 25;

    // Track if a user is already in the pool to enforce the cap properly
    mapping(address => bool) public isMember;

    uint256 public currentDrawId;
    
    // Map drawId to the encrypted address of the winner
    mapping(uint256 => eaddress) private drawWinners;
    // Map drawId to the pot size
    mapping(uint256 => uint256) private drawPots;
    // Map drawId => user address => encrypted boolean (has claimed?)
    mapping(uint256 => mapping(address => ebool)) private hasClaimed;
    // Map drawId => user address => encrypted winnings handle (for EIP-712)
    mapping(uint256 => mapping(address => euint64)) private userWinnings;

    constructor(address _confidentialToken) {
        confidentialToken = ERC7984(_confidentialToken);
        draw = new BlindDraw();
    }

    /**
     * @notice ERC7984 Receiver Hook for Deposits
     * @dev Called automatically when users use `token.confidentialTransferAndCall(vault, amount, "")`
     * This fixes the silent-zero bug, because `amount` is the ACTUAL clamped amount transferred.
     */
    function onConfidentialTransferReceived(
        address /*operator*/,
        address from,
        euint64 amount,
        bytes calldata /*data*/
    ) external returns (ebool) {
        require(msg.sender == address(confidentialToken), "Only valid token");

        // Let the draw contract read the handle
        FHE.allowTransient(amount, address(draw));

        // If new member, enforce cap
        if (!isMember[from]) {
            require(memberCount < MAX_MEMBERS, "Pool is full");
            isMember[from] = true;
            memberCount++;
        }

        // Add tickets to the draw
        draw.addMember(from, amount);

        ebool ret = FHE.asEbool(true);
        FHE.allowTransient(ret, msg.sender);
        return ret;
    }

    /**
     * @notice Withdraw full principal at any time without loss.
     * Removes the risk of underflow since it queries exact balance.
     */
    function withdrawAll() external {
        euint64 currentBalance = draw.getBalance(msg.sender);

        // Remove tickets from the draw (draw already owns currentBalance)
        draw.removeMember(msg.sender, currentBalance);

        // Push the token back to the user.
        // Vault must own the ciphertext to grant access to the token contract.
        euint64 vaultOwnedBalance = FHE.add(currentBalance, FHE.asEuint64(0));
        FHE.allowTransient(vaultOwnedBalance, address(confidentialToken));
        confidentialToken.confidentialTransfer(msg.sender, vaultOwnedBalance);
    }

    /**
     * @notice Trigger the confidential draw for a winner.
     */
    function drawWinner() external {
        eaddress winnerHandle = draw.drawWinner(MAX_MEMBERS);
        
        currentDrawId++;
        drawWinners[currentDrawId] = winnerHandle;
        
        // Mock the pot size as 10 tokens for testing
        uint256 mockPot = 10;
        drawPots[currentDrawId] = mockPot;

        // Precompute winnings for all members so they can decrypt via EIP-712 without paying gas
        uint256 len = draw.getMembersLength();
        for (uint i = 0; i < len; i++) {
            address memberUser = draw.getMember(i);
            ebool isWinner = FHE.eq(winnerHandle, FHE.asEaddress(memberUser));
            euint64 winnings = FHE.select(isWinner, FHE.asEuint64(uint64(mockPot)), FHE.asEuint64(0));
            userWinnings[currentDrawId][memberUser] = winnings;
            // Allow this contract and the member to decrypt
            FHE.allowThis(winnings);
            FHE.allow(winnings, memberUser);
        }
    }

    /**
     * @notice Claim winnings without decrypting the winner's address on-chain.
     * @param drawId The ID of the draw to claim from.
     */
    function claimWinnings(uint256 drawId) external {
        euint64 amountToPay = userWinnings[drawId][msg.sender];
        require(FHE.isInitialized(amountToPay), "Draw not ready or not member");

        ebool alreadyClaimed = hasClaimed[drawId][msg.sender];
        if (!FHE.isInitialized(alreadyClaimed)) {
            alreadyClaimed = FHE.asEbool(false);
        }

        ebool canClaim = FHE.not(alreadyClaimed);
        euint64 safeAmountToPay = FHE.select(canClaim, amountToPay, FHE.asEuint64(0));

        hasClaimed[drawId][msg.sender] = FHE.select(canClaim, FHE.asEbool(true), alreadyClaimed);
        FHE.allowThis(hasClaimed[drawId][msg.sender]);

        // Transfer confidentially! (Transfers 0 silently if they didn't win or already claimed)
        FHE.allowTransient(safeAmountToPay, address(confidentialToken));
        confidentialToken.confidentialTransfer(msg.sender, safeAmountToPay);
    }

    /**
     * @notice Get encrypted winnings for EIP-712 Permit user decryption.
     * @param drawId The draw ID
     * @param user The user address
     * @return The encrypted amount won
     */
    function getEncryptedWinnings(uint256 drawId, address user) external view returns (euint64) {
        return userWinnings[drawId][user];
    }

    /**
     * @notice Get encrypted balance for EIP-712 Permit user decryption.
     * @param user The user address
     * @return The encrypted current deposit balance
     */
    function getEncryptedBalance(address user) external view returns (euint64) {
        return draw.getEncryptedBalance(user);
    }
}

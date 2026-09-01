// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, eaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
import {BlindDraw} from "../BlindDraw.sol";
import {IYieldSource} from "../yield/IYieldSource.sol";

/**
 * @title BlindpotVault
 * @notice Vault for confidential deposits on the fhEVM with autonomous epochs,
 * external yield harvesting (Aave / ERC-4626), and direct prize pool funding.
 */
contract BlindpotVault is ZamaEthereumConfig, IERC7984Receiver {
    
    ERC7984 public immutable confidentialToken;
    BlindDraw public immutable draw;
    address public owner;

    uint256 public memberCount;

    // We cap at 25 members due to HCU depth limits on the Sepolia coprocessor
    uint256 public constant MAX_MEMBERS = 25;

    // Track if a user is currently in the pool
    mapping(address => bool) public isMember;

    uint256 public currentDrawId;

    // Time-locked Epoch configuration (Default: 600s / 10 minutes)
    uint256 public drawInterval = 600;
    uint256 public nextDrawTime;
    
    // Optional external yield source (e.g. ERC4626YieldAdapter routing to Aave/Compound)
    IYieldSource public yieldSource;
    
    // Accumulated manual / sponsor prize pool balance
    uint256 public accumulatedPrizePool;
    
    // Base guaranteed floor prize per round (e.g., 10 USDC)
    uint256 public baseRoundPrize = 10 * 10 ** 6;

    // Map drawId to the encrypted address of the winner
    mapping(uint256 => eaddress) private drawWinners;
    // Map drawId to the pot size
    mapping(uint256 => uint256) private drawPots;
    // Map drawId => user address => encrypted boolean (has claimed?)
    mapping(uint256 => mapping(address => ebool)) private hasClaimed;
    // Map drawId => user address => encrypted winnings handle (for EIP-712)
    mapping(uint256 => mapping(address => euint64)) private userWinnings;

    // Reentrancy Guard state
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    event DrawExecuted(uint256 indexed drawId, uint256 timestamp, uint256 potSize);
    event MemberJoined(address indexed user, uint256 totalMembers);
    event MemberWithdrawn(address indexed user, uint256 totalMembers);
    event PrizePoolFunded(address indexed funder, uint256 amount, uint256 newTotal);
    event YieldSourceUpdated(address indexed newYieldSource);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _confidentialToken) {
        owner = msg.sender;
        confidentialToken = ERC7984(_confidentialToken);
        draw = new BlindDraw();
        nextDrawTime = block.timestamp + drawInterval;
        _status = _NOT_ENTERED;
    }

    /**
     * @notice ERC7984 Receiver Hook for Deposits
     * @dev Called automatically when users use `token.confidentialTransferAndCall(vault, amount, "")`
     */
    function onConfidentialTransferReceived(
        address /*operator*/,
        address from,
        euint64 amount,
        bytes calldata /*data*/
    ) external nonReentrant returns (ebool) {
        require(msg.sender == address(confidentialToken), "Only valid token");

        // Let the draw contract read the handle
        FHE.allowTransient(amount, address(draw));

        // If new member, enforce cap
        if (!isMember[from]) {
            require(memberCount < MAX_MEMBERS, "Pool is full");
            isMember[from] = true;
            memberCount++;
            emit MemberJoined(from, memberCount);
        }

        // Add tickets to the draw
        draw.addMember(from, amount);

        ebool ret = FHE.asEbool(true);
        FHE.allowTransient(ret, msg.sender);
        return ret;
    }

    /**
     * @notice Fund the vault prize pool directly (from sponsor, DAO treasury, or foundation grant).
     * @param amount The amount of prize funding added.
     */
    function fundPrizePool(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        accumulatedPrizePool += amount;
        emit PrizePoolFunded(msg.sender, amount, accumulatedPrizePool);
    }

    /**
     * @notice Set or update the external yield adapter (Aave / Compound / ERC-4626).
     */
    function setYieldSource(address _yieldSource) external onlyOwner {
        yieldSource = IYieldSource(_yieldSource);
        emit YieldSourceUpdated(_yieldSource);
    }

    /**
     * @notice Withdraw full principal at any time without loss.
     * Cleanly resets membership status and decrements active capacity count.
     */
    function withdrawAll() external nonReentrant {
        require(isMember[msg.sender], "Not an active pool depositor");
        
        euint64 currentBalance = draw.getBalance(msg.sender);

        // Remove tickets from the draw
        draw.removeMember(msg.sender, currentBalance);

        // Reset membership status and decrement active count
        isMember[msg.sender] = false;
        if (memberCount > 0) {
            memberCount--;
        }
        emit MemberWithdrawn(msg.sender, memberCount);

        // Push the token back to the user.
        euint64 vaultOwnedBalance = FHE.add(currentBalance, FHE.asEuint64(0));
        FHE.allowTransient(vaultOwnedBalance, address(confidentialToken));
        confidentialToken.confidentialTransfer(msg.sender, vaultOwnedBalance);
    }

    /**
     * @notice Trigger the confidential draw for a winner.
     * Permissionless: anyone, a keeper bot, or community member can execute once the epoch elapses.
     */
    function drawWinner() external nonReentrant {
        require(block.timestamp >= nextDrawTime, "Epoch draw interval not reached");
        require(memberCount > 0, "No active depositors in pool");

        // 1. Harvest yield from external lending adapter if configured
        uint256 harvestedYield = 0;
        if (address(yieldSource) != address(0)) {
            try yieldSource.harvestYield() returns (uint256 harvested) {
                harvestedYield = harvested;
            } catch {
                harvestedYield = 0;
            }
        }

        eaddress winnerHandle = draw.drawWinner(MAX_MEMBERS);
        
        currentDrawId++;
        drawWinners[currentDrawId] = winnerHandle;
        
        // Reset next draw time to next epoch interval
        nextDrawTime = block.timestamp + drawInterval;

        // Calculate round prize: base guaranteed floor + harvested lending yield + fraction of accumulated pot
        uint256 roundPot = baseRoundPrize + harvestedYield;
        if (accumulatedPrizePool > 0) {
            uint256 sponsorBonus = accumulatedPrizePool / 10; // 10% of sponsor pot per round
            if (sponsorBonus > 0) {
                roundPot += sponsorBonus;
                accumulatedPrizePool -= sponsorBonus;
            }
        }
        drawPots[currentDrawId] = roundPot;

        // Precompute winnings for all members so they can decrypt via EIP-712 without paying gas
        uint256 len = draw.getMembersLength();
        for (uint i = 0; i < len; i++) {
            address memberUser = draw.getMember(i);
            ebool isWinner = FHE.eq(winnerHandle, FHE.asEaddress(memberUser));
            euint64 winnings = FHE.select(isWinner, FHE.asEuint64(uint64(roundPot / 10**6)), FHE.asEuint64(0));
            userWinnings[currentDrawId][memberUser] = winnings;
            
            // Allow this contract and the member to decrypt
            FHE.allowThis(winnings);
            FHE.allow(winnings, memberUser);
        }

        emit DrawExecuted(currentDrawId, block.timestamp, roundPot);
    }

    /**
     * @notice Helper to check seconds remaining until next draw epoch.
     */
    function timeUntilNextDraw() external view returns (uint256) {
        if (block.timestamp >= nextDrawTime) {
            return 0;
        }
        return nextDrawTime - block.timestamp;
    }

    /**
     * @notice Claim winnings without decrypting the winner's address on-chain.
     * @param drawId The ID of the draw to claim from.
     */
    function claimWinnings(uint256 drawId) external nonReentrant {
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
     */
    function getEncryptedWinnings(uint256 drawId, address user) external view returns (euint64) {
        return userWinnings[drawId][user];
    }

    /**
     * @notice Get encrypted balance for EIP-712 Permit user decryption.
     */
    function getEncryptedBalance(address user) external view returns (euint64) {
        return draw.getEncryptedBalance(user);
    }
}

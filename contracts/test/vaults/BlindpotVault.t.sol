// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-fhevm/FhevmTest.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {BlindpotVault} from "../../src/vaults/BlindpotVault.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";

// Mock token for testing 
contract MockERC7984 is ZamaEthereumConfig {
    function confidentialTransferFrom(address, address, euint64) external pure returns (bool) {
        return true;
    }
    function confidentialTransfer(address, euint64) external pure returns (bool) {
        return true;
    }
    function confidentialTransferAndCall(address to, uint64 clearAmount, bytes calldata data) external returns (bool) {
        euint64 amount = FHE.asEuint64(clearAmount);
        FHE.allowTransient(amount, to);
        IERC7984Receiver(to).onConfidentialTransferReceived(msg.sender, msg.sender, amount, data);
        return true;
    }
}

contract BlindpotVaultTest is FhevmTest, ZamaEthereumConfig {
    BlindpotVault public vault;
    MockERC7984 public mockToken;

    function setUp() public override {
        super.setUp();
        mockToken = new MockERC7984();
        vault = new BlindpotVault(address(mockToken));
    }

    function test_vaultFlow() public {
        vm.prank(address(1));
        // Use the new hook!
        mockToken.confidentialTransferAndCall(address(vault), 10, "");

        // Advance past epoch interval (600s)
        vm.warp(block.timestamp + 601);

        vault.drawWinner();

        vm.prank(address(1));
        vault.claimWinnings(1);
        
        // And test withdrawAll
        vm.prank(address(1));
        vault.withdrawAll();
    }

    function test_withdrawMidDraw() public {
        // Test withdraw succeeds without loss per contracts.md
        vm.prank(address(2));
        mockToken.confidentialTransferAndCall(address(vault), 25, "");

        assertTrue(vault.isMember(address(2)));

        vm.prank(address(2));
        vault.withdrawAll();

        assertFalse(vault.isMember(address(2)));
    }
}

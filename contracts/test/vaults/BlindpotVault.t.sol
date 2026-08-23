// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-fhevm/FhevmTest.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {BlindpotVault} from "../../src/vaults/BlindpotVault.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";

// Mock token for testing 
contract MockERC7984 {
    function confidentialTransferFrom(address, address, euint64) external pure returns (bool) {
        return true;
    }
    function confidentialTransfer(address, euint64) external pure returns (bool) {
        return true;
    }
    function confidentialTransferAndCall(address to, euint64 amount, bytes calldata data) external returns (bool) {
        // Just call the hook on the vault
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
        euint64 amount = FHE.asEuint64(10);
        FHE.allowTransient(amount, address(vault));
        
        vm.prank(address(1));
        // Use the new hook!
        mockToken.confidentialTransferAndCall(address(vault), amount, "");

        vault.drawWinner();

        vm.prank(address(1));
        vault.claimWinnings(1);
        
        // And test withdrawAll
        vm.prank(address(1));
        vault.withdrawAll();
    }
}

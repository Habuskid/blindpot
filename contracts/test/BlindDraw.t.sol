// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-fhevm/FhevmTest.sol";
import {FHE, euint64, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "../src/BlindDraw.sol";

contract BlindDrawTest is FhevmTest, ZamaEthereumConfig {
    BlindDraw public draw;

    function setUp() public override {
        super.setUp();
        draw = new BlindDraw();
    }

    function addMemberAsVault(address user, uint64 tickets) external {
        euint64 balance = FHE.asEuint64(tickets);
        FHE.allowTransient(balance, address(draw));
        draw.addMember(user, balance);
    }

    function test_drawWinner10() public {
        uint256 members = 10;
        
        for(uint160 i = 1; i <= members; i++) {
            // Allocate 10 tickets per member
            this.addMemberAsVault(address(i), 10);
        }

        uint256 gasStart = gasleft();
        draw.drawWinner(members);
        uint256 gasEnd = gasleft();
        
        uint256 gasUsed = gasStart - gasEnd;
        console.log("Gas used for N=10 members:", gasUsed);

        eaddress winner = draw.currentWinner();
        address decryptedWinner = decrypt(winner);
        console.log("Decrypted winner (N=10):", decryptedWinner);
    }


}

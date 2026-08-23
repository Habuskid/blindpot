// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "forge-fhevm/FhevmTest.sol";

contract FHEMathTest is FhevmTest, ZamaEthereumConfig {
    function test_div_mul() public {
        euint64 R = FHE.asEuint64(2000000000);
        euint64 totalTickets = FHE.asEuint64(10);
        euint64 product = FHE.mul(R, totalTickets);
        euint64 drawn = FHE.div(product, uint64(4294967296));
        
        uint64 decrypted = decrypt(drawn);
        assertEq(decrypted, 4);
    }
}

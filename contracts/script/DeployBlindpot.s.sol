// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BlindpotVault} from "../src/vaults/BlindpotVault.sol";

contract DeployBlindpot is Script {
    // Sepolia cUSDCMock wrapper according to Zama Protocol addresses
    address public constant cUSDCMock = 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639;

    function run() public {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Vault which automatically deploys the BlindDraw contract
        BlindpotVault vault = new BlindpotVault(cUSDCMock);

        vm.stopBroadcast();

        console2.log("=== Deployment Successful ===");
        console2.log("BlindpotVault Address:", address(vault));
        console2.log("BlindDraw Address:    ", address(vault.draw()));
        console2.log("cUSDCMock Token:      ", cUSDCMock);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FhevmTest} from "forge-fhevm/FhevmTest.sol";
import {FHECounter} from "../src/FHECounter.sol";
import {euint32, externalEuint32} from "encrypted-types/EncryptedTypes.sol";

contract FHECounterTest is FhevmTest {
    FHECounter counter;
    address counterAddress;
    Account alice;

    function setUp() public override {
        super.setUp();
        counter = new FHECounter();
        counterAddress = address(counter);
        alice = makeAccount("alice");
    }

    /// @dev Signs the user-decrypt request with `userPk` and decrypts `handle` in one step.
    function userDecryptAs(uint256 userPk, bytes32 handle, address contractAddress) internal returns (uint256) {
        bytes memory sig = signUserDecrypt(userPk, contractAddress);
        return userDecrypt(handle, vm.addr(userPk), contractAddress, sig);
    }

    function test_encryptedCountShouldBeUninitializedAfterDeployment() public view {
        // Expect initial count to be bytes32(0) after deployment,
        // (meaning the encrypted count value is uninitialized)
        assertEq(euint32.unwrap(counter.getCount()), bytes32(0));
    }

    function test_incrementTheCounterByOne() public {
        euint32 encryptedCountBeforeInc = counter.getCount();
        assertEq(euint32.unwrap(encryptedCountBeforeInc), bytes32(0));
        uint256 clearCountBeforeInc = 0;

        // Encrypt constant 1 as a euint32
        uint32 clearOne = 1;
        (externalEuint32 encryptedOne, bytes memory inputProof) = encryptUint32(clearOne, alice.addr, counterAddress);

        vm.prank(alice.addr);
        counter.increment(encryptedOne, inputProof);

        euint32 encryptedCountAfterInc = counter.getCount();
        uint256 clearCountAfterInc = userDecryptAs(alice.key, euint32.unwrap(encryptedCountAfterInc), counterAddress);

        assertEq(clearCountAfterInc, clearCountBeforeInc + clearOne);
    }

    function test_decrementTheCounterByOne() public {
        // Encrypt constant 1 as a euint32
        uint32 clearOne = 1;
        (externalEuint32 encryptedOne, bytes memory inputProof) = encryptUint32(clearOne, alice.addr, counterAddress);

        // First increment by 1, count becomes 1
        vm.prank(alice.addr);
        counter.increment(encryptedOne, inputProof);

        // Then decrement by 1, count goes back to 0
        (externalEuint32 encryptedOneDec, bytes memory inputProofDec) =
            encryptUint32(clearOne, alice.addr, counterAddress);
        vm.prank(alice.addr);
        counter.decrement(encryptedOneDec, inputProofDec);

        euint32 encryptedCountAfterDec = counter.getCount();
        uint256 clearCountAfterDec = userDecryptAs(alice.key, euint32.unwrap(encryptedCountAfterDec), counterAddress);

        assertEq(clearCountAfterDec, 0);
    }
}

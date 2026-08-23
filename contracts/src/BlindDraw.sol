// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, euint160, ebool, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract BlindDraw is ZamaEthereumConfig {

    struct Member {
        address user;
        euint64 balance; // In tickets
    }

    Member[] public members;

    // Total tickets across all members
    euint64 public totalTickets;

    // We use a plaintext divisor to scale random numbers uniformly across total tickets
    uint64 public constant RAND_DIVISOR = 4294967296; // 2**32
    
    eaddress public currentWinner;

    function addMember(address _user, euint64 _balance) public {
        if (!FHE.isInitialized(totalTickets)) {
            totalTickets = FHE.asEuint64(0);
        }
        totalTickets = FHE.add(totalTickets, _balance);
        FHE.allowThis(totalTickets);

        for (uint i = 0; i < members.length; i++) {
            if (members[i].user == _user) {
                members[i].balance = FHE.add(members[i].balance, _balance);
                FHE.allowThis(members[i].balance);
                FHE.allow(members[i].balance, _user);
                return;
            }
        }
        members.push(Member(_user, _balance));
        FHE.allowThis(members[members.length - 1].balance);
        FHE.allow(members[members.length - 1].balance, _user);
    }

    function removeMember(address _user, euint64 _balanceToRemove) public {
        totalTickets = FHE.sub(totalTickets, _balanceToRemove);
        FHE.allowThis(totalTickets);

        for (uint i = 0; i < members.length; i++) {
            if (members[i].user == _user) {
                members[i].balance = FHE.sub(members[i].balance, _balanceToRemove);
                FHE.allowThis(members[i].balance);
                FHE.allow(members[i].balance, _user);
                break;
            }
        }
    }

    function getBalance(address _user) public returns (euint64) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].user == _user) {
                euint64 bal = members[i].balance;
                FHE.allowTransient(bal, msg.sender);
                return bal;
            }
        }
        euint64 zero = FHE.asEuint64(0);
        FHE.allowTransient(zero, msg.sender);
        return zero;
    }

    function getEncryptedBalance(address _user) public view returns (euint64) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].user == _user) {
                return members[i].balance;
            }
        }
        revert("Not a member");
    }

    function getMembersLength() public view returns (uint256) {
        return members.length;
    }

    function getMember(uint256 index) public view returns (address) {
        return members[index].user;
    }

    // Weighted selection loop
    function drawWinner(uint256 maxMembers) public returns (eaddress) {
        require(members.length <= maxMembers, "Too many members");
        require(FHE.isInitialized(totalTickets), "No tickets");

        // R is drawn uniformly from [0, 2**32)
        euint64 R = FHE.asEuint64(FHE.randEuint32()); 
        
        // Scale to [0, totalTickets) securely without modulo
        euint64 drawn = FHE.div(FHE.mul(R, totalTickets), RAND_DIVISOR);

        eaddress winner = FHE.asEaddress(address(0));
        ebool winnerFound = FHE.asEbool(false);

        // O(N) loop to select the winner
        euint64 currentCumulative = FHE.asEuint64(0);
        for (uint i = 0; i < maxMembers; i++) {
            if (i >= members.length) break;

            Member memory m = members[i];
            
            // Dynamically calculate prefix sum
            currentCumulative = FHE.add(currentCumulative, m.balance);

            // If drawn ticket < currentCumulative AND we haven't found a winner yet
            ebool isWinner = FHE.and(FHE.lt(drawn, currentCumulative), FHE.not(winnerFound));

            // Select this member's address if they are the winner, else keep current winner
            eaddress memberEaddress = FHE.asEaddress(m.user);
            winner = FHE.select(isWinner, memberEaddress, winner);
            
            winnerFound = FHE.or(winnerFound, isWinner);
        }

        currentWinner = winner;
        FHE.allowThis(currentWinner);
        FHE.allow(currentWinner, msg.sender);
        
        return currentWinner;
    }
}

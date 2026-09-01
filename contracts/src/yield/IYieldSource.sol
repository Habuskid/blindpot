// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IYieldSource
 * @notice Standard interface for connecting BlindpotVault to external low-risk yield generators.
 * (e.g. Aave v3, Compound v3, Morpho, or ERC-4626 tokenized vaults).
 */
interface IYieldSource {
    /**
     * @notice Deposit pooled underlying principal into the external lending protocol.
     * @param amount Amount of underlying assets to supply for yield generation.
     */
    function supply(uint256 amount) external returns (uint256 sharesReceived);

    /**
     * @notice Redeem underlying principal from the lending protocol on depositor withdrawal.
     * @param amount Amount of underlying assets to withdraw.
     * @param recipient Address receiving the redeemed underlying assets.
     */
    function redeem(uint256 amount, address recipient) external returns (uint256 amountRedeemed);

    /**
     * @notice Harvest accrued interest / yield to fund the next epoch's prize pot.
     * @return harvestedYield The net yield generated since the last epoch draw.
     */
    function harvestYield() external returns (uint256 harvestedYield);

    /**
     * @notice Total underlying balance currently deployed in the yield source.
     */
    function totalUnderlyingSupplied() external view returns (uint256);
}

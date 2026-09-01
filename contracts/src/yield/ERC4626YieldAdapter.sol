// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldSource} from "./IYieldSource.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC4626 is IERC20 {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
}

/**
 * @title ERC4626YieldAdapter
 * @notice Production yield adapter routing Blindpot deposits to any ERC-4626 compliant lending vault
 * (e.g., Aave v3 ERC-4626 wrappers, Compound v3, or Morpho Blue markets).
 */
contract ERC4626YieldAdapter is IYieldSource {
    address public immutable vault;
    IERC4626 public immutable yieldVault;
    IERC20 public immutable underlyingAsset;

    uint256 public principalSupplied;

    modifier onlyVault() {
        require(msg.sender == vault, "Only BlindpotVault authorized");
        _;
    }

    constructor(address _vault, address _yieldVault) {
        vault = _vault;
        yieldVault = IERC4626(_yieldVault);
        underlyingAsset = IERC20(IERC4626(_yieldVault).asset());
    }

    /**
     * @notice Supplies underlying assets to the ERC-4626 lending vault.
     */
    function supply(uint256 amount) external onlyVault returns (uint256 sharesReceived) {
        require(underlyingAsset.transferFrom(vault, address(this), amount), "Transfer failed");
        underlyingAsset.approve(address(yieldVault), amount);
        sharesReceived = yieldVault.deposit(amount, address(this));
        principalSupplied += amount;
    }

    /**
     * @notice Redeems underlying principal when depositors withdraw.
     */
    function redeem(uint256 amount, address recipient) external onlyVault returns (uint256 amountRedeemed) {
        require(amount <= principalSupplied, "Exceeds supplied principal");
        yieldVault.withdraw(amount, recipient, address(this));
        principalSupplied -= amount;
        return amount;
    }

    /**
     * @notice Harvests interest generated beyond the tracked principal.
     * The harvested yield is transferred to the BlindpotVault to fund the epoch prize pot.
     */
    function harvestYield() external onlyVault returns (uint256 harvestedYield) {
        uint256 totalValue = yieldVault.convertToAssets(yieldVault.balanceOf(address(this)));
        if (totalValue > principalSupplied) {
            harvestedYield = totalValue - principalSupplied;
            yieldVault.withdraw(harvestedYield, vault, address(this));
        }
    }

    /**
     * @notice Total underlying assets managed by this adapter.
     */
    function totalUnderlyingSupplied() external view returns (uint256) {
        return yieldVault.convertToAssets(yieldVault.balanceOf(address(this)));
    }
}

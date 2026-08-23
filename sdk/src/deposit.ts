import { useConfidentialTransferAndCall, useShield } from "@zama-fhe/react-sdk";
import { type Address } from "viem";

export function useDeposit(wrapperAddress: Address) {
  // 1. Shield hook: converts public ERC-20 into confidential ERC-7984 wrapper tokens
  const { mutateAsync: shieldMutate, isPending: isShielding, error: shieldError } = useShield({
    address: wrapperAddress,
  });

  // 2. Confidential Transfer & Call hook: deposits confidential ERC-7984 tokens to the Vault
  const { mutateAsync: transferAndCall, isPending: isDepositing, error: depositError } = useConfidentialTransferAndCall({
    address: wrapperAddress,
  });

  const shieldTokens = async (amountInBaseUnits: bigint) => {
    return await shieldMutate({ amount: amountInBaseUnits });
  };

  const depositToVault = async (vaultAddress: Address, amountInBaseUnits: bigint) => {
    return await transferAndCall({
      to: vaultAddress,
      amount: amountInBaseUnits,
      data: "0x",
    });
  };

  return {
    shieldTokens,
    depositToVault,
    isShielding,
    isDepositing,
    isPending: isShielding || isDepositing,
    error: shieldError || depositError,
  };
}

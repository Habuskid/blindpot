import { useConfidentialTransferAndCall } from "@zama-fhe/react-sdk";
import { type Address } from "viem";

export function useDeposit(tokenAddress: Address) {
  // We use useConfidentialTransferAndCall to natively encrypt the amount
  // bound to the tokenAddress, and execute the transferAndCall to the Vault.
  const { mutateAsync: transferAndCall, isPending, error } = useConfidentialTransferAndCall({
    address: tokenAddress,
  });

  const deposit = async (vaultAddress: Address, amount: number) => {
    // The SDK handles encrypting `amount` and sending the transaction.
    // The empty string "" represents the `data` parameter.
    const tx = await transferAndCall({
      to: vaultAddress,
      amount: BigInt(amount),
      data: "0x",
    });
    return tx;
  };

  return {
    deposit,
    isPending,
    error,
  };
}

import { useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { type Address } from "viem";

import { BLINDPOT_VAULT_ABI } from "./abi";

export function useWithdraw() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const withdraw = async (vaultAddress: Address) => {
    const tx = await writeContractAsync({
      chainId: sepolia.id,
      address: vaultAddress,
      abi: BLINDPOT_VAULT_ABI,
      functionName: "withdrawAll",
    } as any);
    return tx;
  };

  return {
    withdraw,
    isPending,
    error,
  };
}

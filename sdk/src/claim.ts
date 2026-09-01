import { useWriteContract } from "wagmi";
import { type Address } from "viem";

import { BLINDPOT_VAULT_ABI } from "./abi";

export function useClaim() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const claim = async (vaultAddress: Address, drawId: bigint) => {
    const tx = await writeContractAsync({
      address: vaultAddress,
      abi: BLINDPOT_VAULT_ABI,
      functionName: "claimWinnings",
      args: [drawId],
    } as any);
    return tx;
  };

  return {
    claim,
    isPending,
    error,
  };
}

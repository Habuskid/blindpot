import { useWriteContract } from "wagmi";
import { type Address } from "viem";

const vaultAbi = [
  {
    type: "function",
    name: "claimWinnings",
    inputs: [{ type: "uint256", name: "drawId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export function useClaim() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const claim = async (vaultAddress: Address, drawId: bigint) => {
    const tx = await writeContractAsync({
      address: vaultAddress,
      abi: vaultAbi,
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

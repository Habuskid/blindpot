import { useWriteContract } from "wagmi";
import { type Address } from "viem";

const vaultAbi = [
  {
    type: "function",
    name: "withdrawAll",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export function useWithdraw() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const withdraw = async (vaultAddress: Address) => {
    const tx = await writeContractAsync({
      address: vaultAddress,
      abi: vaultAbi,
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

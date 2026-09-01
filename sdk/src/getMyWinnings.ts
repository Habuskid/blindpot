import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useReadContract, useAccount } from "wagmi";
import { type Address } from "viem";

const vaultAbi = [
  {
    type: "function",
    name: "getEncryptedWinnings",
    inputs: [{ type: "uint256", name: "drawId" }, { type: "address", name: "user" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
] as const;

export function useGetMyWinnings(vaultAddress: Address, drawId: bigint) {
  const { address: account } = useAccount();

  // 1. Fetch the encrypted handle from the Vault
  const { data: encryptedHandle, refetch } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "getEncryptedWinnings",
    args: account ? [drawId, account] : undefined,
    query: {
      enabled: !!account,
    },
  });

  // 2. Check if the user has already granted an EIP-712 permit for the Vault in this session
  const { data: hasPermit } = useHasPermit({
    contractAddresses: [vaultAddress],
  });

  // 3. The mutation to grant a permit (prompts the wallet)
  const { mutateAsync: grantPermit, isPending: isGrantingPermit } = useGrantPermit();

  const handleGrantPermit = async () => {
    await grantPermit([vaultAddress]);
  };

  // 4. Decrypt the handle using the permit (KMS fetch)
  const hasValidHandle = encryptedHandle !== undefined && encryptedHandle > 0n;
  const formattedHandle = hasValidHandle
    ? (`0x${encryptedHandle.toString(16).padStart(64, "0")}` as `0x${string}`)
    : undefined;

  const { data: decryptedValues, isLoading: isDecrypting } = useDecryptValues(
    formattedHandle ? [{ encryptedValue: formattedHandle, contractAddress: vaultAddress }] : [],
    {
      enabled: !!hasPermit && !!formattedHandle,
    }
  );

  let decryptedWinnings: number | undefined = undefined;
  if (hasPermit) {
    if (encryptedHandle === 0n) {
      decryptedWinnings = 0;
    } else if (formattedHandle && decryptedValues?.[formattedHandle] !== undefined) {
      const raw = Number(decryptedValues[formattedHandle]);
      decryptedWinnings = raw >= 1_000_000 ? raw / 1_000_000 : raw;
    }
  }

  return {
    encryptedHandle: formattedHandle,
    decryptedWinnings,
    hasPermit,
    isGrantingPermit,
    isDecrypting,
    handleGrantPermit,
    refetchHandle: refetch,
  };
}

import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useReadContract, useAccount } from "wagmi";
import { type Address } from "viem";

const vaultAbi = [
  {
    type: "function",
    name: "getEncryptedBalance",
    inputs: [{ type: "address", name: "user" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
] as const;

export function useGetMyBalance(vaultAddress: Address) {
  const { address: account } = useAccount();

  // 1. Fetch the encrypted handle from the Vault
  const { data: encryptedHandle, refetch } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "getEncryptedBalance",
    args: account ? [account] : undefined,
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
  // We format the encrypted handle to be parsed by `useDecryptValues`
  // Note: the handle is passed as a `bigint` from wagmi, but `useDecryptValues`
  // expects it as a hex string `0x...`
  const formattedHandle =
    encryptedHandle !== undefined
      ? `0x${encryptedHandle.toString(16).padStart(64, "0")}` as `0x${string}`
      : undefined;

  const { data: decryptedValues, isLoading: isDecrypting } = useDecryptValues(
    formattedHandle ? [{ encryptedValue: formattedHandle, contractAddress: vaultAddress }] : [],
    {
      enabled: !!hasPermit && !!formattedHandle,
    }
  );

  // Zama decrypted values come back as bigint
  const decryptedBalance = decryptedValues?.[0] !== undefined 
    ? Number(decryptedValues[0]) 
    : undefined;

  return {
    encryptedHandle: formattedHandle,
    decryptedBalance,
    hasPermit,
    isGrantingPermit,
    isDecrypting,
    handleGrantPermit,
    refetchHandle: refetch,
  };
}

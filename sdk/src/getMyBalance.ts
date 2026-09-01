import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useReadContract, useAccount } from "wagmi";
import { type Address } from "viem";

import { BLINDPOT_VAULT_ABI } from "./abi";

export function useGetMyBalance(vaultAddress: Address) {
  const { address: account } = useAccount();

  // 1. Fetch the encrypted handle from the Vault
  const { data: encryptedHandle, refetch } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
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

  let decryptedBalance: number | undefined = undefined;
  if (hasPermit) {
    if (encryptedHandle === 0n) {
      decryptedBalance = 0;
    } else if (formattedHandle && decryptedValues?.[formattedHandle] !== undefined) {
      decryptedBalance = Number(decryptedValues[formattedHandle]) / 1_000_000;
    }
  }

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

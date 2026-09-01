import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useReadContract, useAccount } from "wagmi";
import { type Address } from "viem";

import { BLINDPOT_VAULT_ABI } from "./abi";

export function useGetMyBalance(vaultAddress: Address) {
  const { address: account } = useAccount();

  // Read if user is a member
  const { data: isUserMember } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: "isMember",
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  // Read draw contract address
  const { data: drawAddress } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: "draw",
  });

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

  const permitContracts = drawAddress
    ? [vaultAddress, drawAddress as Address]
    : [vaultAddress];

  // 2. Check if the user has already granted an EIP-712 permit in this session
  const { data: hasPermit } = useHasPermit({
    contractAddresses: permitContracts,
  });

  // 3. The mutation to grant a permit (prompts the wallet)
  const { mutateAsync: grantPermit, isPending: isGrantingPermit } = useGrantPermit();

  const handleGrantPermit = async () => {
    await grantPermit(permitContracts);
  };

  // 4. Decrypt the handle using the permit (KMS fetch)
  const hasValidHandle = encryptedHandle !== undefined && encryptedHandle > 0n;
  const formattedHandle = hasValidHandle
    ? (`0x${encryptedHandle.toString(16).padStart(64, "0")}` as `0x${string}`)
    : undefined;

  const targetContract = (drawAddress as Address) || vaultAddress;

  const { data: decryptedValues, isLoading: isDecrypting } = useDecryptValues(
    formattedHandle ? [{ encryptedValue: formattedHandle, contractAddress: targetContract }] : [],
    {
      enabled: !!hasPermit && !!formattedHandle,
    }
  );

  let decryptedBalance: number | undefined = undefined;
  if (hasPermit) {
    if (isUserMember === false || encryptedHandle === 0n || !hasValidHandle) {
      decryptedBalance = 0;
    } else if (formattedHandle) {
      const val = decryptedValues?.[formattedHandle] ?? decryptedValues?.[formattedHandle.toLowerCase() as `0x${string}`];
      if (val !== undefined && val !== null) {
        decryptedBalance = Number(val) / 1_000_000;
      }
    }
  }

  return {
    encryptedHandle: formattedHandle,
    decryptedBalance,
    hasPermit,
    isGrantingPermit,
    isDecrypting: isDecrypting && !!formattedHandle && decryptedBalance === undefined,
    handleGrantPermit,
    refetchHandle: refetch,
  };
}

import { type Address } from "viem";

export const addresses = {
  // The deployed BlindpotVault contract on Ethereum Sepolia
  vault: "0x3f77c490881688ef87e01cbd48010340ca1cea39" as Address,
  // Zama's official cUSDCMock ERC-7984 confidential wrapper on Ethereum Sepolia
  token: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639" as Address,
  // Zama's official mintable underlying test ERC-20 on Ethereum Sepolia
  underlyingToken: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF" as Address,
};

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { addresses } from '../../sdk/src/config';
import { ERC20_ABI } from '../../sdk/src/abi';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { NetworkBanner } from '../components/NetworkBanner';

export default function BlindpotFaucet() {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { writeContractAsync, isPending: isMinting } = useWriteContract();
  const publicClient = usePublicClient();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  const handleSwitchNetwork = async () => {
    setErrorMsg(null);
    setStatusMsg("Prompting wallet to switch to Ethereum Sepolia...");
    try {
      await switchChainAsync({ chainId: sepolia.id });
      setStatusMsg("Network switched to Sepolia! You can now mint test tokens.");
    } catch (err: any) {
      console.error("Switch chain error:", err);
      setErrorMsg(err?.message || "Failed to switch network. Please select Sepolia manually in MetaMask.");
      setStatusMsg(null);
    }
  };

  const handleDirectMint = async () => {
    if (!account) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setTxHash(null);
    setStatusMsg("Submitting on-chain mint transaction on Sepolia (1,000 Test USDC)...");

    try {
      const mintAmount = BigInt(1000 * 10 ** 6);
      const hash = await writeContractAsync({
        chainId: sepolia.id,
        address: addresses.underlyingToken,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [account, mintAmount],
      } as any);

      setTxHash(hash);
      setStatusMsg("Waiting for block confirmation on Sepolia...");

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStatusMsg("1,000 Test USDC successfully minted on Sepolia. You can now wrap and deposit.");
    } catch (e: any) {
      console.error("Mint error:", e);
      setErrorMsg(e?.message || "Mint transaction rejected or failed. Ensure you have Sepolia testnet ETH for gas.");
      setStatusMsg(null);
    }
  };

  return (
    <AuthGuard>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="flex-grow flex items-center justify-center pt-24 pb-20 px-margin-mobile md:px-margin-desktop z-10 relative">
          <div className="w-full max-w-[620px] bg-surface border-2 border-primary hard-shadow-lg p-6 md:p-8 flex flex-col relative mx-auto">
            <div className="absolute top-0 right-0 p-2 border-l-2 border-b-2 border-primary bg-surface-container-low flex items-center gap-1 font-label-mono text-[10px]">
              <span className="material-symbols-outlined text-[12px]">description</span>
              DOC-FCT-001
            </div>

          <div className="mb-6 border-b-2 border-primary pb-4">
            <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Official Zama Testnet Assets</div>
            <h1 className="font-headline-lg text-2xl md:text-3xl uppercase font-bold text-primary mb-2">GET TEST TOKENS</h1>
            <p className="font-body-md text-xs text-on-surface-variant">
              Mint official test USDC tokens directly on-chain on <strong>Ethereum Sepolia Testnet</strong> (Chain ID 11155111).
            </p>
          </div>
              <NetworkBanner />

              <div className="space-y-4 flex-grow">
                <div className="flex flex-col">
                  <label className="font-label-mono text-xs text-on-surface-variant mb-1 uppercase font-bold">
                    Recipient Wallet Address
                  </label>
                  <div className="bg-surface-container-low border-2 border-primary p-3 flex items-center justify-between">
                    <span className="font-value-mono text-sm text-primary truncate mr-4">
                      {account}
                    </span>
                    <span className="material-symbols-outlined text-primary text-[18px] opacity-75">
                      verified_user
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="font-label-mono text-xs text-on-surface-variant mb-1 uppercase font-bold">
                    Verified Sepolia Contracts
                  </label>
                  <div className="border-2 border-primary p-3 space-y-2 bg-surface">
                    <div className="ledger-row flex justify-between py-1 text-xs">
                      <span className="font-label-mono uppercase text-on-surface-variant">Target Network</span>
                      <span className="font-value-mono text-primary font-bold">ETHEREUM SEPOLIA (11155111)</span>
                    </div>
                    <div className="ledger-row flex justify-between py-1 text-xs items-center">
                      <span className="font-label-mono uppercase text-on-surface-variant">cUSDCMock (Wrapper)</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${addresses.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-value-mono text-secondary font-bold hover:underline flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {addresses.token.slice(0, 6)}...{addresses.token.slice(-4)}
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    </div>
                    <div className="flex justify-between py-1 text-xs items-center">
                      <span className="font-label-mono uppercase text-on-surface-variant">Underlying Token (Mintable)</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${addresses.underlyingToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-value-mono text-secondary font-bold hover:underline flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {addresses.underlyingToken.slice(0, 6)}...{addresses.underlyingToken.slice(-4)}
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-error-container border border-error text-error p-3 text-xs font-mono break-words flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {statusMsg && (
                  <div className="bg-surface-container-high border border-primary text-primary p-3 text-xs font-mono flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                      <span>{statusMsg}</span>
                    </div>
                    {txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-bold hover:underline flex items-center gap-1 text-[11px] pt-1"
                      >
                        View Mint Tx on Sepolia Etherscan →
                      </a>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-3">
                  {isWrongNetwork ? (
                    <button
                      onClick={handleSwitchNetwork}
                      disabled={isSwitchingChain}
                      className="w-full bg-error text-surface border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      {isSwitchingChain ? "Switching Network..." : "Switch Wallet to Sepolia First"}
                    </button>
                  ) : (
                    <button
                      onClick={handleDirectMint}
                      disabled={isMinting}
                      className="w-full bg-secondary-container text-primary border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold text-center hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isMinting ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                          Minting 1,000 USDC on Sepolia...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">water_drop</span>
                          Mint 1,000 Test USDC to Wallet
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/deposit"
                      className="flex-1 bg-primary text-surface border-2 border-primary py-2.5 px-3 font-label-mono text-xs uppercase font-bold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-1"
                    >
                      <span>Proceed to Deposit</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-primary/20">
                  <ul className="font-label-mono text-[10px] uppercase text-on-surface-variant space-y-1 opacity-80">
                    <li>* Calls public mint(address, uint256) on Zama Sepolia contract 0x9b5C...DfFF.</li>
                    <li>* Requires Sepolia testnet ETH for gas.</li>
                  </ul>
                </div>
              </div>
            </div>
        </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold text-primary uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/deposit" className="hover:underline">Deposit</Link>
        </div>
      </footer>
      </div>
    </AuthGuard>
  );
}

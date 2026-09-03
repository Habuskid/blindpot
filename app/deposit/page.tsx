"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useDeposit } from '../../sdk/src/deposit';
import { addresses } from '../../sdk/src/config';
import { ERC20_ABI } from '../../sdk/src/abi';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { NetworkBanner } from '../components/NetworkBanner';
import { CircularLoader, OnchainSyncCard, type OnchainPhase } from '../components/BlindpotLoader';

const VAULT_ADDRESS = addresses.vault;
const TOKEN_WRAPPER_ADDRESS = addresses.token;
const UNDERLYING_TOKEN_ADDRESS = addresses.underlyingToken;

const wrapperAbi = [
  {
    type: "function",
    name: "wrap",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bytes32", name: "" }],
    stateMutability: "nonpayable"
  }
] as const;

export default function BlindpotDepositFlow() {
  const [wrapAmount, setWrapAmount] = useState("100");
  const [depositAmount, setDepositAmount] = useState("100");
  const [actionPhase, setActionPhase] = useState<OnchainPhase>("idle");
  const [actionTitle, setActionTitle] = useState<string>("");
  const [actionDesc, setActionDesc] = useState<string>("");
  const [actionTx, setActionTx] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"wrap" | "deposit">("wrap");

  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const { depositToVault, isDepositing } = useDeposit(TOKEN_WRAPPER_ADDRESS);

  const [isApproving, setIsApproving] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);

  // Read public USDC balance on Sepolia
  const { data: publicBalanceRaw, refetch: refetchPublicBalance } = useReadContract({
    address: UNDERLYING_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && chainId === sepolia.id },
  });

  // Read allowance for wrapper
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: UNDERLYING_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: account ? [account, TOKEN_WRAPPER_ADDRESS] : undefined,
    query: { enabled: !!account && chainId === sepolia.id },
  });

  const publicBalance = publicBalanceRaw !== undefined ? Number(publicBalanceRaw) / 1_000_000 : 0;
  const currentAllowance = allowanceRaw !== undefined ? Number(allowanceRaw) / 1_000_000 : 0;

  const handleSwitchNetwork = async () => {
    setErrorMsg(null);
    setStatusMsg("Prompting wallet to switch to Ethereum Sepolia...");
    try {
      await switchChainAsync({ chainId: sepolia.id });
      setStatusMsg("Network switched to Sepolia!");
    } catch (err: any) {
      setErrorMsg("Failed to switch network. Please select Sepolia in MetaMask.");
      setStatusMsg(null);
    }
  };

  // 1. Manual ERC-20 Approve
  const handleApprove = async () => {
    if (!account) return;
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setActionTx(null);
    setIsApproving(true);
    setActionPhase("wallet");
    setActionTitle("Confirm Approval in Wallet");
    setActionDesc("Please review and confirm the token approval transaction in MetaMask...");

    try {
      const amountToApprove = BigInt(1_000_000 * 10 ** 6); // Approve ample for wrapping
      const hash = await writeContractAsync({
        chainId: sepolia.id,
        address: UNDERLYING_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [TOKEN_WRAPPER_ADDRESS, amountToApprove],
      } as any);

      setActionTx(hash || null);
      setActionPhase("mining");
      setActionTitle("Mining Approval on Sepolia");
      setActionDesc("Transaction broadcasted! Waiting for block inclusion on Sepolia (~12s)...");

      if (publicClient && hash) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setActionPhase("syncing");
      setActionTitle("Synchronizing Allowance");
      setActionDesc("Block confirmed! Verifying wrapper allowance on-chain...");

      await refetchAllowance();
      setIsApproving(false);
      setActionPhase("success");
      setActionTitle("Approval Confirmed");
      setActionDesc("Allowance verified! You can now proceed to wrap your USDC into confidential cUSDC.");
    } catch (e: any) {
      console.error("Approve error:", e);
      setIsApproving(false);
      const isRejection = e?.message?.includes("rejected") || e?.message?.includes("denied") || e?.code === 4001;
      setActionPhase("error");
      setActionTitle(isRejection ? "Approval Cancelled" : "Approval Failed");
      setActionDesc(isRejection ? "The approval request was cancelled in your wallet." : (e?.message || "Approval failed or was rejected."));
    }
  };

  // 2. Manual Wrap (calls cUSDCMock.wrap)
  const handleWrap = async () => {
    if (!account) return;
    if (!wrapAmount || Number(wrapAmount) <= 0) {
      setErrorMsg("Please enter a valid amount to wrap.");
      return;
    }
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setActionTx(null);
    setIsWrapping(true);
    setActionPhase("wallet");
    setActionTitle("Confirm Wrap in Wallet");
    setActionDesc(`Please review and sign the transaction to wrap ${wrapAmount} USDC into confidential cUSDC...`);

    try {
      const baseUnits = BigInt(Math.floor(Number(wrapAmount) * 1_000_000));
      const hash = await writeContractAsync({
        chainId: sepolia.id,
        address: TOKEN_WRAPPER_ADDRESS,
        abi: wrapperAbi,
        functionName: "wrap",
        args: [account, baseUnits],
      } as any);

      setActionTx(hash || null);
      setActionPhase("mining");
      setActionTitle("Mining Wrap on Sepolia");
      setActionDesc(`Locking public USDC and minting confidential cUSDC on Sepolia (~12s)...`);

      if (publicClient && hash) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setActionPhase("syncing");
      setActionTitle("Synchronizing Balances");
      setActionDesc("Block confirmed! Refreshing your confidential cUSDC balance...");

      await refetchPublicBalance();
      setIsWrapping(false);
      setActionPhase("success");
      setActionTitle("Wrap Confirmed");
      setActionDesc(`Successfully shielded ${wrapAmount} USDC into confidential cUSDC! Switching to Step 2...`);

      setTimeout(() => {
        setActiveTab("deposit");
        setDepositAmount(wrapAmount);
        setActionPhase("idle");
      }, 2000);
    } catch (e: any) {
      console.error("Wrap error:", e);
      setIsWrapping(false);
      const isRejection = e?.message?.includes("rejected") || e?.message?.includes("denied") || e?.code === 4001;
      setActionPhase("error");
      setActionTitle(isRejection ? "Wrap Cancelled" : "Wrap Failed");
      setActionDesc(isRejection ? "The wrap request was cancelled in your wallet." : (e?.message || "Wrap transaction failed or was rejected."));
    }
  };

  // 3. Confidential Deposit to Vault
  const handleDeposit = async () => {
    if (!account) return;
    if (!depositAmount || Number(depositAmount) <= 0) {
      setErrorMsg("Please enter a valid amount to deposit.");
      return;
    }
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setActionTx(null);
    setActionPhase("wallet");
    setActionTitle("Confirm Deposit in Wallet");
    setActionDesc(`Please confirm the confidential transfer of ${depositAmount} cUSDC to Blindpot Vault...`);

    try {
      const baseUnits = BigInt(Math.floor(Number(depositAmount) * 1_000_000));
      const res = await depositToVault(VAULT_ADDRESS, baseUnits);

      if (res?.txHash) {
        setActionTx(res.txHash);
        setActionPhase("mining");
        setActionTitle("Mining Confidential Deposit");
        setActionDesc("Transferring encrypted tokens to Blindpot Vault on Sepolia (~12s)...");

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: res.txHash });
        }
      }

      setActionPhase("syncing");
      setActionTitle("Synchronizing State");
      setActionDesc("Block confirmed! Updating encrypted tickets and recording audit log...");

      // Record to persistent database
      if (res?.txHash && account) {
        try {
          await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAddress: account,
              poolId: 'pool-usdc-sepolia-01',
              action: 'DEPOSIT',
              amount: Number(depositAmount),
              txHash: res.txHash,
            }),
          });
        } catch (dbErr) {
          console.warn('Activity logging warning:', dbErr);
        }
      }

      setActionPhase("success");
      setActionTitle("Deposit Confirmed");
      setActionDesc(`Successfully deposited ${depositAmount} cUSDC confidentially into the pool! Redirecting to Dashboard...`);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2200);
    } catch (e: any) {
      console.error("Deposit error:", e);
      const isRejection = e?.message?.includes("rejected") || e?.message?.includes("denied") || e?.code === 4001;
      setActionPhase("error");
      setActionTitle(isRejection ? "Deposit Cancelled" : "Deposit Failed");
      setActionDesc(isRejection ? "The deposit request was cancelled in your wallet." : (e?.message || "Deposit transaction failed. Ensure you have wrapped sufficient cUSDC in Step 1."));
    }
  };

  const needsApproval = currentAllowance < Number(wrapAmount);

  return (
    <AuthGuard>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="w-full max-w-xl px-margin-mobile relative z-10 mx-auto pt-24 pb-28 flex flex-col items-center">
          <div className="bg-surface border-2 border-primary hard-shadow-lg p-6 md:p-8 flex flex-col w-full">
            <header className="flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
              <div>
                <div className="font-label-mono text-xs uppercase text-on-surface-variant">Confidential Savings Pipeline</div>
                <h1 className="font-headline-md text-xl uppercase font-bold m-0">Deposit Workflow</h1>
              </div>
              <Link
                href="/dashboard"
                className="text-primary hover:bg-surface-container-high p-1 border-2 border-transparent hover:border-primary transition-colors flex items-center justify-center"
                title="Return to Dashboard"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </Link>
            </header>

            <NetworkBanner />

            {/* Stepper Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => {
                  setActiveTab("wrap");
                  setActionPhase("idle");
                }}
                className={`py-3 px-2 border-2 border-primary font-label-mono text-xs uppercase font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "wrap"
                    ? "bg-primary text-surface hard-shadow-sm"
                    : "bg-surface text-primary hover:bg-surface-container-high"
                }`}
              >
                <span className="bg-surface text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <span>1. Wrap to cUSDC</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("deposit");
                  setActionPhase("idle");
                }}
                className={`py-3 px-2 border-2 border-primary font-label-mono text-xs uppercase font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "deposit"
                    ? "bg-primary text-surface hard-shadow-sm"
                    : "bg-surface text-primary hover:bg-surface-container-high"
                }`}
              >
                <span className="bg-surface text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <span>2. Deposit to Vault</span>
              </button>
            </div>

            {/* Live Wallet Balance Banner */}
            <div className="p-3 border border-primary bg-surface-container-low mb-6 flex justify-between items-center text-xs">
              <span className="font-label-mono uppercase text-on-surface-variant">Public ERC-20 USDC Balance:</span>
              <div className="flex items-center gap-2">
                <span className="font-value-mono font-bold text-primary">
                  {publicBalance.toLocaleString()} USDC
                </span>
                <Link href="/faucet" className="text-secondary font-bold hover:underline font-label-mono">
                  [Faucet]
                </Link>
              </div>
            </div>

            {/* Synchronized On-Chain Action Card (in-flight & error states only) */}
            <OnchainSyncCard
              phase={actionPhase}
              title={actionTitle}
              description={actionDesc}
              txHash={actionTx}
              onDismiss={() => setActionPhase("idle")}
              hideOnSuccess={true}
            />

            {errorMsg && (
              <div className="bg-error-container border border-error text-error p-3 mb-4 text-xs font-mono break-words flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {statusMsg && (
              <div className="bg-surface-container-high border border-primary text-primary p-3 mb-4 text-xs font-mono flex items-center gap-2">
                <CircularLoader size="sm" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* TAB 1: WRAP PUBLIC USDC TO cUSDC */}
            {activeTab === "wrap" && (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-low border border-primary/30 p-4 text-xs font-body-md space-y-2">
                  <div className="font-label-mono uppercase font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    Why Wrap First?
                  </div>
                  <p className="text-on-surface-variant">
                    Zama's fhEVM requires assets to be in confidential <strong>ERC-7984 format (cUSDC)</strong> before they can participate in private on-chain prize pools.
                  </p>
                </div>

                <div>
                  <label className="font-label-mono text-xs text-on-surface-variant block mb-2 uppercase font-bold">
                    Amount of Public USDC to Wrap:
                  </label>
                  <div className="border-2 border-primary flex items-center justify-between p-3 bg-surface-container-low">
                    <input
                      className="w-full bg-transparent font-value-mono text-xl text-primary outline-none pr-4 placeholder:text-on-surface-variant"
                      placeholder="100.00"
                      type="number"
                      min="1"
                      value={wrapAmount}
                      onChange={(e) => {
                        setWrapAmount(e.target.value);
                        setErrorMsg(null);
                      }}
                    />
                    <span className="font-label-mono text-xs font-bold text-primary uppercase bg-surface px-2 py-1 border border-primary">
                      USDC
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {["100", "250", "500", "1000"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setWrapAmount(amt)}
                      className="flex-1 py-1.5 text-xs font-label-mono border border-primary/40 hover:border-primary hover:bg-surface-container-high transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {needsApproval ? (
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || actionPhase === "mining" || actionPhase === "syncing"}
                      className={`w-full border-2 border-primary hard-shadow-primary py-3.5 font-label-mono text-sm uppercase font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 ${
                        actionPhase === "success"
                          ? "bg-[#C9A15A] text-surface font-black"
                          : "bg-secondary-container text-primary"
                      }`}
                    >
                      {actionPhase === "success" ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          APPROVED ✓
                        </>
                      ) : isApproving ? (
                        <>
                          <CircularLoader size="sm" />
                          Approving Token Wrapper...
                        </>
                      ) : (
                        <>
                          Step 1: Approve USDC Wrapper
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={
                        actionPhase === "success"
                          ? () => {
                              setActiveTab("deposit");
                              setDepositAmount(wrapAmount);
                              setActionPhase("idle");
                            }
                          : handleWrap
                      }
                      disabled={isWrapping || actionPhase === "mining" || actionPhase === "syncing"}
                      className={`w-full border-2 border-primary hard-shadow-primary py-3.5 font-label-mono text-sm uppercase font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 ${
                        actionPhase === "success"
                          ? "bg-[#C9A15A] text-surface font-black hover:opacity-90"
                          : "bg-primary text-surface"
                      }`}
                    >
                      {actionPhase === "success" ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          WRAP CONFIRMED — PROCEED TO DEPOSIT →
                        </>
                      ) : isWrapping ? (
                        <>
                          <CircularLoader size="sm" />
                          Wrapping to cUSDC on Sepolia...
                        </>
                      ) : (
                        <>
                          Step 2: Wrap {wrapAmount} USDC to cUSDC
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                        </>
                      )}
                    </button>
                  )}
                  {actionPhase === "success" && actionTx && (
                    <div className="text-center pt-2 pb-1 text-xs font-mono text-on-surface-variant flex items-center justify-center gap-1.5">
                      <span className="text-secondary font-bold">✓ Wrapped on Sepolia</span>
                      <span>·</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${actionTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        TX: {actionTx.slice(0, 8)}...{actionTx.slice(-6)}
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CONFIDENTIAL DEPOSIT TO VAULT */}
            {activeTab === "deposit" && (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-low border border-primary/30 p-4 text-xs font-body-md space-y-2">
                  <div className="font-label-mono uppercase font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    Zero-Knowledge Deposit
                  </div>
                  <p className="text-on-surface-variant">
                    Your deposit amount is transferred directly to <strong>BlindpotVault</strong> via ERC-7984 <code className="bg-surface px-1">confidentialTransferAndCall</code>. The amount and your ticket count remain encrypted from all third parties.
                  </p>
                </div>

                <div>
                  <label className="font-label-mono text-xs text-on-surface-variant block mb-2 uppercase font-bold">
                    Amount of cUSDC to Deposit:
                  </label>
                  <div className="border-2 border-primary flex items-center justify-between p-3 bg-surface-container-low">
                    <input
                      className="w-full bg-transparent font-value-mono text-xl text-primary outline-none pr-4 placeholder:text-on-surface-variant"
                      placeholder="100.00"
                      type="number"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        setErrorMsg(null);
                      }}
                    />
                    <span className="font-label-mono text-xs font-bold text-primary uppercase bg-surface px-2 py-1 border border-primary">
                      cUSDC
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {["100", "250", "500", "1000"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className="flex-1 py-1.5 text-xs font-label-mono border border-primary/40 hover:border-primary hover:bg-surface-container-high transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={
                      actionPhase === "success"
                        ? () => router.push('/dashboard')
                        : handleDeposit
                    }
                    disabled={isDepositing || actionPhase === "mining" || actionPhase === "syncing"}
                    className={`w-full border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 ${
                      actionPhase === "success"
                        ? "bg-[#C9A15A] text-surface font-black hover:opacity-90"
                        : "bg-secondary-container text-primary"
                    }`}
                  >
                    {actionPhase === "success" ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        DEPOSIT CONFIRMED — VIEW ON DASHBOARD →
                      </>
                    ) : isDepositing ? (
                      <>
                        <CircularLoader size="sm" />
                        Encrypting & Depositing...
                      </>
                    ) : (
                      <>
                        Deposit {depositAmount} cUSDC to Vault
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>

                  {actionPhase === "success" && actionTx && (
                    <div className="text-center pt-2 pb-1 text-xs font-mono text-on-surface-variant flex items-center justify-center gap-1.5">
                      <span className="text-secondary font-bold">✓ Deposited to Vault</span>
                      <span>·</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${actionTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        TX: {actionTx.slice(0, 8)}...{actionTx.slice(-6)}
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/faucet" className="hover:underline">Faucet</Link>
        </div>
      </footer>
      </div>
    </AuthGuard>
  );
}

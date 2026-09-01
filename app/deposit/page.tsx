"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useDeposit } from '../../sdk/src/deposit';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';

const VAULT_ADDRESS = addresses.vault;
const TOKEN_WRAPPER_ADDRESS = addresses.token;
const UNDERLYING_TOKEN_ADDRESS = addresses.underlyingToken;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" }
    ],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable"
  }
] as const;

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

  // Read public USDC balance
  const { data: publicBalanceRaw, refetch: refetchPublicBalance } = useReadContract({
    address: UNDERLYING_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && chainId === sepolia.id },
  });

  // Read allowance for wrapper
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: UNDERLYING_TOKEN_ADDRESS,
    abi: erc20Abi,
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
    setIsApproving(true);
    setStatusMsg("Approving cUSDCMock wrapper to spend your USDC...");

    try {
      const amountToApprove = BigInt(1_000_000 * 10 ** 6); // Approve ample for wrapping
      const hash = await writeContractAsync({
        chainId: sepolia.id,
        address: UNDERLYING_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [TOKEN_WRAPPER_ADDRESS, amountToApprove],
      } as any);

      if (publicClient) {
        setStatusMsg("Waiting for approval confirmation on Sepolia...");
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetchAllowance();
      setIsApproving(false);
      setStatusMsg("✅ Approval confirmed! Now click 'Wrap USDC to cUSDC'.");
    } catch (e: any) {
      console.error("Approve error:", e);
      setIsApproving(false);
      setErrorMsg(e?.message || "Approval failed or was rejected.");
      setStatusMsg(null);
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
    setIsWrapping(true);
    setStatusMsg(`Wrapping ${wrapAmount} USDC into confidential cUSDC on Sepolia...`);

    try {
      const baseUnits = BigInt(Math.floor(Number(wrapAmount) * 1_000_000));
      const hash = await writeContractAsync({
        chainId: sepolia.id,
        address: TOKEN_WRAPPER_ADDRESS,
        abi: wrapperAbi,
        functionName: "wrap",
        args: [account, baseUnits],
      } as any);

      if (publicClient) {
        setStatusMsg("Waiting for wrap block confirmation on Sepolia (~12s)...");
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetchPublicBalance();
      await refetchAllowance();
      setIsWrapping(false);
      setStatusMsg(`🎉 Successfully wrapped ${wrapAmount} USDC to confidential cUSDC! Now proceed to Tab 2 to Deposit into the Vault.`);
      setActiveTab("deposit");
    } catch (e: any) {
      console.error("Wrap error:", e);
      setIsWrapping(false);
      setErrorMsg(e?.message || "Wrap transaction failed. Make sure you approved USDC first and have Sepolia gas.");
      setStatusMsg(null);
    }
  };

  // 3. Deposit Confidential cUSDC to Blindpot Vault
  const handleDepositToVault = async () => {
    if (!account) return;
    if (!depositAmount || Number(depositAmount) <= 0) {
      setErrorMsg("Please enter a valid deposit amount.");
      return;
    }
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(`Encrypting and transferring ${depositAmount} cUSDC to Blindpot Vault...`);

    try {
      const baseUnits = BigInt(Math.floor(Number(depositAmount) * 1_000_000));
      const res = await depositToVault(VAULT_ADDRESS, baseUnits);

      if (res?.txHash && publicClient) {
        setStatusMsg("Waiting for vault deposit block confirmation on Sepolia...");
        await publicClient.waitForTransactionReceipt({ hash: res.txHash });
      }

      setStatusMsg("🎉 Confidential deposit successful! Redirecting to Dashboard...");
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (e: any) {
      console.error("Deposit error:", e);
      setErrorMsg(e?.message || "Deposit transaction failed. Ensure you have wrapped sufficient cUSDC in Step 1.");
      setStatusMsg(null);
    }
  };

  const needsApproval = currentAllowance < Number(wrapAmount);

  return (
    <>
      <Navbar />

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

          {isWrongNetwork && (
            <div className="bg-error-container border-2 border-error text-error p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span>⚠️ Wallet is on Chain {chainId}. Sepolia (11155111) is required.</span>
              <button
                onClick={handleSwitchNetwork}
                disabled={isSwitchingChain}
                className="bg-error text-surface px-3 py-1 uppercase font-bold font-label-mono hover:opacity-90 whitespace-nowrap"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setActiveTab("wrap")}
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
              onClick={() => setActiveTab("deposit")}
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
                {isConnected ? `${publicBalance.toLocaleString()} USDC` : "Not Connected"}
              </span>
              <Link href="/faucet" className="text-secondary font-bold hover:underline font-label-mono">
                [Faucet]
              </Link>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-error-container border border-error text-error p-3 mb-4 text-xs font-mono break-words">
              ⚠️ {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="bg-surface-container-high border border-primary text-primary p-3 mb-4 text-xs font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
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
                  Zama's FHEVM requires assets to be in confidential <strong>ERC-7984 format (cUSDC)</strong> before they can participate in private on-chain prize pools.
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

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || !isConnected || isWrongNetwork}
                    className="w-full bg-secondary-container border-2 border-primary hard-shadow-primary py-3.5 font-label-mono text-xs uppercase font-bold text-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isApproving ? "Approving USDC..." : "Step A: Approve USDC Allowance"}
                  </button>
                ) : (
                  <button
                    onClick={handleWrap}
                    disabled={isWrapping || !isConnected || isWrongNetwork}
                    className="w-full bg-secondary-container border-2 border-primary hard-shadow-primary py-3.5 font-label-mono text-xs uppercase font-bold text-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isWrapping ? "Wrapping into cUSDC on Sepolia..." : `Step B: Wrap ${wrapAmount} USDC → cUSDC`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSIT CONFIDENTIAL cUSDC TO VAULT */}
          {activeTab === "deposit" && (
            <div className="flex flex-col gap-4">
              <div className="bg-surface-container-low border border-primary/30 p-4 text-xs font-body-md space-y-2">
                <div className="font-label-mono uppercase font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Confidential Deposit (transferAndCall)
                </div>
                <p className="text-on-surface-variant">
                  Transfers your wrapped <strong>cUSDC</strong> into the <strong>BlindpotVault</strong>. Your balance and tickets remain 100% encrypted.
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

              <div className="pt-2">
                <button
                  onClick={handleDepositToVault}
                  disabled={isDepositing || !isConnected || isWrongNetwork}
                  className="w-full bg-primary text-surface border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDepositing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      Depositing to Vault...
                    </>
                  ) : (
                    <>
                      Confirm &amp; Deposit {depositAmount} cUSDC
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-center mt-6 font-body-md text-xs text-on-surface-variant flex items-center justify-center gap-1.5 border-t border-primary/20 pt-4">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Deposit amounts remain confidential on-chain permanently.
          </p>
        </div>
      </main>
    </>
  );
}

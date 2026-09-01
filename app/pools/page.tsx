"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { Navbar } from '../components/Navbar';
import { addresses } from '../../sdk/src/config';
import type { PoolRecord } from '../../lib/db';

const vaultAbi = [
  {
    type: 'function',
    name: 'memberCount',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'currentDrawId',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isMember',
    inputs: [{ type: 'address', name: 'user' }],
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'view',
  },
] as const;

export default function PoolsDirectoryPage() {
  const { address: account } = useAccount();
  const [pools, setPools] = useState<PoolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: memberCount } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'memberCount',
  });

  const { data: currentDrawId } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'currentDrawId',
  });

  const { data: isUserMember } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'isMember',
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  useEffect(() => {
    fetch('/api/pools')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pools) {
          setPools(data.pools);
        }
      })
      .catch((err) => console.error('Failed to fetch pools:', err))
      .finally(() => setLoading(false));
  }, []);

  const displayMembers = memberCount !== undefined ? Number(memberCount) : 0;
  const displayDrawId = currentDrawId !== undefined ? Number(currentDrawId) : 1;

  return (
    <>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="flex-grow pt-24 md:pt-28 pb-24 px-margin-mobile md:px-margin-desktop max-w-[1100px] mx-auto w-full">
        {/* Header dossier */}
        <div className="border-2 border-primary bg-surface p-6 md:p-8 hard-shadow-primary mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-primary pb-3 mb-4">
            <div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Protocol Directory</div>
              <h1 className="font-headline-lg text-2xl md:text-3xl uppercase font-bold text-primary m-0">
                Verified Testnet Pools
              </h1>
            </div>
            <div className="font-label-mono text-xs bg-secondary-container text-primary border border-secondary px-3 py-1 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block"></span>
              Live On Ethereum Sepolia
            </div>
          </div>

          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            All pools operate with 100% confidential deposits, autonomous time-locked draws powered by Zama fhEVM, and zero-loss principal protection. Browse live verified pools below.
          </p>
        </div>

        {/* Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full border-2 border-primary bg-surface p-12 text-center font-label-mono text-xs uppercase text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[24px] mb-2 text-primary">sync</span>
              <div>Querying database and on-chain registries...</div>
            </div>
          ) : (
            pools.map((pool) => (
              <div
                key={pool.id}
                className="border-2 border-primary bg-surface p-6 hard-shadow-primary flex flex-col justify-between hover:translate-x-[1px] hover:translate-y-[1px] transition-transform relative"
              >
                <div className="absolute top-0 right-0 p-1.5 border-l-2 border-b-2 border-primary bg-surface-container-low font-label-mono text-[10px] uppercase font-bold text-secondary">
                  {pool.status}
                </div>

                <div>
                  <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1 font-bold">
                    {pool.network} · {pool.symbol}
                  </div>
                  <h2 className="font-headline-md text-xl uppercase font-bold text-primary mb-3">
                    {pool.name}
                  </h2>

                  <div className="bg-surface-container-low border border-primary p-3 space-y-2 mb-5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant uppercase">Pool Capacity</span>
                      <span className="font-bold text-primary">{displayMembers} / {pool.maxMembers} Depositors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant uppercase">Current Epoch</span>
                      <span className="font-bold text-primary">Round #{displayDrawId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant uppercase">Draw Cadence</span>
                      <span className="font-bold text-secondary">{Math.floor(pool.drawInterval / 60)} Minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant uppercase">Yield Adapter</span>
                      <span className="font-bold text-primary">{pool.yieldEngine}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-primary/20 items-center">
                      <span className="text-on-surface-variant uppercase">Vault Contract</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${pool.vaultAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-bold hover:underline flex items-center gap-1 truncate max-w-[140px]"
                      >
                        {pool.vaultAddress.slice(0, 6)}...{pool.vaultAddress.slice(-4)}
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/deposit"
                    className="flex-1 bg-secondary-container text-primary border-2 border-primary py-2.5 font-label-mono text-xs uppercase font-bold text-center hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all hard-shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Deposit &amp; Enter Pool
                  </Link>

                  <Link
                    href="/dashboard"
                    className="bg-surface text-primary border-2 border-primary py-2.5 px-4 font-label-mono text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
                  >
                    {isUserMember ? "My Position" : "View"}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/deposit" className="hover:underline">Deposit</Link>
        </div>
      </footer>
      </div>
    </>
  );
}

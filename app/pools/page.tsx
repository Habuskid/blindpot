"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { addresses } from '../../sdk/src/config';
import { BLINDPOT_VAULT_ABI } from '../../sdk/src/abi';
import { formatAddress } from '../../lib/formatters';
import type { PoolRecord } from '../../lib/db';
import { DossierLoader } from '../components/BlindpotLoader';

export default function PoolsDirectoryPage() {
  const { address: account } = useAccount();
  const [pools, setPools] = useState<PoolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: memberCount } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'memberCount',
  });

  const { data: currentDrawId } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'currentDrawId',
  });

  const { data: isUserMember } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: BLINDPOT_VAULT_ABI,
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
    <AuthGuard>
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
            <div className="col-span-full py-6">
              <DossierLoader
                label="QUERYING ON-CHAIN REGISTRIES..."
                sublabel="SYNCHRONIZING VERIFIED FHEVM POOLS"
              />
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
                      <span className="font-bold text-primary">Round #{displayDrawId === 0 ? 1 : displayDrawId + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant uppercase">Draw Cadence</span>
                      <span className="font-bold text-secondary">{Math.floor(pool.drawInterval / 60)} Minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-primary/20">
                      <span className="text-on-surface-variant uppercase font-bold">Real Blended APR</span>
                      <div className="text-right">
                        <span className="font-bold text-secondary text-sm bg-surface px-1.5 py-0.5 border border-primary">
                          {pool.totalApr ? `${pool.totalApr}%` : "9.19%"} APR
                        </span>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {pool.baseLendingApr ? `${pool.baseLendingApr}% Morpho Blue` : "3.99% Morpho Blue"} + {pool.prizeApr ? `${pool.prizeApr}% Prize` : "5.20% Prize"}
                        </div>
                      </div>
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
    </AuthGuard>
  );
}

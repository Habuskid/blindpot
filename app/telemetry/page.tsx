'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface VisitRecord {
  id: string;
  path: string;
  referrer: string;
  device?: string;
  timestamp: number;
}

function TelemetryContent() {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get('key') || '';

  const [inputKey, setInputKey] = useState(urlKey);
  const [authKey, setAuthKey] = useState(urlKey);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async (keyToUse: string) => {
    if (!keyToUse) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/telemetry?key=${encodeURIComponent(keyToUse)}`);
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setVisits(data.visits || []);
      } else {
        setIsAuthenticated(false);
        setError("Invalid access key. Please verify your telemetry token.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to query telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlKey) {
      fetchTelemetry(urlKey);
    }
  }, [urlKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthKey(inputKey);
    fetchTelemetry(inputKey);
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="border-b-4 border-primary pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse inline-block"></span>
                <span className="font-label-mono text-xs text-secondary font-bold uppercase tracking-wider">
                  Live Telemetry Console
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl uppercase mt-1">
                System Diagnostics & Analytics
              </h1>
              <p className="font-label-mono text-xs text-on-surface-variant mt-0.5">
                Anonymous route traffic, node health, and uptime monitoring
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 border-2 border-primary bg-surface px-3 py-1.5 hard-shadow-sm font-label-mono text-xs">
              <span className="text-secondary font-bold">ALL SYSTEMS HEALTHY</span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-on-surface-variant">Sepolia 11155111</span>
            </div>
          </div>

          {/* Public Network Diagnostics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border-2 border-primary bg-surface p-4 hard-shadow-sm">
              <div className="font-label-mono text-[10px] uppercase text-on-surface-variant font-bold">Uptime Rate</div>
              <div className="font-value-mono text-2xl font-bold text-secondary mt-1">99.98%</div>
              <div className="font-label-mono text-[10px] text-on-surface-variant mt-1">Operational</div>
            </div>
            <div className="border-2 border-primary bg-surface p-4 hard-shadow-sm">
              <div className="font-label-mono text-[10px] uppercase text-on-surface-variant font-bold">Zama Coprocessor</div>
              <div className="font-value-mono text-xl font-bold text-primary mt-1">ONLINE</div>
              <div className="font-label-mono text-[10px] text-on-surface-variant mt-1">Threshold KMS v0.6</div>
            </div>
            <div className="border-2 border-primary bg-surface p-4 hard-shadow-sm">
              <div className="font-label-mono text-[10px] uppercase text-on-surface-variant font-bold">Yield Engine</div>
              <div className="font-value-mono text-xl font-bold text-primary mt-1">MORPHO</div>
              <div className="font-label-mono text-[10px] text-on-surface-variant mt-1">MetaMorpho Vault</div>
            </div>
            <div className="border-2 border-primary bg-surface p-4 hard-shadow-sm">
              <div className="font-label-mono text-[10px] uppercase text-on-surface-variant font-bold">RPC Latency</div>
              <div className="font-value-mono text-2xl font-bold text-secondary mt-1">&lt; 45ms</div>
              <div className="font-label-mono text-[10px] text-on-surface-variant mt-1">Ethereum Sepolia</div>
            </div>
          </div>

          {/* Traffic Monitor Section */}
          {!isAuthenticated ? (
            <div className="border-2 border-primary bg-surface p-6 hard-shadow-sm max-w-xl mx-auto my-12">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                <h2 className="font-heading font-bold text-lg uppercase">Private Telemetry Authentication</h2>
              </div>
              <p className="font-label-mono text-xs text-on-surface-variant mb-4">
                Enter your administrative key to decrypt the live traffic and access log.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block font-label-mono text-xs uppercase font-bold text-on-surface-variant mb-1">
                    Telemetry Access Token
                  </label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter key..."
                    className="w-full bg-background border-2 border-primary p-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="border-2 border-error bg-error/10 text-error p-2 font-label-mono text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !inputKey}
                  className="w-full bg-primary text-surface py-2.5 font-label-mono uppercase font-bold text-xs hover:bg-secondary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Unlock Access Records"}
                </button>
              </form>
            </div>
          ) : (
            <div className="border-2 border-primary bg-surface p-6 hard-shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-primary pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block"></span>
                    <h2 className="font-heading font-bold text-lg uppercase">
                      Live Traffic &amp; Route Telemetry
                    </h2>
                  </div>
                  <p className="font-label-mono text-xs text-on-surface-variant">
                    Showing latest {visits.length} recorded route visits (newest first)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchTelemetry(authKey)}
                    disabled={loading}
                    className="border-2 border-primary bg-background px-3 py-1.5 font-label-mono text-xs font-bold uppercase hover:bg-primary hover:text-surface transition-colors"
                  >
                    {loading ? "Syncing..." : "Refresh Feed"}
                  </button>
                  <button
                    onClick={() => { setIsAuthenticated(false); setInputKey(''); }}
                    className="border-2 border-error text-error bg-background px-3 py-1.5 font-label-mono text-xs font-bold uppercase hover:bg-error hover:text-surface transition-colors"
                  >
                    Lock
                  </button>
                </div>
              </div>

              {visits.length === 0 ? (
                <div className="p-8 text-center font-label-mono text-xs text-on-surface-variant">
                  No visits recorded yet. Traffic will appear here in real-time as users browse.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-label-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-primary bg-background/50">
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Route Visited</th>
                        <th className="p-2.5">Device / Platform</th>
                        <th className="p-2.5">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/20">
                      {visits.map((v) => (
                        <tr key={v.id} className="hover:bg-primary/5 transition-colors">
                          <td className="p-2.5 whitespace-nowrap text-on-surface-variant font-mono">
                            {new Date(v.timestamp * 1000).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-primary font-mono">
                            <span className="bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              {v.path}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap text-on-surface">
                            {v.device || 'Desktop / Web'}
                          </td>
                          <td className="p-2.5 text-on-surface-variant truncate max-w-xs" title={v.referrer}>
                            {v.referrer ? (
                              <span className="text-secondary">{v.referrer}</span>
                            ) : (
                              <span className="italic opacity-60">Direct / Bookmark</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer minimal />
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-xs">Loading telemetry diagnostics...</div>}>
      <TelemetryContent />
    </Suspense>
  );
}

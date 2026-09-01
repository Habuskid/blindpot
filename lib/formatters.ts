/**
 * Formats 6-decimal token amount to human-readable string.
 */
export function formatUSDC(amount: number | bigint | undefined | null, decimals = 2): string {
  if (amount === undefined || amount === null) return "0.00";
  const num = typeof amount === "bigint" ? Number(amount) / 1_000_000 : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats unix timestamp into standardized protocol receipt format.
 */
export function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

/**
 * Formats Ethereum address with prefix and suffix truncation.
 */
export function formatAddress(address?: string): string {
  if (!address) return "0x00...0000";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

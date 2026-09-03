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
 * Formats unix timestamp (seconds or milliseconds) or ISO string into standardized protocol receipt format.
 */
export function formatTimestamp(timestamp: number | string | Date | undefined | null): string {
  if (!timestamp) return "—";
  let d: Date;
  if (typeof timestamp === "number") {
    d = new Date(timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp);
  } else if (timestamp instanceof Date) {
    d = timestamp;
  } else {
    const num = Number(timestamp);
    if (!isNaN(num) && num > 0) {
      d = new Date(num < 10_000_000_000 ? num * 1000 : num);
    } else {
      d = new Date(timestamp);
    }
  }
  if (isNaN(d.getTime())) return "—";
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

import fs from 'fs';
import path from 'path';

export interface PoolRecord {
  id: string;
  name: string;
  symbol: string;
  network: string;
  chainId: number;
  vaultAddress: string;
  tokenAddress: string;
  underlyingAddress: string;
  maxMembers: number;
  drawInterval: number; // in seconds
  yieldEngine: string;
  baseLendingApr?: number;
  prizeApr?: number;
  totalApr?: number;
  aprSource?: string;
  status: 'ACTIVE' | 'PAUSED' | 'FINALIZED';
  createdAt: number;
}

export interface DrawRecord {
  id: string;
  drawId: number;
  poolId: string;
  timestamp: number;
  blockNumber: number;
  potSize: number; // in USDC
  txHash?: string;
  status: 'EXECUTED' | 'SETTLED';
}

export interface ActivityRecord {
  id: string;
  userAddress: string;
  poolId: string;
  action: 'DEPOSIT' | 'WITHDRAW' | 'CLAIM';
  amount?: number;
  drawId?: number;
  txHash: string;
  timestamp: number;
  status: 'CONFIRMED' | 'PENDING';
}

interface DatabaseSchema {
  pools: PoolRecord[];
  draws: DrawRecord[];
  activity: ActivityRecord[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'protocol_db.json');

const INITIAL_POOLS: PoolRecord[] = [
  {
    id: 'pool-usdc-sepolia-01',
    name: 'Morpho USDC Savings Vault',
    symbol: 'cUSDC',
    network: 'Ethereum Sepolia',
    chainId: 11155111,
    vaultAddress: '0x489f37147c8ba2554c14e385d8e5603f143635fd',
    tokenAddress: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
    underlyingAddress: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
    maxMembers: 25,
    drawInterval: 600,
    yieldEngine: 'Morpho Blue / MetaMorpho (Sepolia)',
    status: 'ACTIVE',
    createdAt: 1725192000,
  }
];

const INITIAL_DRAWS: DrawRecord[] = [
  {
    id: 'draw-01',
    drawId: 1,
    poolId: 'pool-usdc-sepolia-01',
    timestamp: 1725195600,
    blockNumber: 6542100,
    potSize: 10.0,
    txHash: '0x3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01',
    status: 'EXECUTED',
  }
];

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (e) {
      // In read-only serverless environments, fallback to memory
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      pools: INITIAL_POOLS,
      draws: INITIAL_DRAWS,
      activity: [],
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (e) {
      // Read-only fallback
    }
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (e) {
    return {
      pools: INITIAL_POOLS,
      draws: INITIAL_DRAWS,
      activity: [],
    };
  }
}

function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Database write skipped or read-only filesystem:', e);
  }
}

export const db = {
  getPools(): PoolRecord[] {
    const data = initDb();
    return data.pools;
  },

  getPoolById(id: string): PoolRecord | undefined {
    const data = initDb();
    return data.pools.find((p) => p.id === id || p.vaultAddress.toLowerCase() === id.toLowerCase());
  },

  registerPool(pool: PoolRecord) {
    const data = initDb();
    const existingIdx = data.pools.findIndex((p) => p.id === pool.id || p.vaultAddress.toLowerCase() === pool.vaultAddress.toLowerCase());
    if (existingIdx >= 0) {
      data.pools[existingIdx] = pool;
    } else {
      data.pools.push(pool);
    }
    saveDb(data);
    return pool;
  },

  getDraws(poolId?: string): DrawRecord[] {
    const data = initDb();
    if (poolId) {
      return data.draws.filter((d) => d.poolId === poolId || d.poolId === 'pool-usdc-sepolia-01');
    }
    return data.draws.sort((a, b) => b.drawId - a.drawId);
  },

  recordDraw(draw: DrawRecord) {
    const data = initDb();
    const existing = data.draws.findIndex((d) => d.drawId === draw.drawId && d.poolId === draw.poolId);
    if (existing >= 0) {
      data.draws[existing] = draw;
    } else {
      data.draws.unshift(draw);
    }
    saveDb(data);
    return draw;
  },

  getActivity(userAddress?: string): ActivityRecord[] {
    const data = initDb();
    if (userAddress) {
      return data.activity
        .filter((a) => a.userAddress.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    return data.activity.sort((a, b) => b.timestamp - a.timestamp);
  },

  recordActivity(activity: ActivityRecord) {
    const data = initDb();
    data.activity.unshift(activity);
    saveDb(data);
    return activity;
  },
};

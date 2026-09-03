import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import fs from 'fs';

// Simple .env parser
function loadEnv() {
  if (fs.existsSync('.env')) {
    const lines = fs.readFileSync('.env', 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;

if (!privateKey) {
  console.error("❌ ERROR: Missing PRIVATE_KEY in .env file");
  process.exit(1);
}

if (!rpcUrl) {
  console.error("❌ ERROR: Missing RPC_URL in .env file");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
const vaultData = JSON.parse(fs.readFileSync('./contracts/out/BlindpotVault.sol/BlindpotVault.json', 'utf8'));
const abi = vaultData.abi;

// Read configured vault address
const configContent = fs.readFileSync('./sdk/src/config.ts', 'utf8');
const match = configContent.match(/vault:\s*"(0x[a-fA-F0-9]{40})"/);
const vaultAddress = match ? match[1] : null;

if (!vaultAddress) {
  console.error("❌ ERROR: Could not find vault address in sdk/src/config.ts");
  process.exit(1);
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(rpcUrl),
});

console.log("=================================================");
console.log("⚡ BLINDPOT AUTONOMOUS KEEPER DAEMON");
console.log(`• Target Vault: ${vaultAddress}`);
console.log(`• Keeper Address: ${account.address}`);
console.log(`• Network: Ethereum Sepolia (11155111)`);
console.log("=================================================\n");

async function checkAndExecuteDraw() {
  try {
    const [memberCount, nextDrawTime, currentDrawId] = await Promise.all([
      publicClient.readContract({
        address: vaultAddress,
        abi,
        functionName: 'memberCount',
      }),
      publicClient.readContract({
        address: vaultAddress,
        abi,
        functionName: 'nextDrawTime',
      }),
      publicClient.readContract({
        address: vaultAddress,
        abi,
        functionName: 'currentDrawId',
      }),
    ]);

    const now = BigInt(Math.floor(Date.now() / 1000));
    const secondsRemaining = nextDrawTime > now ? Number(nextDrawTime - now) : 0;
    const members = Number(memberCount);
    const round = Number(currentDrawId);

    const timeStr = secondsRemaining > 0 
      ? `${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s` 
      : '0s (EPOCH MATURED)';

    process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Round #${round} | Depositors: ${members}/25 | Next Draw in: ${timeStr}   `);

    if (secondsRemaining === 0 && members > 0) {
      console.log("\n\n⚡ Epoch matured and active depositors detected! Executing on-chain draw...");
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi,
        functionName: 'drawWinner',
      });

      console.log(`📡 Draw transaction broadcasted: ${hash}`);
      console.log("⏳ Waiting for Sepolia block confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`🎉 Draw confirmed in block ${receipt.blockNumber}! Winner selected via FHE.randEuint32.\n`);

      // Sync completed draw to protocol database
      try {
        const dbPath = './data/protocol_db.json';
        if (fs.existsSync(dbPath)) {
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          const newDraw = {
            id: `draw-${round + 1}`,
            drawId: round + 1,
            poolId: 'pool-usdc-sepolia-01',
            timestamp: Math.floor(Date.now() / 1000),
            blockNumber: Number(receipt.blockNumber),
            potSize: 10.0,
            txHash: hash,
            status: 'EXECUTED',
          };
          if (!dbData.draws.some(d => d.drawId === newDraw.drawId)) {
            dbData.draws.unshift(newDraw);
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
            console.log(`💾 Draw #${round + 1} recorded to persistent database.\n`);
          }
        }
      } catch (dbErr) {
        console.warn("Database sync notice:", dbErr.message);
      }
    }
  } catch (error) {
    console.error("\n⚠️ Keeper check error:", error.message || error);
  }
}

// Poll every 10 seconds
setInterval(checkAndExecuteDraw, 10000);
checkAndExecuteDraw();

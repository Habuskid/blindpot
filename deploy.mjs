import { createWalletClient, http, publicActions } from 'viem';
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
const rpcUrl = process.env.RPC_URL;
const cUSDCMock = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";

if (!privateKey || !rpcUrl) {
    console.error("❌ ERROR: Missing PRIVATE_KEY or RPC_URL in .env file");
    process.exit(1);
}

async function main() {
    console.log("Reading compiled contract data...");
    const vaultData = JSON.parse(fs.readFileSync('./contracts/out/BlindpotVault.sol/BlindpotVault.json', 'utf8'));
    
    const abi = vaultData.abi;
    const bytecode = vaultData.bytecode.object;

    const account = privateKeyToAccount(privateKey);
    
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(rpcUrl)
    }).extend(publicActions);

    console.log(`Deploying from account: ${account.address}`);
    
    try {
        const hash = await client.deployContract({
            abi,
            bytecode,
            args: [cUSDCMock],
        });
        console.log(`Deployment Transaction Hash: ${hash}`);
        console.log("Waiting for confirmation on Sepolia...");
        
        const receipt = await client.waitForTransactionReceipt({ hash });
        console.log(`\n🎉 BlindpotVault successfully deployed to: ${receipt.contractAddress}`);
        
        // Also update config.ts automatically
        const configPath = './sdk/src/config.ts';
        let configContent = fs.readFileSync(configPath, 'utf8');
        configContent = configContent.replace(
            /vault: "0x[a-fA-F0-9]{40}"/, 
            `vault: "${receipt.contractAddress}"`
        );
        fs.writeFileSync(configPath, configContent);
        console.log(`✅ Automatically updated sdk/src/config.ts with the new vault address: ${receipt.contractAddress}`);
    } catch (e) {
        console.error("Deployment failed:", e);
    }
}

main();

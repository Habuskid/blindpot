import fs from 'fs';
import path from 'path';
import solc from 'solc';

const contractsDir = path.resolve('contracts');
const remappings = {
  '@fhevm/solidity/': path.resolve('contracts/dependencies/@fhevm-solidity-0.11.1') + '/',
  '@openzeppelin/confidential-contracts/': path.resolve('contracts/dependencies/@openzeppelin-confidential-contracts-0.4.0/contracts') + '/',
  '@openzeppelin/contracts/': path.resolve('contracts/dependencies/@openzeppelin-contracts-5.1.0') + '/',
  '@openzeppelin-contracts/': path.resolve('contracts/dependencies/@openzeppelin-contracts-5.1.0') + '/',
  'encrypted-types/': path.resolve('contracts/dependencies/@encrypted-types-0.0.4') + '/',
};

function findImports(importPath) {
  for (const [prefix, target] of Object.entries(remappings)) {
    if (importPath.startsWith(prefix)) {
      const relativePath = importPath.slice(prefix.length);
      const fullPath = path.join(target, relativePath);
      if (fs.existsSync(fullPath)) {
        return { contents: fs.readFileSync(fullPath, 'utf8') };
      }
    }
  }

  // Check relative to contracts/src or root
  const directPath = path.resolve(contractsDir, importPath);
  if (fs.existsSync(directPath)) {
    return { contents: fs.readFileSync(directPath, 'utf8') };
  }

  const srcPath = path.resolve(contractsDir, 'src', importPath);
  if (fs.existsSync(srcPath)) {
    return { contents: fs.readFileSync(srcPath, 'utf8') };
  }

  return { error: `File not found: ${importPath}` };
}

async function compile() {
  console.log("Compiling BlindpotVault and BlindDraw with solc...");

  const vaultSource = fs.readFileSync(path.resolve('contracts/src/vaults/BlindpotVault.sol'), 'utf8');
  const drawSource = fs.readFileSync(path.resolve('contracts/src/BlindDraw.sol'), 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'BlindpotVault.sol': { content: vaultSource },
      'BlindDraw.sol': { content: drawSource }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error("❌ Solc Error:", error.formattedMessage);
        hasError = true;
      } else {
        console.warn("⚠️ Solc Warning:", error.formattedMessage);
      }
    }
    if (hasError) process.exit(1);
  }

  const vaultContract = output.contracts['BlindpotVault.sol']['BlindpotVault'];
  if (!vaultContract) {
    console.error("❌ BlindpotVault artifact not found in solc output");
    process.exit(1);
  }

  const outDir = path.resolve('contracts/out/BlindpotVault.sol');
  fs.mkdirSync(outDir, { recursive: true });

  const artifact = {
    abi: vaultContract.abi,
    bytecode: {
      object: '0x' + vaultContract.evm.bytecode.object
    }
  };

  fs.writeFileSync(path.join(outDir, 'BlindpotVault.json'), JSON.stringify(artifact, null, 2));
  console.log("🎉 Compilation succeeded! Artifact saved to contracts/out/BlindpotVault.sol/BlindpotVault.json");
}

compile();

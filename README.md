# hardhat-safe-proposer

Use safe multisig wallet to deploy contracts

## Note

This is an early stage hobby project

## Example Usage

```javascript
import * as proposer from "hardhat-safe-proposer";

async function main() {
  const deployer = "0x123"; // local hardhat deployer address. Loaded in hardhat.config.js
  const safeAddress = "0x456"; // safe mulsitig wallet address
  const safeVersion = "1.3.0";
  const contractName = "YourContract";
  const deploymentArgs = [arg1, arg2]; // constructor arguments for your contract

  await proposer.proposeDeploy(
    deployer,
    safeAddress,
    safeVersion,
    contractName,
    deploymentArgs
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

```

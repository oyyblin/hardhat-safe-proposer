import hre from "hardhat";
import "@nomiclabs/hardhat-ethers";
import Safe from "@safe-global/safe-core-sdk";
import { getCreateCallDeployment } from "@safe-global/safe-deployments";
import {
  SafeTransactionDataPartial,
  SafeVersion,
} from "@safe-global/safe-core-sdk-types";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import SafeServiceClient from "@safe-global/safe-service-client";

const ethers = hre.ethers;
const safeTransactionServiceUrls: { [chainId: number]: string } = {
  1: "https://safe-transaction-mainnet.safe.global",
  5: "https://safe-transaction-goerli.safe.global",
  10: "https://safe-transaction-optimism.safe.global",
  56: "https://safe-transaction-bsc.safe.global",
  100: "https://safe-transaction-gnosis-chain.safe.global",
  137: "https://safe-transaction-polygon.safe.global",
  246: "https://safe-transaction-ewc.safe.global",
  250: "https://safe-txservice.fantom.network",
  288: "https://safe-transaction.mainnet.boba.network",
  42161: "https://safe-transaction-arbitrum.safe.global",
  43114: "https://safe-transaction-avalanche.safe.global",
  73799: "https://safe-transaction-volta.safe.global",
  1313161554: "https://safe-transaction-aurora.safe.global",
};

export async function proposeDeploy(
  deployer: string,
  safeAddress: string,
  safeVersion: SafeVersion,
  contractName: string,
  deployArgs: any[]
) {
  const signer = await ethers.getSigner(deployer);
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });
  const chainId = await ethAdapter.getChainId();

  const safeSdk = await Safe.create({
    ethAdapter: ethAdapter,
    safeAddress: safeAddress,
  });

  console.log("prepare deployment data");
  const contract = await ethers.getContractFactory(contractName);
  const encodedDeploy = contract.interface.encodeDeploy(deployArgs);
  const deploymentData = ethers.utils.hexConcat([
    contract.bytecode,
    encodedDeploy,
  ]);

  console.log("prepare CreateCall");
  const singletonDeployment = getCreateCallDeployment({
    version: safeVersion,
    released: true,
  });

  const createCall = ethAdapter.getCreateCallContract({
    safeVersion: safeVersion,
    chainId: chainId,
    singletonDeployment: singletonDeployment,
  });
  const encodedPerformCreate = createCall.encode("performCreate", [
    0,
    deploymentData,
  ]);

  console.log("build transaction");
  const safeTransactionData: SafeTransactionDataPartial = {
    to: createCall.getAddress(),
    data: encodedPerformCreate,
    value: "0",
    // operation: OperationType.DelegateCall,
  };
  const safeTransaction = await safeSdk.createTransaction({
    safeTransactionData,
  });

  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
  const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

  console.log("propose transaction to safe: %s", safeTxHash);
  const safeTxServiceUrl = safeTransactionServiceUrls[chainId];
  const safeService = new SafeServiceClient({
    txServiceUrl: safeTxServiceUrl,
    ethAdapter,
  });
  await safeService.proposeTransaction({
    safeAddress: safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: senderSignature.signer,
    senderSignature: senderSignature.data,
  });
}

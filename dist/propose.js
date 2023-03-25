"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposeDeploy = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
require("@nomiclabs/hardhat-ethers");
const safe_core_sdk_1 = __importDefault(require("@safe-global/safe-core-sdk"));
const safe_deployments_1 = require("@safe-global/safe-deployments");
const safe_ethers_lib_1 = __importDefault(require("@safe-global/safe-ethers-lib"));
const safe_service_client_1 = __importDefault(require("@safe-global/safe-service-client"));
const ethers = hardhat_1.default.ethers;
const safeTransactionServiceUrls = {
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
async function proposeDeploy(deployer, safeAddress, safeVersion, contractName, deployArgs) {
    const signer = await ethers.getSigner(deployer);
    const ethAdapter = new safe_ethers_lib_1.default({
        ethers,
        signerOrProvider: signer,
    });
    const chainId = await ethAdapter.getChainId();
    const safeSdk = await safe_core_sdk_1.default.create({
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
    const singletonDeployment = (0, safe_deployments_1.getCreateCallDeployment)({
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
    const safeTransactionData = {
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
    const safeService = new safe_service_client_1.default({
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
exports.proposeDeploy = proposeDeploy;
//# sourceMappingURL=propose.js.map
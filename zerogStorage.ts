import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";

export interface ZgUploadResult {
  rootHash: string;
  txHash: string;
  storageProvider: "zerog";
  objectPath: string;
}

type SingleUploadInfo = { txHash: string; rootHash: string; txSeq: number };
type BatchUploadInfo = { txHashes: string[]; rootHashes: string[]; txSeqs: number[] };

function isSingleUpload(info: SingleUploadInfo | BatchUploadInfo): info is SingleUploadInfo {
  return "rootHash" in info;
}

export function isZeroGConfigured(): boolean {
  return !!(
    process.env.INDEXER_RPC &&
    process.env.BLOCKCHAIN_RPC &&
    process.env.PRIVATE_KEY
  );
}

export async function uploadToZeroG(
  buffer: Buffer,
  _filename: string
): Promise<ZgUploadResult> {
  const indexerRpc = process.env.INDEXER_RPC;
  const blockchainRpc = process.env.BLOCKCHAIN_RPC;
  const privateKey = process.env.PRIVATE_KEY;

  if (!indexerRpc || !blockchainRpc || !privateKey) {
    throw new Error(
      "0G Storage env vars not configured: INDEXER_RPC, BLOCKCHAIN_RPC, PRIVATE_KEY are required"
    );
  }

  const provider = new ethers.JsonRpcProvider(blockchainRpc);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerRpc);

  const file = new MemData(buffer);

  const uploadOpts = {
    tags: "0x",
    finalityRequired: true,
    taskSize: 10,
    expectedReplica: 1,
    skipTx: false,
    fee: BigInt("0"),
  };

  const [info, err] = await indexer.upload(file, blockchainRpc, signer, uploadOpts);

  if (err !== null) {
    throw new Error(`0G Storage upload failed: ${err}`);
  }

  if (!info) {
    throw new Error("0G Storage upload returned no result");
  }

  if (!isSingleUpload(info)) {
    throw new Error("0G Storage upload returned unexpected batch result");
  }

  return {
    rootHash: info.rootHash,
    txHash: info.txHash || "",
    storageProvider: "zerog",
    objectPath: `zerog://${info.rootHash}`,
  };
}

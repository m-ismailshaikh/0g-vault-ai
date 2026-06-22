---
name: 0G Storage SDK
description: Official 0G Storage TypeScript SDK — correct package name, upload API, and type narrowing required.
---

## Correct package

`@0gfoundation/0g-storage-ts-sdk` — this is the official package from the 0G README.
Do NOT use `@0glabs/0g-ts-sdk` (an older, different package also on npm).

## Install

```
pnpm add @0gfoundation/0g-storage-ts-sdk ethers
```

ethers v6 is a peer dependency. v6.17 works despite the warning about requiring 6.13.1.

## Upload pattern (Node/Express, in-memory buffer)

```typescript
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const indexer = new Indexer(INDEXER_RPC);

const file = new MemData(buffer); // buffer: Buffer

const [info, err] = await indexer.upload(file, BLOCKCHAIN_RPC, signer, {
  tags: "0x",
  finalityRequired: true,
  taskSize: 10,
  expectedReplica: 1,
  skipTx: false,
  fee: BigInt("0"),
});

if (err) throw new Error(`0G upload failed: ${err}`);
// info.rootHash, info.txHash
```

## Critical: union return type

`indexer.upload()` returns `[SingleUploadInfo | BatchUploadInfo, error]`:
- Single: `{ txHash: string; rootHash: string; txSeq: number }`
- Batch:  `{ txHashes: string[]; rootHashes: string[]; txSeqs: number[] }`

Must narrow with a type guard before accessing rootHash/txHash:
```typescript
function isSingleUpload(info): info is SingleUploadInfo {
  return "rootHash" in info;
}
```

## Env vars required
- `INDEXER_RPC` — e.g. https://indexer-storage-testnet-turbo.0g.ai
- `BLOCKCHAIN_RPC` — e.g. https://evmrpc-testnet.0g.ai
- `PRIVATE_KEY` — Ethereum wallet private key (needs balance for gas)

## Fallback pattern
Check `isZeroGConfigured()` before calling; if false, fall back to Replit App Storage.
objectPath stored as `zerog://{rootHash}` for 0G-stored documents.

**Why:** The two npm packages have different names and APIs. Without the type guard the TypeScript compiler rejects access to rootHash/txHash because the SDK exposes a union return type.

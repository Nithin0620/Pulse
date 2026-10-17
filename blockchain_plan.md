# PULSE — Blockchain Integrity Anchoring Plan

## 1. Executive Summary

PULSE uses a **hybrid Web2 / Web3 architecture**:
- **Off-chain:** Sensitive medical records, prescriptions, and lab reports are stored in Firebase Firestore and cloud storage (or local storage when offline).
- **On-chain:** Cryptographic integrity fingerprints (`keccak256` / `sha256`), document metadata, and timestamps are anchored to an Ethereum-compatible testnet (e.g., Base Sepolia, Arbitrum Sepolia, or Ethereum Sepolia).

This design ensures:
1. **Zero gas fees or friction for elderly users:** Relayer/sponsor transactions occur in the background without requiring MetaMask or wallet signatures.
2. **Strict privacy compliance:** No Protected Health Information (PHI) or Personally Identifiable Information (PII) is ever written to the blockchain.
3. **Decentralized proof of integrity:** Even if centralized servers or databases are compromised, any alteration to a medical record is immediately flagged because the record's hash will no longer match the immutable blockchain ledger.

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                  PULSE Web App                                    |
+-----------------------------------------------------------------------------------+
        |                                                           |
   1. Upload PDF / Image                                    2. Compute Hash
        |                                                  (SHA-256 / Keccak256)
        v                                                           |
+------------------------+                                          v
|  Firebase / Cloud DB   |                             +--------------------------+
| - Stores actual file   |                             |    Gasless Relayer API   |
| - Document metadata    |                             | (or Direct Testnet RPC)  |
| - AI-extracted meds    |                             +--------------------------+
+------------------------+                                          |
        ^                                                           | 3. Submit Tx
        |                                                           v
        | 4. Store txHash, blockNumber                 +--------------------------+
        +----------------------------------------------| Ethereum Smart Contract  |
                                                       | (MedicalRecordRegistry)  |
                                                       +--------------------------+
```

### Verification Flow (Tamper Detection)
1. User or verifier clicks **"Verify Authenticity"** on any document in PULSE.
2. The client fetches the stored file and recalculates its hash.
3. The client queries the smart contract: `records(recordHash)`.
4. If found:
   - Green state: **"Authentic — Anchored on Block #<number> at <timestamp>"** with a link to Etherscan / Blockscout.
5. If the file was modified by even 1 byte:
   - Red state: **"Tampering Detected — File hash does not match blockchain record!"**

---

## 3. Smart Contract Design

### `MedicalRecordRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicalRecordRegistry
 * @dev Anchors cryptographic hashes of medical records for tamper-evident verification.
 */
contract MedicalRecordRegistry {
    struct Record {
        address registeredBy;
        uint256 timestamp;
        uint256 blockNumber;
        string recordType; // e.g. "PRESCRIPTION", "LAB_REPORT", "DISCHARGE_SUMMARY"
    }

    // Mapping from file/content hash (bytes32) to on-chain record metadata
    mapping(bytes32 => Record) public records;

    event RecordAnchored(
        bytes32 indexed recordHash,
        address indexed submitter,
        uint256 timestamp,
        uint256 blockNumber,
        string recordType
    );

    /**
     * @notice Anchor a document hash onto the blockchain.
     * @param recordHash The Keccak-256 or SHA-256 hash of the off-chain document.
     * @param recordType The category of the medical document.
     */
    function anchorRecord(bytes32 recordHash, string calldata recordType) external {
        require(records[recordHash].timestamp == 0, "Record already anchored");

        records[recordHash] = Record({
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            recordType: recordType
        });

        emit RecordAnchored(recordHash, msg.sender, block.timestamp, block.number, recordType);
    }

    /**
     * @notice Check whether a document hash exists on-chain and retrieve its timestamp.
     * @param recordHash Hash of the file to verify.
     */
    function verifyRecord(bytes32 recordHash) external view returns (
        bool isAuthentic,
        uint256 timestamp,
        uint256 blockNumber,
        address registeredBy,
        string memory recordType
    ) {
        Record memory rec = records[recordHash];
        return (
            rec.timestamp > 0,
            rec.timestamp,
            rec.blockNumber,
            rec.registeredBy,
            rec.recordType
        );
    }
}
```

---

## 4. Proposed File Changes in PULSE

| File | Proposed Responsibility |
| :--- | :--- |
| `src/services/blockchainService.ts` | Handles hash generation (`crypto.subtle` / `ethers`), RPC connection, contract interaction, and verification calls. |
| `src/context/MedicationContext.tsx` | Extends `MedDocument` interface with `blockchain?: { txHash: string; recordHash: string; blockNumber?: number; explorerUrl: string }`. |
| `src/pages/Documents.tsx` | Adds an on-chain anchoring trigger during upload and displays the verification badge + Etherscan link. |
| `src/components/DocumentVerifyModal.tsx` | Interactive modal showing live hash recalculation, contract lookup, and tamper detection result. |

---

## 5. Gasless Relayer Strategy (Zero UX Friction)

Elderly patients and regular users should **never** be required to:
- Install MetaMask or any Web3 wallet.
- Acquire testnet ETH or manage private keys.
- Approve transaction popups.

**How to implement:**
1. A backend endpoint or lightweight serverless function (Firebase Function or API route) holds a dedicated relayer wallet funded with free testnet ETH.
2. When the client calls `addDocument()`, it asks the relayer to sign and submit the `anchorRecord()` call.
3. The returned transaction hash is saved with the document in Firestore.

---

## 6. Network Selection

For hackathon presentation and live demos, **Base Sepolia** or **Arbitrum Sepolia** is recommended over Ethereum L1 Sepolia:
- **Confirmation speed:** ~1-2 seconds (instant feedback during live demo).
- **Faucets:** Freely available with generous limits.
- **Block Explorer:** BaseScan / Arbiscan provides clean, recognizable UI for judges.

---

## 7. Hackathon Live Demo Script (30 Seconds)

1. **Upload:** Upload a prescription image in PULSE.
2. **Anchor:** Point out the green badge: `🛡️ Verified on Base Sepolia (Tx: 0x8a2f...)`. Click the badge to open BaseScan showing the transaction and timestamp.
3. **Tamper Test:** 
   - Open the "Verify Document" modal.
   - Click "Test Tampering": slightly alter one character in the file and re-verify.
   - Show the red alert: `⚠️ INTEGRITY BREACH: The file has been modified since it was anchored to the blockchain`.

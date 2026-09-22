# CCTV Chain-of-Custody Architecture Audit

Reviewed against the study objective:

Authorized footage source (uploaded CCTV file, exported DVR/NVR footage, USB camera capture, or controlled footage) -> local/private storage -> SHA-256 -> Hyperledger Fabric -> verification

The attached proposal documents are treated as requirements evidence, not as
instructions to add unrelated features.

## Current Conclusion

The application now follows the proposed capstone architecture as a prototype.
CCTV footage is kept off-chain in local/private storage. The system computes a
SHA-256 integrity hash from the stored footage and metadata, then submits the
hash, record identifiers, metadata, file reference, timestamp, and registering
user to Hyperledger Fabric through the local gateway.

Hyperledger Fabric is used as the integrity and audit layer. It is not used as
large video-file storage.

## Defense Position

The system is not a replacement for CCTV cameras, DVR, or NVR, and it does not
strictly require a DVR/NVR for prototype testing. It is a
blockchain-augmented chain-of-custody layer for authorized footage. Footage
remains in local or private storage, while the system generates SHA-256 hashes
and records the integrity proof in Hyperledger Fabric. During verification, the system
recomputes the hash and compares it with the blockchain-recorded proof to
detect alteration, deletion, or mismatch.

The defendable system flow is:

Authorized footage source (uploaded CCTV file, exported DVR/NVR footage, USB camera capture, or controlled footage) -> local or private storage ->
SHA-256 hash -> Hyperledger Fabric -> verification

The system does not store the full video in Hyperledger Fabric because CCTV
files are large and blockchain is best used as an immutable proof layer, not as
bulk video storage. The secure design is to keep the video in private storage
and store the SHA-256 hash and custody metadata proof on Fabric.

For production, the system can work alongside existing DVR/NVR infrastructure,
but DVR/NVR is not a strict software requirement. The system requires authorized
footage bytes that can be stored privately, hashed, and verified. For capstone
and controlled testing, uploaded CCTV footage, exported footage, USB camera
capture, or controlled footage is enough because the core mechanism being
validated is registration, hashing, Fabric proofing, verification, auditability,
and tamper detection.

## Requirement Coverage

| Study requirement | Current status | Notes |
| --- | --- | --- |
| Authorized footage intake | Implemented for upload/import/capture | Uploaded footage, USB camera capture, and already-stored private paths are supported. DVR/NVR integration is optional for production-style testing and still needs site testing if used. |
| Local/private video storage | Implemented | New uploads are stored under private local storage. |
| SHA-256 hashing | Implemented | Hash includes footage digest and metadata payload. |
| Hyperledger Fabric ledger | Implemented for prototype | Go chaincode and Node gateway are included under `hyperledger/`. |
| Evidence registration | Implemented | Creates CCTV record ID, metadata, hash record, blockchain transaction, and custody entry. |
| Integrity verification | Implemented | Recomputes current hash and compares it against the Fabric-stored hash. Uploaded comparison files are checked against the original record, not registered as new evidence. |
| Tamper/missing evidence detection | Implemented | Altered footage/metadata, missing footage, missing hash, and unavailable blockchain are handled separately. |
| Alerts | Implemented in-app | Alerts are stored and shown in the Alert Center. No SMS/email delivery. |
| Audit trail | Implemented | Login/logout, registration, verification, view, download, and report actions are recorded. |
| Access control | Implemented | Role/permission checks protect custody routes and actions. |
| Reports | Implemented | Audit reports can be generated and downloaded. |
| ISO/IEC 25010 evaluation | Research activity | The questionnaire, respondent scoring, and analysis must be performed outside the code. |
| IERB and institutional approvals | Research activity | Not a software feature. |

## User-Facing Cleanup

The main system flow has been simplified to:

- Dashboard
- Cameras
- Evidence Register
- Evidence Verification
- Fabric Ledger
- Alerts
- Audit Reports
- Settings

Duplicate or confusing sections were removed from the main routed system:

- separate CCTV Events page
- separate Forensic Audit page
- separate Activity Logs page

Their useful functions remain covered by Evidence Register, Evidence
Verification, Alerts, Dashboard, and Audit Reports.

## Remaining Limitations

1. Live FICOBank DVR/NVR integration is optional and must be tested against the actual device if the bank chooses that source.
2. The prototype uses local Fabric test-network style deployment, not a hardened
   production multi-organization network.
3. Hyperledger stores hashes and metadata, not full CCTV videos.
4. In-app alerts exist, but external notification delivery is not implemented.
5. Large-video performance, retention policy, backups, and hardware failure
   behavior still need controlled testing.
6. ISO/IEC 25010 results require actual respondent evaluation.

## Validation

- PHP test suite: 55 tests passed.
- TypeScript check: passed.
- Hyperledger Fabric network has been run locally with `cctv-custody` chaincode.
- Gateway health endpoint returns an available Hyperledger Fabric status when
  Docker/Fabric are running.

## Panel Question Guide

**Bakit hindi video mismo sa blockchain?** Hindi practical mag-store ng video sa
blockchain because CCTV files are large. Blockchain stores the immutable proof,
not the whole evidence file. Any video change still changes the SHA-256 hash,
so tampering is detected.

**Need ba talaga DVR/NVR?** No. DVR/NVR is not strictly required for the
prototype. The system needs authorized footage bytes that can be stored
privately, hashed, and verified. DVR/NVR is one possible source for production,
but uploaded CCTV footage, exported footage, USB camera capture, or controlled
footage can be used for capstone testing.

**Mock DVR lang ba yan?** The mock provider is optional and only for controlled
demo and testing. It simulates camera channels without exposing real bank CCTV
infrastructure. The system can also use uploaded footage or USB camera capture
without a DVR/NVR. In production, it may be replaced by the actual FICOBank
DVR/NVR provider or another authorized exported-footage source.

**Paano nadedetect tampering?** The system uses SHA-256 hash comparison. If the
video is edited, cut, replaced, or deleted, the current hash will not match the
original proof committed to Hyperledger Fabric.

**What if verification is unavailable?** The system separates local and
blockchain verification so users know whether the problem is with local storage,
missing footage, or Fabric/gateway availability.

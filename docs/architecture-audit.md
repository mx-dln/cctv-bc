# CCTV Chain-of-Custody Architecture Audit

Reviewed against the study objective:

Camera -> DVR/NVR -> local/private storage -> SHA-256 -> Hyperledger Fabric

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

## Requirement Coverage

| Study requirement | Current status | Notes |
| --- | --- | --- |
| CCTV/DVR/NVR evidence intake | Implemented for upload/import | Uploaded footage and already-stored private paths are supported. Live hardware integration still needs site testing. |
| Local/private video storage | Implemented | New uploads are stored under private local storage. |
| SHA-256 hashing | Implemented | Hash includes footage digest and metadata payload. |
| Hyperledger Fabric ledger | Implemented for prototype | Go chaincode and Node gateway are included under `hyperledger/`. |
| Evidence registration | Implemented | Creates CCTV record ID, metadata, hash record, blockchain transaction, and custody entry. |
| Integrity verification | Implemented | Recomputes current hash and compares it against the Fabric-stored hash. |
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

1. Live FICOBank DVR/NVR integration must be tested against the actual device.
2. The prototype uses local Fabric test-network style deployment, not a hardened
   production multi-organization network.
3. Hyperledger stores hashes and metadata, not full CCTV videos.
4. In-app alerts exist, but external notification delivery is not implemented.
5. Large-video performance, retention policy, backups, and hardware failure
   behavior still need controlled testing.
6. ISO/IEC 25010 results require actual respondent evaluation.

## Validation

- PHP test suite: 53 tests passed.
- TypeScript check: passed.
- Hyperledger Fabric network has been run locally with `cctv-custody` chaincode.
- Gateway health endpoint returns an available Hyperledger Fabric status when
  Docker/Fabric are running.

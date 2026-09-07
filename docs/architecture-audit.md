# CCTV Architecture Audit

Reviewed on 2026-09-06 against CHAIN.pdf (10-page development blueprint) and
CHAIN-OF-CUSTODY-UPDATED.docx (revised objectives, conceptual framework, scope,
and testing methodology). Documents were treated as requirements evidence,
not as instructions authorizing unrelated actions.

## Conclusion

The application is not a complete Hyperledger Fabric implementation. The local
registration, hashing, verification, access control, alerts, and audit workflows
have been corrected and tested, but a real ledger integration remains outstanding.
Do not present local simulation results as Fabric validation or immutable evidence.

The sources differ on video storage. PDF section 5 permits video in prototype
transactions; the revised document explicitly keeps video outside the blockchain.
This revision retains off-chain footage and submits its reference and metadata.
It does not claim full compliance with the optional on-chain-video demonstration.

## Requirement Coverage

| Requirement | Result after this audit | Evidence or limitation |
| --- | --- | --- |
| CCTV/NVR footage input | Partial | Uploaded video and existing relative storage paths work. Remote URLs/NVR references cannot be verified without importing bytes. Live hardware not tested. |
| Authentication and roles | Tested | Login/logout audit listeners; route permissions enforced using seeded permissions. Users without permissions are denied custody access. |
| CCTV registration | Tested | Record ID, metadata, filename and resolution persist. Search and pagination available. New uploads use private storage. |
| SHA-256 of footage and metadata | Tested | File digest is included in the metadata payload hash. Reloaded records verify; modified bytes or metadata fail. |
| Blockchain package | Partial | Adapter sends record/event ID, camera, hash, metadata, reference, registration time/user, and status. No video bytes sent. |
| Fabric SDK and chaincode | Missing from repository | No SDK gateway, chaincode implementation, certificates, peer/orderer deployment, or network definition found. |
| Endorsement, ordering and ledger commit | Unverified | HTTP adapter expects a gateway. Real network behavior cannot be established by the PHP simulation. |
| Transaction confirmation | Corrected | Requires gateway transaction ID and committed status. Unconfirmed submissions remain pending. No automatic retry worker is implemented. |
| Original versus current hash | Tested locally | Simulation compares against the saved transaction hash instead of echoing the submitted hash. SQL simulation remains mutable. |
| Missing versus altered footage | Tested | Missing local file produces missing status/alert; altered bytes/metadata produce tampered (displayed as altered in register). |
| Unavailable verification | Corrected | Remote references, missing baseline, or network failures do not claim verified or altered. Stored status becomes pending. |
| Integrity notifications | Partial | In-app alerts work. No external notification delivery or continuous background verification was established. |
| Audit trail | Tested core actions | Login/logout, registration, viewing, verification and authenticated downloads are recorded. Timeline query and report browsing repaired. |
| Dashboard | Implemented | Required record counts, recent transactions, alerts, and activity trail. Simulation is labeled. |
| Reports | Tested Excel path | Corrected query relationships/date columns, export disk, download route, missing count summary. PDF template exists; visual report QA not performed. |
| Research evaluation | Not established | No evidence of completed ISO/IEC 25010 user evaluation, performance benchmarks, pilot deployment, or measured detection study. These require actual evaluation. |

## Corrections

- Removed unconditional simulated verification success and automatic simulation fallback.
- Removed false transaction success when no commit confirmation is returned.
- Fixed discarded filename/resolution and normalized new registration before hashing.
- Denied registration based solely on filename or an unreadable remote reference.
- Added permission enforcement, private new uploads, authenticated download and audit.
- Connected authentication events to existing audit logging.
- Unified forensic analysis with the footage-aware verification workflow.
- Fixed broken audit relationships, dates, Excel output path and file download.
- Added CSRF/JSON headers to browser API requests and fixed provider save callbacks.
- Hid provider password/API key from serialized models; blank edits preserve secrets.
- Corrected outdated frontend transaction/record properties and invalid select values.
- Added registration errors, transaction mode/status, pagination and search.

## Removed or Simplified

- Live evidence-tampering endpoint/controller. Controlled alteration belongs in tests.
- Unused simulator page and simulator/tamper permissions in fresh seed data.
- Duplicate forensic/defense dashboards and unsupported weighted health scores.
- Certificate endpoint claiming a digital signature using an ordinary hash.
- Camera create/edit pages and resource routes whose controller methods did not exist.
- Team policy, invitation scheduler, team UI references and tests of nonexistent teams.
  Authentication/dashboard tests were retained and updated for the actual application.
- Settings save endpoint that only changed unused database values. Settings now display
  effective runtime configuration. Deployment configuration remains in config/env.
- Unsupported print report format, which never generated a file.

Provider integrations, evidence history, audit reports, alerts and authentication
security features were retained because they support the revised objectives.
Historical migrations/data were not erased to remove an unused feature.

## Remaining Risks and Work

1. Implement/deploy a real Fabric SDK gateway, chaincode, identities and network;
   test registration, retrieval, rejection and commit confirmation end to end.
   The existing adapter uses custom HTTP routes, not a bundled network implementation.
2. Review old simulated records. Older transactions contain no saved hash, and old
   remote references may carry stale verified labels until checked. Re-register from
   authorized original footage; do not invent or backfill an original ledger hash.
3. Legacy public uploads may remain reachable via the public storage link. New
   uploads are private, but existing files require an explicit migration that
   preserves original references and hashes. No existing footage was moved/deleted.
4. Audit/history records and simulation transactions are ordinary SQL records, not
   independently immutable. Database administrator modifications are not prevented.
5. A historical schema replacement migration drops tables. Do not run it over a
   populated older installation without a backup and a data-preserving upgrade plan.
6. Automatic metadata extraction, live NVR download/import, retry scheduling and
   ongoing discrepancy monitoring require additional implementation/validation.
7. User provisioning currently relies on seeds/administrative setup; self-registered
   users receive no custody permissions. No user-management screen was found.
8. Large-video throughput, concurrent hash-chain sequencing, file-write failure
   cleanup, retention and full hardware integration have not been stress-tested.

## Validation

- PHP suite: 53 tests passed, including 13 custody regression tests.
- TypeScript: `npm run types:check` passed.
- Production assets: `npm run build` passed (optional font fallback warning only).
- Headless Edge: admin login and seven main screens loaded without page errors.
- Registration screenshots checked at 1440x1000 and 390x844; no horizontal overflow.
- Tests used an isolated SQLite database and fake storage; existing CCTV data was
  not used for destructive test scenarios. Browser login added a normal audit entry.
- No live Fabric or NVR success is inferred from these results.

## 1.1.0 (2025-03-18)

### Added

- Add ~assets routing for sites

## 1.0.1 (2024-07-10)

### Fixed

- **ci**: Set src passed a correct level for release tasks

### Maintenance

- **ci**: Rework staging and prod CI task topology and add .cz.json config
- Update node.js dependencies braces and fill-range
- **ci**: pull full repo for release

## 1.0.0 (2024-07-10)

### Added

- Add dev deployment env for PRs to staging
- Switch to using harden container fof cf-image
- Only allow GET, HEAD requests
- Add usePreviewPath option on redirects to keep site preview path on redirect
- Add build redirects to federalist proxy deploy
- add support for empty array of redirects
- Test and build redirects
- Add redirects utils

### Fixed

- Added encoded values check regex
- CI pipeline has working build-redirects task
- test:integration to include redirects

### Maintenance

- **ci**: use boot task for multiple env deploy
- use pipeline tasks
- use hardened nginx image
- container hardening
- **ci**: Switch to general-task and registry-image for CI jobs
- Partialize CI tests and use hardened git resource
- Update README.md
- Update CI pipelines to hardened resources
- Update app stack to cflinuxfs4
- update test env to Node 16

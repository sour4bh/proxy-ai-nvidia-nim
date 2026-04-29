# Security Policy

## Supported Versions

Security fixes target the `main` branch.

## Deployment Boundary

proxyai has no client authentication by design. It is intended for localhost,
Tailscale, VPNs, or another private network boundary. Do not expose the process
directly to the public internet.

The proxy ignores client `Authorization` headers for upstream purposes and
always injects its own `NVIDIA_NIM_API_KEY` when calling NVIDIA NIM. Treat the
machine running proxyai as trusted infrastructure.

## Secrets

- Keep `.env` local.
- Never commit `NVIDIA_NIM_API_KEY`.
- Rotate the key immediately if it is exposed in logs, shell history, commits,
  screenshots, issues, or chat transcripts.

## Reporting a Vulnerability

If GitHub private vulnerability reporting is enabled for this repository, use
that first. Otherwise, open a minimal issue asking for a private disclosure
channel and do not include exploit details, tokens, private URLs, or sensitive
logs in the public issue.

Useful reports include:

- Affected route or command.
- Expected and observed behavior.
- Minimal reproduction steps.
- Impact and whether secrets, upstream quota, or private network access are
  involved.

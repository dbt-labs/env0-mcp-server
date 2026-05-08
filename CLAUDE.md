# env0 MCP Server — dbt Labs Fork

## What this is

A fork of [`env0/mcp-server`](https://github.com/env0/mcp-server) (Apache 2.0) with one addition: **generic bearer token auth middleware** so the server can be hosted behind an identity provider instead of requiring static API keys on every client.

## Why we forked

env0's official MCP server requires each user/agent to hold `ENV0_API_KEY` and `ENV0_API_SECRET` directly. dbt Labs Security rejected this for Runlayer (our MCP hosting platform) because:
- No per-user identity — everyone shares the same key
- No audit trail of who called what
- Static credentials on every client increase exposure surface

The fix is a generic bearer auth mode: users authenticate via their org's identity provider (OIDC), the server validates the JWT, and a single env0 API key lives server-side. This isn't dbt-specific — any org hosting this server can use it.

## Goal

The auth middleware should be **generic enough to PR upstream** to `env0/mcp-server`. Keep changes minimal and backward-compatible. The upstream PR framing: "Add bearer token auth mode for hosted/enterprise deployments."

## Architecture

```
User/Agent → [OIDC SSO] → MCP Host (Runlayer) → Bearer Token → This Server
                                                                    │
                                                    Validates JWT via JWKS
                                                    Extracts user identity
                                                                    │
                                                    Uses server-side env0
                                                    API key for all calls
                                                                    │
                                                              env0 API
                                                          (api.env0.com)
```

Two auth modes via `AUTH_MODE` env var:
- `basic` (default) — existing behavior, no changes. API key per client.
- `bearer` — new. Validates `Authorization: Bearer <jwt>` against OIDC/JWKS. env0 API key is server-side only.

## Existing codebase (upstream)

```
src/
  server.ts              # MCP server setup and transport
  cli.ts                 # CLI entry point
  env0-service/
    env0-client.ts       # HTTP client — Basic Auth with ENV0_API_KEY + ENV0_API_SECRET
    env0-service.ts      # Service layer — calls /mcp/* endpoints on api.env0.com
    models/              # TypeScript types for API responses
  mcp/
    index.ts             # Tool registration
    tools/               # 12 tool implementations (get-environments, deploy-environment, etc.)
    schemas/             # Zod input schemas per tool
```

Key details:
- **API surface:** Server hits `/mcp/`-prefixed endpoints (curated by env0), not the raw REST API
- **Auth in env0-client.ts:** Constructs `Basic ${base64(keyId:keySecret)}` header in constructor
- **Tools (12):** get-environments, get-projects, get-plan-logs, get-error-analysis, deploy-environment, approve-environment, abort-environment, cancel-environment, get-cloud-configurations, get-cloud-resources, generate-iac, check-iac-job-status
- **Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, `axios`, `zod`

## Implementation plan

### Phase 1: Bearer auth middleware

1. **New file `src/auth/bearer-auth.ts`:**
   - Accept `AUTH_MODE` env var (`basic` | `bearer`, default `basic`)
   - When `bearer`: validate incoming JWT using `jose` library
   - Discover JWKS keys via `OIDC_ISSUER` (uses `.well-known/openid-configuration`) or direct `JWKS_URI`
   - Optional `AUTH_AUDIENCE` for audience claim validation
   - Extract user identity from standard JWT claims (`sub`, `email`, `name`)
   - Export middleware function and user-identity extractor

2. **Modify `src/server.ts`:**
   - Import and apply auth middleware based on `AUTH_MODE`
   - When `bearer`, authenticate requests before they reach MCP tool handlers
   - Pass user identity through to tool handlers (for logging/attribution)

3. **No changes to `src/env0-service/`:**
   - `env0-client.ts` keeps using `ENV0_API_KEY` + `ENV0_API_SECRET` for env0 API calls
   - The auth middleware is between the MCP client and this server, not between this server and env0

4. **New dependency:** `jose` (lightweight, well-maintained JWT/JWKS library)

5. **Environment variables (bearer mode):**
   ```
   AUTH_MODE=bearer
   OIDC_ISSUER=https://your-idp.com    # auto-discovers JWKS via .well-known
   # OR
   JWKS_URI=https://your-idp.com/.well-known/jwks.json
   AUTH_AUDIENCE=optional-audience       # optional JWT audience validation

   # env0 credentials (unchanged, server-side)
   ENV0_API_KEY=...
   ENV0_API_SECRET=...
   ENV0_ORGANIZATION_ID=...
   ```

### Phase 2: Runlayer deployment (dbt-specific, not upstreamed)

6. **Dockerfile** — multi-stage Node.js build, production image
7. **`runlayer.yaml`:**
   ```yaml
   name: env0-mcp
   runtime: docker
   build:
     dockerfile: Dockerfile
     context: .
     platform: arm
   service:
     port: 3000
     path: /mcp
   infrastructure:
     cpu: 256
     memory: 512
   env:
     AUTH_MODE: bearer
     OIDC_ISSUER: ${OIDC_ISSUER}
     ENV0_API_KEY: ${ENV0_API_KEY}
     ENV0_API_SECRET: ${ENV0_API_SECRET}
     ENV0_ORGANIZATION_ID: ${ENV0_ORGANIZATION_ID}
   ```
8. Deploy: `uvx runlayer deploy --host dbt.runlayer.com`
9. Register as connector with tool allowlist: `get-environments`, `get-projects`, `get-plan-logs`, `get-error-analysis`

### Phase 3: Upstream PR

10. Branch off the auth changes (exclude runlayer.yaml, deployment configs)
11. PR to `env0/mcp-server` with title: "Add bearer token auth mode for hosted/enterprise deployments"
12. Include docs for both auth modes in README

## Testing

- **Basic mode:** Set `AUTH_MODE=basic` (or omit — it's the default). Existing behavior should be completely unchanged.
- **Bearer mode:** Set `AUTH_MODE=bearer` + `OIDC_ISSUER`. Send requests with valid/invalid/expired JWTs. Verify: valid tokens pass through, invalid tokens get 401, user identity is extracted.
- **No env0 API key:** Server should fail fast at startup with a clear error, regardless of auth mode.

## Rules

- Keep the diff from upstream minimal. Don't refactor existing code.
- Don't change how `env0-client.ts` authenticates to env0 — that's a separate concern.
- `AUTH_MODE=basic` must remain the default and work identically to upstream.
- The `runlayer.yaml` and dbt-specific deployment configs go in a separate directory or are excluded from the upstream PR.
- Use `jose` not `jsonwebtoken` — it's lighter, has no native dependencies, and handles JWKS key rotation automatically.

# env0 MCP Server — Fork Configuration

This is the dbt Labs fork of `env0/mcp-server`, deployed to Runlayer as a hosted MCP server.

## Upstream PR policy (CRITICAL)

This file exists only in the dbt Labs fork (`dbt-labs/env0-mcp-server`). It must **never** appear in PRs to the upstream repo (`env0/mcp-server`).

When creating upstream PRs:
1. Branch from `upstream/main`, not `origin/main`
2. Cherry-pick or rebase only the commits relevant to the contribution
3. Verify `CLAUDE.md` is not in the diff before opening the PR
4. **Always pass `--repo dbt-labs/env0-mcp-server`** when running `gh pr create` — without it, `gh` defaults to the upstream `env0/mcp-server` remote and the PR lands on the public repo

Files that must never reach upstream:
- `CLAUDE.md`
- `.claude/` (if added later)

## Runlayer deployment sync

This fork is deployed to Runlayer as a hosted Docker service. Tool descriptions served by the MCP server become the schema that Claude Code and other clients see. **When you change a tool's description, default value, or parameter schema in the source code, the Runlayer deployment must be rebuilt to pick up those changes.**

After merging changes that affect tool metadata:
- Rebuild the deployment in Runlayer (deployment ID: `7a867761-29af-4722-b285-1ebd095582b8`)
- Verify the updated descriptions appear via `list_server_tools` on the Runlayer API

There are two places tool descriptions live in the source:
1. **Schema files** (`src/mcp/schemas/*.ts`) — parameter-level descriptions and defaults
2. **Tool registration** (`src/mcp/tools/*.ts`) — top-level tool description string

Both must stay consistent with each other, and both propagate to Runlayer only after a redeploy.

### Docker cache gotcha

The Runlayer CLI uses `docker build` internally and does not expose `--no-cache`. Docker's layer cache for `COPY . .` persists even after `docker builder prune --all` — intermediate layers are stored as image layers, not just in the builder cache.

If you deploy and the tool descriptions don't change, the image was likely built from a cached layer with stale source:
1. Modify any file in the build context (e.g. `echo "// bust" >> src/mcp/tools/get-plan-logs.ts`)
2. Redeploy with `uvx runlayer deploy -c runlayer.yaml -e .env`
3. Clean up the throwaway change after the deploy
4. Wait ~30-45s after deploy for the ECS task to roll over before verifying via `list_server_tools`

### Upstream contribution checklist

When cherry-picking fork commits onto an upstream PR branch:
1. Audit the diff for any dbt Labs-specific data (account IDs, deployment IDs, org IDs, internal URLs, Slack channels)
2. Remove internal implementation comments (e.g. `// Change 3:`) — keep only comments that explain *why*
3. Verify `CLAUDE.md`, `runlayer.yaml`, `.env`, `.tool-versions` are not in the diff
4. Ensure changes work generically for any env0 customer, not just our deployment

## Remotes

| Remote | Repo | Purpose |
|--------|------|---------|
| `origin` | `dbt-labs/env0-mcp-server` | Fork — our changes, Runlayer deployment source |
| `upstream` | `env0/mcp-server` | Upstream — general contributions only |

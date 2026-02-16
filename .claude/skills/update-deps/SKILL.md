---
name: update-deps
description: Incrementally update and deduplicate dependencies in the Yarn monorepo. Analyzes outdated packages, identifies safe minor/patch bumps, checks for lockfile duplications, and updates one-by-one verifying types after each change.
---

# Update Dependencies

Incrementally update dependencies in this Yarn v1 monorepo. The goal is to keep dependencies fresh while avoiding breakage — reducing duplicate versions in the lockfile, closing known vulnerabilities, and staying close to upstream.

## Philosophy

- **Incremental**: Update one dependency or a small related group at a time, never all at once. Prefer thematic batches (e.g., all AWS SDK packages, all Storybook-related packages, all Babel packages). For non-thematic updates, keep to a maximum of 3–4 packages (5 absolute max) per PR.
- **Safe first**: Prefer patch and minor bumps. Avoid major version bumps unless explicitly requested.
- **Verify after each change**: Run `yarn check-types` in the affected workspace(s) after every update.
- **No unnecessary resolutions**: Avoid adding `resolutions` to `package.json` unless absolutely necessary (they are hard to maintain and can mask real issues).
- **Yarn only**: This is a Yarn v1 monorepo. Always use `yarn` commands — never use `npm` for installing or managing dependencies.

## Process

### Step 1: Analyze

```bash
# List outdated packages across all workspaces
yarn outdated 2>&1 | head -80

# Count duplicated packages in the lockfile
grep -E '^"?[a-z@]' yarn.lock | sed 's/"//g' | sed 's/,.*$//' | sed 's/@[^@]*$//' | sort | uniq -c | sort -rn | awk '$1 > 1' | wc -l
```

### Step 2: Pick candidates

Categorize by risk:

| Risk       | Type                       | Examples                                    |
| ---------- | -------------------------- | ------------------------------------------- |
| **Low**    | `@types/*` patch bumps     | `@types/node` 22.5.0 -> 22.5.1              |
| **Low**    | Patch bumps of stable libs | `storybook` 10.2.3 -> 10.2.8                |
| **Medium** | Minor bumps                | `winston` 3.14.2 -> 3.19.0                  |
| **Medium** | Babel ecosystem bumps      | `@babel/core` 7.25.x -> 7.29.x              |
| **High**   | Major bumps                | `react-hook-form` 7.x -> 8.x                |
| **High**   | ESM-only migrations        | `chalk`, `p-map`, etc. (excluded in `ncux`) |

Optionally, check if updating a package would reduce lockfile duplications:

```bash
yarn why <package-name>
```

Prioritize updates that align versions across workspaces or reduce transitive duplicates (e.g., updating `@babel/core` in client to match the version Storybook pulls in).

### Step 3: Baseline type check

Before applying any update, run `check-types` on the workspace(s) you are about to touch. This tells you which errors already exist vs which ones your change introduces.

**Scope rule:**

- Updating a dependency in **one workspace** (client, server, bin, e2e): check only that workspace.
- Updating the **root `package.json`** (resolutions, shared devDependencies): check **all 4 workspaces**, since root changes can affect any of them.

```bash
# Example: server-only change
yarn workspace @parallel/server run check-types 2>&1 | tail -10

# Example: root change — check all 4
yarn workspace @parallel/client run check-types 2>&1 | tail -10
yarn workspace @parallel/server run check-types 2>&1 | tail -10
yarn workspace @parallel/bin run check-types 2>&1 | tail -10
yarn workspace @parallel/e2e run check-types 2>&1 | tail -10
```

### Step 4: Apply the update

Edit the version in the appropriate `package.json`, then install and verify.

```bash
SKIP_UPDATE_IP_DB=1 yarn install

# Check the "Applying patches..." output — all should show checkmarks

# Re-run check-types on same scope as Step 3, compare against baseline
yarn workspace @parallel/server run check-types
```

### Step 5: Verify yarn.lock

After `yarn install`, check that the lockfile hasn't grown unexpectedly. Yarn v1 frequently introduces duplicate resolutions when transitive dependencies declare slightly different semver ranges for the same internal package (common with AWS SDK, Babel, etc.).

```bash
# Compare lockfile line count against develop
echo "develop: $(git show develop:yarn.lock | wc -l) lines"
echo "current: $(wc -l < yarn.lock) lines"

# Check for new duplications in the updated scope
npx yarn-deduplicate --list --scopes @aws-sdk   # adjust scope to match the batch
```

**If new duplications are found**, deduplicate before proceeding:

```bash
npx yarn-deduplicate --scopes <scope>
SKIP_UPDATE_IP_DB=1 yarn install
```

Then re-run `check-types` on the affected workspaces to confirm nothing broke.

**If deduplication doesn't resolve the growth** (i.e., there are genuinely new transitive packages that can't be collapsed), verify the increase is explainable (e.g., a new sub-package was added upstream). Unexplained lockfile growth is a reason to abort the update.

### Step 6: Handle type errors

If `check-types` shows **new** errors (not in the baseline):

1. **Few errors (1-3)**: Fix them inline (e.g., add `?? []` for newly-optional values).
2. **Many errors (5+)**: The update is too breaking for a quick bump. Revert and note it as needing a dedicated PR.

After fixing any source files, format them:

```bash
yarn prettier --write <file>
```

## Gotchas

### Yarn v1 lockfile and downgrades

Changing a version range back in `package.json` does NOT downgrade in the lockfile if the currently locked version still satisfies the range. To truly downgrade:

- Edit `yarn.lock` directly to set the old resolved version and integrity hash, or
- Run `yarn workspace <workspace> add <package>@<exact-old-version>`, then restore the caret range in `package.json`.

### Patched packages

The project uses `patch-package`. Before updating any of these, verify the patch still applies:

`@apollo/client`, `body-parser`, `eslint-plugin-formatjs`, `ip-location-api`, `knex`, `mjml-core`, `postgres-interval`

### @types/\* packages must match their parent

Only update a `@types/xx` package to the latest version if the corresponding `xx` package is at its latest version. Bumping a type package ahead of its runtime counterpart can introduce type mismatches and subtle breakage.

### ESM-only exclusions

These packages are pinned to CJS-compatible versions and must NOT be updated (excluded in the `ncux` script in root `package.json`):

`chalk`, `camelcase`, `escape-string-regexp`, `p-all`, `p-map`, `p-props`, `file-type`, `graphql-upload`, `graphql-request`, `@types/graphql-upload`, `graphql-upload-client`, `flat`

### Resolutions

Only add new resolutions for critical issues (security vulnerabilities, build-breaking conflicts). They are hard to maintain and can silently mask real incompatibilities.

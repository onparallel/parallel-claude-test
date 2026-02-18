---
name: code-review
description: Review local code changes before creating a PR. Use to catch security vulnerabilities and logic issues that linters can't detect. Analyzes the diff for SQL injection, XSS, multi-tenancy violations, hardcoded secrets, race conditions, and transaction handling.
---

# Code Review

Review code changes and show suggested fixes.

## Environment Detection

Check if running in CI:

```bash
echo $GITHUB_ACTIONS
```

- **Local** (`GITHUB_ACTIONS` is empty): Open VS Code diffs, ask user for action
- **GitHub Actions** (`GITHUB_ACTIONS=true`): Post results as PR comment

## Instructions

### Step 1: Get changes

**In GitHub Actions:**
```bash
gh pr diff $PR_NUMBER
```

**Local:**
```bash
git diff origin/develop...HEAD
```

If no commits yet, also check working directory:
```bash
git diff
git diff --cached
```

### Step 2: Analyze the changes

Look for real issues in the diff. Examples of things to watch for (only mention if actually present — do not list these categories if no issues are found):

**CRITICAL (should block):** SQL injection, XSS, command injection, multi-tenancy violations (missing `org_id` filters), data loss risks, hardcoded secrets.

**CODE QUALITY (suggestions):** Missing error handling in critical paths, race conditions, incorrect transaction handling, N+1 query patterns.

**LOCKFILE (if `yarn.lock` changed):** Review `yarn.lock` changes against `package.json` files. Flag unnecessary package duplications (same package resolved to multiple versions when one would suffice) or changes that don't make sense given the `package.json` updates.

### Step 3: Report findings

**If NO issues are found:**

```
## Code Review

No issues found. Code looks good!
```

In GitHub Actions, post this as PR comment and finish:
```bash
gh pr comment $PR_NUMBER --body "## Code Review

✅ No issues found. Code looks good!"
```

**If issues ARE found**, continue to Step 4.

### Step 4: Present results

**In GitHub Actions:**

Post as PR comment with findings:

```bash
gh pr comment $PR_NUMBER --body "## Code Review

### Critical Issues
[List issues with file:line, problem, and suggested fix]

### Suggestions
[List code quality improvements]"
```

**Local:**

Create suggested fixes and open in VS Code:

```bash
mkdir -p /tmp/code-suggestions
```

For each file with issues:
1. Read current content
2. Create fixed version at `/tmp/code-suggestions/[filename].suggested.[ext]`
3. Open diff:
   ```bash
   code --diff path/to/file.ts /tmp/code-suggestions/[filename].suggested.ts
   ```

### Step 5: Summary (Local only)

```
## Code Review

### Critical Issues
[List any critical issues, or "None found"]

### Suggestions
[List code quality improvements]

### Files opened in VS Code
- [List of files]
```

For each issue include: file, line number, problem description, and fix.

### Step 6: User action (Local only)

Use AskUserQuestion:

- **Apply fixes** - Copy suggested files to their original locations
- **Skip** - Do nothing

**Apply fixes:**

```bash
cp /tmp/code-suggestions/[filename].suggested.ts path/to/file.ts
```

## What NOT to flag

- Anything ESLint/Prettier handles (style, unused vars, const vs let)
- Missing documentation
- Refactoring suggestions for unchanged code

## Step 7: Documentation check (CI only)

After completing the code review, **only in GitHub Actions**, evaluate whether the changes warrant a documentation review. Be conservative to control costs.

**Invoke `/check-documentation` if the changes include:**
- New features or user-facing functionality
- New or removed API endpoints or GraphQL resolvers
- New database tables, services, workers, or architectural components
- Changes to configuration or environment variables

**Do NOT invoke `/check-documentation` if the changes are:**
- Bug fixes
- Internal refactoring without API changes
- Test additions or modifications
- Dependency updates
- Code style or formatting changes
- Minor logic changes to existing code without API impact

If the changes meet the criteria, run the `/check-documentation` skill. You already have the diff and analysis in context — the documentation check should reuse them instead of fetching the diff again. Otherwise, skip it entirely.

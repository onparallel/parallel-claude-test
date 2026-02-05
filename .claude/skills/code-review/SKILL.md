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

**CRITICAL (should block):**

- SQL injection (string concatenation in queries)
- Security vulnerabilities (XSS, command injection)
- Multi-tenancy violations (missing `org_id` filters)
- Data loss risks (destructive operations without confirmation)
- Hardcoded secrets or credentials

**CODE QUALITY (suggestions):**

- Missing error handling in critical paths
- Race conditions or concurrency issues
- Incorrect transaction handling
- N+1 query patterns

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

---
name: local-code-review
description: Review local code changes before creating a PR
---

# Local Code Review

Review local code changes and show suggested fixes in VS Code.

## Instructions

### Step 1: Get local changes

Get all changes compared to master:

```bash
git diff origin/master...HEAD
```

If there are no commits yet, also check working directory:
```bash
git diff
git diff --cached
```

### Step 2: Analyze the changes

Review for these issues:

**CRITICAL (should block):**
- SQL injection (string concatenation in queries)
- Security vulnerabilities (XSS, command injection)
- Multi-tenancy violations (missing `org_id` filters)
- Data loss risks (destructive operations without confirmation)
- Hardcoded secrets or credentials

**CODE QUALITY (suggestions):**
- `console.log` statements left in code
- `let` that should be `const`
- Unused variables or imports
- Missing error handling in critical paths

### Step 3: Create suggested fixes and open in VS Code

**THIS STEP IS MANDATORY.** You MUST always create fix suggestions and open them in VS Code when ANY issues are found (critical or suggestions). Do NOT skip this step. The user must see the suggested fixes visually to accept or reject them.

**Always create the temp directory first:**
```bash
mkdir -p /tmp/code-suggestions
```

1. **For each file with issues:**
   - Read the current file content
   - Create a fixed version at `/tmp/code-suggestions/[filename].suggested.[ext]`
   - Open VS Code diff view:
   ```bash
   code --diff path/to/file.ts /tmp/code-suggestions/[filename].suggested.ts
   ```

### Step 4: Provide summary

**After opening VS Code**, provide a brief summary:

```
## Local Code Review Summary

### Critical Issues
(List any critical issues found, or "None found")

### Suggestions
(List code quality improvements)

### Files opened in VS Code
- [List of files opened for review]
```

**For each issue, include:**
1. File and line number
2. What the problem is
3. Brief description of the fix

### Step 5: Ask user what to do

Use AskUserQuestion to ask the user:
- "Apply fixes" - Copy the suggested files to their original locations
- "Skip" - Do nothing

**If user chooses "Apply fixes":**
```bash
cp /tmp/code-suggestions/[filename].suggested.ts path/to/file.ts
```

## What NOT to flag

- Style issues handled by ESLint/Prettier
- Missing documentation (unless critical)
- Refactoring suggestions for unchanged code

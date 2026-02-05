---
name: local-code-review
description: Review local code changes before creating a PR
---

# Local Code Review

Review local code changes (staged, unstaged, and commits) before creating a PR.

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

### Step 3: Provide feedback

**Format your review as:**

```
## Local Code Review Summary

### Critical Issues
(List any critical issues found, or "None found")

### Suggestions
(List code quality improvements)

### Files Reviewed
- path/to/file.ts
```

**For each issue, include:**
1. File and line number
2. What the problem is
3. Suggested fix (with code snippet)

## What NOT to flag

- Style issues handled by ESLint/Prettier
- Missing documentation (unless critical)
- Refactoring suggestions for unchanged code

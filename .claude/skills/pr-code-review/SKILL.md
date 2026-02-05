---
name: pr-code-review
description: Review an open PR from the repository
---

# PR Code Review

Review an open Pull Request from the repository.

## Instructions

### Step 1: List open PRs

Get all open PRs in the repository:

```bash
gh pr list --state open --json number,title,author,headRefName --limit 20
```

### Step 2: Let the user select a PR

Use AskUserQuestion to present the list of open PRs and let the user select which one to review. Show:
- PR number
- Title
- Author
- Branch name

### Step 3: Get the PR diff

Once the user selects a PR, get its diff:

```bash
gh pr diff <PR_NUMBER>
```

Also get PR details for context:
```bash
gh pr view <PR_NUMBER> --json title,body,files
```

### Step 4: Analyze the changes

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

### Step 5: Provide feedback

**Format your review as:**

```
## PR Code Review: #<NUMBER> - <TITLE>

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

### Step 6: Offer to post review

Ask if you should post the review as a PR comment:

```bash
gh pr review <PR_NUMBER> --comment --body "review content here"
```

Or for critical issues, request changes:

```bash
gh pr review <PR_NUMBER> --request-changes --body "review content here"
```

## What NOT to flag

- Style issues handled by ESLint/Prettier
- Missing documentation (unless critical)
- Refactoring suggestions for unchanged code

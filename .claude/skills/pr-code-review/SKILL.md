---
name: pr-code-review
description: Review an open PR from the repository
---

# PR Code Review

Review an open Pull Request and show suggested fixes in VS Code.

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

### Step 3: Get the PR diff and files

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

### Step 5: Create suggested fixes and open in VS Code

**THIS STEP IS MANDATORY.** You MUST always create fix suggestions and open them in VS Code when ANY issues are found (critical or suggestions). Do NOT skip this step. The user must see the suggested fixes visually to accept or reject them.

1. **Checkout the PR branch locally:**
   ```bash
   gh pr checkout <PR_NUMBER>
   ```

**Always create the temp directory first:**
```bash
mkdir -p /tmp/code-suggestions
```

2. **For each file with issues:**
   - Read the current file content
   - Create a fixed version at `/tmp/code-suggestions/[filename].suggested.[ext]`
   - Open VS Code diff view:
   ```bash
   code --diff path/to/file.ts /tmp/code-suggestions/[filename].suggested.ts
   ```

### Step 6: Provide summary

**After opening VS Code**, provide a brief summary:

```
## PR Code Review: #<NUMBER> - <TITLE>

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

### Step 7: Ask user what to do

Use AskUserQuestion to ask the user:
- "Apply fixes" - Copy the suggested files to their original locations (on the PR branch)
- "Post as PR comment" - Post the review as a comment on the PR
- "Request changes" - Post review requesting changes
- "Skip" - Do nothing

**If user chooses "Apply fixes":**
```bash
cp /tmp/code-suggestions/[filename].suggested.ts path/to/file.ts
```

**If user chooses "Post as PR comment":**
```bash
gh pr review <PR_NUMBER> --comment --body "review content here"
```

**If user chooses "Request changes":**
```bash
gh pr review <PR_NUMBER> --request-changes --body "review content here"
```

## What NOT to flag

- Style issues handled by ESLint/Prettier
- Missing documentation (unless critical)
- Refactoring suggestions for unchanged code

# Documentation Check Instructions

## Your Task
Check if code changes affect documented functionality. If yes, UPDATE the documentation directly with a commit.

## Steps

### STEP 1: Read the PR diff
Read the DIFF_FILE provided in the context to understand what code changed.

### STEP 2: Read existing documentation
Read files in /docs/core/ to understand what is documented.

### STEP 3: Analyze impact
Determine if changes affect documented functionality:
- New features that should be documented
- Changed behavior of documented features
- New API endpoints or tables
- New user roles or permissions

### STEP 4: Update documentation (if needed)
If documentation needs updates:

1. Use the Edit tool to update the documentation files
2. Follow these **STYLE RULES**:
   - Keep descriptions brief and focused on PURPOSE
   - Use tables for summaries (| Column | Description |)
   - Use ## headers for sections
   - Don't list database columns - describe what the feature does
   - Reference related features when relevant

3. Commit and push the changes:
```bash
git add docs/
git commit -m "docs: update documentation for new features

- [List what was documented]

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### STEP 5: Write result file
Write to /tmp/docs-result.txt:
- "UPDATED" if you made documentation changes
- "OK" if no documentation changes needed
- "NEEDS_UPDATE" if docs need updates but you couldn't make them

### STEP 6: Post summary comment
Use the PR_NUMBER from the context:

```bash
gh pr comment {PR_NUMBER} --body "YOUR_SUMMARY"
```

**Format:**
## 📚 Documentation Review

### Status
- ✅ Documentation is up to date
- 📝 Documentation updated (committed)
- ❌ Documentation needs manual update

### Changes Made (if updated)
- [List what was added/changed in docs]

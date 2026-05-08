---
name: review
description: Code review for GitHub pull requests. Fetches PR details and diff, produces a structured review, and saves it to code_review/PR_<number>.md.
trigger: /review
---

# /review

Perform a thorough code review of a GitHub pull request.

## Steps

1. If no PR number is provided in args, run `gh pr list` to show open PRs and ask the user which one to review.
2. If a PR number is provided, run `gh pr view <number>` and `gh pr diff <number>` in parallel to get PR details and the full diff.
3. For large diffs, also fetch the file list with `gh api repos/{owner}/{repo}/pulls/{number}/files --paginate` to get complete patch data per file.
4. Analyze the changes and produce a thorough review covering:
    - **Overview** — what the PR does
    - **Issues** — grouped by severity: High / Medium / Low. Each issue must include the file name, a code snippet where relevant, and a concrete fix suggestion.
    - **Positive Notes** — good patterns worth highlighting
    - **Summary** — one paragraph: blockers, quick fixes, and readiness verdict

5. **Always write the full review to `code_review/PR_<number>.md`** before presenting it to the user. Create the `code_review/` directory if it does not exist.

6. Present the review to the user after the file is written.

## Review focus areas

- Code correctness and logic errors
- TypeScript type safety (avoid `any`, improper casts)
- React patterns: stale closures in `useCallback`/`useMemo`, missing deps, unnecessary re-renders
- RTK Query: correct tag invalidation, over-fetching, mutation payload hygiene
- File/component size (project ceiling: ~300 lines per file)
- Form validation at submission boundaries
- Role-based access control consistency (use `RoleEnum` from `src/types/auth.ts`)
- Hardcoded magic strings that should use defined type values
- Unused props or dead code
- Test coverage for new logic

## Output format

Use this structure in the markdown file:

```markdown
# PR #<number> — <title>

**Author:** <author>
**Branch:** <head> → <base>
**Status:** <status>

## Overview

...

## Issues

### High

...

### Medium

...

### Low

...

## Positive Notes

...

## Summary

...
```

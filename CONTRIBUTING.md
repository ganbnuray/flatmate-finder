# Contributing to Flatmate Finder

## GitHub Flow

This project uses [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow) as our branching strategy. The core principle is simple: `main` is always deployable, and all changes go through pull requests.

### Workflow

1. **Create a branch** from `main` with a descriptive name (see naming conventions below).
2. **Make your changes** in small, focused commits.
3. **Open a pull request** against `main` when your work is ready for review.
4. **Request a review** from at least one teammate.
5. **Address feedback** — respond to every comment, either by making changes or explaining why no change is needed.
6. **Merge** once approved — the PR author merges their own PR after approval.

### Branch Naming

Use the following prefixes:

- `feature/` — new features (e.g., `feature/matching-algorithm`)
- `fix/` — bug fixes (e.g., `fix/profile-image-upload`)
- `setup/` — tooling and configuration (e.g., `setup/eslint-config`)
- `docs/` — documentation updates (e.g., `docs/deployment-guide`)

### Commit Messages

Write clear, concise commit messages:

- Use present tense ("Add feature" not "Added feature")
- Keep the subject line under 72 characters
- Reference issue numbers where applicable (e.g., "Fix login redirect (#12)")

### Pull Request Guidelines

Every PR must:

- Have a clear title describing the change
- Use the PR template (auto-populated when you open a PR)
- Be small and self-contained — one feature or fix per PR
- Include relevant tests or documentation updates where applicable
- Be reviewed by at least **one** team member before merging

### Code Review Expectations

When reviewing a PR:

- Be constructive and specific — suggest concrete improvements
- Approve only when you've read and understood the changes
- Leave actionable comments (not just "LGTM") for non-trivial PRs
- Check that the PR description matches the actual changes

When your PR is reviewed:

- Respond to every comment — either incorporate the feedback or explain your reasoning
- Don't dismiss reviews without discussion

### MVP Tagging

We will tag releases for each MVP milestone:

- `mvp-1` — First MVP
- `mvp-2` — Second MVP
- `mvp-3` — Final version

Tags should be created on `main` after the relevant PR(s) are merged.

## Getting Help

If you're stuck or unsure about the workflow, ask in the team chat or open a draft PR for early feedback.

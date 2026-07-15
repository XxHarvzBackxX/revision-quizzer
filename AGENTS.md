# Repository Working Agreement

## Feature branch workflow

Apply this workflow to every new feature unless the user explicitly requests a different approach:

1. Start from the latest `dev` branch.
2. Create a dedicated branch named `feature/<short-kebab-case-name>` from `dev` before changing feature code.
3. Never start feature work from `master`, commit feature work directly to `master`, or target `master` with the feature pull request.
4. Commit coherent increments while developing. Use descriptive commit messages so the feature can be reviewed commit by commit; do not leave the entire implementation for one undifferentiated commit.
5. Before handoff, run the relevant tests and checks, commit every remaining feature change to the feature branch, and leave its worktree clean. Do not create an empty final commit merely to satisfy this rule.
6. Push the feature branch for review and hand it back to the user for inspection. The pull request base must be `dev`.
7. Do not merge the feature branch, rebase it onto `master`, or push changes directly to `dev` unless the user explicitly asks.

Typical setup:

```powershell
git switch dev
git pull --ff-only origin dev
git switch -c feature/foo-bar
```

Typical handoff:

```powershell
git status
git push -u origin feature/foo-bar
```

Then open or provide a pull request targeting `dev`.

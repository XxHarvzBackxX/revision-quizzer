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

## Release version workflow

Every completed feature, including internal tooling and refactoring work, must participate in the app's release history. A feature is not ready for handoff until it includes both a new app version and a matching changelog entry:

1. Follow Semantic Versioning for the net change: use a patch increment for compatible fixes, a minor increment for backward-compatible features, and a major increment for breaking changes.
2. Keep the root versions in `package.json` and `package-lock.json` identical. Do not create a Git tag unless the user explicitly requests a release.
3. Add the new version to the top of `src/changelog.ts`. Its version must match `package.json`, and its notes must describe only behavior that survives in the final diff.
4. Treat the in-app changelog as user-facing copy: group related outcomes, avoid commit-level implementation noise, and make the release date and impact clear. For internal work, describe the resulting reliability, maintainability, security, or delivery improvement rather than omitting the entry.
5. Add or update tests that verify the package version, newest changelog entry, unread-release behavior, and visible version label remain aligned.
6. Before declaring a feature complete, verify the version bump and changelog entry are included in the final branch diff, committed, and pushed with the rest of the feature.

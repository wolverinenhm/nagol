# Publish Nagol to GitHub

Project repository: https://github.com/wolverinenhm/nagol

The repository was created on 20 October 2026. The instructions below explain how to publish your own copy. For this existing repository, clone it instead of creating it again.

## Browser + Git commands

1. Sign in to https://github.com/ with the intended account.
2. Open https://github.com/new. Choose owner `wolverinenhm`, repository name
   `nagol`, and a description such as “Local-first personal AI workspace for
   Windows”. Choose Public if you intend an open-source release.
3. Leave README, .gitignore and licence initialization **unchecked**; these files
   are already included. Click **Create repository**.
4. Extract the source ZIP. Open PowerShell in the extracted `nagol` folder.
5. Run the following commands one per line:

```powershell
git init
git add .
git status
git diff --cached --stat
git commit -m "Initial Nagol developer preview"
git branch -M main
git remote add origin https://github.com/wolverinenhm/nagol.git
git push -u origin main
```

If Git asks for a name/email, configure your own identity and rerun the commit:

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR VERIFIED OR GITHUB NOREPLY EMAIL"
```

Git Credential Manager normally opens browser authentication. Do not paste a
token into a repository file or put a token into the remote URL. If the repository
name is taken, choose another name and update the remote URL accordingly. Do not
force-push over an existing repository.

6. Verify the GitHub repository file list, including `.github/workflows/ci.yml`.
7. Open the **Actions** tab and inspect **Test and package Windows**. When it
   succeeds, download the `Nagol-Windows-developer-preview` artifact.
8. Extract its portable ZIP and launch `Nagol.exe` on a clean Windows PC. Perform
   every relevant manual check in `TESTING.md` before publishing a binary.
9. After successful dependency installation, commit the generated lockfile and
   change the CI install step from `npm install` to `npm ci`.

## GitHub CLI alternative

Install GitHub CLI separately from https://cli.github.com/ and run:

```powershell
gh auth login
git init
git add .
git commit -m "Initial Nagol developer preview"
git branch -M main
gh repo create nagol --public --source=. --remote=origin --push
gh repo view --web
gh run list
```

Use either publication route, not both. These commands are instructions; they
were not executed successfully on your behalf during source preparation.

## Release after verification

```powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run release:zip
gh release create v0.1.0 dist/Nagol-0.1.0-windows-x64.zip --prerelease --title "Nagol 0.1.0 developer preview" --notes-file docs/RELEASE_NOTES.md
```

`--notes-file` preserves the actual multiline notes. Add binaries as release
assets, not Git commits. Confirm the release URL, uploaded filename and download
before telling users it is published. Keep all parity and test limitations in the
release notes until they are resolved.

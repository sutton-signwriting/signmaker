# Release Steps

## Pre-Commit
- Update `package.json` with the release version.
- Update `CHANGELOG.md` with release details and compare links.
- Update `README.md` only when public links, badges, usage, or project description change.
- Confirm `LICENSE` copyright years and contributor wording when the year or authorship changes.
- Confirm GitHub Pages is configured with Source: `GitHub Actions`.

## Build and Test

```sh
npm install
npm run typecheck
npm test
npm run build:pages
npm run build:package
```

The GitHub Pages build uses `/signmaker/` as the Vite base path. The package/static build
uses relative asset paths with `./` so generated files can be served from a future npm
package, downloaded archive, or local directory.

## Commit and Tag

Replace `X.Y.Z` with the release version.

```sh
git status
git add ...
git commit -m "Release vX.Y.Z"
git push origin main
git tag -am "Release vX.Y.Z" vX.Y.Z
git push origin vX.Y.Z
```

Pushing to `main` deploys GitHub Pages through the `Deploy to GitHub Pages` workflow.

## Create GitHub Release
- Go to https://github.com/sutton-signwriting/signmaker/tags
- Create a release from the release tag.
- Use the `CHANGELOG.md` release section as the release notes.
- Upload manually built static archives only if needed.
- Publish.

GitHub automatically provides source ZIP and tarball downloads for each tag.

## Optional Static Archive

The public site is deployed by GitHub Actions. If a static app archive is needed:

```sh
npm run build:package
cp README.md CHANGELOG.md LICENSE dist/
zip -r sutton-signwriting-signmaker-X.Y.Z.zip dist
tar -zcvf sutton-signwriting-signmaker-X.Y.Z.tar.gz dist
```

## NPM Publish

NPM publishing is paused while the v2 package distribution format is finalized.

The expected v2 package contract is a built static web app distribution rather than the
old checked-in static root. The package build should use relative asset paths:

```sh
npm run build:package
```

Before resuming npm publishing:
- decide whether npm should publish from `dist/` or a prepared package directory
- include `README.md`, `CHANGELOG.md`, `LICENSE`, `index.html`, `demo.html`, `assets/`, and `alphabet/`
- ensure the package name remains `@sutton-signwriting/signmaker`
- remove `"private": true` only when the publish layout is verified

When ready:

```sh
npm publish --access public
```

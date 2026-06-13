# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### To Do
- better help and documentation
- rewire screen communication for fsw, swu, and style
- integrate search and search results
- add keyboard command to append the selected symbol to end of the sequence
- signbox view, png view, svg view, fsw string, swu string
- charset to restrict links and communications
- whoami page
- head snapping on insertion of head symbol with overlay (complex faces) and overlapping
- create font section with font installed or not information
- create profile page
- action > cancel shouldn't clear sign
- styling string needs breaking change individual symbol size and offset
- after offset, add new max coordinate
- update sutton-signwriting/core for new styling string definition
- update draft-slevinski-formal-signwriting
- add signmaker to sutton-signwriting/sgnw-components
- add offset coordinate to S state and URLs

## [2.0.0] - 2026-06-13
### Added
- Rebuilt SignMaker as a Vite, React 19, TypeScript, Tailwind CSS v4, and Zustand application.
- Added GitHub Pages deployment through GitHub Actions with a Vite build artifact.
- Added bundled Sutton SignWriting TTF fonts through `@sutton-signwriting/font-ttf`.
- Added modern canvas controls, settings and export dialogs, breadcrumb palette navigation, and mobile-friendly tooling.
- Added language picker support with IANA signed and spoken language filtering.
- Added fingerspelling and mouthing tooling through the SignWriting service.
- Added expanded Playwright end-to-end coverage for URL parameters, export, operations, drag behavior, i18n, and tooling.

### Changed
- Preserved URL hash parameters, iframe `postMessage` load/save behavior, FSW/SWU I/O, undo/redo, PNG/SVG export, palette, sequence, keyboard shortcuts, and multi-language UI in the new implementation.
- Replaced the old Mithril app structure with a source-based Vite build in `src/` and static assets in `public/`.
- Changed GitHub Pages publishing from checked-in static root files to a generated `dist/` artifact.
- Kept the npm package private while the v2 package distribution format is finalized.

### Removed
- Removed generated README and changelog HTML files from the release workflow.
- Removed the legacy Mithril implementation from the active source tree after migration.

## [1.2.1] - 2026-04-18
### Fixed
- fix lost symbol on save

## [1.2.0] - 2026-01-10
### Added
- support for Left, Middle, and Right lane sign editing
- support for horizontal writing sign editing

## [1.1.0] - 2022-02-27
### Added
- demo page loads state
- more actions menu for share, demo, and cancel
- added iframesize
- URL parameter button highlights
- README and CHANGELOG html pages

### Fixed
- demo page for file system access by explicitly referencing index.html
- double-touch to zoom on ipad
- server location of dot, local, or public for demo page use in a link and iframe
- state variables, defaults, and values
- url hash to removed unwanted key/value pairs
- readme link to escape iframe
- messaging when access signmaker through file system

## [1.0.0] - 2021-12-16
### Added
- symbol palette
- signmaker editor
- PNG and SVG images with download
- URL parameters
- iFrame messaging
- demo page

[Unreleased]: https://github.com/sutton-signwriting/signmaker/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/sutton-signwriting/signmaker/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/sutton-signwriting/signmaker/releases/tag/v1.2.1
[1.2.0]: https://github.com/sutton-signwriting/signmaker/releases/tag/v1.2.0
[1.1.0]: https://github.com/sutton-signwriting/signmaker/releases/tag/v1.1.0
[1.0.0]: https://github.com/sutton-signwriting/signmaker/releases/tag/v1.0.0

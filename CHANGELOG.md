# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### added
- cancel button for page view and iframe view
- demo page loads state
- action menu for save, share, and demo
- added iframesize
- URL parameter button highlights
- README and CHANGELOG html pages

### fixed
- demo page for file system access by explicitly referencing index.html
- double-touch to zoom on ipad
- server location of dot, local, or public for demo page use in a link and iframe
- state variables, defaults, and values
 

### To Do
- better help and documentation
- rewire screen communication for fsw, swu, and style
- add layout and view
- upgrade interface with responsive HTML and CSS
- integrate the styling string
- upgrade mithril from v0.2 to v2.0
- upgrade config data from window object to json
- upgrade to sutton-signwriting packages
- test cross-platform
- fix undo and redo with history and back button
- make save interact with a SignWriting dictionary API
- integrate search and search results
- reorganize messages for user interface, eliminate and complete
- fix and expand keyboarding options
- add keyboard command to append the selected symbol to end of the sequence
- default demo to local home rather than dot home
- include links on demo page to GH and more
- signbox view, png view, svg view,fsw string,swu string
- charset to restrict links and communications
- fonts page for testing if they are installed and more information
- whoami page
- head snapping on insertion of head symbol with overlay (complex faces) and overlapping

## [1.0.0] - 2021-12-16
### Added
- symbol palette
- signmaker editor
- PNG and SVG images with download
- URL parameters
- iFrame messaging
- demo page

[Unreleased]: https://github.com/sutton-signwriting/signmaker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sutton-signwriting/signmaker/releases/tag/v1.0.0

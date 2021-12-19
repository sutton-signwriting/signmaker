# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### added
- cancel button for page view and iframe view
- save for page view using navigator.share
- demo page loads state
- action menu for save, share, and demo

### fixed
- demo page for file system access by explicitly referencing index.html
- double-touch to zoom on ipad
- local home value for demo page use in a link and iframe
 

### To Do
- better help and documentation
- rewire screen communication
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

# Release Steps 

## Pre-Commit
* update package.json with new version
* update Changelog with version details
* update Readme version number in links

## Build and Document
    npm run md2html

## Commit and tag
    git add ...
    git commit -m "version details"
    git push origin main
    git tag -am "version details" v1.2.1
    git push --tags

## Packaging Binaries
    npm pack
    gunzip sutton-signwriting-signmaker-1.2.1.tgz
    tar -xvf sutton-signwriting-signmaker-1.2.1.tar
    mv package sutton-signwriting-signmaker-1.2.1
    zip -r sutton-signwriting-signmaker-1.2.1.zip sutton-signwriting-signmaker-1.2.1
    tar -zcvf sutton-signwriting-signmaker-1.2.1.tar.gz sutton-signwriting-signmaker-1.2.1

## Create Github Release
* Go to https://github.com/sutton-signwriting/signmaker/tags
* Create release from Tag
* Upload .ZIP and .TAR.GZ
* Publish

## NPM Publish
    npm publish --access public

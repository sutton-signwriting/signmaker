#!/bin/bash

UNAMESTR=`uname`
if [[ "$UNAMESTR" == 'Linux' ]]; then
  SED_EXTENDED='-r'
elif [[ "$UNAMESTR" == 'Darwin' ]]; then
  SED_EXTENDED='-E'
fi; 

function readJson {  
  VALUE=`grep -m 1 "\"${2}\"" ${1} | sed ${SED_EXTENDED} 's/^ *//;s/.*: *"//;s/",?//'`

  if [ ! "$VALUE" ]; then
    echo "Error: Cannot find \"${2}\" in ${1}" >&2;
    exit 1;
  else
    echo $VALUE ;
  fi; 
}

VERSION=`readJson package.json version`;

function htmlVersion {  
  REGEX="[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?"
  VALUE=`grep -m 1 -E "${1/.html/}.js\?v=$REGEX" ${1} | sed ${SED_EXTENDED} 's/^.*\?v=//;s/".*$//;'`

  if [ ! "$VALUE" ]; then
    echo "Error: Cannot find version in ${1}" >&2;
    exit 1;
  else
    echo $VALUE ;
  fi; 
}
function htmlUpdate {
  V=`htmlVersion $1`
  sed -i 's/'${V}'/'${VERSION}'/' $1
}

function mdVersion {  
  REGEX="[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?"
  VALUE=`grep -m 1 -E "v$REGEX" ${1} | sed ${SED_EXTENDED} 's/^## v//'`

  if [ ! "$VALUE" ]; then
    echo "Error: Cannot find version in ${1}" >&2;
    exit 1;
  else
    echo $VALUE ;
  fi; 
}
function mdUpdate {
  V=`mdVersion $1`
  sed -i 's/'${V}'/'${VERSION}'/' $1
}

htmlUpdate index.html
htmlUpdate demo.html

mdUpdate README.md
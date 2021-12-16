# @sutton-signwriting/signmaker

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/sutton-signwriting/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![version](https://img.shields.io/npm/v/@sutton-signwriting/signmaker)](https://www.npmjs.com/package/@sutton-signwriting/signmaker)
[![npm downloads](https://img.shields.io/npm/dm/@sutton-signwriting/signmaker)](https://npm-stat.com/charts.html?package=@sutton-signwriting/signmaker&from=2021-12-16)
- - - 

<img alt="SignMaker Artwork" src="./signmaker.png">

@sutton-signwriting/signmaker is an online editor that can be [accessed directly](https://sutton-signwriting.github.io/signmaker/), [embedded in an iFrame](https://sutton-signwriting.github.io/signmaker/demo.html), and [downloaded](https://github.com/sutton-signwriting/signmaker/archive/gh-pages.zip).  It uses both Formal SignWriting in ASCII (FSW) and SignWriting in Unicode (SWU) character sets, along with the associated style string.  See [draft-slevinski-formal-signwriting](https://tools.ietf.org/id/draft-slevinski-formal-signwriting-08.html) for detailed specification.

> Author: https://SteveSlevinski.me  
> Channel: https://www.youtube.com/channel/UCXu4AXlG0rXFtk_5SzumDow  
> Support: https://www.patreon.com/signwriting  

---

## Useful links

- Public Editor: https://sutton-signwriting.github.io/signmaker/
- Public Demo: https://sutton-signwriting.github.io/signmaker/demo.html
- Source: https://github.com/sutton-signwriting/signmaker
- Download: https://github.com/sutton-signwriting/signmaker/archive/gh-pages.zip
- Issue Tracker: https://github.com/sutton-signwriting/signmaker/issues
- Online Discussion: https://gitter.im/sutton-signwriting/community
 
---

## URL Parameters
SignMaker supports eight keys for URL query parameters

* ui - language code for user interface
* alphabet - sign language code for symbol palette hierarchy
* fsw - the sign value in Formal SignWriting in ASCII (FSW)
* swu - the sign value in SignWriting in Unicode (SWU)
* styling - the style string for image creation
* grid - grid detail of 0,1,2
* skin - alternate displays such as "inverse" and "colorful"
* tab - the value for the tab to display

Example: https://sutton-signwriting.github.io/signmaker/#?ui=ase&fsw=AS10011S10019S2e704S2e748M525x535S2e748483x510S10011501x466S2e704510x500S10019476x475&skin=colorful  
Top Half of Demo: https://sutton-signwriting.github.io/signmaker/demo.html

---

## iFrame Messaging
1) embed SignMaker in an iFrame
2) send message to the iFrame using postMessage
3) receive message from the iFrame with an event listener for message

Bottom Half of Demo: https://sutton-signwriting.github.io/signmaker/demo.html

- - -

## License
MIT

- - - 

## SignWriting General Interest
- SignWriting Website: https://signwriting.org/
- Wikipedia page: https://en.wikipedia.org/wiki/SignWriting
- Email Discussion: https://www.signwriting.org/forums/swlist/
- Facebook Group: https://www.facebook.com/groups/SuttonSignWriting/

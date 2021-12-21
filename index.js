/**
* Sutton SignWriting SignMaker 2022 v1.0.0
* https://github.com/sutton-signwriting/signmaker
* Copyright (c) 2007-2021, Steve Slevinski
* SignMaker is released under the MIT License.
*/
var isApp = false;

var isiFrame = (window.location !== window.parent.location);

function receiveMessage(event) {
  setS(event.data);
}
// event listener for message event
window.addEventListener("message", receiveMessage, false);

//translations
var t;
var allSignLang = {};
allSignLang['alphabet']=Object.keys(defmessages).filter(function(key){return (key.slice(0,4)=="sgn_");});  
var signLang={};
signLang['alphabet'] = allSignLang['alphabet'].slice(0);
function checkSignLang(type) {
  //type=alphabet or other
  if (!allSignLang[type].length) return;
  var key = allSignLang[type].shift();
  var url = 'config/' + type + "/" + type + '-' + key.slice(4) + '.js';
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', url, true);
  xhr.onload = function (e) {
    if (xhr.status == 404) {
      var index = signLang[type].indexOf(key);
      if (index > -1) {
        signLang[type].splice(index, 1);
      }
    }
    checkSignLang(type);
  };
  xhr.onerror = function (e) {
    var index = signLang[type].indexOf(key);
    if (index > -1) {
      signLang[type].splice(index, 1);
    }
    checkSignLang(type);
  };
  xhr.send(null);
}

function tt(args){
  text = t.apply(this,arguments);
  text = text.replace(/@@/g,'');
  return m.trust(ssw.svg(text) || '<p>' + text + '</p>');
}

window.onresize = function (){
  m.redraw();
}

function setS(obj){
  Object.keys(obj).map( key => {
    val = obj[key];
    if (S[key] == val) return;
    switch (key) {
      case 'ui':
        if(t && val==S['ui']) return;
        var msg = messages[val];
        if (!msg) {
          val='en';
          msg = messages[val];
        }
        S['ui']=val;
        for (var attr in defmessages) { if(!msg[attr]) msg[attr]=defmessages[attr];}
        t = libTranslate.getTranslationFunction(msg);
        break;
      case 'alphabet':
        S['alphabet']=val;
        classie.addClass(document.body,"waiting");
        var js = document.createElement("script");
        js.type = "text/javascript";
        delete window.alphabet;
        if (val == 'iswa' || val == ''){
          js.src = "config/alphabet.js?" + Date.now();
        } else {
          js.src = "config/alphabet/alphabet-" + val + ".js?" + Date.now();
        }
        document.getElementsByTagName('head')[0].appendChild(js);  
        var jsCheck = setInterval(function(){
          if (window.alphabet && palette){
            classie.removeClass(document.body,"waiting");
            palette.vm.init();
            palette.vm.select();
            m.redraw();
            clearInterval(jsCheck);
          }
        },100);
        break;
      case 'fsw':
        S['fsw'] = val;
        signmaker && signmaker.vm.fsw(val);
        break;
      case 'swu':
        val = decodeURI(val)
        S['swu'] = val;
        signmaker && signmaker.vm.swu(val);
        break;
      case 'styling':
        S['styling'] = val;
        break;
      case 'grid':
        S['grid'] = val;
        break;
      case 'skin':
        S['skin'] = val;
        document.body.className=val;
        break;
      case 'tab':
        S['tab'] = val;
        break;
    }
  })
  m.redraw();
}

//state
var S = { // state
  'ui': undefined,
  'alphabet': undefined,
  'fsw': undefined,
  'swu': undefined,
  'styling': undefined,
  'grid': undefined,
  'skin': undefined,
  'tab': undefined
}

var D = { // defaults
  'ui': 'en',
  'alphabet': 'iswa',
  'grid': '1',
  'tab': ''
}

function hash(){
  S['fsw'] = signmaker.vm.fswnorm();
  S['swu'] = signmaker.vm.swunorm();
  return "?" + Object.keys(S).map(function(key){
    return (S[key] && (D[key] != S[key]))?key+"="+S[key]:undefined
  }).filter(item => item !== undefined).join("&");
}
function hashSet(){
  //  history.replaceState(null, null, document.location.pathname + '#' + hash);
  history.pushState(null, null, document.location.pathname + '#' + hash());
  //  window.location.hash = hash;
}

window.onhashchange = hashChange;
function hashChange(event){
  var parts;
  var hashed = {}
  var iloc = window.location.href.indexOf('#?');
  if (iloc>-1) {
    var hashes = decodeURI(window.location.href.slice(iloc + 2)).split('&');
    for(var i = 0; i < hashes.length; i++) {
      parts = hashes[i].split('=');
      if (parts[0]) hashed[parts[0]] = parts[1];
    }
  }
  
  hashed = {...D, ...hashed}
  Object.keys(hashed).forEach(key => {
    if (!(key in S)) {
      hashed[key] = undefined;
    }
  })
  setS(hashed);
} 



hashChange();

// SIGNMAKER
////////////
var dlFile = null;
var spatials = {};

spatials.Symbol = function(data) {
    this.key = m.prop(data.key);
    this.x = m.prop(data.x);
    this.y = m.prop(data.y);
    this.selected = m.prop(true);
};

spatials.List = Array;


var signmaker = {};

// vm
signmaker.vm = {
  midWidth: 125,
  midHeight: 125,
  new: function(){
    signmaker.vm.list=new spatials.List();
    signmaker.vm.sort=[];
    signmaker.vm.history = ['{"list":[],"sort":[]'];
    signmaker.vm.cursor = 0;
  },
  save: function(){
    if (isiFrame){
      parent.postMessage({'signmaker': 'save', 'swu': signmaker.vm.swunorm(), 'fsw': signmaker.vm.fswnorm()})
    } else {
      hashSet();
      console.log(window.location.href)
    }
  },
  share: function(){
    if (navigator.share) {
      navigator.share({'url': document.location.href})
    } else {
      console.log(window.location.href);
    }
  },
  demo: function(){
    window.location = "./demo.html#" + hash();
  },
  cancel: function(){
    if (isiFrame){
      parent.postMessage({'signmaker': 'cancel'})
    }
    signmaker.vm.clear();
    palette.vm.action = false;
  },
  fswlive: function(){
    var fsw = 'M500x500';
    if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
    if (signmaker.vm.list.length){
      for (var i=0; i < signmaker.vm.list.length; i++) {
        fsw += signmaker.vm.list[i].key() + signmaker.vm.list[i].x() + 'x' + signmaker.vm.list[i].y();
      }
      var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
      fsw = fsw.replace("M500x500","M" + bbox[1] + 'x' + bbox[3]);
    }
    return fsw=="M500x500"?'':fsw;
  },
  swulive: function(){
    return ssw.fsw2swu(signmaker.vm.fswlive());
  },
  swunorm: function(){
    return ssw.fsw2swu(signmaker.vm.fswnorm());
  },
  fswnorm: function(){
    return ssw.norm(signmaker.vm.fswlive());
  },
  fsw: function(fsw,silent){
    if (typeof(fsw)!='undefined') {
      fsw = ssw.sign(fsw);
      var syms = fsw.match(/S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) || [];
      signmaker.vm.list = new spatials.List();
      for (var i=0; i < syms.length; i++) {
        signmaker.vm.list.push(new spatials.Symbol({key:syms[i].slice(0,6),x:parseInt(syms[i].slice(6,9)),y:parseInt(syms[i].slice(10,13))}))
      }
      syms = fsw.match(/A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/) || [];
      if (syms.length) {
        signmaker.vm.sort= syms[0].slice(1).match(/.{6}/g);
      } else {
        signmaker.vm.sort = [];
      }
      signmaker.vm.addhistory(silent);
      signmaker.vm.selnone();

    }
    return signmaker.vm.fswlive();
  },
  fswraw: '',
  fswview: function(fsw){
    if (typeof(fsw)!='undefined') {
      signmaker.vm.fswraw = fsw;
      signmaker.vm.swuraw = '';
      fsw = ssw.parse(fsw,"fsw")["fsw"];
      signmaker.vm.fsw(fsw,true);
      if (fsw==signmaker.vm.fswraw) {
        signmaker.vm.fswraw = '';
      } else {
        fsw = signmaker.vm.fswraw;
      }
    } else {
      fsw = signmaker.vm.fswraw || signmaker.vm.fswnorm();
    }
    return fsw;
  },
  swu: function(swu,silent){
    if (swu!='undefined') {
      signmaker.vm.fsw(ssw.swu2fsw(swu),silent);
    } else {
      fsw = 'M500x500';
      if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
      for (var i=0; i < signmaker.vm.list.length; i++) {
        fsw += signmaker.vm.list[i].key() + signmaker.vm.list[i].x() + 'x' + signmaker.vm.list[i].y();
      }
    }
  },
  swuraw: '',
  swuview: function(swu){
    if (typeof(swu)!='undefined') {
      signmaker.vm.swuraw = swu;
      signmaker.vm.fswraw = '';
      swu = ssw.parse(swu,"swu")["swu"];
      signmaker.vm.swu(swu,true);
      if (swu==signmaker.vm.swuraw) {
        signmaker.vm.swuraw = '';
      } else {
        swu = signmaker.vm.swuraw;
      }
    } else {
      swu = signmaker.vm.swuraw || signmaker.vm.swunorm();
    }
    return swu;
  },
  styling: m.prop(''),
  dlpng: function(){
    var canvas = ssw.canvas(signmaker.vm.fswnorm()+signmaker.vm.styling(),{size: signmaker.vm.size(), pad: signmaker.vm.pad(), line: signmaker.vm.linecolor(), fill: signmaker.vm.fillcolor(), back: signmaker.vm.backcolor(), colorize: signmaker.vm.colorize()});
    var data = canvas.toDataURL("image/png");
    var link = document.getElementById('downloadlink');
    link.href = data;
    link.download=("sign") + ".png" ;
    link.click();    
  },
  dlsvg: function(){
    var svg = ssw.svg(signmaker.vm.fswnorm()+signmaker.vm.styling(),{
      size: signmaker.vm.size(),
      pad: signmaker.vm.pad(),
      line: signmaker.vm.linecolor(), 
      fill: signmaker.vm.fillcolor(), 
      back: signmaker.vm.backcolor(), 
      colorize: signmaker.vm.colorize(),
      copy: (signmaker.vm.chars == "swu")?"opt":''
    });

    var data = new Blob([svg], {type: 'image/svg+xml'});
    if (dlFile !== null) {
      window.URL.revokeObjectURL(dlFile);
    }
    dlFile = window.URL.createObjectURL(data);
    var link = document.getElementById('downloadlink');
    link.href = dlFile;
    link.download=("sign") + ".svg" ;
    link.click();    
  },
  size: m.prop('1'),
  pad: m.prop('0'),
  linecolor: m.prop('black'),
  fillcolor: m.prop('white'),
  backcolor: m.prop(''),
  colorize: m.prop(''),
  center: function(){
    signmaker.vm.fsw(ssw.norm(signmaker.vm.fsw()));
  },
  list: new spatials.List(),
  sort: [],
  history: ['{"list":[],"sort":[]'],
  cursor: 0,
  addhistory: function(silent){
    if (!silent) {
      signmaker.vm.fswraw = '';
      signmaker.vm.swuraw = '';
    }
    var history ={list:signmaker.vm.list,sort:signmaker.vm.sort};
    var newhist = JSON.stringify(history).replace(/true/g,'false');
    if (newhist != signmaker.vm.history[signmaker.vm.cursor]){
      signmaker.vm.cursor++;
      signmaker.vm.history = signmaker.vm.history.slice(0,signmaker.vm.cursor);
      signmaker.vm.history.push(newhist);
      hashSet();
    } 
  },
  undo: function(){
    if (signmaker.vm.cursor<=0) return;
    signmaker.vm.cursor--;
    var history = JSON.parse(signmaker.vm.history[signmaker.vm.cursor]);
    var syms = history['list'];
    signmaker.vm.list = new spatials.List();
    for (var i=0; i < syms.length; i++) {
      signmaker.vm.list.push(new spatials.Symbol({key:syms[i]['key'],x:syms[i]['x'],y:syms[i]['y']}))
    }
    signmaker.vm.selnone();
    signmaker.vm.sort = history['sort'];
    m.redraw();
  },
  redo: function(){
    if ((signmaker.vm.cursor+1)>=signmaker.vm.history.length) return;
    signmaker.vm.cursor++;
    var history = JSON.parse(signmaker.vm.history[signmaker.vm.cursor]);
    var syms = history['list'];
    signmaker.vm.list = new spatials.List();
    for (var i=0; i < syms.length; i++) {
      signmaker.vm.list.push(new spatials.Symbol({key:syms[i]['key'],x:syms[i]['x'],y:syms[i]['y']}))
    }
    signmaker.vm.selnone();
    signmaker.vm.sort = history['sort'];
    m.redraw();
  },
  add: function(symbol) {
    signmaker.vm.selnone();
    if (symbol) {
      signmaker.vm.list.push(new spatials.Symbol(symbol));
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  addSeq: function(key,position) {
    signmaker.vm.sort.splice(position, 0, key);
    signmaker.vm.addhistory();
    m.redraw();
  },
  selnone: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      signmaker.vm.list[i].selected(false);
    }
  },
  copy: function() {
    var len = signmaker.vm.list.length;
    for (var i=0; i < len; i++) {
      if (signmaker.vm.list[i].selected()){
        var symbol = signmaker.vm.list[i];
        signmaker.vm.add({key:symbol.key(),x:symbol.x()+10,y:symbol.y()+10});
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  delete: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list.splice(i,1);
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  clear: function() {
    signmaker.vm.list = new spatials.List();
    signmaker.vm.sort=[];
    signmaker.vm.addhistory();
    m.redraw();
  },
  variation: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.scroll(signmaker.vm.list[i].key(),step));
      }
     }
    signmaker.vm.addhistory();
    m.redraw();
  },
  mirror: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.mirror(signmaker.vm.list[i].key()));
       }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  fill: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.fill(signmaker.vm.list[i].key(),step));
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  over: function() {
    var len = signmaker.vm.list.length;
    for (var i=0; i < len; i++) {
      if (signmaker.vm.list[i].selected()){
        var symbol = signmaker.vm.list[i];
        signmaker.vm.add({key:symbol.key(),x:symbol.x(),y:symbol.y()});
        signmaker.vm.list.splice(i,1);
        len--;
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  rotate: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.rotate(signmaker.vm.list[i].key(),step));
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  select: function(step) {
    if (!signmaker.vm.list.length) return;
    var sel = 0;
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        sel = i;
      }
    }
    sel += step;
    if (sel<0) sel = signmaker.vm.list.length-1;
    if (sel>=signmaker.vm.list.length) sel = 0;
    signmaker.vm.selnone();
    signmaker.vm.list[sel].selected(true);
    m.redraw();
  },
  move: function(x,y) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].x(signmaker.vm.list[i].x()+x);
        signmaker.vm.list[i].y(signmaker.vm.list[i].y()+y);
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  }
};
signmaker.controller = function(){
//  signmaker.vm.init();
};

function sbDragEnd( draggie,e,p ) {
  var sb = document.getElementById("signbox");
  var drag = draggie.dragPoint;
  if (overlap(draggie.element,sb)){
    signmaker.vm.list[draggie.element.index].x(signmaker.vm.list[draggie.element.index].x() + drag.x);
    signmaker.vm.list[draggie.element.index].y(signmaker.vm.list[draggie.element.index].y() + drag.y);
    signmaker.vm.addhistory();
    m.redraw();
  } else {
    var seq = document.getElementById("sequence");
    if (overlap(draggie.element,seq)){
      var position = parseInt(draggie.position.y / (window.innerHeight/20));
      var key = signmaker.vm.list[draggie.element.index].key();
      signmaker.vm.addSeq(key,position);
    }
    draggie.element.style.left = (parseInt(draggie.element.style.left) - drag.x) + 'px';
    draggie.element.style.top = (parseInt(draggie.element.style.top) - drag.y) + 'px';
  }
}

function sbDragStart( draggie ){
  signmaker.vm.selnone();
  signmaker.vm.list[draggie.element.index].selected(true);
}

function seqDragEnd( draggie,e,p ) {
  var position1 = parseInt(draggie.startPoint.y / (window.innerHeight/20));
  var position2 = parseInt((draggie.startPoint.y+draggie.dragPoint.y) / (window.innerHeight/20));
  draggie.element.style.left = (parseInt(draggie.element.style.left) - draggie.dragPoint.x) + 'px';
  draggie.element.style.top = (parseInt(draggie.element.style.top) - draggie.dragPoint.y) + 'px';
  if (position1<signmaker.vm.sort.length){
    if (position1!=position2){
      signmaker.vm.sort.splice(position2, 0, signmaker.vm.sort.splice(position1, 1)[0]);
    } else {
      signmaker.vm.sort.splice(position1,1);
    }
    signmaker.vm.addhistory();
    m.redraw();
  }
}

signmaker.view = function(ctrl){

  var clientWidth = document.getElementById('signmaker').clientWidth*.90
  var clientHeight = document.getElementById('signmaker').clientHeight*.5;
  signmaker.vm.midWidth = parseInt(clientWidth/2);
  signmaker.vm.midHeight = parseInt(clientHeight/2);
  var bbox = ssw.bbox(ssw.max(signmaker.vm.fsw())).split(" ");
  //check if bbox is outside of display
  if (bbox.length==4){
    if (bbox[0]<510-signmaker.vm.midWidth || bbox[1]>490+signmaker.vm.midWidth) { // left or right
      signmaker.vm.midWidth = signmaker.vm.midWidth + 500 - parseInt((parseInt(bbox[0])+parseInt(bbox[1]))/2);
    }
    if (bbox[2]<510-signmaker.vm.midHeight || bbox[3]>490+signmaker.vm.midHeight) { // top or bottom
      signmaker.vm.midHeight = signmaker.vm.midHeight + 500 - parseInt((parseInt(bbox[2])+parseInt(bbox[3]))/2);
    }
  }
  var grid = '';
  switch (S['grid'] || "0") {
    case "0":
      break;
    case "1":
      grid = '<svg width="' + clientWidth + '" height="' + clientHeight + '" viewBox="0 0 ' + clientWidth + ' ' + clientHeight + '" xmlns="http://www.w3.org/2000/svg" version="1.1">';
      grid += '<g stroke="gray" >';
      grid += '<line x1="0" y1="' + signmaker.vm.midHeight + '" x2="' + clientWidth + '" y2="' + signmaker.vm.midHeight + '" stroke-width="1"  />';
      grid += '<line y1="0" x1="' + signmaker.vm.midWidth + '" y2="' + clientHeight + '" x2="' + signmaker.vm.midWidth + '" stroke-width="1"  />';
      grid += '</g>';
      grid += '</svg>';
      break;
    case "2":
      grid = '<svg width="' + clientWidth + '" height="' + clientHeight + '" viewBox="0 0 ' + clientWidth + ' ' + clientHeight + '" xmlns="http://www.w3.org/2000/svg" version="1.1">';
      grid += '<g stroke="lightgray" >';
      var startH = signmaker.vm.midHeight % 10;
      var startW = signmaker.vm.midWidth % 10;
      for (var w=startW;w<clientWidth;w+=10){
        grid += '<line y1="0" x1="' + w + '" y2="' + clientHeight + '" x2="' + w + '" stroke-width="1"  />';
      }
      for (var h=startH;h<clientHeight;h+=10){
        grid += '<line x1="0" y1="' + h + '" x2="' + clientWidth + '" y2="' + h + '" stroke-width="1"  />';
      }
      grid += '</g>';
      grid += '<g stroke="gray" >';
      grid += '<line x1="0" y1="' + signmaker.vm.midHeight + '" x2="' + clientWidth + '" y2="' + signmaker.vm.midHeight + '" stroke-width="1"  />';
      grid += '<line y1="0" x1="' + signmaker.vm.midWidth + '" y2="' + clientHeight + '" x2="' + signmaker.vm.midWidth + '" stroke-width="1"  />';
      grid += '</g>';
      grid += '</svg>';
      break;
  }
  var editor = [m('div',{id:"signbox"},[
    m("div",m.trust(grid)),
    signmaker.vm.list.map(function(symbol, index) {
      return m("div"
      , {
        "class": symbol.selected() ? "selected" : "",
        style:{
          left: (parseInt(symbol.x())-500+signmaker.vm.midWidth).toString() + 'px',
          top: (parseInt(symbol.y())-500+signmaker.vm.midHeight).toString() + 'px'
        },
        config: function(element, isInitialized) {
          element.index=index;
          if (!isInitialized) {
            var draggie = new Draggabilly(element,{containment:"#signmaker"});
            draggie.on( 'dragStart', sbDragStart );
            draggie.on( 'dragEnd', sbDragEnd );
          }
        }
      },m.trust(ssw.svg(symbol.key())));
    })
  ]),
  m('div',{id:"sequence"},
    signmaker.vm.sort.concat('').map(function(key) {
      return m("div.sort"
      , {
        config: function(element, isInitialized) {
          element.key=key;
          if (!isInitialized) {
            var draggie = new Draggabilly(element,{containment:"#sequence"});
            draggie.on( 'dragEnd', seqDragEnd );
          }
        }
      },m.trust(ssw.svg(key)));
    }))
  ];

  var currentTab;
  switch (S['tab']) {
    case '': // signmaker commands
      currentTab = [
        m("div.cmdslim.clickable.",{onclick: signmaker.vm.move.bind(signmaker.vm,-1,0)},tt('moveLeft')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,0,-1)},tt('moveUp')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,0,1)},tt('moveDown')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,1,0)},tt('moveRight')),
        m('div',{style:"clear:both;height:0%"}),
        m('div.cmd.clickable',{onclick: signmaker.vm.copy},tt("copy")),
        m('div.cmd.clickable',{onclick: signmaker.vm.mirror},tt('mirror')),
        m('div.cmd.clickable',{onclick: signmaker.vm.center},tt('center')),
        m('div.cmd.clickable',{onclick: signmaker.vm.delete},tt('delete')),
        m('div.cmd.clickable',{onclick: signmaker.vm.rotate.bind(signmaker.vm,-1)},tt('rotateCCW')),
        m('div.cmd.clickable',{onclick: signmaker.vm.rotate.bind(signmaker.vm,1)},tt('rotateCW')),
        m('div.cmd.clickable',{onclick: signmaker.vm.select.bind(signmaker.vm,1)},tt('selectNext')),
        m('div.cmd',{"class": (signmaker.vm.cursor<=0)?"disabled":"clickable",onclick: signmaker.vm.undo}, tt('undo')),
        m('div.cmd.clickable',{onclick: signmaker.vm.fill.bind(signmaker.vm,-1)},tt('fillPrev')),
        m('div.cmd.clickable',{onclick: signmaker.vm.fill.bind(signmaker.vm,1)},tt('fillNext')),
        m('div.cmd.clickable',{onclick: signmaker.vm.select.bind(signmaker.vm,-1)},tt('selectPrev')),
        m('div.cmd',{"class": ((signmaker.vm.cursor+1)>=signmaker.vm.history.length)?"disabled":"clickable",onclick: signmaker.vm.redo},tt('redo')),
        m('div.cmd.clickable',{onclick: signmaker.vm.variation.bind(signmaker.vm,-1)},tt('variationPrev')),
        m('div.cmd.clickable',{onclick: signmaker.vm.variation.bind(signmaker.vm,1)},tt('variationNext')),
        m('div.cmd.clickable',{onclick: signmaker.vm.over},tt('placeOver')),
        m('div.cmd.clickable',{onclick: signmaker.vm.clear},tt('clearAll'))
      ];
      break;
    case 'png':
      currentTab = [
        m('div.cmd',{"class": (S['tab'] == 'png') ? "selected" : "unselected",onclick: () => setS({'tab':'png'})},tt("pngImage")),
        m('div.cmd',{"class": (S['tab'] == 'svg') ? "selected" : "unselected",onclick: () => setS({'tab':'svg'})},tt("svgImage")),
        m('div.cmdslim',tt('size')
        ),
        m('div.cmdslim',
          m("input",{id:"size",value:signmaker.vm.size(),oninput:m.withAttr('value',signmaker.vm.size)})
        ),
        m('div.cmdslim',tt('pad')
        ),
        m('div.cmdslim',
          m("input",{id:"pad",value:signmaker.vm.pad(),oninput:m.withAttr('value',signmaker.vm.pad)})
        ),
        m('div.cmdslim',tt('line')
        ),
        m('div.cmdslim',
          m("input",{id:"line",value:signmaker.vm.linecolor(),oninput:m.withAttr('value',signmaker.vm.linecolor)})
        ),
        m('div.cmdslim',tt('fill')
        ),
        m('div.cmdslim',
          m("input",{id:"fill",value:signmaker.vm.fillcolor(),oninput:m.withAttr('value',signmaker.vm.fillcolor)})
        ),
        m('div.cmdslim',tt('background')
        ),
        m('div.cmdslim',
          m("input",{id:"back",value:signmaker.vm.backcolor(),oninput:m.withAttr('value',signmaker.vm.backcolor)})
        ),
        m('div.cmdslim',tt('colorize')
        ),
        m('div.cmdslim',
          m("input",{id:"colorize",type:"checkbox",checked:signmaker.vm.colorize(),onclick:m.withAttr('checked',signmaker.vm.colorize)})
        ),
        m('div.cmdrow',
          m("p.fsw","Styling: "),
          m("input",{id:"styling",value:signmaker.vm.styling(),oninput:m.withAttr("value",signmaker.vm.styling)})
        ),
        isApp?'':m('div.cmd.clickable',{onclick: signmaker.vm.dlpng},tt('download')),
      ];
      var canvas = ssw.canvas(signmaker.vm.fswnorm()+signmaker.vm.styling(),{size: signmaker.vm.size(), pad: signmaker.vm.pad(), line: signmaker.vm.linecolor(), fill: signmaker.vm.fillcolor(), back: signmaker.vm.backcolor(), colorize: signmaker.vm.colorize()});
      var data = canvas?canvas.toDataURL("image/png"):"";
      editor = m('div',{id:"signbox"},
        m('div.mid',
          m('img',{src:data,value:("sign") + ".png"})
        )
      );
      break;
    case "svg":
      currentTab = [
        m('div.cmd',{"class": (S['tab'] == 'png') ? "selected" : "unselected",onclick: () => setS({'tab':'png'})},tt("pngImage")),
        m('div.cmd',{"class": (S['tab'] == 'svg') ? "selected" : "unselected",onclick: () => setS({'tab':'svg'})},tt("svgImage")),
        m('div.cmdslim',tt('size')
        ),
        m('div.cmdslim',
          m("input",{id:"size",value:signmaker.vm.size(),oninput:m.withAttr('value',signmaker.vm.size)})
        ),
        m('div.cmdslim',tt('pad')
        ),
        m('div.cmdslim',
          m("input",{id:"pad",value:signmaker.vm.pad(),oninput:m.withAttr('value',signmaker.vm.pad)})
        ),
        m('div.cmdslim',tt('line')
        ),
        m('div.cmdslim',
          m("input",{id:"line",value:signmaker.vm.linecolor(),oninput:m.withAttr('value',signmaker.vm.linecolor)})
        ),
        m('div.cmdslim',tt('fill')
        ),
        m('div.cmdslim',
          m("input",{id:"fill",value:signmaker.vm.fillcolor(),oninput:m.withAttr('value',signmaker.vm.fillcolor)})
        ),
        m('div.cmdslim',tt('background')
        ),
        m('div.cmdslim',
          m("input",{id:"back",value:signmaker.vm.backcolor(),oninput:m.withAttr('value',signmaker.vm.backcolor)})
        ),
        m('div.cmdslim',tt('colorize')
        ),
        m('div.cmdslim',
          m("input",{id:"colorize",type:"checkbox",checked:signmaker.vm.colorize(),onclick:m.withAttr('checked',signmaker.vm.colorize)})
        ),
        m('div.cmdrow',
          m("p.fsw","Styling: "),
          m("input",{id:"styling",value:signmaker.vm.styling(),oninput:m.withAttr("value",signmaker.vm.styling)})
        ),
        isApp?'':m('div.cmd.clickable',{onclick: signmaker.vm.dlsvg},tt('download')),
      ];
      var svg = ssw.svg(signmaker.vm.fswnorm()+signmaker.vm.styling(),{
        size: signmaker.vm.size(),
        pad: signmaker.vm.pad(),
        line: signmaker.vm.linecolor(),
        fill: signmaker.vm.fillcolor(),
        back: signmaker.vm.backcolor(),
        colorize: signmaker.vm.colorize(),
        copy: (signmaker.vm.chars == "swu")?"opt":''
      });
      editor = m('div',{id:"signbox"},
        m('div.mid',
          m.trust(svg)
        )
      );
      break;
    case "more":
      var alphaSignLang = signLang['alphabet'].map(function(key){
        return t(key) + '\t' + key.slice(4);
      });
      alphaSignLang.sort();
      currentTab = [
        m('div.cmd',{"class": (S['tab'] == 'png') ? "selected" : "unselected",onclick: () => setS({'tab':'png'})},tt("pngImage")),
        m('div.cmd',{"class": (S['tab'] == 'svg') ? "selected" : "unselected",onclick: () => setS({'tab':'svg'})},tt("svgImage")),
        m('div.cmdslim',tt('userInterface')
        ),
        m('div.cmdlong',
          m('select', {id: 'language',onchange:function(e){setS({'ui':e.target.value});}},
            m('optgroup',
              Object.keys(messages).map(function(key){
                return m('option',{value: key,selected:(key==S['ui'])},messages[key]['language']);
              })
            )
          )
        ),
        m('div.cmdslim',tt('alphabet')
        ),
        m('div.cmdlong',
          m('select', {id: 'alphaLang',onchange:function(e){setS({'alphabet':e.target.value});}},
            m('optgroup',
              m('option',{value:''},t('iswa2010')),
              alphaSignLang.map(function(val){
                var vals = val.split('\t');
                return m('option',{value: vals[1],selected:(vals[1]==S['alphabet'])},vals[0]);
              })
            )
          )
        ),
        m('div.cmdslim',tt('grid')
        ),
        m('div.cmdslim.clickable',{"class": (S['grid']=="0") ? "checked" : "unchecked",onclick: function(){setS({'grid':"0"});}},tt('grid0')),
        m('div.cmdslim.clickable',{"class": (S['grid']=="1") ? "checked" : "unchecked",onclick: function(){setS({'grid':"1"});}},tt('grid1')),
        m('div.cmdslim.clickable',{"class": (S['grid']=="2") ? "checked" : "unchecked",onclick: function(){setS({'grid':"2"});}},tt('grid2')),
        m('div.cmdslim',tt('skin')
        ),
        m('div.cmdslim.clickable',{"class": (S['skin']=="" || S['skin']==undefined) ? "checked" : "unchecked",onclick: function(){setS({'skin': ''});}},tt('blackOnWhite')),
        m('div.cmdslim.clickable',{"class": (S['skin']=="inverse") ? "checked" : "unchecked",onclick: function(){setS({'skin': 'inverse'});}},tt('whiteOnBlack')),
        m('div.cmdslim.clickable',{"class": (S['skin']=="colorful") ? "checked" : "unchecked",onclick: function(){setS({'skin': 'colorful'});}},tt('colorful')),
        m('div.cmdrow',
          m("p.fsw","FSW:"),
          m("input",{"class": (signmaker.vm.fswraw && (signmaker.vm.fswraw != signmaker.vm.fswlive()))?'warning':'',id:"fsw",value:signmaker.vm.fswview(),oninput:m.withAttr("value",signmaker.vm.fswview)})
        ),
        m('div', {"class":(signmaker.vm.chars=="fsw")?'cmdrow':'cmdfull'},
          m("p.swu","SWU:"),
          m("input",{"class": (signmaker.vm.swuraw && (signmaker.vm.swuraw != signmaker.vm.swulive()))?'warning':'',id:"swu",value:signmaker.vm.swuview(),oninput:m.withAttr("value",signmaker.vm.swuview)})
        ),
        m('div.cmdrow',
          m("p.fsw","Styling: "),
          m("input",{id:"styling",value:signmaker.vm.styling(),oninput:m.withAttr("value",signmaker.vm.styling)})
        ),
      ]
      break;

  }

  return [
    editor,
    m('div',{id:"command"},[
      m('div.cmd.edit',{"class": (S['tab'] == '') ? "selected" : "unselected",onclick: () => setS({'tab':''})},tt("editTab")),
      m('div.cmd',{"class": (S['tab'] =='more') ? "selected" : "unselected",onclick: () => setS({'tab':'more'})},tt("moreTab")),
      currentTab
      ])
    ]
};


// PALETTE
//////////
var palette = {}; //app namespace
//model
palette.structure = function(){
  return window.alphabet;
};

palette.vm = {};

palette.vm.init = function(){
  this.source = palette.structure();
  this.action = false;
}

palette.vm.select = function(group,base,lower){
  var key;
  this.group = group || '';
  this.base = base || '';
  this.lower = !!lower;
  
  if (this.base && !this.lower){
    var key1 = this.base.slice(0,4) + "08";
    var key2 = this.base.slice(0,4) + "18";
    this.mirror = (ssw.size(key1) || ssw.size(key2))
    this.grid=[[],[],[],[],[],[],[],[]];
    for (var f=0;f<6;f++){
      for (var r=0;r<8;r++){
        key=this.base.slice(0,4) + f + r;
        this.grid[r].push(key);
      }
    }
  } else if (this.base && this.lower){
    this.mirror = true;
    this.grid=[[],[],[],[],[],[],[],[]];
    for (var f=0;f<6;f++){
      for (var r=8;r<16;r++){
        key=this.base.slice(0,4) + f + r.toString(16);
        this.grid[(r-8)].push(key);
      }
    }
  } else if (this.group){
    this.mirror = false;
    this.grid=[[],[],[],[],[],[],[],[],[],[]];
    var cnt=0;
    for (var i=0; i<this.source[this.group].length;i++){
      key = this.source[this.group][i];
      this.grid[(cnt++%10)].push(key);
    }
    for (var i=cnt; i<60;i++){
      this.grid[(i%10)].push('');
    }
  } else {
    this.mirror=false;
    this.grid=[[],[],[],[],[],[],[],[],[],[]];
    var cnt=0;
    for (key in this.source){
      if (palette.vm.dialing){
        var start = window.alphabet[key][0];
        var end = window.alphabet[key].slice(-1)[0]
        if (!ssw.results(query+"R" + start.slice(1,4) + 't' + end.slice(1,4),text).length) {
          key='';
        }
      }
      this.grid[(cnt++%10)].push(key);
    }
    for (var i=cnt; i<60;i++){
      this.grid[(i%10)].push('');
    }
  }
}

palette.controller = function(){
  palette.vm.init();
  palette.vm.select();
}

palette.click = function(key){
  if (palette.vm.base){
    return;
  } else if (palette.vm.group){
    palette.vm.select(palette.vm.group,key);
  } else {
    palette.vm.select(key);
  }
};

palette.undo = function(){
  return {
    "class": palette.vm.dialhist.length || palette.vm.group?"clickable":"disabled",
    onclick: function(){
      if (palette.vm.base){
        palette.vm.select(palette.vm.group);
      } else if (palette.vm.group){
        palette.vm.select();
      }
    }
  }
}
palette.top = function(){
  return {
    onclick: function(){
      palette.vm.select();
    }
  };
};
palette.previous = function(){
  return {
    onclick: function(){
      if (palette.vm.base){
        palette.vm.select(palette.vm.group);
      } else {
        palette.vm.select();
      }
    }
  };
};
palette.mirror = function(){
  return {
    "class": palette.vm.dialing==3?"smaller":'',
    onclick: function(){
      palette.vm.select(palette.vm.group,palette.vm.base,!palette.vm.lower);
    }
  };
};

//view

// gets the offset of an element relative to the document
function getOffset( el ) {
  var offset = el?el.getBoundingClientRect():{top:0,left:0};
  return { top : offset.top + (window.pageYOffset || window.document.documentElement.scrollTop), left : offset.left + (window.pageXOffset || window.document.documentElement.scrollLeft) }
}

function overlap(el1, el2){
  if (!el2) return false;
  var offset1 = getOffset( el1 ), width1 = el1.offsetWidth, height1 = el1.offsetHeight,
    offset2 = getOffset( el2 ), width2 = el2.offsetWidth, height2 = el2.offsetHeight;
  if (!(offset2.left > offset1.left + width1 - width1/2 || offset2.left + width2 < offset1.left + width1/2 || offset2.top > offset1.top + height1 - height1/2 || offset2.top + height2 < offset1.top + height1/2 )){
    return true;
  } else {
    return false;
  }
}

function palDragEnd( draggie,e,p ) {
  var sb = document.getElementById("signbox");
  if (overlap(draggie.element,sb)){
    var offset1 = getOffset( draggie.element ),
      offset2 = getOffset( sb );
    var symbol = {key:draggie.element.key,x: parseInt(500-signmaker.vm.midWidth+1+offset1.left-offset2.left),y: parseInt(500-signmaker.vm.midHeight+offset1.top-offset2.top)};
    signmaker.vm.add(symbol);
  } else {
    var seq = document.getElementById("sequence");
    if (overlap(draggie.element,seq)){
      var position = parseInt((draggie.startPoint.y+draggie.dragPoint.y) / (window.innerHeight/20));
      var key = draggie.element.key;
      signmaker.vm.addSeq(key,position);
    }
  }
    
  draggie.element.style.top=0;
  draggie.element.style.left=0;
  draggie.element.topleft=false;
  classie.remove(draggie.element,"topleft");
  var drag = draggie.dragPoint;
  if ( drag.x === 0 && drag.y === 0 ) {
    palette.click(draggie.element.key);
    m.redraw();
  }
}

function palDragMove( draggie ){
  if (!draggie.element.topleft){
    draggie.element.topleft=true;
    classie.add(draggie.element,"topleft");
  }
}

palette.view = function(ctrl){
  var tooltip = palette.vm.base?'':palette.vm.group?'base_':'group_';
  return [
    palette.vm.action?[
      m('div.btn.clickable.save',{onclick: signmaker.vm.save},tt("save")),
      m('div.btn.clickable.share',{onclick: signmaker.vm.share},tt("share")),
      m('div.btn.clickable.demo',{onclick: signmaker.vm.demo},tt("demo")),
      m('div.btn.clickable.cancel',{onclick: signmaker.vm.cancel},tt("cancel")),
    ]:[
      m('div.btn.clickable.save',{onclick: () => palette.vm.action = !palette.vm.action},tt("action")),
      m("div.btn.clickable",palette.top(),tt("top")),
      m("div.btn.clickable",palette.previous(),tt("previous")),
      palette.vm.mirror?m("div.btn",palette.mirror(),tt("mirror")):''
    ],
    palette.vm.grid.map(function(row){
      return m("div.row",{"class":palette.vm.dialing?"smaller":''},row.map(function(key){
        return m("div"
        , {
          title: tooltip?t(tooltip + key.slice(0,4)):'',
          config: function(element, isInitialized) {
            element.key=key;
            if (!isInitialized) {
              var draggie = new Draggabilly(element);
              draggie.on( 'dragMove', palDragMove );
              draggie.on( 'dragEnd', palDragEnd );
            }
          }
        },m.trust(ssw.svg(key)));
      }));
    })
  ];
};


addEventListener("keydown", function(event){
  if (event.target==document.body){
    var code = event.charCode || event.keyCode;
    for (var i=0; i<keyboard['prevent'].length; i++){
      if (code === keyboard['prevent'][i]){
        event.preventDefault();
      }
    }
    return false;
  }
});

function initApp(){
  m.mount(document.getElementById("palette"), palette);
  m.mount(document.getElementById("signmaker"), signmaker);
}

var cssCheck;
window.onload = function () {
  if (S['swu']) {
    signmaker.vm.swu(S['swu'])
  } else if (S['fsw']) {
    signmaker.vm.fsw(S['fsw'])
  } 
  var cnt = 0;
  if (!!ssw.size("S10000")){
    initApp();
  } else {
    classie.addClass(document.body,"waiting");
    var page = document.body.innerHTML;
    cssCheck = setInterval(function(){
      if (ssw.size("S10000")){
        classie.removeClass(document.body,"waiting");
        document.body.innerHTML = page;
        clearInterval(cssCheck);
        initApp();
        //secondary call for Android default browser
        //setTimeout(function(){ initApp(); }, 100);
      } else {
        document.getElementById('dots').innerHTML=Array(1+parseInt(((cnt++)%40)/10)).join('.');      
      }
    },100);
    document.body.innerHTML = '<h2>' + t('loadFont') + ' <span id="dots"></span>' + '</h2>';
  }

  
}

checkKeyboard = function (event,name){
  if (event.target==document.body){
    var code = event.charCode || event.keyCode;
    var checks = keyboard[name];
    var checking;
    var act;
    if (!(checks[0] instanceof Array)){
      checks = [checks];
    }
    for (var i=0; i < checks.length; i++) {
      checking = checks[i]
      if (checking[0] == code){
        act = true;
        checking = checking.slice(1);
        for (check in checking){
          if (!event[checking[check]]){
            act = false;
            break;
          }
        }
        if (act) return true;
      }
    }
    return false;
  }
}
addEventListener("keyup", function(event) {
  var x = event.charCode || event.keyCode;
  if (checkKeyboard(event,"left10")){ signmaker.vm.move(-10,0);} else
  if (checkKeyboard(event,"up10")){ signmaker.vm.move(0,-10);} else
  if (checkKeyboard(event,"right10")){ signmaker.vm.move(10,0);} else
  if (checkKeyboard(event,"down10")){ signmaker.vm.move(0,10);} else
  if (checkKeyboard(event,"left")){ signmaker.vm.move(-1,0);} else
  if (checkKeyboard(event,"up")){ signmaker.vm.move(0,-1);} else
  if (checkKeyboard(event,"right")){ signmaker.vm.move(1,0);} else
  if (checkKeyboard(event,"down")){ signmaker.vm.move(0,1);} else
  if (checkKeyboard(event,"selectBack")){ signmaker.vm.select(-1);} else 
  if (checkKeyboard(event,"selectNext")){ signmaker.vm.select(1);} else 
  if (checkKeyboard(event,"escape")){ if (S['tab'] == 'more') {setS({'tab':''});} else {setS({'tab':'more'})} }else 
  if (checkKeyboard(event,"delete")){ signmaker.vm.delete();} else 
  if (checkKeyboard(event,"redo")){ signmaker.vm.redo();} else 
  if (checkKeyboard(event,"undo")){ signmaker.vm.undo();} else 
  if (checkKeyboard(event,"rotateBack")){ signmaker.vm.rotate(-1);} else 
  if (checkKeyboard(event,"rotateNext")){ signmaker.vm.rotate(1);} else 
  if (checkKeyboard(event,"variationBack")){ signmaker.vm.variation(-1);} else 
  if (checkKeyboard(event,"variationNext")){ signmaker.vm.variation(1);} else 
  if (checkKeyboard(event,"mirror")){ signmaker.vm.mirror();} else 
  if (checkKeyboard(event,"fillBack")){ signmaker.vm.fill(-1);} else 
  if (checkKeyboard(event,"fillNext")){ signmaker.vm.fill(1);} else 
  if (checkKeyboard(event,"recenter")){ signmaker.vm.center();}
   
  if (event.preventDefault) event.preventDefault();
  return false;
});
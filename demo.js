
// Receive Signal
function receiveMessage(event) {
  M_in.push(event.data)
  m.redraw();
  if (event.origin === "http://localhost:5000" 
    || event.origin === "https://sutton-signwriting.github.io/signmaker") {
    // inspect event.data
  }
}
// event listener for message event
window.addEventListener("message", receiveMessage, false);

var M_in = [];
var M_out = [];

function iframesize2style(val){
  return !val?'':val.split('x').map((num,i) => {
    switch(i) {
      case 0:
        return 'width:' + parseInt(num) + 'px;';
      case 1:
        return 'height:' + parseInt(num) + 'px;';
      default:
        return '';
    }
  }).join('')
}

//ST state terminals are not hashes for a link or iframe
var ST = ['server','iframesize','view'];
//SS state split, where key is a reference to a value
var SS = ['server'];

//S values are saved by value
// values are hashed to demo a link and iframe
var S = {
  'iframesize': undefined,
  'view': undefined,
  'ui': undefined,
  'alphabet': undefined,
  'fsw': undefined,
  'swu': undefined,
  'styling': undefined,
  'grid': undefined,
  'skin': undefined,
  'tab': undefined
}

// state defaults
var SD = {
  'server': {
    'dot': './',
    'local': [window.location.href.split("#")[0].replace(/\/demo(\.html)?$/,"/")],
    'public': 'https://sutton-signwriting.github.io/signmaker/'
//    'backup': ''
  },
  //  'mode': {
//    'svg': 'svg',
//    'png': 'png',
//
//  },
  'view': {
    'index.html': 'signmaker',
//    'text.html': 'signtext',
    'README.html': 'read me',
    'CHANGELOG.html': 'change log'
  },
  'iframesize': {
    '400x200': 'tiny',
    '640x360': 'small',
    '1024x726': 'medium',
    '': 'full'
  },
  'ui': {
    'en': 'English',
    'ase': 'ASL',
    'ptBR': 'Portuguese'
  },
  'alphabet': {
    'iswa': 'ISWA 2010',
    'ase': 'ASL'
  },
  'fsw': {
    'AS10011S10019S2e704S2e748M525x535S2e748483x510S10011501x466S2e704510x500S10019476x475': 'sign',
    'AS15a21S15a07S21100S2df04S2df14M521x538S15a07494x488S15a21498x489S2df04498x517S2df14497x461S21100479x486': 'becomes',
    'AS1f010S10018S20600M519x524S10018485x494S1f010490x494S20600481x476': "word"
  },
  'swu': {
    '𝠀񀀒񀀚񋚥񋛩𝠃𝤟𝤩񋛩𝣵𝤐񀀒𝤇𝣤񋚥𝤐𝤆񀀚𝣮𝣭': 'sign',
    '𝠀񂇢񂇈񆙡񋎥񋎵𝠃𝤛𝤬񂇈𝤀𝣺񂇢𝤄𝣻񋎥𝤄𝤗񋎵𝤃𝣟񆙡𝣱𝣸': 'becomes',
    '𝠀񅨑񀀙񆉁𝠃𝤙𝤞񀀙𝣷𝤀񅨑𝣼𝤀񆉁𝣳𝣮': 'word'
  },
  'styling': {
    '-CZ2': 'colorize',
    '-CP10G_lightblue_Zx': 'complex'
  },
  'grid': {
    '0': '0',
    '1': '1',
    '2': '2',
  },
  'skin': {
    'inverse': 'inverse',
    'colorful': 'colorful'
  },
  'tab': {
    'more': 'more',
    'png': 'png',
    'svg': 'svg'
  }
}
//find state key for value

function hash(){
  return "?" + Object.keys(S).map(key => {
    return S[key]?key+"="+S[key]:undefined
  }).filter(item => (item !== undefined)).join("&")
}

function hashSet(){
  //  history.replaceState(null, null, document.location.pathname + '#' + hash);
  history.pushState(null, null, document.location.pathname + '#' + hash());
  //  window.location.hash = hash;
}

function demohash(){
  return "?" + Object.keys(S).map(key => {
    return S[key]?key+"="+S[key]:undefined
  }).filter(item => (item !== undefined)).filter(item => !ST.includes(item.split("=")[0])).join("&")
}
window.onhashchange = hashChange;
function hashChange(event){
  var parts;
  var hashed = {}
  var iloc = window.location.href.indexOf('?');
  if (iloc>-1) {
    var hashes = decodeURI(window.location.href.slice(iloc + 1)).split('&');
    for(var i = 0; i < hashes.length; i++) {
      parts = hashes[i].split('=');
      if (parts[0]) hashed[parts[0]] = parts[1];
    }
  }
  if (hashed['server'] === undefined) { hashed['server'] = 'local';}
  if (hashed['iframesize'] === undefined) { hashed['iframesize'] = '400x200';}
  if (hashed['view'] === undefined) { hashed['view'] = 'index.html';}
  S = hashed;
  //T = hashed
}
hashChange();

var root = document.body
var ButtonS = {
  view: function(vnode) {
    return m('button', {
      class: SS.includes(vnode.attrs.lookup)?(
        (S[vnode.attrs.lookup]==vnode.attrs.text)?'selected':''
      ):(
        (S[vnode.attrs.lookup]==vnode.attrs.value)?'selected':''
      ),
      onclick: function(e){
        if (!SS.includes(vnode.attrs.lookup)){
          S[vnode.attrs.lookup] = vnode.attrs.value;
        } else {
          S[vnode.attrs.lookup] = vnode.attrs.text;
        }
        if ((vnode.attrs.lookup == "fsw" || vnode.attrs.lookup == "swu") && vnode.attrs.value == ""){
          document.getElementById('signmaker').contentWindow.postMessage({'fsw':''})
        }
        if (vnode.attrs.lookup == "view"){
          if (vnode.attrs.value == "README.html" || vnode.attrs.value == "CHANGELOG.html") {
            S['iframesize'] = '';
          }
        }
        hashSet();
      }
    }, vnode.attrs.text)
  }
}
var ButtonM = {
  view: function(vnode) {
    return m('button', {
      onclick: function(e){
        var msg = {[vnode.attrs.state]: vnode.attrs.value};
        M_out.push(msg);
        document.getElementById('signmaker').contentWindow.postMessage(msg)
        m.redraw();
      }
    }, vnode.attrs.text)
  }
}
var IFrame = {
  view: function(vnode) {
    return m('iframe#signmaker', {
      style: vnode.attrs.style,
      src: vnode.attrs.src,
      onclick: function(e){
        console.log("touched");
      },
      onchange: function(e){
        console.log("changed")
        console.log(e)
      }
    })
  }
}
var Demo = {
  view: function() {
    return [
      m('h2','URL Parameters'),
      Object.keys(SD).map( key => {
        return m('span.boxed',[
          m('span',key),
          ST.includes(key)?'':m(ButtonS,{lookup: key,value:undefined,text:'none'}),
          Object.keys(SD[key]).map(name => {
            return m(ButtonS,{
              lookup:key,
              value:name,
              text: !SS.includes(key)?SD[key][name]:name
            })
          }),
          m('span.swu'," (" + (S[key]?S[key]:'') + ") ")
        ])
      }),
      m('div',{style:"clear:both;height:1%"}),
      m('hr'),
      m('pre', m('code.swu','<a href="' + SD['server'][S['server']] + S['view'] + "#" + demohash() + '">a link</a>')),
      m('a',{"style":"","href":SD['server'][S['server']] + S['view'] + "#" + demohash()},"a link"),
      m('pre', m('code.swu','<iframe ' + (S['iframesize']?('style:"' + iframesize2style(S['iframesize']) + '" '):'') + ' src:"' + SD['server'][S['server']] + S['view'] + "#" + demohash() + '"></iframe>')),
      m(IFrame,{
        "style": iframesize2style(S['iframesize']),
        src:SD['server'][S['server']] + S['view'] + '#' + demohash()
      }),
      m('hr'),
      m('h2',"Messages Received"),
      M_in.map((msg,i) => m("li.swu", JSON.stringify(msg))),
      m('hr'),
      m('h2',"Messages Sent"),
      M_out.map((msg,i) => m("li.swu", JSON.stringify(msg))),
      Object.keys(SD).filter(item => !ST.includes(item)).map( key => {
        return m('span.boxed',[
          m('span',key),
          m(ButtonM,{state: key,value:'',text:'none'}),
          Object.keys(SD[key]).map(name => {
            return m(ButtonM,{state:key,value:name,text:SD[key][name]})
          })
        ])
      }),
      m('div',{style:"clear:both;height:1%"}),
      
//      m('iframe',{"style":"width:200px;height:400px", src:T['server'] + "#" + demohash()}),
//      m('iframe',{src:T['server'] + "#" + demohash()})
    ]
  }
}
m.mount(root, Demo);
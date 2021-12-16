
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

var T = {
  'home': './',
  'style': 'height:200px;width:400px;'
}
var OT = {
  'home': {
    './': 'dot',
    'http://localhost:5000/': 'local',
    'https://sutton-signwriting.github.io/signmaker/': 'public'
  },
  'style': {
    'height:200px;width:400px;': 'tiny',
    'height:360px;width:640px;': 'small',
    'height:726px;width:1024px;': 'medium',
    '': 'full'

  }
}

var S = {
  'ui': undefined,
  'alphabet': undefined,
  'fsw': undefined,
  'swu': undefined,
  'styling': undefined,
  'grid': undefined,
  'skin': undefined,
  'tab': undefined
}
var OS = {
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

function hash(){
  return "?" + 
  Object.keys(S).map(function(key){
    return S[key]?key+"="+S[key]:undefined
  }).filter(item => (item !== undefined)).join("&")
}

var root = document.body
var ButtonT = {
  view: function(vnode) {
    return m('button', {
      onclick: function(e){
        T[vnode.attrs.state] = vnode.attrs.value;
        m.redraw();
      }
    }, vnode.attrs.text)
  }
}
var ButtonS = {
  view: function(vnode) {
    return m('button', {
      onclick: function(e){
        S[vnode.attrs.state] = vnode.attrs.value;
        if ((vnode.attrs.state == "fsw" || vnode.attrs.state == "swu") && vnode.attrs.value == ""){
          document.getElementById('signmaker').contentWindow.postMessage({'fsw':''})
        }
        m.redraw();
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
      Object.keys(OT).map( key => {
        return m('span.boxed',[
          m('span',key),
          Object.keys(OT[key]).map(name => {
            return m(ButtonT,{state:key,value:name,text:OT[key][name]})
          }),
          m('span.swu'," (" + (T[key]?T[key]:'') + ") ")
        ])
      }),
      m('div',{style:"clear:both;height:1%"}),
      m('hr'),
      m('h2','URL Parameters'),
      Object.keys(OS).map( key => {
        return m('span.boxed',[
          m('span',key),
          m(ButtonS,{state: key,value:'',text:'none'}),
          Object.keys(OS[key]).map(name => {
            return m(ButtonS,{state:key,value:name,text:OS[key][name]})
          }),
          m('span.swu'," (" + (S[key]?S[key]:'') + ") ")
        ])
      }),
      m('div',{style:"clear:both;height:1%"}),
      m('hr'),
      m('pre', m('code.swu','<a href="' + T['home'] + "#" + hash() + '">a link</a>')),
      m('a',{"style":"","href":T['home'] + "#" + hash()},"a link"),
      m('pre', m('code.swu','<iframe style:"' + T['style'] + '" src:"' + T['home'] + "#" + hash() + '"></iframe>')),
      m(IFrame,{"style":T['style'], src:T['home'] + "#" + hash()}),
      m('hr'),
      m('h2',"Messages Received"),
      M_in.map((msg,i) => m("li.swu", JSON.stringify(msg))),
      m('hr'),
      m('h2',"Messages Sent"),
      M_out.map((msg,i) => m("li.swu", JSON.stringify(msg))),
      Object.keys(OS).map( key => {
        return m('span.boxed',[
          m('span',key),
          m(ButtonM,{state: key,value:'',text:'none'}),
          Object.keys(OS[key]).map(name => {
            return m(ButtonM,{state:key,value:name,text:OS[key][name]})
          }),
          m('span.swu'," (" + (S[key]?S[key]:'') + ") ")
        ])
      }),
      m('div',{style:"clear:both;height:1%"}),
      
//      m('iframe',{"style":"width:200px;height:400px", src:T['home'] + "#" + hash()}),
//      m('iframe',{src:T['home'] + "#" + hash()})
    ]
  }
}
m.mount(root, Demo);
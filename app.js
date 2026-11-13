(function(){
var EP=[],state={q:'',from:-500,to:2000,tag:null},map,layer;
var MIN=-500,MAX=2000;
function fmt(y){return y<0?(-y)+' B.C.':'A.D. '+y}
function norm(s){return (s||'').toLowerCase()}
function match(e){
  var t=norm(e.title+' '+e.summary+' '+e.tags.join(' ')+' '+e.places.map(function(p){return p.name}).join(' '));
  if(state.q&&t.indexOf(norm(state.q))<0)return false;
  if(e.year_end<state.from||e.year_start>state.to)return false;
  if(state.tag&&e.tags.indexOf(state.tag)<0)return false;
  return true}
function render(){
  var list=EP.filter(match),box=document.getElementById('cards');box.innerHTML='';
  list.forEach(function(e){var a=document.createElement('a');a.className='card';a.href=e.slug+'/';
    a.innerHTML='<img alt="" loading="lazy" src="'+e.slug+'/thumb.png"><div><b></b><span></span></div>';
    a.querySelector('b').textContent=e.title;a.querySelector('span').textContent=fmt(e.year_start)+' to '+fmt(e.year_end)+' · '+e.tags.slice(0,3).join(', ');box.appendChild(a)});
  document.getElementById('count').textContent=list.length+' of '+EP.length+' episodes';
  if(!list.length)box.innerHTML='<p class="empty">No episode matches. Widen the years or clear the search.</p>';
  if(map){layer.clearLayers();var b=[];list.forEach(function(e){e.places.forEach(function(p){
      var m=L.circleMarker([p.lat,p.lon],{radius:p.role==='setting'?9:6,color:'#d6b062',weight:2,fillColor:p.role==='setting'?'#d6b062':'#14100c',fillOpacity:.85}).addTo(layer);
      var d=document.createElement('div');var h=document.createElement('b');h.textContent=p.name;d.appendChild(h);d.appendChild(document.createElement('br'));
      var n=document.createElement('span');n.textContent=(p.year!=null?fmt(p.year)+': ':'')+(p.note||'');d.appendChild(n);d.appendChild(document.createElement('br'));
      var l=document.createElement('a');l.href=e.slug+'/';l.textContent=e.title;d.appendChild(l);m.bindPopup(d);b.push([p.lat,p.lon])})});
    if(b.length)map.fitBounds(b,{padding:[30,30],maxZoom:6})}}
function init(){
  var q=document.getElementById('q'),f=document.getElementById('from'),t=document.getElementById('to');
  var u=new URLSearchParams(location.search);
  if(u.get('q')){state.q=u.get('q');q.value=state.q}
  function sync(){var p=new URLSearchParams();if(state.q)p.set('q',state.q);if(state.from>MIN)p.set('from',state.from);if(state.to<MAX)p.set('to',state.to);if(state.tag)p.set('tag',state.tag);
    history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));document.getElementById('yl').textContent=fmt(state.from)+' to '+fmt(state.to)}
  state.from=u.get('from')?+u.get('from'):MIN;state.to=u.get('to')?+u.get('to'):MAX;state.tag=u.get('tag');
  f.min=t.min=MIN;f.max=t.max=MAX;f.value=state.from;t.value=state.to;
  q.addEventListener('input',function(){state.q=q.value;sync();render()});
  f.addEventListener('input',function(){state.from=Math.min(+f.value,state.to);f.value=state.from;sync();render()});
  t.addEventListener('input',function(){state.to=Math.max(+t.value,state.from);t.value=state.to;sync();render()});
  var tags={};EP.forEach(function(e){e.tags.forEach(function(x){tags[x]=1})});var c=document.getElementById('chips');
  Object.keys(tags).sort().forEach(function(x){var b=document.createElement('button');b.className='chip';b.type='button';b.textContent=x;b.setAttribute('aria-pressed',state.tag===x);
    b.onclick=function(){state.tag=state.tag===x?null:x;Array.prototype.forEach.call(c.children,function(k){k.setAttribute('aria-pressed',k.textContent===state.tag)});sync();render()};c.appendChild(b)});
  if(window.L){map=L.map('map',{scrollWheelZoom:false}).setView([45,10],4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:12,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);layer=L.layerGroup().addTo(map)}
  sync();render()}
fetch('episodes.json').then(function(r){return r.json()}).then(function(d){EP=d;init()});
})();
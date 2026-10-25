const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
// Minimal DOM harness: exercises production game handlers and timers in Node.
// This is logic QA, not a substitute for WebKit/device rendering tests.
function harness(saved=new Map()){
 const ids=new Map(), timers=new Map(), events={}; let clock=0,serial=0;
 class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.classes=new Set();this.textContent='';this.value='';this.classList={add:(...cs)=>cs.forEach(c=>this.classes.add(c)),remove:(...cs)=>cs.forEach(c=>this.classes.delete(c)),contains:c=>this.classes.has(c),toggle:(c,v)=>{if(v??!this.classes.has(c))this.classes.add(c);else this.classes.delete(c);}};}
  set className(v){this.classes=new Set(v.split(/\s+/));} get className(){return [...this.classes].join(' ');}
  set innerHTML(html){this.html=html;this.children=[];const stack=[this];for(const m of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)){const token=m[0];if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}const tag=token.match(/^<(\w+)/)[1];const e=new Element(tag);for(const a of token.matchAll(/([\w-]+)="([^"]*)"/g))e.setAttribute(a[1],a[2]);stack.at(-1).appendChild(e);if(!['input','img','br','meta','link','source'].includes(tag)&&!token.endsWith('/>'))stack.push(e);}}
  get innerHTML(){return this.html||'';}
  setAttribute(k,v){this.attributes[k]=v;if(k==='id'){this.id=v;ids.set(v,this);}if(k==='class')this.className=v;if(k==='value')this.value=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
  appendChild(e){this.children.push(e);e.parent=this;return e;}
  after(e){this.parent?.appendChild(e);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
  matches(s){return s.startsWith('.')?this.classes.has(s.slice(1)):s.startsWith('#')?this.id===s.slice(1):s.startsWith('[')?this.attributes[s.slice(1,-1)]!==undefined:this.tagName===s;}
  querySelectorAll(s){return this.children.flatMap(e=>[...(e.matches(s)?[e]:[]),...e.querySelectorAll(s)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  closest(s){return this.matches(s)?this:this.parent?.closest(s)||null;}
  addEventListener(n,fn){this['on'+n]=fn;}
  showModal(){} play(){return Promise.resolve();} pause(){}
 }
 const body=new Element('body');body.innerHTML=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
 const document={body,hidden:false,getElementById:id=>ids.get(id),createElement:t=>new Element(t),querySelector:s=>body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s),addEventListener:(n,f)=>events[n]=f};
 const context=vm.createContext({document,window:{scrollTo(){},addEventListener(){},removeEventListener(){}},navigator:{},location:{protocol:'file:'},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},performance:{now:()=>clock},setTimeout:(f,ms)=>{const id=++serial;timers.set(id,{at:clock+ms,f});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>++serial,cancelAnimationFrame(){},console});
 for(const file of ['app.js','arcade.js','maze.js']) vm.runInContext(fs.readFileSync(path.join(root,'www',file),'utf8'),context,{filename:file});
 const run=code=>vm.runInContext(code,context);run('state.music=false;init()');
 function advance(ms){const end=clock+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;timers.delete(next[0]);next[1].f();}clock=end;}
 const click=(id,node)=>{const el=ids.get(id);assert.ok(el&&el.onclick,`handler ${id}`);el.onclick({target:node||el});};
 return {run,ids,saved,advance,click,events,document,body};
}
test('all ten games start and finish at every difficulty with bounded scores',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const id of ['beat','stars','memory','sort','colors','dodge','balloon','rhythm','balance','maze']){
  const h=harness();h.run(`state.difficulty='${difficulty}';chooseGame('${id}');startRound()`);
  assert.equal(h.run('state.live'),true);h.run('if(state.game.tick)state.game.tick(state.duration);endRound()');
  assert.equal(h.run('state.scores[0].length'),1);assert.ok(h.run('state.scores[0][0]>=0&&state.scores[0][0]<=100'));h.click('nextRound');assert.match(h.ids.get('roundInfo').textContent,/FINAL/);
 }
});
test('beat locks after five catches during result delay',()=>{const h=harness();h.run("chooseGame('beat');startRound();state.game.tick(0)");for(let i=0;i<12;i++)h.click('beatTap');assert.equal(h.run('state.game.tries'),5);h.advance(500);assert.ok(h.run('state.scores[0][0]')>=0&&h.run('state.scores[0][0]')<=100);});
test('ten correct stars finish and cannot earn additional hits',()=>{const h=harness();h.run("chooseGame('stars');startRound()");for(let i=0;i<15;i++){const active=h.ids.get('starGrid').children.find(e=>e.classes.has('active-star'));h.click('starGrid',active);}assert.equal(h.run('state.game.hits'),10);h.advance(400);assert.equal(h.run('state.scores[0][0]'),100);});
test('number ordering clears all three escalating levels',()=>{const h=harness();h.run("chooseGame('sort');startRound()");for(const count of [5,7,9]){for(let i=1;i<=count;i++)h.click('sortGrid',h.ids.get('sortGrid').children.find(e=>e.dataset.n===String(i)));h.advance(490);}h.advance(400);assert.equal(h.run('state.scores[0][0]'),100);});
test('memory playback completes all three increasing stages at every difficulty',()=>{for(const diff of ['easy','normal','hard']){const h=harness();h.run(`state.difficulty='${diff}';chooseGame('memory');startRound()`);const seq=h.run('Array.from({length:7},(()=>{const r=makeRng(state.gameSeed+137713);return()=>Math.floor(r()*4)})())');for(let stage=0;stage<3;stage++){h.advance(5000);const len=h.run('RULES[state.difficulty].sequence')+stage;for(const i of seq.slice(0,len))h.click('memoryGrid',h.ids.get('memoryGrid').children[i]);h.advance(700);}h.advance(600);assert.equal(h.run('state.scores[0][0]'),100);}});
test('color game accepts direct and reversed rules for all ten rounds',()=>{const h=harness();h.run("chooseGame('colors');startRound()");const names=['きいろ','ピンク','みずいろ','むらさき'];for(let i=0;i<10;i++){const prompt=h.ids.get('colorPrompt').innerHTML;const target=names.findIndex(n=>prompt.includes(n));const chosen=prompt.includes('以外')?(target+1)%4:target;h.click('colorOptions',h.ids.get('colorOptions').children.find(e=>e.dataset.c===String(chosen)));h.advance(375);}h.advance(450);assert.equal(h.run('state.scores[0][0]'),100);});
test('random mode selects distinct games and persists final results',()=>{const h=harness();h.run("state.count=6;startSession('quick')");assert.equal(h.run('new Set(state.sequence).size'),6);for(let i=0;i<6;i++){h.click('startRound');h.run('endRound()');h.click('nextRound');}assert.equal(JSON.parse(h.saved.get('pikopia_scores')).length,1);const loaded=harness(h.saved);loaded.run('displayRanking()');assert.match(loaded.ids.get('rankingList').innerHTML,/プレイヤー1/);});
test('two-player handover retains same seeded game layout and finishes',()=>{const h=harness();h.run("state.count=3;startSession('duo');state.sequence=['sort','beat','colors'];startRound()");const first=h.ids.get('sortGrid').children.map(e=>e.dataset.n);h.run('endRound()');h.click('nextRound');for(let i=0;i<2;i++){h.click('startRound');h.run('endRound()');h.click('nextRound');}assert.equal(h.run('state.player'),1);h.click('handoverBtn');h.click('startRound');assert.deepEqual(h.ids.get('sortGrid').children.map(e=>e.dataset.n),first);h.run('endRound()');h.click('nextRound');for(let i=0;i<2;i++){h.click('startRound');h.run('endRound()');h.click('nextRound');}assert.match(h.ids.get('roundInfo').textContent,/FINAL/);});
test('ranking uses score per game, including mixed game counts',()=>{const h=harness();h.run("saveScore({name:'A',score:80,count:1});saveScore({name:'B',score:350,count:5});saveScore({name:'C',score:270,count:3})");assert.deepEqual(JSON.parse(h.saved.get('pikopia_scores')).map(e=>e.name),['C','A','B']);});
test('quitting and backgrounding cancel delayed game callbacks',()=>{const h=harness();h.run("chooseGame('memory');startRound();stopGame()");h.advance(30000);assert.equal(h.run('state.live'),false);h.run("chooseGame('stars');startRound()");h.document.hidden=true;h.events.visibilitychange();assert.equal(h.run('state.live'),false);assert.ok(h.ids.get('startRound'));});
test('native resources match canonical source and optional online is disabled',()=>{for(const file of ['app.js','arcade.js','maze.js','friends.js','party-plus.js','index.html','style.css','arcade.css','maze.css','party-plus.css','sw.js'])assert.deepEqual(fs.readFileSync(path.join(root,'www',file)),fs.readFileSync(path.join(root,'ios-native/PIKOPIA/www',file)));assert.match(fs.readFileSync(path.join(root,'www/index.html'),'utf8'),/<button disabled aria-disabled="true" id="onlineBtn"/);});
test('second player name dialog accepts and cancels inside the web app',async()=>{
 const h=harness();let pending=h.run('askDuo()');let dialog=h.body.querySelector('dialog');assert.ok(dialog);dialog.returnValue='cancel';dialog.onclose();await pending;assert.equal(h.run('state.view'),'home');
 pending=h.run('askDuo()');dialog=h.body.querySelector('dialog');dialog.querySelector('input').value='テスター2';dialog.returnValue='ok';dialog.onclose();await pending;assert.equal(h.run('state.mode'),'duo');assert.equal(h.run('state.name2'),'テスター2');
});
test('ranking deletion dialog preserves cancellation and applies confirmation',async()=>{
 const h=harness(new Map([['pikopia_scores','[]']]));let pending=h.run("$('clearRanking').onclick()");let dialog=h.body.querySelector('dialog');dialog.returnValue='cancel';dialog.onclose();await pending;assert.equal(h.saved.has('pikopia_scores'),true);
 pending=h.run("$('clearRanking').onclick()");dialog=h.body.querySelector('dialog');dialog.returnValue='ok';dialog.onclose();await pending;assert.equal(h.saved.has('pikopia_scores'),false);
});

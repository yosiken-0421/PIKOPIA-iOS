/* PIKOPIA Arcade v0.2: original games, adaptive challenges and new controls. */
'use strict';
GAME_INFO.push(
{id:'balloon',name:'ふうせんファクトリー',emoji:'🎈',desc:'ふくらませて、ギリギリでストップ！',help:'5つの風船を目標の大きさに。割れる前に止めよう',bg:'#ffd4e6',scene:'linear-gradient(160deg,#ffe2ed,#b9b7ff)'},
{id:'rhythm',name:'リズム・スター',emoji:'🥁',desc:'光るボタンをリズムよく！',help:'音のタイミングで光るボタンをタップしてコンボ',bg:'#c9e4ff',scene:'linear-gradient(150deg,#404589,#9879c7)'},
{id:'balance',name:'まほうの天秤',emoji:'⚖️',desc:'2つ選んで同じ重さに！',help:'数字の宝石を2個選んで、目標の重さにそろえよう',bg:'#d4efb8',scene:'linear-gradient(150deg,#f3f9db,#bbdfbd)'}
);
const arcadeStatus=(label,score)=>{state.game.score=clamp(score,0,100);setStats(label);};
const arcadeHit=(msg,pitch=780)=>{tone(pitch,.10,'triangle');flash(msg);};
const ARCADE_PACE={easy:.78,normal:1,hard:1.25};
function mountBalloon(){
const scene=$('scene');
scene.innerHTML='<div class="arcade-title">🎈 ちょうどいい大きさでストップ</div><div class="balloon-zone"><div class="balloon-meter"><span class="balloon-target" id="bTarget"></span><span class="balloon-fill" id="bFill"></span></div><div class="balloon-face" id="bFace"><span id="bExpression">◕ᴗ◕</span></div><div class="balloon-size" id="bSize">0%</div></div><div class="arcade-controls"><button class="arcade-big" id="bPump">＋ ふくらませる</button><button class="arcade-big arcade-stop" id="bStop">ここでストップ！</button></div><div class="arcade-mini" id="bRound">1 / 5 ふうせん</div>';
let round=0,air=0,total=0,target=0,locked=false;
function draw(){if(!$('bTarget'))return;$('bTarget').style.left=(target-8)+'%';$('bTarget').style.width='16%';$('bFill').style.width=air+'%';$('bSize').textContent=air+'%';$('bExpression').textContent=air>95?'⊙﹏⊙':Math.abs(air-target)<=8?'◕▽◕':'◕ᴗ◕';$('bFace').style.transform='scale('+(0.65+air/200)+')';$('bRound').textContent=round+'/5 ふうせん ・ 目標 '+target+'%';}
function next(){if(!state.live)return;round++;if(round>5){schedule(endRound,350);return;}locked=false;air=0;target=65+gameRand(22);draw();}
function stop(burst=false){if(locked||!state.live)return;locked=true;const d=Math.abs(air-target),points=burst?0:d<=6?20:d<=13?15:d<=22?9:3;total+=points;arcadeStatus('風船 '+round+'/5 ・ +'+points+'点',total);arcadeHit(burst?'パンッ！':points===20?'ぴったり！':'ナイス！',burst?220:760);$('bPump').disabled=true;$('bStop').disabled=true;schedule(()=>{if(!state.live)return;$('bPump').disabled=false;$('bStop').disabled=false;next();},650);}
$('bPump').onclick=()=>{if(locked||!state.live)return;air+=7+gameRand(7);if(air>=100){air=100;draw();stop(true);return;}tone(360+air*3,.06);draw();};$('bStop').onclick=()=>stop();next();
}
function mountRhythm(){
const scene=$('scene'),symbol=['🌟','🌸','🌙','💎'];
scene.innerHTML='<div class="rhythm-header">光ったらタップ！ ✨<strong id="rhythmCombo">COMBO 0</strong></div><div class="rhythm-beat" id="rhythmBeat">♪</div><div class="rhythm-pads" id="rhythmPads">'+symbol.map((v,i)=>'<button class="rhythm-pad" data-r="'+i+'" aria-label="'+['星','花','月','宝石'][i]+'のパッド">'+v+'</button>').join('')+'</div><div class="rhythm-footer">タイミングを合わせて12音を演奏しよう</div>';
const seq=Array.from({length:12},()=>gameRand(4)),pads=[...$('rhythmPads').children],pace=.9/ARCADE_PACE[state.difficulty],first=1.1,windowSize=state.difficulty==='easy'?.38:state.difficulty==='hard'?.22:.28;
let step=0,combo=0,score=0;
function advance(){if(step>=12){schedule(endRound,600);return;}pads.forEach((p,i)=>p.classList.toggle('rhythm-now',i===seq[step]));}
state.game.tick=e=>{if(step>=12)return;const delta=e-(first+step*pace),active=Math.abs(delta)<windowSize;pads.forEach((p,i)=>p.classList.toggle('rhythm-ready',active&&i===seq[step]));$('rhythmBeat').textContent=active?'TAP!':'♪';if(delta>windowSize){combo=0;step++;$('rhythmCombo').textContent='COMBO 0';arcadeStatus('リズム '+step+'/12 ・ おしい！',score);tone(230,.06);advance();}};
$('rhythmPads').onclick=e=>{const b=e.target.closest('button');if(!b||!state.live||step>=12)return;const now=(performance.now()-state.started)/1000,delta=Math.abs(now-(first+step*pace));if(+b.dataset.r===seq[step]&&delta<=windowSize){combo++;score=Math.min(100,score+(delta<.12?9:7));tone([440,530,620,710][seq[step]],.14);flash(delta<.12?'PERFECT!':'GOOD!');step++;$('rhythmCombo').textContent='COMBO '+combo;arcadeStatus('リズム '+step+'/12',score);advance();}else{combo=0;score=Math.max(0,score-3);$('rhythmCombo').textContent='COMBO 0';tone(250,.07);flash('タイミングを合わせて！');}};
advance();
}
function mountBalance(){
const scene=$('scene');scene.innerHTML='<div class="balance-title">⚖️ 2つの宝石を選ぼう</div><div class="balance-target" id="balanceTarget"></div><div class="balance-slots" id="balanceSlots">？ ＋ ？</div><div class="balance-choices" id="balanceChoices"></div><button class="balance-reset" id="balanceReset">選び直す ↺</button><div class="balance-progress" id="balanceProgress"></div>';
let round=0,score=0,selected=[],values=[],goal=0,locked=false;
function draw(){if(!$('balanceTarget'))return;$('balanceTarget').textContent='目標 '+goal;$('balanceSlots').textContent=selected.map(i=>values[i]).join(' ＋ ')||'？ ＋ ？';$('balanceChoices').innerHTML=values.map((v,i)=>'<button class="balance-gem '+(selected.includes(i)?'chosen':'')+'" data-i="'+i+'" '+(selected.includes(i)?'disabled':'')+' aria-label="重さ'+v+'の宝石">💠<span>'+v+'</span></button>').join('');$('balanceProgress').textContent='問題 '+round+'/5';}
function next(){if(!state.live)return;round++;if(round>5){schedule(endRound,500);return;}locked=false;selected=[];const a=1+gameRand(5),b=1+gameRand(5);goal=a+b;values=gameShuffle([a,b,goal+1,Math.max(1,goal-3)]);draw();}
$('balanceChoices').onclick=e=>{const b=e.target.closest('button');if(!b||locked||!state.live)return;const i=+b.dataset.i;if(selected.includes(i))return;selected.push(i);tone(390+values[i]*38,.08);draw();if(selected.length===2){locked=true;const good=selected.reduce((s,j)=>s+values[j],0)===goal;score+=good?20:0;arcadeStatus('天秤 '+round+'/5 ・ '+(good?'+20点':'もう一度！'),score);arcadeHit(good?'大せいかい！':'ざんねん！',good?850:220);schedule(next,700);}};
$('balanceReset').onclick=()=>{if(locked||!state.live)return;selected=[];draw();};next();
}
/* Existing games now grow through escalating levels, combos and tactical choices. */
mountBeat=function(){
const scene=$('scene');scene.innerHTML='<div class="beat-track"></div><div class="beat-center"></div><div class="beat-orb" id="beatOrb">✦</div><div class="arcade-combo" id="beatCombo">0 COMBO</div><button class="beat-tap" id="beatTap">ジャスト！ ✨</button>';
let pos=0,combo=0;state.game.tick=e=>{pos=50+42*Math.sin(e*(2.8+state.game.tries*.48)*RULES[state.difficulty].pace);$('beatOrb').style.left=pos+'%';};
$('beatTap').onclick=()=>{if(!state.live)return;const d=Math.abs(pos-50),perfect=d<5,good=d<13;combo=good?combo+1:0;state.game.score+=(perfect?18:good?13:d<22?8:2)+(perfect?Math.min(5,combo*2):good?Math.min(5,combo):0);state.game.tries++;$('beatCombo').textContent=combo+' COMBO';arcadeHit(perfect?'PERFECT!':good?'GOOD!':'もう少し！',good?830:320);setStats('タップ '+state.game.tries+'/5');if(state.game.tries===5)schedule(endRound,450);};
};
mountStars=function(){
const scene=$('scene');scene.innerHTML='<div class="arcade-title">🌟 金色の星を追いかけよう（💥はタップしないで！）</div><div class="star-grid" id="starGrid"></div><div class="arcade-combo" id="starCombo">COMBO 0</div>';
let active=gameRand(16),hazard=(active+1+gameRand(15))%16,combo=0,age=0;const grid=$('starGrid');
for(let i=0;i<16;i++){const b=document.createElement('button');b.className='star-cell';b.dataset.i=i;b.setAttribute('aria-label','マス '+(i+1));grid.appendChild(b);}
function paint(){[...grid.children].forEach((b,i)=>{b.textContent=i===active?'⭐':i===hazard?'💥':'✧';b.classList.toggle('active-star',i===active);});}
function relocate(){const old=active;active=gameRand(15);if(active>=old)active++;hazard=(active+1+gameRand(15))%16;age=(performance.now()-state.started)/1000;paint();}
paint();state.game.tick=e=>{if(state.game.hits>=10)return;const duration=state.difficulty==='easy'?3:state.difficulty==='normal'?1.9:1.3;if(e-age>=duration){combo=0;$('starCombo').textContent='COMBO 0';relocate();}};
grid.onclick=e=>{const b=e.target.closest('button');if(!b||!state.live||state.game.hits>=10)return;const cell=+b.dataset.i;if(cell===active){state.game.hits++;combo++;state.game.score+=9+Math.min(5,Math.floor(combo/3));$('starCombo').textContent='COMBO '+combo;arcadeHit(combo>=3?'コンボ！':'きらっ！');setStats('星 '+state.game.hits+'/10');if(state.game.hits===10)schedule(endRound,400);else relocate();}else{combo=0;$('starCombo').textContent='COMBO 0';state.game.score=Math.max(0,state.game.score-(cell===hazard?8:3));tone(240,.07);flash(cell===hazard?'あぶない！':'おしい！');}};
};
mountMemory=function(){
const scene=$('scene');scene.innerHTML='<div class="memory-hint" id="memoryHint">光と音をおぼえよう</div><div class="memory-grid" id="memoryGrid"><button class="memory-pad" data-p="0" aria-label="黄"></button><button class="memory-pad" data-p="1" aria-label="桃"></button><button class="memory-pad" data-p="2" aria-label="水"></button><button class="memory-pad" data-p="3" aria-label="紫"></button></div><div class="arcade-mini" id="memoryStage">STAGE 1 / 3</div>';
const pads=[...$('memoryGrid').children],notes=[392,494,587,740],seq=Array.from({length:7},()=>gameRand(4));let stage=0,index=0,ready=false,mistakes=0,score=0;
function blink(i){pads[i].classList.add('lit');tone(notes[i],.20);schedule(()=>pads[i].classList.remove('lit'),310);}
function demonstrate(){ready=false;index=0;const len=RULES[state.difficulty].sequence+stage-1;$('memoryHint').textContent='よく見ておぼえよう…';$('memoryStage').textContent='STAGE '+stage+'/3';seq.slice(0,len).forEach((i,j)=>schedule(()=>blink(i),500+j*550));schedule(()=>{ready=true;$('memoryHint').textContent='順番通りにタップ！';},600+len*550);}
function next(){stage++;if(stage>3){schedule(endRound,500);return;}demonstrate();}
$('memoryGrid').onclick=e=>{const b=e.target.closest('button');if(!b||!state.live||!ready)return;const i=+b.dataset.p,len=RULES[state.difficulty].sequence+stage-1;blink(i);if(i===seq[index]){index++;if(index===len){score+=stage===3?40:30;arcadeStatus('ステージ '+stage+'/3 せいこう！',score);ready=false;arcadeHit('おぼえた！');schedule(next,650);}else setStats('順番 '+index+'/'+len);}else{mistakes++;index=0;score=Math.max(0,score-4);arcadeStatus('ミス '+mistakes+' 回 ・ もう一度',score);arcadeHit('もう一度！',240);if(mistakes>=4){ready=false;schedule(endRound,400);}else schedule(demonstrate,800);}};
next();
};
mountSort=function(){
const scene=$('scene');scene.innerHTML='<div class="arcade-title" id="sortGuide">すばやく順番に！</div><div class="sort-grid" id="sortGrid"></div><div class="arcade-mini" id="sortStage">STAGE 1/3</div>';
let stage=0,expected=1,mistakes=0,score=0,max=0;
function next(){stage++;if(stage>3){schedule(endRound,360);return;}expected=1;max=stage===1?5:stage===2?7:9;const nums=gameShuffle(Array.from({length:max},(_,i)=>i+1));$('sortGuide').textContent=stage===1?'1〜5 を順番に':stage===2?'1〜7 にチャレンジ！':'さいごは 1〜9！';$('sortStage').textContent='STAGE '+stage+'/3';$('sortGrid').innerHTML=nums.map(n=>'<button class="sort-cell" data-n="'+n+'">'+n+'</button>').join('');}
$('sortGrid').onclick=e=>{const b=e.target.closest('button');if(!b||!state.live||b.disabled)return;const n=+b.dataset.n;if(n!==expected){mistakes++;score=Math.max(0,score-3);b.classList.add('wrong');schedule(()=>b.classList.remove('wrong'),250);arcadeHit('つぎは '+expected+'！',250);setStats('ミス '+mistakes+' ・ つぎは '+expected);return;}b.disabled=true;b.classList.add('done');score+=100/21;expected++;tone(460+expected*30,.07);arcadeStatus('STAGE '+stage+'/3 ・ '+(expected-1)+'/'+max,score);if(expected>max){arcadeHit('ステージクリア！');schedule(next,480);}};next();
};
mountColors=function(){
const scene=$('scene'),cols=[{name:'きいろ',glyph:'☀️',color:'#ffe082'},{name:'ピンク',glyph:'🌸',color:'#ffaac1'},{name:'みずいろ',glyph:'💧',color:'#96dfff'},{name:'むらさき',glyph:'🔮',color:'#c1afff'}];
scene.innerHTML='<div class="color-prompt" id="colorPrompt"></div><div class="color-options" id="colorOptions"></div><div class="arcade-mini" id="colorsRule">ルールをよく読もう</div>';
let round=0,score=0,target=0,exclude=false,locked=false;
function next(){if(!state.live)return;round++;if(round>10){schedule(endRound,350);return;}target=gameRand(4);exclude=round>=4&&round%3===0;locked=false;$('colorPrompt').innerHTML=exclude?'<span>「'+cols[target].name+'」以外</span> をタップ！':'<span>「'+cols[target].name+'」</span> をタップ！';$('colorsRule').textContent=round+'/10 ・ '+(exclude?'ちがう色をえらぼう':'同じ色をえらぼう');$('colorOptions').innerHTML=gameShuffle([0,1,2,3]).map(i=>'<button class="color-orb" data-c="'+i+'" style="background:'+cols[i].color+'" aria-label="'+cols[i].name+'">'+cols[i].glyph+'<small>'+cols[i].name+'</small></button>').join('');}
$('colorOptions').onclick=e=>{const b=e.target.closest('button');if(!b||locked||!state.live)return;locked=true;const i=+b.dataset.c,good=exclude?i!==target:i===target;score=Math.max(0,score+(good?10:-3));arcadeStatus('ひかり '+round+'/10 ・ '+(good?'せいかい！':'おしい！'),score);arcadeHit(good?'ぴったり！':'もう一回！',good?770:220);schedule(next,360);};next();
};
mountDodge=function(){
const scene=$('scene');scene.innerHTML='<div class="dodge-sky"><div class="dodge-lane"></div><div class="dodge-lane"></div><div class="dodge-lane"></div></div><div class="dodge-player" id="dodgePlayer">🚀</div><div class="arcade-mini dodge-help">☄️ よける ／ ⭐ 取る</div>';
const controls=document.createElement('div');controls.className='dodge-controls';controls.innerHTML='<button id="dodgeLeft" aria-label="左へ">◀</button><button id="dodgeRight" aria-label="右へ">▶</button>';scene.after(controls);
const d={lane:1,items:[],next:0,hits:0,stars:0},player=$('dodgePlayer');function position(){player.style.left=d.lane*33.333+1.67+'%';}position();
function move(delta){if(!state.live)return;d.lane=clamp(d.lane+delta,0,2);position();tone(420,.05);}
const left=()=>move(-1),right=()=>move(1);$('dodgeLeft').onclick=left;$('dodgeRight').onclick=right;const key=e=>{if(e.key==='ArrowLeft'||e.key==='a')left();if(e.key==='ArrowRight'||e.key==='d')right();};window.addEventListener('keydown',key);state.cleanup=()=>{window.removeEventListener('keydown',key);controls.remove();};
function spawn(t){const star=gameRand(3)===0,lane=gameRand(3),item={star,lane,birth:t,done:false,el:document.createElement('div')};item.el.className='dodge-obstacle'+(star?' dodge-star':'');item.el.textContent=star?'⭐':'☄️';item.el.style.left=lane*33.333+1.67+'%';scene.appendChild(item.el);d.items.push(item);}
state.game.tick=e=>{if(e>=d.next){spawn(e);d.next=e+Math.max(.47,(1-e/state.duration*.28)/RULES[state.difficulty].pace);}const travel=2.3/RULES[state.difficulty].pace;for(const item of d.items){const p=(e-item.birth)/travel;item.el.style.top=(-20+p*115)+'%';if(!item.done&&p>.79){item.done=true;if(item.lane===d.lane){if(item.star){d.stars++;arcadeHit('スターゲット！',900);}else{d.hits++;arcadeHit('ぶつかった！',170);}}}if(p>1.1){item.el.remove();item.expired=true;}}d.items=d.items.filter(i=>!i.expired);arcadeStatus('⭐ '+d.stars+' ・ ☄️ '+d.hits,clamp(75*e/state.duration+8*d.stars-14*d.hits,0,100));};
};

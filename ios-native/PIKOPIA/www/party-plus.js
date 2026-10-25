/* PIKOPIA Party Plus 0.3.0 — original local progression and character powers.
 * Works offline. Never treats device records as a verified online ranking. */
(() => {
'use strict';
const CHARACTERS={
 piko:{name:'ピコ',power:'スターラッシュ',detail:'次の成功に +8点',icon:'✨'},
 mint:{name:'ミント',power:'まもりの翼',detail:'次の失点を最大12点防ぐ',icon:'🛡️'},
 moya:{name:'モヤ',power:'ときのまほう',detail:'残り時間を6秒のばす',icon:'⏳'}
};
const PARTNERS={beat:'piko',stars:'moya',memory:'moya',sort:'mint',colors:'piko',dodge:'mint',balloon:'moya',rhythm:'piko',balance:'mint',maze:'mint'};
const STORE='pikopia_party_v030';
const LIMIT=100000;
const safeNum=n=>Math.max(0,Math.min(LIMIT,Number.isFinite(Number(n))?Math.floor(Number(n)):0));
const dayKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const daySeed=day=>{let n=2166136261;for(const c of 'PIKOPIA-daily-'+day)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const goal=()=>state.difficulty==='easy'?45:state.difficulty==='hard'?75:60;
const read=()=>{try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}};
const write=value=>{try{localStorage.setItem(STORE,JSON.stringify(value));}catch{/* private mode */}};
let skill=null,challengeDay='';
function todayBest(data){return data.daily?.[dayKey()]?.[state.difficulty]||0;}
function renderBook(){
 const home=document.querySelector('.mode-stack');if(!home)return;
 let node=document.getElementById('partyBook');if(!node){node=document.createElement('section');node.id='partyBook';node.className='party-book';node.setAttribute('aria-label','スターコレクション');home.insertAdjacentElement('afterend',node);}
 const info=read(),stars=safeNum(info.stars),best=safeNum(todayBest(info));
 const title=stars>=40?'星空の達人':stars>=15?'きらめき名人':stars>=4?'星あつめ見習い':'はじめての冒険者';
 node.innerHTML='<div class="book-emblem">⭐</div><div><small>STAR COLLECTION</small><h3>冒険のきろく</h3><p>あつめた星 <strong>'+stars+'</strong> 個　・　'+title+'</p><p>今日のベスト（この難易度） <strong>'+(best?best+' / 500':'まだなし')+'</strong></p></div>';
}
function ensureDailyButton(){
 const home=document.querySelector('.mode-stack');if(!home||document.getElementById('dailyBtn'))return;
 const btn=document.createElement('button');btn.id='dailyBtn';btn.className='mode-card party-daily';
 btn.innerHTML='<span class="mode-glyph">🌠</span><span class="mode-text"><small>DAILY CHALLENGE</small><strong>本日のチャレンジ</strong><span>今日決まった5本で自己ベストを更新！</span></span><span class="chevron">↗</span>';
 btn.addEventListener('click',()=>startSession('daily'));home.appendChild(btn);
}
function missionIntro(){
 const el=document.querySelector('#playBody .game-intro');if(!el||el.querySelector('.party-mission'))return;
 const who=PARTNERS[currentInfo()?.id]||'piko',hero=CHARACTERS[who],mission=document.createElement('div');
 mission.className='party-mission';
 mission.innerHTML='<span>⭐ 今日の小さなミッション</span><strong>'+goal()+'点以上でスターを1個GET!</strong><small>'+hero.icon+' '+hero.name+'の能力：「'+hero.power+'」</small>';
 el.querySelector('#startRound')?.before(mission);
}
function abilityHud(){
 if(state.mode==='online'){skill=null;return;}
 const area=document.querySelector('#playBody .game-area');if(!area)return;
 const who=PARTNERS[currentInfo()?.id]||'piko',hero=CHARACTERS[who];
 skill={who,armed:false,used:false,last:0,bonus:0,protection:0};
 const bar=document.createElement('div');bar.className='party-ability';
 bar.innerHTML='<span class="friend-portrait friend-'+who+'" role="img" aria-label="'+hero.name+'"></span><div><b>'+hero.name+'の'+hero.power+'</b><small>'+hero.detail+'　・　1ゲーム1回</small></div><button id="partyAbility" type="button">つかう</button>';
 const stats=area.querySelector('.game-live-stats');if(stats)stats.after(bar);else area.appendChild(bar);
 const btn=bar.querySelector('button');
 btn.addEventListener('click',()=>{
   if(!state.live||!skill||skill.used||skill.armed)return;
   skill.last=clamp(Number(state.game.score)||0,0,100);
   skill.armed=true;btn.disabled=true;bar.classList.add('party-active');
   tone(810,.12,'triangle');
   if(who==='moya'){
     state.duration+=6;skill.used=true;skill.armed=false;btn.textContent='＋6秒！';
     flash('モヤのまほう！ ＋6秒');
   }else if(who==='piko'){btn.textContent='成功を待ってる…';flash('次の成功で＋8点！');}
   else{btn.textContent='ガード待機中';flash('失点をガード！');}
 });
}
function watchSkill(){
 if(!state.live||!skill||skill.who==='moya')return;
 const now=clamp(Number(state.game.score)||0,0,100),previous=skill.last;
 if(skill.armed&&!skill.used){
   const delta=now-previous;
   if(skill.who==='piko'&&delta>0){
     const actual=Math.min(8,100-now);state.game.score=now+actual;skill.bonus=actual;
     skill.used=true;skill.armed=false;
     flash('ピコのスターラッシュ！');tone(1040,.11);
   }else if(skill.who==='mint'&&delta<0){
     const restored=Math.min(12,-delta);state.game.score=now+restored;
     skill.protection=restored;skill.used=true;skill.armed=false;
     flash('ミントが守った！');tone(860,.12);
   }
 }
 skill.last=clamp(Number(state.game.score)||0,0,100);
 const button=document.getElementById('partyAbility');
 if(button&&skill.used&&skill.who!=='moya')button.textContent=skill.who==='piko'?'＋'+skill.bonus+'点！':'－'+skill.protection+'点ガード！';
}
function addMissionResult(points){
 if(state.mode==='online')return;
 const result=document.querySelector('#playBody .result-screen');
 if(!result||result.querySelector('.party-mission-result'))return;
 const cleared=points>=goal(),el=document.createElement('div');el.className='party-mission-result'+(cleared?' cleared':'');
 el.innerHTML='<strong>'+(cleared?'⭐ ミッションクリア！':'🌱 次はスターを目指そう！')+'</strong><small>目標 '+goal()+'点 ／ 今回 '+points+'点</small>';
 result.querySelector('#nextRound')?.before(el);
 if(cleared){const d=read();d.stars=safeNum(d.stars)+1;write(d);}
}
function duelBreakdown(){
 if(state.mode!=='duo')return;
 const result=document.querySelector('#playBody .result-screen');
 const scores=result?.querySelector('.result-scorelines');if(!scores)return;
 const a=state.scores[0],b=state.scores[1];
 const aw=a.filter((n,i)=>n>b[i]).length,bw=b.filter((n,i)=>n>a[i]).length,ties=a.length-aw-bw;
 const el=document.createElement('section');el.className='party-duel';
 el.innerHTML='<span>各ミニゲームの勝負</span><strong>'+aw+' 勝 － '+bw+' 勝</strong><small>引き分け '+ties+' ゲーム ・ '+escapeHtml(state.playerName)+' / '+escapeHtml(state.name2)+'</small>';
 scores.before(el);
 scores.querySelectorAll(':scope > div').forEach((row,i)=>{row.classList.add('party-round-score');if(a[i]>b[i])row.classList.add('party-a-wins');if(b[i]>a[i])row.classList.add('party-b-wins');});
}
function dailySummary(){
 if(state.mode!=='daily')return;
 const sum=state.scores[0].reduce((a,b)=>a+b,0),d=read(),date=challengeDay||dayKey(),level=state.difficulty;
 d.daily=d.daily&&typeof d.daily==='object'?d.daily:{};
 const previous=d.daily[date]?.[level]||0,better=sum>previous;
 d.daily[date]=d.daily[date]||{};d.daily[date][level]=Math.max(previous,sum);
 // Keep at most 14 dates so the offline record cannot grow without bound.
 const keys=Object.keys(d.daily).sort().reverse();keys.slice(14).forEach(key=>delete d.daily[key]);write(d);
 const result=document.querySelector('#playBody .result-screen');if(!result)return;
 const e=document.createElement('div');e.className='party-daily-summary';
 e.innerHTML='<strong>🌠 本日のチャレンジ</strong><span>'+(better?'自己ベスト更新！':'今日のベスト')+' '+d.daily[date][level]+' / 500点</span><small>'+date+' ・ '+({easy:'やさしい',normal:'ふつう',hard:'上級'}[level]||'ふつう')+' ・ 記録はこの端末だけに保存</small>';
 result.querySelector('#resultAgain')?.before(e);
}
const baseStart=startSession;
startSession=function(mode,specific=null,onlineRoom=null){
 skill=null;baseStart(mode,specific,onlineRoom);
 if(mode==='daily'){
   challengeDay=dayKey();
   const seed=daySeed(challengeDay);
   state.gameSeed=seed;
   state.sequence=seededShuffle(GAME_INFO.map(game=>game.id),seed).slice(0,5);
   state.round=0;drawIntro();
 }
};
const baseIntro=drawIntro;
drawIntro=function(){baseIntro();missionIntro();};
const baseRound=startRound;
startRound=function(){baseRound();abilityHud();};
const baseStats=setStats;
setStats=function(message){watchSkill();baseStats(message);};
const baseEnd=endRound;
endRound=function(){
 if(!state.live)return;
 watchSkill();
 const points=clamp(Math.round(Number(state.game.score)||0),0,100);
 baseEnd();
 addMissionResult(points);
 skill=null;
};
const baseFinish=finalResults;
finalResults=function(){baseFinish();duelBreakdown();dailySummary();renderBook();};
const baseShow=show;
show=function(view){baseShow(view);if(view==='home')renderBook();};
document.addEventListener('DOMContentLoaded',()=>{ensureDailyButton();renderBook();});
})();
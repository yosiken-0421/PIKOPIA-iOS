/* PIKOPIA friends: actual in-game character integration. */
(()=>{
'use strict';
const friendByGame={beat:'piko',stars:'moya',memory:'moya',sort:'mint',colors:'piko',dodge:'mint'};
const labels={piko:'ピコ',mint:'ミント',moya:'モヤ'};
const tips={beat:'真ん中でキャッチ！',stars:'星を集めてね！',memory:'順番を覚えてね♪',sort:'1から順番にタップ！',colors:'同じ色を選ぼう！',dodge:'ミントを動かして！'};
function face(who,cls=''){return '<span class="friend-portrait friend-'+who+' '+cls+'" role="img" aria-label="'+labels[who]+'"></span>';}
function id(){try{return currentInfo().id;}catch(e){return 'beat';}}
function cards(){
document.querySelectorAll('#gameGrid .game-card').forEach((card,i)=>{
if(card.dataset.friendsReady)return;
const who=['piko','moya','moya','mint','piko','mint'][i],art=card.querySelector('.game-art');
if(!art)return;
const glyph=art.querySelector('.game-emoji')?.textContent||'✨';
art.classList.add('game-art-friends');
art.innerHTML=face(who,'card-friend')+'<span class="game-medallion" aria-hidden="true">'+glyph+'</span><span class="game-friend-name">'+labels[who]+'と遊ぼう</span>';
card.dataset.friendsReady='1';
});
}
function home(){
const wrap=document.querySelector('.mascot-wrap');
if(!wrap||wrap.dataset.friendsReady)return;
wrap.innerHTML='<div class="hero-friends">'+face('piko','hero-piko')+face('mint','hero-mint')+face('moya','hero-moya')+'</div><span class="mascot-label">ピコたち ✨</span>';
wrap.dataset.friendsReady='1';
}
function play(){
const host=document.getElementById('playBody');if(!host)return;
const game=id(),who=friendByGame[game]||'piko';
const intro=host.querySelector('.game-intro .big-art');
if(intro&&!intro.dataset.friendsReady){
intro.innerHTML=host.querySelector('#handoverBtn')?'<div class="friend-pair">'+face('piko','intro-friend')+face('mint','intro-friend')+'</div>':face(who,'intro-friend')+'<span class="intro-glitter" aria-hidden="true">✦ ✧ ✦</span>';
intro.classList.add('big-art-friends');intro.dataset.friendsReady='1';
}
const scene=host.querySelector('.game-scene');
if(scene&&!scene.dataset.friendsReady){
scene.classList.add('scene-with-friends','scene-'+game);
const pal=document.createElement('div');pal.className='game-friend-companion';
pal.innerHTML=face(who,'playing-friend')+'<span class="friend-says">'+tips[game]+'</span>';scene.appendChild(pal);
if(game==='dodge'){const player=scene.querySelector('#dodgePlayer');if(player){player.innerHTML=face('mint','dodge-mint');player.classList.add('dodge-friend-player');}}
scene.dataset.friendsReady='1';
}
const result=host.querySelector('.result-screen .result-emoji');
if(result&&!result.dataset.friendsReady){
result.innerHTML='<div class="celebrate-friends">'+face('mint','celebrate-mint')+face('piko','celebrate-piko')+face('moya','celebrate-moya')+'</div><div class="celebrate-stars">✨ ⭐ ✨</div>';
result.classList.add('result-friends');result.dataset.friendsReady='1';
}
}
function init(){cards();home();play();const host=document.getElementById('playBody');if(host)new MutationObserver(play).observe(host,{childList:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
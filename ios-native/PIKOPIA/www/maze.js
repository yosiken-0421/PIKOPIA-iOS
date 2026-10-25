/* Star-path maze: original touch-and-swipe puzzle for PIKOPIA 0.2.0 */
'use strict';
GAME_INFO.push({id:'maze',name:'星あかりの迷路',emoji:'🧭',desc:'道を見つけて、光のゴールへ！',help:'指をスワイプ／矢印でミントをゴールに導こう',bg:'#c1f2dc',scene:'linear-gradient(155deg,#d0f8f5,#b1baf1)'});
function mountMaze(){
 const scene=$('scene');
 scene.innerHTML='<div class="maze-title" id="mazeTitle">星の道を探そう！</div><div class="maze-board" id="mazeBoard" role="group" aria-label="４かける４の迷路"></div><div class="maze-controls" id="mazeControls"><button data-dir="0" aria-label="上へ移動">▲</button><div><button data-dir="3" aria-label="左へ移動">◀</button><button data-dir="2" aria-label="下へ移動">▼</button><button data-dir="1" aria-label="右へ移動">▶</button></div></div><div class="maze-caption" id="mazeCaption">スワイプでも動けるよ</div>';
 const bits=[1,2,4,8],opp=[2,3,0,1],dx=[0,1,0,-1],dy=[-1,0,1,0],board=$('mazeBoard');
 let stage=0,score=0,position=0,steps=0,path=[],star=-1,starTaken=false,exits=[],locked=false;
 function build(){
  exits=Array(16).fill(0);const visited=new Set([0]),stack=[0];
  while(stack.length){const at=stack[stack.length-1],x=at%4,y=Math.floor(at/4),opts=[];
   for(let d=0;d<4;d++){const nx=x+dx[d],ny=y+dy[d],ni=ny*4+nx;if(nx>=0&&nx<4&&ny>=0&&ny<4&&!visited.has(ni))opts.push([d,ni]);}
   if(!opts.length){stack.pop();continue;}const [d,ni]=opts[gameRand(opts.length)];exits[at]|=bits[d];exits[ni]|=bits[opp[d]];visited.add(ni);stack.push(ni);
  }
  const from=Array(16).fill(-1),q=[0];from[0]=0;
  while(q.length){const at=q.shift();if(at===15)break;for(let d=0;d<4;d++){if(!(exits[at]&bits[d]))continue;const nx=at%4+dx[d],ny=Math.floor(at/4)+dy[d],ni=ny*4+nx;if(from[ni]===-1){from[ni]=at;q.push(ni);}}}
  path=[15];while(path[0]!==0)path.unshift(from[path[0]]);
  star=path[Math.max(1,Math.floor(path.length/2))];starTaken=false;
 }
 function render(){board.innerHTML=exits.map((mask,i)=>'<button class="maze-cell '+(i===position?'maze-current ':'')+(i===15?'maze-goal':'')+'" data-i="'+i+'" data-exits="'+mask+'" aria-label="'+(i===position?'ミントがいる場所':i===15?'ゴール':i===star&&!starTaken?'星がある道':'通路')+'" style="border-top:'+(mask&1?'2px solid transparent':'4px solid #7668b3')+';border-right:'+(mask&2?'2px solid transparent':'4px solid #7668b3')+';border-bottom:'+(mask&4?'2px solid transparent':'4px solid #7668b3')+';border-left:'+(mask&8?'2px solid transparent':'4px solid #7668b3')+'">'+(i===position?'🐰':i===15?'🏁':i===star&&!starTaken?'⭐':'·')+'</button>').join('');
  $('mazeTitle').textContent='迷路 '+stage+' / 2 ・ '+(starTaken?'⭐ゲット！':'⭐を拾ってゴールへ');
  $('mazeCaption').textContent=steps+'歩　｜　スワイプ・矢印で移動';
 }
 function newMaze(){if(!state.live)return;stage++;if(stage>2){schedule(endRound,550);return;}position=0;steps=0;locked=false;build();render();}
 function move(d){if(!state.live||locked||!Number.isInteger(d)||d<0||d>3)return;
  if(!(exits[position]&bits[d])){tone(210,.06);return;}position+=dy[d]*4+dx[d];steps++;tone(450+steps*9,.07,'triangle');
  if(position===star&&!starTaken){starTaken=true;flash('スター発見！');}
  if(position===15){locked=true;const extra=Math.max(0,steps-(path.length-1));const earned=Math.max(10,40+(starTaken?10:0)-Math.min(24,extra*2));score+=earned;state.game.score=clamp(score,0,100);setStats('迷路 '+stage+'/2 ・ +'+earned+'点');flash('ゴール！');render();schedule(newMaze,800);return;}render();setStats('迷路 '+stage+'/2 ・ '+steps+'歩');
 }
 $('mazeControls').onclick=e=>{const b=e.target.closest('button');if(b)move(Number(b.dataset.dir));};
 board.onclick=e=>{const b=e.target.closest('button');if(!b)return;const dest=Number(b.dataset.i);const d=[position-4,position+1,position+4,position-1].indexOf(dest);if(d>=0&&(d%2===0||Math.floor(position/4)===Math.floor(dest/4)))move(d);};
 let start=null;board.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
 board.addEventListener('pointerup',e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;start=null;if(Math.max(Math.abs(x),Math.abs(y))<22)return;move(Math.abs(x)>Math.abs(y)?x>0?1:3:y>0?2:0);});
 const key=e=>{const dict={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};if(dict[e.key]!==undefined){e.preventDefault();move(dict[e.key]);}};
 window.addEventListener('keydown',key);state.cleanup=()=>window.removeEventListener('keydown',key);newMaze();
}
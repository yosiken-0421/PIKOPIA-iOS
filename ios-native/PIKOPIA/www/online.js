// Firebase SDK 13.1.0: optional asynchronous invite-code score contest.
// This requires a user-owned Firebase project and corresponding Firestore security rules.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,updateDoc,onSnapshot,runTransaction} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
const cleanName = v => String(v||'プレイヤー').trim().slice(0,14)||'プレイヤー';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode=()=>Array.from({length:8},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
export async function createOnlineService(config){if(!config||!config.apiKey||!config.projectId||!config.appId)throw Error('Firebase config が不足しています');const app=initializeApp(config);const auth=getAuth(app);const u=await signInAnonymously(auth);const db=getFirestore(app);const uid=u.user.uid;
 async function createRoom({name,difficulty,count}){for(let attempt=0;attempt<4;attempt++){const code=makeCode(),ref=doc(db,'pikopia_rooms',code),existing=await getDoc(ref);if(existing.exists())continue;
 await setDoc(ref,{hostUid:uid,hostName:cleanName(name),guestUid:null,guestName:null,hostScore:-1,guestScore:-1,difficulty,count,seed:Math.floor(Math.random()*2000000000),createdAt:Date.now()});return {code};}throw Error('コード発行に失敗');}
 async function joinRoom(code,name){if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw Error('8文字の招待コードを入力してください');const ref=doc(db,'pikopia_rooms',code);await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw Error('部屋が見つかりません');const d=snap.data();if(d.guestUid||d.hostUid===uid)throw Error('参加済みの部屋です');tx.update(ref,{guestUid:uid,guestName:cleanName(name)});});return {code};}
 function observeRoom(code,cb){return onSnapshot(doc(db,'pikopia_rooms',code),s=>{if(s.exists())cb(s.data());},e=>{console.error('online room listener',e);});}
 async function submitScore(code,score){const ref=doc(db,'pikopia_rooms',code);const snap=await getDoc(ref);if(!snap.exists())throw Error('部屋なし');const d=snap.data();const key=d.hostUid===uid?'hostScore':d.guestUid===uid?'guestScore':null;if(!key)throw Error('この部屋の参加者ではありません');if(d[key]>=0)return;await updateDoc(ref,{[key]:Math.max(0,Math.min(d.count*100,Math.round(score)))});}
 return{uid,createRoom,joinRoom,observeRoom,submitScore};
}

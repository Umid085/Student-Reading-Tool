import { useState, useRef, useEffect } from "react";

var API        = "/.netlify/functions/generate";
var USERS_KEY    = "rq-users-v6";
var BOARDS_KEY   = "rq-boards-v6";
var SOCIAL_KEY   = "rq-social-v6";
var CREDS_KEY    = "rq-credentials";
var VOCAB_KEY    = "rq-vocab-v1";
var DAILY_KEY    = "rq-daily-v1";
var DAILY_LB_KEY = "rq-daily-lb-v1";

var LEVELS = [
  {key:"A1",color:"#22c55e",glow:"rgba(34,197,94,0.25)",  mult:1,  timeLimit:150,timeBonus:200,desc:"Elementary"},
  {key:"A2",color:"#16a34a",glow:"rgba(22,163,74,0.25)",  mult:1.5,timeLimit:150,timeBonus:200,desc:"Elementary+"},
  {key:"B1",color:"#f59e0b",glow:"rgba(245,158,11,0.25)", mult:2,  timeLimit:180,timeBonus:300,desc:"Intermediate"},
  {key:"B2",color:"#d97706",glow:"rgba(217,119,6,0.25)",  mult:2.5,timeLimit:180,timeBonus:300,desc:"Upper-Intermediate"},
  {key:"C1",color:"#6366f1",glow:"rgba(99,102,241,0.25)", mult:3,  timeLimit:210,timeBonus:400,desc:"Advanced"},
  {key:"C2",color:"#ec4899",glow:"rgba(236,72,153,0.25)", mult:4,  timeLimit:210,timeBonus:400,desc:"Mastery"}
];

var Q_LABELS = {mcq:"Multiple Choice",gap_word:"Gap Fill - Words",gap_sentence:"Gap Fill - Sentences",matching:"Matching",heading:"Match Headings",qa:"Open Answer",tfnm:"True/False/Not Mentioned",ynng:"Yes/No/Not Given"};
var Q_XP = {mcq:1,gap_word:1,gap_sentence:1,matching:3,heading:3,qa:2,tfnm:1,ynng:1};

// ── pure helpers ─────────────────────────────────────────────
function getLv(k){for(var i=0;i<LEVELS.length;i++){if(LEVELS[i].key===k)return LEVELS[i];}return LEVELS[0];}
function formatTime(s){if(s<=0)return"0:00";var m=Math.floor(s/60),sec=s%60;return m+":"+(sec<10?"0":"")+sec;}
function pctColor(p){return p>=80?"#22c55e":p>=60?"#f59e0b":"#ef4444";}
function enc(p){try{return btoa(p);}catch(e){return p;}}

function calcStreak(games) {
  if (!games||games.length===0) return 0;
  var dates=[];
  for(var i=0;i<games.length;i++){var d=games[i].date;if(dates.indexOf(d)===-1)dates.push(d);}
  dates.sort(function(a,b){return new Date(b)-new Date(a);});
  var today=new Date();today.setHours(0,0,0,0);
  var first=new Date(dates[0]);first.setHours(0,0,0,0);
  if(Math.round((today-first)/(864e5))>1)return 0;
  var streak=1;
  for(var j=1;j<dates.length;j++){
    var prev=new Date(dates[j-1]);prev.setHours(0,0,0,0);
    var curr=new Date(dates[j]);curr.setHours(0,0,0,0);
    if(Math.round((prev-curr)/(864e5))===1)streak++;
    else break;
  }
  return streak;
}

function getBestLevel(games){
  if(!games||!games.length)return"none";
  var lvOrder=["A1","A2","B1","B2","C1","C2"];
  return games.reduce(function(best,g){return lvOrder.indexOf(g.level)>lvOrder.indexOf(best)?g.level:best;},games[0].level);
}

function scoreQuestion(q,ans){
  if(q.type==="mcq"||q.type==="gap_word"||q.type==="gap_sentence"||q.type==="tfnm"||q.type==="ynng")return ans===q.answer?Q_XP[q.type]:0;
  if(q.type==="matching"){var s=0;for(var i=0;i<q.correctPairs.length;i++){if(ans&&ans[i]===q.correctPairs[i])s++;}return s;}
  if(q.type==="heading"){var h=0;for(var j=0;j<q.correctMap.length;j++){if(ans&&ans[j]===q.correctMap[j])h++;}return h;}
  if(q.type==="qa"){if(!ans||ans.trim().length<3)return 0;var lo=ans.toLowerCase(),hits=0;for(var k=0;k<q.keywords.length;k++){if(lo.includes(q.keywords[k].toLowerCase()))hits++;}return hits>=Math.ceil(q.keywords.length/2)?Q_XP.qa:0;}
  return 0;
}
function maxPoints(q){if(q.type==="matching")return q.lefts?q.lefts.length:3;if(q.type==="heading")return q.correctMap?q.correctMap.length:2;return Q_XP[q.type]||1;}

var BADGES=[
  {id:"first_steps",   name:"First Steps",      icon:"👣", desc:"Complete your first quiz"},
  {id:"story_starter", name:"Story Starter",     icon:"📖", desc:"Complete 5 quizzes"},
  {id:"reader",        name:"Reader",            icon:"📚", desc:"Complete 10 quizzes"},
  {id:"explorer",      name:"Explorer",          icon:"🗺️", desc:"Complete 25 quizzes"},
  {id:"bookworm",      name:"Bookworm",          icon:"🐛", desc:"Complete 50 quizzes"},
  {id:"quiz_master",   name:"Quiz Master",       icon:"🏆", desc:"Score 100% on a quiz"},
  {id:"speed_reader",  name:"Speed Reader",      icon:"⚡", desc:"Finish under half the time limit"},
  {id:"vocab_builder", name:"Vocab Builder",     icon:"✏️", desc:"Save 10 words to your notebook"},
  {id:"word_collector",name:"Word Collector",    icon:"📝", desc:"Save 50 words"},
  {id:"on_fire",       name:"On Fire",           icon:"🔥", desc:"Maintain a 3-day reading streak"},
  {id:"week_warrior",  name:"Week Warrior",      icon:"🌟", desc:"Maintain a 7-day reading streak"},
  {id:"daily_champ",   name:"Daily Champ",       icon:"📅", desc:"Complete a daily challenge"},
  {id:"high_scorer",   name:"High Scorer",       icon:"🎯", desc:"Earn 500+ XP in a single quiz"},
  {id:"all_types",     name:"Complete Player",   icon:"🎮", desc:"Use all 6 question types in one session"},
  {id:"level_5",       name:"Level Up",          icon:"⭐", desc:"Reach player level 5"},
];

function checkBadges(user,vocab,streak){
  var games=user&&user.games?user.games:[];
  var vocabCount=vocab?vocab.length:0;
  var e={};
  if(games.length>=1)e.first_steps=true;
  if(games.length>=5)e.story_starter=true;
  if(games.length>=10)e.reader=true;
  if(games.length>=25)e.explorer=true;
  if(games.length>=50)e.bookworm=true;
  if(games.some(function(g){return g.pct===100;}))e.quiz_master=true;
  if(games.some(function(g){return g.timeSecs<getLv(g.level).timeLimit/2;}))e.speed_reader=true;
  if(vocabCount>=10)e.vocab_builder=true;
  if(vocabCount>=50)e.word_collector=true;
  if(streak>=3)e.on_fire=true;
  if(streak>=7)e.week_warrior=true;
  if(games.some(function(g){return g.isDaily;}))e.daily_champ=true;
  if(games.some(function(g){return g.xp>=500;}))e.high_scorer=true;
  if(games.some(function(g){return g.typeStats&&Object.keys(g.typeStats).length>=6;}))e.all_types=true;
  var totalXp=games.reduce(function(s,g){return s+g.xp;},0);
  if(getUserLevel(totalXp)>=5)e.level_5=true;
  return e;
}

var LEVEL_THRESHOLDS=[0,1000,2500,4500,7000,10500,15000,21000,28000,36000,45000,55000,66000,78000,91000,105000,120000,136000,153000,171000,190000];
function getUserLevel(totalXp){
  for(var i=LEVEL_THRESHOLDS.length-1;i>=0;i--){
    if(totalXp>=LEVEL_THRESHOLDS[i])return i+1;
  }
  return 1;
}
function getLevelProgress(totalXp){
  var level=getUserLevel(totalXp);
  var current=LEVEL_THRESHOLDS[level-1]||0;
  var isMaxLevel=level>=LEVEL_THRESHOLDS.length;
  var next=isMaxLevel?current:LEVEL_THRESHOLDS[level];
  var progress=isMaxLevel?100:((totalXp-current)/(next-current))*100;
  return{level:level,current:current,next:next,xpNeeded:isMaxLevel?0:next-totalXp,progress:Math.min(100,Math.max(0,progress))};
}

// ── storage ──────────────────────────────────────────────────
async function apiGet(key){
  try{
    var r=await fetch("/.netlify/functions/storage?key="+encodeURIComponent(key));
    if(!r.ok)throw new Error("not ok");
    var d=await r.json();
    if(d.value){
      try{localStorage.setItem(key,d.value);}catch(e){}  // keep local cache in sync
      return JSON.parse(d.value);
    }
    return null;
  }catch(e){
    try{var v=localStorage.getItem(key);return v?JSON.parse(v):null;}catch(e2){return null;}
  }
}
async function apiSet(key,val){
  var str=JSON.stringify(val);
  try{localStorage.setItem(key,str);}catch(e){}  // always write locally first
  try{
    var r=await fetch("/.netlify/functions/storage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:key,value:str})});
    if(!r.ok)throw new Error("not ok");
  }catch(e){}  // local already saved, silent fail on remote
}
async function loadUsers(){var v=await apiGet(USERS_KEY);return v||[];}
async function saveUsers(u){await apiSet(USERS_KEY,u);}
async function loadBoards(){var v=await apiGet(BOARDS_KEY);return v||{};}
async function saveBoards(b){await apiSet(BOARDS_KEY,b);}
async function loadSocial(){var v=await apiGet(SOCIAL_KEY);return v||{};}
async function saveSocial(s){await apiSet(SOCIAL_KEY,s);}
async function loadVocab(){var v=await apiGet(VOCAB_KEY);return v||{};}
async function saveVocab(v){await apiSet(VOCAB_KEY,v);}
async function loadDaily(){var v=await apiGet(DAILY_KEY);return v||null;}
async function saveDaily(d){await apiSet(DAILY_KEY,d);}
async function loadDailyLb(){var v=await apiGet(DAILY_LB_KEY);return v||{};}
async function saveDailyLb(d){await apiSet(DAILY_LB_KEY,d);}

// ── social helpers ────────────────────────────────────────────
function getSocial(social,name){return social[name]||{friends:[],requests:[],likes:0,challenges:[]};}

function doSendRequest(social,from,to){
  var toData=getSocial(social,to);
  if(toData.friends.indexOf(from)!==-1)return{ok:false,err:"Already friends"};
  if(toData.requests.indexOf(from)!==-1)return{ok:false,err:"Request already sent"};
  var n=JSON.parse(JSON.stringify(social));
  if(!n[to])n[to]={friends:[],requests:[],likes:0,challenges:[]};
  n[to].requests.push(from);
  return{ok:true,social:n};
}

function doAcceptRequest(social,username,from){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[username])n[username]={friends:[],requests:[],likes:0,challenges:[]};
  if(!n[from])n[from]={friends:[],requests:[],likes:0,challenges:[]};
  n[username].requests=n[username].requests.filter(function(r){return r!==from;});
  if(n[username].friends.indexOf(from)===-1)n[username].friends.push(from);
  if(n[from].friends.indexOf(username)===-1)n[from].friends.push(username);
  return n;
}

function doDeclineRequest(social,username,from){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[username])return n;
  n[username].requests=n[username].requests.filter(function(r){return r!==from;});
  return n;
}

function doRemoveFriend(social,username,friend){
  var n=JSON.parse(JSON.stringify(social));
  if(n[username])n[username].friends=n[username].friends.filter(function(f){return f!==friend;});
  if(n[friend])n[friend].friends=n[friend].friends.filter(function(f){return f!==username;});
  return n;
}

function doLikeProfile(social,liker,target){
  var n=JSON.parse(JSON.stringify(social));
  if(!n._likes)n._likes={};
  var key=liker+"->"+target;
  if(n._likes[key])return{ok:false,social:n,err:"Already liked"};
  n._likes[key]=true;
  if(!n[target])n[target]={friends:[],requests:[],likes:0,challenges:[]};
  n[target].likes=(n[target].likes||0)+1;
  return{ok:true,social:n};
}

function hasLiked(social,liker,target){return!!(social._likes&&social._likes[liker+"->"+target]);}

function doSendChallenge(social,from,to,level,types){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[to])n[to]={friends:[],requests:[],likes:0,challenges:[]};
  if(!n[to].challenges)n[to].challenges=[];
  n[to].challenges.push({from:from,level:level,types:types,date:new Date().toLocaleDateString(),status:"pending"});
  return n;
}

function doRespondChallenge(social,username,idx,status){
  var n=JSON.parse(JSON.stringify(social));
  if(n[username]&&n[username].challenges&&n[username].challenges[idx]){
    n[username].challenges[idx].status=status;
  }
  return n;
}

// ── chart component ──────────────────────────────────────────
function GameChart(props){
  var games=props.games||[];
  if(!games.length)return<div style={{textAlign:"center",padding:20,color:"#6b7280"}}>No games to chart yet</div>;

  var w=320,h=200,pad=40;
  var maxXp=Math.max.apply(null,games.map(function(g){return g.xp;}));
  var scale=function(val,max,size){return(val/max)*(size-pad*2)+pad;};

  var points=games.map(function(g,i){
    var x=pad+(i/(games.length-1||1))*(w-pad*2);
    var y=h-scale(g.xp,maxXp,h);
    return{x:x,y:y,xp:g.xp,date:g.date};
  });

  var pathData="M "+points.map(function(p){return p.x+","+p.y;}).join(" L ");
  var minDate=games[0].date,maxDate=games[games.length-1].date;

  return(
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:14,padding:12,overflow:"auto"}}>
      <svg width="100%" height="250" viewBox={"0 0 "+w+" "+h} style={{minHeight:250}}>
        {/* grid lines */}
        {[0,1,2,3,4].map(function(i){
          var y=pad+(i/4)*(h-pad*2);
          return<line key={"grid-"+i} x1={pad} y1={y} x2={w-20} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>;
        })}

        {/* axes */}
        <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
        <line x1={pad} y1={h-pad} x2={w-20} y2={h-pad} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>

        {/* chart line */}
        <path d={pathData} stroke="#818cf8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

        {/* data points */}
        {points.map(function(p,i){
          return(
            <g key={"point-"+i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#818cf8" opacity="0.6"/>
              <circle cx={p.x} cy={p.y} r="5.5" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.3"/>
              <text x={p.x} y={p.y-12} textAnchor="middle" fontSize="11" fill="#a78bfa" fontWeight="700">{p.xp}</text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text x="12" y="20" fontSize="11" fill="#9ca3af" fontWeight="600">XP</text>

        {/* X axis labels */}
        <text x={pad} y={h-20} fontSize="10" fill="#6b7280" textAnchor="middle">{minDate}</text>
        <text x={w-25} y={h-20} fontSize="10" fill="#6b7280" textAnchor="end">{maxDate}</text>
      </svg>
    </div>
  );
}

// ── question components ───────────────────────────────────────
function McqQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {q.options.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":["A","B","C","D"][i]}
        </span>{opt}
      </button>);
    })}
  </div>);
}

function GapWordQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var parts=q.sentence?q.sentence.split("___"):["",""];
  return(<div>
    <div style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:14,color:"#e5e7eb",lineHeight:1.7}}>
      {parts[0]}<span style={{display:"inline-block",minWidth:70,borderBottom:"2px solid #818cf8",textAlign:"center",padding:"0 4px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8",fontWeight:700}}>{sel!==null?q.options[sel]:"_____"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
        if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
        return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:8,padding:"7px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit"}}>{opt}</button>);
      })}
    </div>
  </div>);
}

function GapSentQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var parts=q.paragraph?q.paragraph.split("___"):["",""];
  return(<div>
    <div style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#e5e7eb",lineHeight:1.8}}>
      {parts[0]}<span style={{display:"inline-block",background:conf?(sel===q.answer?"rgba(52,211,153,0.2)":"rgba(239,68,68,0.2)"):"rgba(99,102,241,0.15)",border:"1px dashed "+(conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8"),borderRadius:6,padding:"1px 6px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8",fontWeight:700,margin:"0 4px"}}>{sel!==null?q.options[sel]:"[ select ]"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.04)",bd="1px solid rgba(255,255,255,0.1)",col="#9ca3af";
        if(conf){if(isOk){bg="rgba(52,211,153,0.1)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.15)";bd="1px solid #818cf8";col="#c7d2fe";}
        return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:8,padding:"9px 10px",color:col,fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
          <span style={{color:"#6366f1",fontWeight:700,marginRight:6}}>{["A","B","C","D"][i]}.</span>{opt}
        </button>);
      })}
    </div>
  </div>);
}

function MatchingQ(props){
  var q=props.q,matches=props.matches,conf=props.conf,onMatch=props.onMatch,shuffled=props.shuffled;
  var [activeLeft,setActiveLeft]=useState(null);
  function clickLeft(i){if(conf)return;setActiveLeft(i===activeLeft?null:i);}
  function clickRight(ri){if(conf||activeLeft===null)return;onMatch(activeLeft,ri);setActiveLeft(null);}
  return(<div>
    <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Tap a left item then tap its match on the right.</p>
    <div style={{display:"flex",gap:8}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {q.lefts.map(function(l,i){
          var matched=matches&&matches[i]!==undefined;
          var ok=conf&&matched&&matches[i]===q.correctPairs[i];
          var bad=conf&&matched&&matches[i]!==q.correctPairs[i];
          return(<button key={i} onClick={function(){clickLeft(i);}} style={{background:activeLeft===i?"rgba(99,102,241,0.3)":matched?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft===i?"#818cf8":ok?"#34d399":bad?"#ef4444":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:ok?"#34d399":bad?"#ef4444":activeLeft===i?"#c7d2fe":"#e5e7eb",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {l}{matched&&<span style={{float:"right",opacity:0.5,fontSize:9}}>{q.rights[matches[i]]}</span>}
          </button>);
        })}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {shuffled.map(function(r,ri){
          var origIdx=q.rights?q.rights.indexOf(r):ri;var used=matches&&Object.values(matches).indexOf(origIdx)!==-1;
          return(<button key={ri} onClick={function(){clickRight(ri);}} style={{background:used?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft!==null&&!conf?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:used?"#6b7280":"#e5e7eb",fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {r}
          </button>);
        })}
      </div>
    </div>
    {conf&&(<div style={{marginTop:8,fontSize:11,color:"#d1fae5"}}>
      {q.lefts.map(function(l,i){var ok=matches&&matches[i]===q.correctPairs[i];return<div key={i}>{ok?"✓":"✕"} {l} = {q.rights[q.correctPairs[i]]}</div>;})}
    </div>)}
  </div>);
}

function HeadingQ(props){
  var q=props.q,userMap=props.userMap,conf=props.conf,onMatch=props.onMatch;
  return(<div>
    <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Match each paragraph to the correct heading.</p>
    {q.paragraphs.map(function(para,pi){
      var selHead=userMap&&userMap[pi]!==undefined?userMap[pi]:null;
      return(<div key={pi} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:10,marginBottom:8}}>
        <p style={{fontSize:12,color:"#d1d5db",lineHeight:1.7,marginBottom:6}}>{para}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {q.headings.map(function(h,hi){
            var isSel=selHead===hi;
            var ok=conf&&hi===q.correctMap[pi];
            var bad=conf&&isSel&&hi!==q.correctMap[pi];
            var bg="rgba(255,255,255,0.04)",bd="1px solid rgba(255,255,255,0.1)",col="#9ca3af";
            if(ok){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}
            else if(bad){bg="rgba(239,68,68,0.1)";bd="1px solid #ef4444";col="#ef4444";}
            else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
            return(<button key={hi} onClick={function(){if(!conf)onMatch(pi,hi);}} style={{background:bg,border:bd,borderRadius:6,padding:"4px 9px",color:col,fontSize:11,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit"}}>{h}</button>);
          })}
        </div>
      </div>);
    })}
  </div>);
}

function QAQ(props){
  var q=props.q,val=props.val,conf=props.conf,onChange=props.onChange;
  var scored=conf?scoreQuestion(q,val):null;
  return(<div>
    <textarea disabled={conf} value={val||""} onChange={function(e){if(!conf)onChange(e.target.value);}} placeholder="Write your answer here..." style={{width:"100%",minHeight:80,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:13,padding:"9px 11px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
    {conf&&(<div style={{marginTop:6,padding:"8px 10px",borderRadius:8,background:scored?"rgba(52,211,153,0.1)":"rgba(239,68,68,0.1)",border:"1px solid "+(scored?"#34d399":"#ef4444"),fontSize:12,color:"#d1fae5"}}>
      {scored?"Good! ":"Improve: "}{q.explanation}<div style={{marginTop:3,color:"#9ca3af",fontSize:11}}>Key: {q.keywords.join(", ")}</div>
    </div>)}
  </div>);
}

function TfnmQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var opts=["True","False","Not Mentioned"];
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {opts.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":"●"}
        </span>{opt}
      </button>);
    })}
  </div>);
}

function YnngQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var opts=["Yes","No","Not Given"];
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {opts.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":"●"}
        </span>{opt}
      </button>);
    })}
  </div>);
}

// ── Timer ────────────────────────────────────────────────────
function Timer(props){
  var [secs,setSecs]=useState(props.limit);
  var iv=useRef(null);
  useEffect(function(){setSecs(props.limit);},[props.limit]);
  useEffect(function(){
    if(!props.running){clearInterval(iv.current);return;}
    iv.current=setInterval(function(){setSecs(function(s){if(s<=1){clearInterval(iv.current);props.onExpire();return 0;}return s-1;});},1000);
    return function(){clearInterval(iv.current);};
  },[props.running]);
  var p=props.limit>0?secs/props.limit:0;
  var col=p>0.5?"#22c55e":p>0.25?"#f59e0b":"#ef4444";
  return(<div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid "+col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0}}>{formatTime(secs)}</div>
    <div style={{flex:1}}>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:999,height:7,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:999,width:(p*100)+"%",background:col,transition:"width 1s linear"}}/>
      </div>
    </div>
  </div>);
}

// ── Main App ─────────────────────────────────────────────────
export default function App(){
  // auth
  var [nameInput,setNameInput]=useState("");
  var [passInput,setPassInput]=useState("");
  var [authMode,setAuthMode]=useState("register");
  var [authErr,setAuthErr]=useState("");
  var [currentUser,setCurrentUser]=useState(null);
  var [allUsers,setAllUsers]=useState([]);
  var [boards,setBoards]=useState({});
  var [social,setSocial]=useState({});
  var [appReady,setAppReady]=useState(false);
  // game
  var [level,setLevel]=useState("");
  var [selectedTypes,setSelectedTypes]=useState(["mcq","gap_word","gap_sentence","matching","heading","qa"]);
  var [passage,setPassage]=useState("");
  var [topic,setTopic]=useState("");
  var [questions,setQuestions]=useState([]);
  var [shuffledRights,setShuffledRights]=useState([]);
  var [current,setCurrent]=useState(0);
  var [userAnswers,setUserAnswers]=useState({});
  var [matchState,setMatchState]=useState({});
  var [headingState,setHeadingState]=useState({});
  var [confirmed,setConfirmed]=useState(false);
  var [streak,setStreak]=useState(0);
  var [totalXpSoFar,setTotalXpSoFar]=useState(0);
  var [showPassage,setShowPassage]=useState(false);
  var [timerRunning,setTimerRunning]=useState(false);
  var startTimeRef=useRef(null);
  var [timeExpired,setTimeExpired]=useState(false);
  var [result,setResult]=useState(null);
  // ui
  var [stage,setStage]=useState("auth");
  var [loadMsg,setLoadMsg]=useState("");
  var [lbLevel,setLbLevel]=useState("A1");
  var [error,setError]=useState("");
  // social ui
  var [searchQuery,setSearchQuery]=useState("");
  var [friendStage,setFriendStage]=useState("search"); // search|requests|list
  var [viewingUser,setViewingUser]=useState(null); // username string for friend profile
  var [challengeTarget,setChallengeTarget]=useState(null);
  var [challengeLevel,setChallengeLevel]=useState("B1");
  var [challengeTypes,setChallengeTypes]=useState(["mcq","qa"]);
  var [socialMsg,setSocialMsg]=useState("");
  // history
  var [historyLevel,setHistoryLevel]=useState("");
  // vocab notebook
  var [vocab,setVocab]=useState([]);
  var [allVocab,setAllVocab]=useState({});
  var [savedWords,setSavedWords]=useState(new Set());
  var [vocabCard,setVocabCard]=useState(0);
  var [vocabFlipped,setVocabFlipped]=useState(false);
  var [vocabFilter,setVocabFilter]=useState("all");
  // daily challenge
  var [dailyChallenge,setDailyChallenge]=useState(null);
  var [dailyDone,setDailyDone]=useState(null);
  var [dailyLb,setDailyLb]=useState([]);
  var [isDailyGame,setIsDailyGame]=useState(false);
  var [dailyLoading,setDailyLoading]=useState(false);
  // reading screen enhancements
  var [focusMode,setFocusMode]=useState(false);
  var [readingTimerSecs,setReadingTimerSecs]=useState(0);
  var readingTimerRef=useRef(null);
  var [isSpeaking,setIsSpeaking]=useState(false);
  var [selectedWord,setSelectedWord]=useState(null);
  var [wordDef,setWordDef]=useState(null);
  var [wordDefLoading,setWordDefLoading]=useState(false);

  useEffect(function(){
    var saved=localStorage.getItem("rq-session");
    var savedCreds=null;
    try{savedCreds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e){}
    Promise.all([loadUsers(),loadBoards(),loadSocial()]).then(function(v){
      setAllUsers(v[0]);setBoards(v[1]);setSocial(v[2]);
      if(saved){var found=null;for(var i=0;i<v[0].length;i++){if(v[0][i].name===saved){found=v[0][i];break;}}if(found){setCurrentUser(found);setStage("home");}}
      else if(savedCreds&&savedCreds.name&&savedCreds.hash){var found2=null;for(var j=0;j<v[0].length;j++){if(v[0][j].name===savedCreds.name&&v[0][j].hash===savedCreds.hash){found2=v[0][j];break;}}if(found2){setCurrentUser(found2);setStage("home");}}
      setAppReady(true);
    });
  },[]);

  // reading screen timer + TTS cleanup
  useEffect(function(){
    if(stage==="reading"){
      setReadingTimerSecs(0);setSelectedWord(null);setWordDef(null);
      readingTimerRef.current=setInterval(function(){setReadingTimerSecs(function(s){return s+1;});},1000);
    } else {
      if(readingTimerRef.current){clearInterval(readingTimerRef.current);readingTimerRef.current=null;}
      if(window.speechSynthesis){window.speechSynthesis.cancel();}
      setIsSpeaking(false);
    }
    return function(){if(readingTimerRef.current){clearInterval(readingTimerRef.current);readingTimerRef.current=null;}};
  },[stage]);

  // load vocab + daily challenge when user logs in
  useEffect(function(){
    if(!currentUser)return;
    var today=new Date().toLocaleDateString();
    loadVocab().then(function(v){setAllVocab(v||{});setVocab((v&&v[currentUser.name])||[]);});
    loadDaily().then(function(d){if(d&&d.date===today)setDailyChallenge(d);});
    var doneRaw=null;try{doneRaw=JSON.parse(localStorage.getItem("rq-daily-done-"+currentUser.name));}catch(e){}
    setDailyDone(doneRaw&&doneRaw.date===today?doneRaw:null);
    loadDailyLb().then(function(lb){setDailyLb((lb&&lb[today])||[]);});
  },[currentUser]);

  // always pull fresh users when entering friends page or typing a search
  useEffect(function(){
    if(stage==="friends"&&currentUser){
      loadUsers().then(function(u){setAllUsers(u);});
    }
  },[stage]);
  useEffect(function(){
    if(stage==="friends"&&currentUser&&searchQuery.trim().length>=2){
      loadUsers().then(function(u){setAllUsers(u);});
    }
  },[searchQuery]);

  var lv=getLv(level);
  var q=questions&&questions.length>current?questions[current]:null;

  // ── auth ──────────────────────────────────────────────────
  async function doRegister(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr("Name and password required.");return;}
    if(passInput.length<4){setAuthErr("Password must be at least 4 characters.");return;}
    var fresh=await loadUsers();setAllUsers(fresh);
    for(var i=0;i<fresh.length;i++){if(fresh[i].name.toLowerCase()===nameInput.trim().toLowerCase()){setAuthErr("Username taken.");return;}}
    var user={name:nameInput.trim(),hash:enc(passInput),games:[],joined:new Date().toLocaleDateString()};
    var nu=fresh.concat([user]);
    await saveUsers(nu);
    localStorage.setItem("rq-session",user.name);
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:user.name,hash:user.hash}));
    setAllUsers(nu);setCurrentUser(user);setStage("home");
  }

  async function doLogin(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr("Please enter name and password.");return;}
    var fresh=await loadUsers();setAllUsers(fresh);
    var found=null;
    for(var i=0;i<fresh.length;i++){if(fresh[i].name.toLowerCase()===nameInput.trim().toLowerCase()){found=fresh[i];break;}}
    if(!found){setAuthErr("User not found. Please register first.");return;}
    if(found.hash!==enc(passInput)){setAuthErr("Wrong password.");return;}
    localStorage.setItem("rq-session",found.name);
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:found.name,hash:found.hash}));
    setCurrentUser(found);setStage("home");
  }

  // ── social actions ─────────────────────────────────────────
  async function sendRequest(to){
    if(!currentUser||to===currentUser.name)return;
    var r=doSendRequest(social,currentUser.name,to);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg("Request sent to "+to+"!");
  }

  async function acceptRequest(from){
    var n=doAcceptRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg("You and "+from+" are now friends!");
  }

  async function declineRequest(from){
    var n=doDeclineRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg("Request declined.");
  }

  async function removeFriend(friend){
    var n=doRemoveFriend(social,currentUser.name,friend);
    await saveSocial(n);setSocial(n);setSocialMsg(friend+" removed from friends.");
  }

  async function likeProfile(target){
    if(!currentUser||target===currentUser.name)return;
    var r=doLikeProfile(social,currentUser.name,target);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg("Liked "+target+"'s profile!");
  }

  async function sendChallenge(){
    if(!challengeTarget||!currentUser)return;
    var n=doSendChallenge(social,currentUser.name,challengeTarget,challengeLevel,challengeTypes);
    await saveSocial(n);setSocial(n);
    setSocialMsg("Challenge sent to "+challengeTarget+"!");
    setChallengeTarget(null);
  }

  async function respondChallenge(idx,status,challenge){
    var n=doRespondChallenge(social,currentUser.name,idx,status);
    await saveSocial(n);setSocial(n);
    if(status==="accepted"&&challenge){
      setLevel(challenge.level);
      setSelectedTypes(challenge.types||["mcq","qa"]);
      setSocialMsg("");
      setStage("home");
    }
  }

  // ── search ─────────────────────────────────────────────────
  function getSearchResults(){
    if(!searchQuery||searchQuery.trim().length<2)return[];
    if(!allUsers||!Array.isArray(allUsers))return[];
    var q2=searchQuery.trim().toLowerCase();
    return allUsers.filter(function(u){return u.name!==currentUser.name&&u.name.toLowerCase().indexOf(q2)!==-1;});
  }

  // ── vocab ─────────────────────────────────────────────────
  function toggleWord(word){
    setSavedWords(function(s){var n=new Set(s);if(n.has(word))n.delete(word);else n.add(word);return n;});
  }

  function speakPassage(){
    if(!window.speechSynthesis)return;
    if(isSpeaking){window.speechSynthesis.cancel();setIsSpeaking(false);return;}
    var utt=new SpeechSynthesisUtterance(passage);
    utt.onend=function(){setIsSpeaking(false);};
    utt.onerror=function(){setIsSpeaking(false);};
    window.speechSynthesis.speak(utt);
    setIsSpeaking(true);
  }

  async function lookupWord(word){
    if(selectedWord===word){setSelectedWord(null);setWordDef(null);return;}
    setSelectedWord(word);setWordDef(null);setWordDefLoading(true);
    try{
      var r=await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+encodeURIComponent(word));
      if(!r.ok)throw new Error("not found");
      var data=await r.json();
      var entry=data[0];
      var phonetic=entry.phonetic||(entry.phonetics&&entry.phonetics[0]&&entry.phonetics[0].text)||"";
      var audio=(entry.phonetics&&entry.phonetics.find(function(p){return p.audio;})||{}).audio||"";
      var meaning=entry.meanings&&entry.meanings[0]&&entry.meanings[0].definitions&&entry.meanings[0].definitions[0];
      setWordDef({phonetic:phonetic,audio:audio,def:meaning?meaning.definition:"",example:meaning&&meaning.example?meaning.example:""});
    }catch(e){
      setWordDef({phonetic:"",audio:"",def:"No definition found for this word.",example:""});
    }
    setWordDefLoading(false);
  }

  // ── game ──────────────────────────────────────────────────
  function shuffleArr(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  async function generate(){
    if(!level){setError("Pick a level first!");return;}
    if(selectedTypes.length===0){setError("Select at least one question type.");return;}
    setError("");setStage("loading");
    var msgs=["Picking a topic...","Writing your passage...","Crafting questions...","Almost ready..."];
    var mi=0;setLoadMsg(msgs[0]);
    var iv=setInterval(function(){mi=(mi+1)%msgs.length;setLoadMsg(msgs[mi]);},1600);
    try{
      var lvObj=getLv(level);
      var typeDescs={mcq:"mcq - 4-option multiple choice",gap_word:"gap_word - sentence with blank, pick word",gap_sentence:"gap_sentence - paragraph with blank, pick sentence",matching:"matching - match 3 lefts to 3 rights (correctPairs:[0,1,2])",heading:"heading - match 2 headings to 2 paragraphs (correctMap:[0,1])",qa:"qa - open answer with keywords",tfnm:"tfnm - True/False/Not Mentioned statement (answer: 0=True, 1=False, 2=Not Mentioned)",ynng:"ynng - Yes/No/Not Given question (answer: 0=Yes, 1=No, 2=Not Given)"};
      var typeExamples={mcq:'{"type":"mcq","q":"?","options":["A","B","C","D"],"answer":0,"explanation":"Why."}',gap_word:'{"type":"gap_word","sentence":"The ___ rose.","options":["w1","w2","w3","w4"],"answer":1,"explanation":"Why."}',gap_sentence:'{"type":"gap_sentence","paragraph":"Start. ___ End.","options":["S1.","S2.","S3.","S4."],"answer":2,"explanation":"Why."}',matching:'{"type":"matching","instruction":"Match.","lefts":["T1","T2","T3"],"rights":["D1","D2","D3"],"correctPairs":[0,1,2],"explanation":"Why."}',heading:'{"type":"heading","instruction":"Match headings.","paragraphs":["P1...","P2..."],"headings":["H A","H B","H C"],"correctMap":[0,1],"explanation":"Why."}',qa:'{"type":"qa","q":"Explain X.","keywords":["k1","k2","k3"],"explanation":"Should mention..."}',tfnm:'{"type":"tfnm","q":"Statement from passage.","answer":0,"explanation":"Why true/false/not mentioned."}',ynng:'{"type":"ynng","q":"Question about passage?","answer":1,"explanation":"Why yes/no/not given."}'};
      var typeList="",exList="";
      for(var ti=0;ti<selectedTypes.length;ti++){typeList+=(ti+1)+". "+typeDescs[selectedTypes[ti]]+"\n";exList+="    "+typeExamples[selectedTypes[ti]]+(ti<selectedTypes.length-1?",":"")+"\\n";}
      var passInstr={A1:"80-100 words, basic vocabulary, daily life",A2:"110-130 words, everyday vocabulary, travel/hobbies",B1:"140-160 words, moderate vocabulary, tech/environment",B2:"170-190 words, varied vocabulary, nuanced argument",C1:"200-220 words, sophisticated vocabulary, philosophy/politics",C2:"230-260 words, advanced academic vocabulary, abstract topic"};
      var pt="You are an expert language teacher. Level: "+level+".\nPassage: "+(passInstr[level]||passInstr["B1"])+".\nPick a RANDOM varied topic.\n\nCreate EXACTLY "+selectedTypes.length+" question(s):\n"+typeList+"\nReturn ONLY valid JSON:\n{\"topic\":\"Short\",\"passage\":\"Full text\",\"questions\":[\n"+exList+"]}\n\ncorrectPairs: index=left position, value=right index (0-based)\ncorrectMap: index=paragraph, value=heading index (0-based)\nAll questions based on passage. Level "+level+" appropriate.";
      var res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,messages:[{role:"user",content:pt}]})});
      var data=await res.json();
      var raw="";if(data.content){for(var i=0;i<data.content.length;i++){if(data.content[i].text)raw+=data.content[i].text;}}
      var json=JSON.parse(raw.replace(/```json/g,"").replace(/```/g,"").trim());
      setPassage(json.passage);setTopic(json.topic||"Reading");setQuestions(json.questions);
      var mq=null;for(var j=0;j<json.questions.length;j++){if(json.questions[j].type==="matching"){mq=json.questions[j];break;}}
      setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights):[]);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
      setStage("reading");
    }catch(e){console.log("generate err",e);setError("Generation failed - please try again.");setStage("home");}
    clearInterval(iv);
  }

  function startQuiz(){
    if(window.speechSynthesis){window.speechSynthesis.cancel();setIsSpeaking(false);}
    setFocusMode(false);setSelectedWord(null);setWordDef(null);
    if(currentUser&&savedWords.size>0){
      var today=new Date().toLocaleDateString();
      var newEntries=[];
      savedWords.forEach(function(w){if(!vocab.some(function(v){return v.word===w;}))newEntries.push({word:w,level:level,topic:topic,date:today,status:"new"});});
      if(newEntries.length>0){
        var nv=vocab.concat(newEntries);
        var nAll={};for(var k in allVocab)nAll[k]=allVocab[k];nAll[currentUser.name]=nv;
        setVocab(nv);setAllVocab(nAll);saveVocab(nAll);
      }
    }
    startTimeRef.current=Date.now();setTimerRunning(true);setStage("quiz");
  }
  function handleExpire(){setTimerRunning(false);setTimeExpired(true);doFinish();}

  function getCurrentAnswer(){if(!q)return null;if(q.type==="matching")return matchState;if(q.type==="heading")return headingState;return userAnswers[current]!==undefined?userAnswers[current]:null;}

  function canConfirm(){
    if(!q||timeExpired)return false;
    if(q.type==="mcq"||q.type==="gap_word"||q.type==="gap_sentence"||q.type==="tfnm"||q.type==="ynng")return userAnswers[current]!==undefined;
    if(q.type==="matching")return Object.keys(matchState).length===q.lefts.length;
    if(q.type==="heading")return Object.keys(headingState).length===q.paragraphs.length;
    if(q.type==="qa")return userAnswers[current]&&userAnswers[current].trim().length>=3;
    return false;
  }

  function doConfirm(){
    if(!canConfirm())return;
    var ans=getCurrentAnswer(),pts=scoreQuestion(q,ans),mxp=maxPoints(q);
    var isGood=pts>=Math.ceil(mxp/2),ns=isGood?streak+1:0;
    setStreak(ns);
    setTotalXpSoFar(function(x){return x+Math.round(pts*(lv?lv.mult:1)*100)+(ns>=3?50:0);});
    setConfirmed(true);
  }

  function doNext(){
    if(current+1>=questions.length){setTimerRunning(false);doFinish();}
    else{setCurrent(function(c){return c+1;});setConfirmed(false);}
  }

  async function doFinish(){
    var timeSecs=startTimeRef.current?Math.round((Date.now()-startTimeRef.current)/1000):(lv?lv.timeLimit:180);
    var totalEarned=0,totalMax=0,ansArr=[],typeStats={};
    for(var i=0;i<questions.length;i++){
      var qs=questions[i],ans=null;
      if(qs.type==="matching")ans=matchState;
      else if(qs.type==="heading")ans=headingState;
      else ans=userAnswers[i]!==undefined?userAnswers[i]:null;
      var pts=scoreQuestion(qs,ans),mx=maxPoints(qs);
      ansArr.push(pts>=Math.ceil(mx/2));
      totalEarned+=pts;totalMax+=mx;
      if(!typeStats[qs.type])typeStats[qs.type]={earned:0,max:0};
      typeStats[qs.type].earned+=pts;typeStats[qs.type].max+=mx;
    }
    var pct=totalMax>0?Math.round((totalEarned/totalMax)*100):0;
    var stars=pct>=90?5:pct>=75?4:pct>=60?3:pct>=40?2:1;
    var lvObj=lv||LEVELS[0];
    var tb=Math.round(lvObj.timeBonus*Math.max(0,(lvObj.timeLimit-timeSecs)/lvObj.timeLimit));
    var finalXp=Math.round(totalEarned*lvObj.mult*100)+tb+(streak>=3?50:0);
    var today=new Date().toLocaleDateString();

    var badgesBefore=checkBadges(currentUser,vocab,calcStreak(currentUser.games));
    var gameEntry={level:lvObj.key,score:totalEarned,total:totalMax,xp:finalXp,pct:pct,timeSecs:timeSecs,timeBonus:tb,topic:topic,date:today,typeStats:typeStats,isDaily:isDailyGame||false};
    var updatedUser={name:currentUser.name,hash:currentUser.hash,games:currentUser.games.concat([gameEntry]),joined:currentUser.joined};
    var newUsers=[];for(var j=0;j<allUsers.length;j++){newUsers.push(allUsers[j].name===currentUser.name?updatedUser:allUsers[j]);}
    await saveUsers(newUsers);setAllUsers(newUsers);setCurrentUser(updatedUser);
    var newStreakVal=calcStreak(updatedUser.games);
    var badgesAfter=checkBadges(updatedUser,vocab,newStreakVal);
    var newBadgeIds=BADGES.filter(function(b){return badgesAfter[b.id]&&!badgesBefore[b.id];}).map(function(b){return b.id;});

    var lbEntry={name:currentUser.name,xp:finalXp,score:totalEarned,total:totalMax,pct:pct,timeSecs:timeSecs,topic:topic,date:today};
    var nb={};for(var k in boards){nb[k]=boards[k];}
    var cur=nb[lvObj.key]||[];var filtered=cur.filter(function(e){return e.name!==currentUser.name;});var merged=filtered.concat([lbEntry]);merged.sort(function(a,b){return b.xp-a.xp;});nb[lvObj.key]=merged.slice(0,20);
    await saveBoards(nb);setBoards(nb);

    var wasDaily=isDailyGame;
    if(isDailyGame&&currentUser){
      var done={date:today,xp:finalXp,pct:pct,timeSecs:timeSecs};
      localStorage.setItem("rq-daily-done-"+currentUser.name,JSON.stringify(done));
      setDailyDone(done);
      var dlb=await loadDailyLb();
      var todayDlb=(dlb&&dlb[today])||[];
      var dfiltered=todayDlb.filter(function(e){return e.name!==currentUser.name;});
      var dEntry={name:currentUser.name,xp:finalXp,pct:pct,timeSecs:timeSecs};
      var dmerged=dfiltered.concat([dEntry]);dmerged.sort(function(a,b){return b.xp-a.xp;});
      var ndlb={};for(var dk in dlb)ndlb[dk]=dlb[dk];ndlb[today]=dmerged;
      saveDailyLb(ndlb);setDailyLb(dmerged);
      setIsDailyGame(false);
    }

    var rank=0;for(var r=0;r<nb[lvObj.key].length;r++){if(nb[lvObj.key][r].name===currentUser.name&&nb[lvObj.key][r].xp===finalXp&&nb[lvObj.key][r].date===today){rank=r;break;}}
    setResult({xp:finalXp,score:totalEarned,maxScore:totalMax,pct:pct,stars:stars,timeBonus:tb,timeSecs:timeSecs,rank:rank,answers:ansArr,typeStats:typeStats,wasDaily:wasDaily,newBadges:newBadgeIds});
    setStage("result");
  }

  function doRestart(){
    setLevel("");setPassage("");setTopic("");setQuestions([]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);
    setResult(null);setTimerRunning(false);setTimeExpired(false);setError("");
    setIsDailyGame(false);setSavedWords(new Set());
    setFocusMode(false);setSelectedWord(null);setWordDef(null);setReadingTimerSecs(0);
    setStage("home");
  }

  async function startDailyChallenge(){
    var today=new Date().toLocaleDateString();
    var dc=dailyChallenge;
    if(dc&&dc.date===today){
      var mq2=null;for(var j2=0;j2<dc.questions.length;j2++){if(dc.questions[j2].type==="matching"){mq2=dc.questions[j2];break;}}
      setLevel(dc.level||"B1");setPassage(dc.passage);setTopic(dc.topic);setQuestions(dc.questions);
      setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights):[]);
      setSelectedTypes(dc.questions.map(function(q){return q.type;}).filter(function(t,i,a){return a.indexOf(t)===i;}));
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());
      setIsDailyGame(true);setStage("reading");return;
    }
    setError("");setStage("loading");setDailyLoading(true);
    var dMsgs=["Picking today's topic...","Writing the passage...","Crafting questions...","Almost ready..."];
    var dMi=0;setLoadMsg(dMsgs[0]);
    var dIv=setInterval(function(){dMi=(dMi+1)%dMsgs.length;setLoadMsg(dMsgs[dMi]);},1600);
    try{
      var dTypes=["mcq","gap_word","gap_sentence","matching","heading","qa"];
      var dTypeDescs={mcq:"mcq - 4-option multiple choice",gap_word:"gap_word - sentence with blank, pick word",gap_sentence:"gap_sentence - paragraph with blank, pick sentence",matching:"matching - match 3 lefts to 3 rights (correctPairs:[0,1,2])",heading:"heading - match 2 headings to 2 paragraphs (correctMap:[0,1])",qa:"qa - open answer with keywords"};
      var dTypeEx={mcq:'{"type":"mcq","q":"?","options":["A","B","C","D"],"answer":0,"explanation":"Why."}',gap_word:'{"type":"gap_word","sentence":"The ___ rose.","options":["w1","w2","w3","w4"],"answer":1,"explanation":"Why."}',gap_sentence:'{"type":"gap_sentence","paragraph":"Start. ___ End.","options":["S1.","S2.","S3.","S4."],"answer":2,"explanation":"Why."}',matching:'{"type":"matching","instruction":"Match.","lefts":["T1","T2","T3"],"rights":["D1","D2","D3"],"correctPairs":[0,1,2],"explanation":"Why."}',heading:'{"type":"heading","instruction":"Match headings.","paragraphs":["P1...","P2..."],"headings":["H A","H B","H C"],"correctMap":[0,1],"explanation":"Why."}',qa:'{"type":"qa","q":"Explain X.","keywords":["k1","k2","k3"],"explanation":"Should mention..."}'};
      var dTL="",dEL="";for(var dti=0;dti<dTypes.length;dti++){dTL+=(dti+1)+". "+dTypeDescs[dTypes[dti]]+"\n";dEL+="    "+dTypeEx[dTypes[dti]]+(dti<dTypes.length-1?",":"")+"\\n";}
      var dPt="You are an expert language teacher. Level: B1.\nPassage: 140-160 words, moderate vocabulary, interesting topic for "+today+".\nPick a RANDOM varied topic.\n\nCreate EXACTLY "+dTypes.length+" question(s):\n"+dTL+"\nReturn ONLY valid JSON:\n{\"topic\":\"Short\",\"passage\":\"Full text\",\"questions\":[\n"+dEL+"]}\n\ncorrectPairs: index=left position, value=right index (0-based)\ncorrectMap: index=paragraph, value=heading index (0-based)\nAll questions based on passage. Level B1 appropriate.";
      var dRes=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,messages:[{role:"user",content:dPt}]})});
      var dData=await dRes.json();
      var dRaw="";if(dData.content){for(var di=0;di<dData.content.length;di++){if(dData.content[di].text)dRaw+=dData.content[di].text;}}
      var dJson=JSON.parse(dRaw.replace(/```json/g,"").replace(/```/g,"").trim());
      var newDc={date:today,level:"B1",passage:dJson.passage,topic:dJson.topic||"Daily Reading",questions:dJson.questions};
      await saveDaily(newDc);setDailyChallenge(newDc);
      var mq3=null;for(var j3=0;j3<dJson.questions.length;j3++){if(dJson.questions[j3].type==="matching"){mq3=dJson.questions[j3];break;}}
      setLevel("B1");setPassage(dJson.passage);setTopic(dJson.topic||"Daily Reading");setQuestions(dJson.questions);
      setShuffledRights(mq3&&mq3.rights?shuffleArr(mq3.rights):[]);
      setSelectedTypes(dTypes);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());
      setIsDailyGame(true);setStage("reading");
    }catch(e){console.log("daily err",e);setError("Daily challenge failed - please try again.");setStage("home");}
    clearInterval(dIv);setDailyLoading(false);
  }

  // ── style helpers ─────────────────────────────────────────
  var BG="linear-gradient(160deg,#0d0d1a 0%,#111827 55%,#0d1f12 100%)";
  var CARD={background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:20};
  var GHOST={background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"#9ca3af",borderRadius:10,padding:"9px 16px",fontFamily:"inherit",fontSize:14,cursor:"pointer",fontWeight:600};
  var INP={width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,color:"#f3f4f6",fontSize:16,padding:"13px 15px",outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  function mkBtn(bg,fg){return{background:bg,color:fg||"#fff",border:"none",borderRadius:12,padding:"13px 22px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"};}
  function pill(bg,col){return{background:bg,color:col||"#fff",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700};}

  if(!appReady)return<div style={{minHeight:"100vh",background:"#0d0d1a",display:"flex",alignItems:"center",justifyContent:"center",color:"#34d399",fontFamily:"sans-serif"}}>Loading...</div>;

  // ── current user's social data ─────────────────────────────
  var myData=currentUser?getSocial(social,currentUser.name):{friends:[],requests:[],likes:0,challenges:[]};
  myData=myData||{friends:[],requests:[],likes:0,challenges:[]};
  myData.friends=myData.friends||[];
  myData.requests=myData.requests||[];
  var myStreak=currentUser?calcStreak(currentUser.games):0;
  var myBestLevel=currentUser?getBestLevel(currentUser.games):"none";
  var pendingChallenges=(myData.challenges||[]).filter(function(c){return c.status==="pending";});

  return(
    <>
    <style>{`
      @keyframes rqFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-22px)}}
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{margin:0;padding:0;overflow-x:hidden}
      .rq-orb{position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;animation:rqFloat var(--dur,12s) ease-in-out infinite;z-index:0}
      .rq-card-3d{transition:transform 0.22s ease,box-shadow 0.22s ease}
      .rq-card-3d:hover{transform:translateY(-3px) scale(1.015);box-shadow:0 16px 48px rgba(0,0,0,0.55)}
      .rq-lb-row{cursor:pointer;transition:background 0.15s,transform 0.15s}
      .rq-lb-row:hover{background:rgba(255,255,255,0.07)!important;transform:translateX(3px)}
      .rq-wrap{width:100%;padding:16px 16px 64px}
      .rq-home-hdr{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;padding-top:8px;margin-bottom:14px}
      .rq-home-nav{display:flex;gap:6px;flex-shrink:0}
      .rq-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}
      @media(max-width:400px){.rq-home-nav button{padding:7px 10px!important;font-size:12px!important}}
      @media(min-width:480px){.rq-wrap{max-width:480px;margin:0 auto;padding:18px 20px 64px}}
      @media(min-width:640px){.rq-wrap{max-width:660px;padding:22px 28px 72px}.rq-lvgrid{grid-template-columns:repeat(3,1fr)!important}}
      @media(min-width:1024px){.rq-wrap{max-width:860px;padding:30px 52px 90px}}
      @media(min-width:1440px){.rq-wrap{max-width:1040px;padding:36px 80px 100px}}
    `}</style>
    <div style={{minHeight:"100vh",background:BG,fontFamily:"'Trebuchet MS',sans-serif",color:"#f3f4f6",overflow:"hidden"}}>
      <div className="rq-orb" style={{width:520,height:520,background:"rgba(99,102,241,0.11)",top:"-18%",left:"-13%","--dur":"13s"}}/>
      <div className="rq-orb" style={{width:380,height:380,background:"rgba(52,211,153,0.08)",top:"38%",right:"-10%","--dur":"17s",animationDelay:"4s"}}/>
      <div className="rq-orb" style={{width:300,height:300,background:"rgba(236,72,153,0.07)",bottom:"4%",left:"8%","--dur":"21s",animationDelay:"9s"}}/>
      <div className="rq-wrap" style={{position:"relative",zIndex:1}}>

        {/* ── AUTH ──────────────────────────────────────────── */}
        {stage==="auth"&&(
          <div style={{paddingTop:46,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:8}}>📖</div>
            <h1 style={{fontSize:32,fontWeight:900,color:"#34d399",margin:"0 0 6px"}}>Reading Quest</h1>
            <p style={{color:"#6b7280",marginBottom:26,fontSize:15}}>6 question types · Friends · Compete</p>
            <div style={CARD}>
              <div style={{display:"flex",gap:4,marginBottom:18,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:4}}>
                {["register","login"].map(function(m){return<button key={m} onClick={function(){setAuthMode(m);setAuthErr("");}} style={{flex:1,padding:"10px 0",border:"none",borderRadius:8,fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer",background:authMode===m?"#34d399":"transparent",color:authMode===m?"#0d0d1a":"#6b7280"}}>{m==="login"?"Log In":"Register"}</button>;})}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input style={INP} placeholder="Username" value={nameInput} onChange={function(e){setNameInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
                <input style={INP} type="password" placeholder="Password (min 4 chars)" value={passInput} onChange={function(e){setPassInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
              </div>
              {authErr&&<p style={{color:"#f87171",fontSize:14,marginTop:10}}>{authErr}</p>}
              <button onClick={authMode==="login"?doLogin:doRegister} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:14}}>{authMode==="login"?"Log In":"Create Account"}</button>
            </div>
          </div>
        )}

        {/* ── HOME ──────────────────────────────────────────── */}
        {stage==="home"&&(
          <div>
            <div className="rq-home-hdr">
              <div>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#34d399"}}>Hey, {currentUser?currentUser.name:""}!</h2>
                <div className="rq-pills">
                  <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥 {myStreak} day streak</span>
                  <span style={pill("rgba(167,139,250,0.15)","#a78bfa")}>Friends: {myData.friends.length}</span>
                  {myData.likes>0&&<span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes: {myData.likes}</span>}
                  {pendingChallenges.length>0&&<span style={pill("rgba(239,68,68,0.2)","#f87171")}>!{pendingChallenges.length} challenge</span>}
                </div>
              </div>
              <div className="rq-home-nav">
                <button onClick={function(){setStage("friends");}} style={GHOST}>Friends</button>
                <button onClick={function(){setVocabCard(0);setVocabFlipped(false);setVocabFilter("all");setStage("vocab");}} style={GHOST}>Vocab</button>
                <button onClick={function(){setHistoryLevel("");setStage("history");}} style={GHOST}>History</button>
                <button onClick={function(){setStage("profile");}} style={GHOST}>Profile</button>
                <button onClick={function(){setLbLevel("A1");setStage("leaderboard");}} style={GHOST}>Board</button>
              </div>
            </div>

            {/* pending challenges */}
            {pendingChallenges.length>0&&(
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(239,68,68,0.3)"}}>
                <p style={{fontSize:11,color:"#f87171",fontWeight:700,marginBottom:8}}>GAME CHALLENGES</p>
                {pendingChallenges.map(function(c,idx){
                  var realIdx=myData.challenges.indexOf(c);
                  return(<div key={idx} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:12,color:"#f3f4f6",flex:1}}><strong>{c.from}</strong> challenged you to <strong>{c.level}</strong></span>
                    <button onClick={function(){respondChallenge(realIdx,"accepted",c);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"5px 10px",fontSize:11}}>Accept</button>
                    <button onClick={function(){respondChallenge(realIdx,"declined",null);}} style={{...mkBtn("#374151"),padding:"5px 10px",fontSize:11}}>Decline</button>
                  </div>);
                })}
              </div>
            )}

            {/* daily challenge card */}
            {currentUser&&(function(){
              var today=new Date().toLocaleDateString();
              var done=dailyDone&&dailyDone.date===today;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:done?"rgba(251,191,36,0.3)":"rgba(6,182,212,0.3)",background:done?"rgba(251,191,36,0.05)":"rgba(6,182,212,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <p style={{fontSize:11,color:done?"#fbbf24":"#06b6d4",fontWeight:700,letterSpacing:0.6,margin:"0 0 2px"}}>TODAY'S DAILY CHALLENGE</p>
                      <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{done?"Completed! "+dailyDone.xp+" XP · "+dailyDone.pct+"%":dailyChallenge&&dailyChallenge.date===today?dailyChallenge.topic+" (B1)":"B1 · All question types"}</p>
                    </div>
                    <button onClick={done?function(){setStage("dailyleaderboard");}:startDailyChallenge} disabled={dailyLoading} style={{...mkBtn(done?"#fbbf24":"#06b6d4","#0d0d1a"),padding:"9px 16px",fontSize:13,flexShrink:0}}>{dailyLoading?"Loading...":done?"Leaderboard":"Play"}</button>
                  </div>
                </div>
              );
            })()}

            {/* question type selector */}
            <div style={{...CARD,marginBottom:12,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.6,margin:0}}>QUESTION TYPES (min 1)</p>
                <span style={{fontSize:10,color:"#6b7280"}}>{selectedTypes.length} selected</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.keys(Q_LABELS).map(function(t){
                  var active=selectedTypes.indexOf(t)!==-1;
                  function toggle(){setSelectedTypes(function(prev){var isAct=prev.indexOf(t)!==-1;if(isAct&&prev.length===1)return prev;if(isAct)return prev.filter(function(x){return x!==t;});return prev.concat([t]);});}
                  return(<button key={t} onClick={toggle} style={{background:active?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(active?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 11px",fontSize:11,color:active?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400}}>{active?"✓ ":""}{Q_LABELS[t]}</button>);
                })}
              </div>
            </div>

            {/* level selector */}
            <p style={{fontWeight:700,color:"#d1fae5",fontSize:11,letterSpacing:0.8,marginBottom:8}}>CHOOSE LEVEL</p>
            <div className="rq-lvgrid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {LEVELS.map(function(l){
                var active=level===l.key;
                return(<button key={l.key} className="rq-card-3d" onClick={function(){setLevel(l.key);setError("");}} style={{background:active?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.03)",border:"2px solid "+(active?l.color:"rgba(255,255,255,0.08)"),borderRadius:14,padding:"12px 13px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:active?"0 0 14px "+l.glow:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:15,fontWeight:900,color:active?l.color:"#f3f4f6"}}>{l.key}</span>
                    <span style={{background:active?l.color:"rgba(255,255,255,0.06)",color:active?"#0d0d1a":"#6b7280",borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:700}}>x{l.mult}</span>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{l.desc}</div>
                  <div style={{fontSize:10,color:"#4b5563",marginTop:2}}>{formatTime(l.timeLimit)} limit</div>
                </button>);
              })}
            </div>
            {error&&<p style={{color:"#f87171",fontSize:13,marginBottom:10}}>{error}</p>}
            <button onClick={generate} disabled={!level} style={{...mkBtn(level?lv.color:"#374151",level?"#0d0d1a":"#6b7280"),width:"100%",fontSize:15}}>{level?"Start "+level+" Quest!":"Select a level to begin"}</button>
          </div>
        )}

        {/* ── LOADING ───────────────────────────────────────── */}
        {stage==="loading"&&(
          <div style={{textAlign:"center",paddingTop:90}}>
            <div style={{fontSize:44,marginBottom:14}}>...</div>
            <h3 style={{color:lv?lv.color:"#34d399",fontWeight:800,fontSize:17,marginBottom:8}}>{loadMsg}</h3>
            <p style={{color:"#6b7280",fontSize:13}}>Creating {selectedTypes.length} question type(s) for {level}...</p>
          </div>
        )}

        {/* ── READING ───────────────────────────────────────── */}
        {stage==="reading"&&(function(){
          var wordCount=passage.split(/\s+/).length;
          var estSecs=Math.max(30,Math.round(wordCount/3));
          var readPct=Math.min(100,Math.round((readingTimerSecs/estSecs)*100));
          function WordTokens(){
            return passage.split(/(\s+)/).map(function(token,i){
              if(/^\s+$/.test(token))return<span key={i}>{token}</span>;
              var word=token.replace(/[^a-zA-Z'-]/g,"").toLowerCase();
              if(!word)return<span key={i}>{token}</span>;
              var saved=savedWords.has(word),isSelected=selectedWord===word;
              return<span key={i} onClick={function(){lookupWord(word);}} style={{cursor:"pointer",borderRadius:3,background:isSelected?"rgba(251,191,36,0.25)":saved?"rgba(6,182,212,0.2)":"transparent",color:isSelected?"#fbbf24":saved?"#06b6d4":"inherit",padding:"0 2px",transition:"background 0.12s",textDecoration:isSelected?"underline":"none",textDecorationColor:"#fbbf24"}}>{token}</span>;
            });
          }

          if(focusMode)return(
            <div>
              <button onClick={function(){setFocusMode(false);}} style={{position:"fixed",top:14,right:14,background:"rgba(13,13,26,0.85)",border:"1px solid rgba(255,255,255,0.15)",color:"#9ca3af",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontFamily:"inherit",zIndex:100,backdropFilter:"blur(8px)"}}>✕ Exit Focus</button>
              <div style={{paddingTop:10,paddingBottom:80}}>
                <h2 style={{margin:"0 0 18px",fontSize:20,fontWeight:900,color:"#f9fafb"}}>{topic}</h2>
                <p style={{lineHeight:2.1,fontSize:18,color:"#e5e7eb",margin:0,letterSpacing:0.2}}><WordTokens/></p>
                {selectedWord&&(
                  <div style={{...CARD,marginTop:16,background:"rgba(251,191,36,0.08)",borderColor:"rgba(251,191,36,0.3)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:17,fontWeight:900,color:"#fbbf24"}}>{selectedWord}</span>
                      <div style={{display:"flex",gap:6}}>
                        {wordDef&&wordDef.audio&&<button onClick={function(){new Audio(wordDef.audio).play().catch(function(){});}} style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",borderRadius:7,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔊</button>}
                        <button onClick={function(){toggleWord(selectedWord);}} style={{background:savedWords.has(selectedWord)?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:savedWords.has(selectedWord)?"#06b6d4":"#9ca3af",borderRadius:7,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{savedWords.has(selectedWord)?"⭐ Saved":"⭐ Save"}</button>
                        <button onClick={function(){setSelectedWord(null);setWordDef(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
                      </div>
                    </div>
                    {wordDefLoading&&<p style={{fontSize:13,color:"#6b7280",margin:0}}>Looking up...</p>}
                    {wordDef&&!wordDefLoading&&<><p style={{fontSize:13,color:"#d1d5db",margin:0,lineHeight:1.6}}>{wordDef.def}</p>{wordDef.example&&<p style={{fontSize:12,color:"#6b7280",margin:"4px 0 0",fontStyle:"italic"}}>"{wordDef.example}"</p>}</>}
                  </div>
                )}
              </div>
              <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(13,13,26,0.95)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"12px 20px",display:"flex",gap:10,alignItems:"center",zIndex:99,backdropFilter:"blur(10px)"}}>
                <span style={{fontSize:13,color:"#6b7280",minWidth:50}}>⏱ {formatTime(readingTimerSecs)}</span>
                <button onClick={speakPassage} style={{background:isSpeaking?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.06)",border:"1px solid "+(isSpeaking?"#818cf8":"rgba(255,255,255,0.1)"),color:isSpeaking?"#818cf8":"#9ca3af",borderRadius:8,padding:"7px 13px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{isSpeaking?"⏹ Stop":"🔊 Listen"}</button>
                {savedWords.size>0&&<span style={{fontSize:12,color:"#06b6d4",fontWeight:700}}>⭐ {savedWords.size}</span>}
                <button onClick={startQuiz} style={{...mkBtn(lv?lv.color:"#34d399","#0d0d1a"),marginLeft:"auto",padding:"10px 20px",fontSize:14}}>Begin Quiz →</button>
              </div>
            </div>
          );

          return(
            <div>
              {/* header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingTop:6}}>
                <span style={{...pill(lv?lv.color:"#34d399","#0d0d1a"),fontSize:12,fontWeight:900}}>{level} · {selectedTypes.length} questions</span>
                <button onClick={function(){setFocusMode(true);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"#9ca3af",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>📖 Focus Mode</button>
              </div>

              {/* title */}
              <h2 style={{margin:"0 0 12px",fontSize:21,fontWeight:900,color:"#f9fafb",lineHeight:1.3}}>{topic}</h2>

              {/* progress bar */}
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginBottom:5}}>
                  <span>Progress</span>
                  <span>{wordCount} words · ~{Math.max(1,Math.ceil(wordCount/180))} min read</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.07)",borderRadius:999,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:readPct+"%",background:lv?lv.color:"#34d399",borderRadius:999,transition:"width 1s linear"}}/>
                </div>
              </div>

              {/* passage */}
              <div style={{...CARD,marginBottom:12}}>
                <p style={{lineHeight:2.1,fontSize:17,color:"#e5e7eb",margin:0}}><WordTokens/></p>
                <p style={{fontSize:11,color:"#4b5563",margin:"10px 0 0",textAlign:"center"}}>Tap any word to look it up</p>
              </div>

              {/* vocab popup */}
              {selectedWord&&(
                <div style={{...CARD,marginBottom:12,background:"rgba(251,191,36,0.07)",borderColor:"rgba(251,191,36,0.3)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <span style={{fontSize:19,fontWeight:900,color:"#fbbf24"}}>{selectedWord}</span>
                      {wordDef&&wordDef.phonetic&&<span style={{fontSize:12,color:"#9ca3af",marginLeft:9}}>{wordDef.phonetic}</span>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                      {wordDef&&wordDef.audio&&<button onClick={function(){new Audio(wordDef.audio).play().catch(function(){});}} style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔊</button>}
                      <button onClick={function(){toggleWord(selectedWord);}} style={{background:savedWords.has(selectedWord)?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:savedWords.has(selectedWord)?"#06b6d4":"#9ca3af",borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{savedWords.has(selectedWord)?"⭐ Saved":"⭐ Save"}</button>
                      <button onClick={function(){setSelectedWord(null);setWordDef(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>
                    </div>
                  </div>
                  {wordDefLoading&&<p style={{fontSize:13,color:"#6b7280",margin:0}}>Looking up definition...</p>}
                  {wordDef&&!wordDefLoading&&(
                    <>
                      <p style={{fontSize:14,color:"#d1d5db",margin:0,lineHeight:1.7}}>{wordDef.def}</p>
                      {wordDef.example&&<p style={{fontSize:12,color:"#6b7280",margin:"5px 0 0",fontStyle:"italic"}}>e.g. "{wordDef.example}"</p>}
                    </>
                  )}
                </div>
              )}

              {/* bottom action bar */}
              <div style={{...CARD,padding:"11px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"#9ca3af",minWidth:56}}>⏱ {formatTime(readingTimerSecs)}</span>
                <button onClick={speakPassage} style={{background:isSpeaking?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.05)",border:"1px solid "+(isSpeaking?"#818cf8":"rgba(255,255,255,0.1)"),color:isSpeaking?"#818cf8":"#9ca3af",borderRadius:8,padding:"6px 13px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{isSpeaking?"⏹ Stop":"🔊 Listen"}</button>
                {savedWords.size>0&&<span style={{fontSize:12,color:"#06b6d4",fontWeight:700}}>⭐ {savedWords.size} saved</span>}
                <div style={{marginLeft:"auto",fontSize:11,color:"#4b5563"}}>Bonus: up to {lv?lv.timeBonus:200} XP</div>
              </div>

              <button onClick={startQuiz} style={{...mkBtn(lv?lv.color:"#f59e0b","#0d0d1a"),width:"100%",fontSize:15,padding:"14px 0"}}>Begin Quiz →</button>
            </div>
          );
        })()}

        {/* ── QUIZ ──────────────────────────────────────────── */}
        {stage==="quiz"&&q&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",gap:5}}>
                <span style={pill("#7c3aed")}>Q{current+1}/{questions.length}</span>
                <span style={pill("rgba(255,255,255,0.07)","#c7d2fe")}>{Q_LABELS[q.type]||q.type}</span>
                {streak>=3&&<span style={pill("#dc2626")}>Streak {streak}</span>}
              </div>
              <span style={{background:"rgba(255,255,255,0.07)",borderRadius:999,padding:"4px 11px",fontSize:12,color:lv?lv.color:"#34d399",fontWeight:700}}>{totalXpSoFar} XP</span>
            </div>
            <div style={{...CARD,padding:"11px 14px",marginBottom:9}}><Timer limit={lv?lv.timeLimit:180} running={timerRunning} onExpire={handleExpire}/></div>
            <div style={{marginBottom:9}}>
              <button onClick={function(){setShowPassage(function(p){return!p;});}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 12px",color:"#9ca3af",fontFamily:"inherit",fontWeight:600,fontSize:12,cursor:"pointer",textAlign:"left"}}>{showPassage?"Hide passage":"Show passage"}</button>
              {showPassage&&(<div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"12px 14px"}}><p style={{lineHeight:1.9,fontSize:15,color:"#d1d5db",margin:0}}>{passage}</p></div>)}
            </div>
            <div style={CARD}>
              {(q.q)&&<p style={{fontSize:17,fontWeight:700,lineHeight:1.6,marginBottom:14,color:"#f9fafb"}}>{q.q}</p>}
              {(q.instruction)&&<p style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#f9fafb"}}>{q.instruction}</p>}
              {q.type==="gap_word"&&!q.q&&<p style={{fontSize:16,fontWeight:700,marginBottom:10,color:"#f9fafb"}}>Fill in the blank:</p>}
              {q.type==="mcq"&&<McqQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="gap_word"&&<GapWordQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="gap_sentence"&&<GapSentQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="matching"&&<MatchingQ q={q} matches={matchState} conf={confirmed} shuffled={shuffledRights} onMatch={function(li,ri){var origIdx=q.rights?q.rights.indexOf(shuffledRights[ri]):ri;setMatchState(function(m){var n={};for(var k in m)n[k]=m[k];n[li]=origIdx;return n;});}}/>}
              {q.type==="heading"&&<HeadingQ q={q} userMap={headingState} conf={confirmed} onMatch={function(pi,hi){setHeadingState(function(m){var n={};for(var k in m)n[k]=m[k];n[pi]=hi;return n;});}}/>}
              {q.type==="qa"&&<QAQ q={q} val={userAnswers[current]||""} conf={confirmed} onChange={function(v){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=v;return n;});}}/>}
              {q.type==="tfnm"&&<TfnmQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="ynng"&&<YnngQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {confirmed&&q.explanation&&q.type!=="qa"&&(<div style={{marginTop:10,padding:"9px 11px",borderRadius:10,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.3)",fontSize:12,color:"#d1fae5"}}>{q.explanation}</div>)}
              <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
                {!confirmed?<button onClick={doConfirm} disabled={!canConfirm()} style={mkBtn(canConfirm()?"#6366f1":"#374151")}>Check Answer</button>
                :<button onClick={doNext} style={mkBtn(lv?lv.color:"#34d399","#0d0d1a")}>{current+1>=questions.length?"See Results":"Next Question"}</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {stage==="result"&&result&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:50,marginBottom:5}}>{result.pct>=80?"★":"○"}</div>
            <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 4px",color:lv?lv.color:"#34d399"}}>{result.pct>=80?"Excellent!":result.pct>=60?"Good job!":"Keep going!"}</h2>
            <p style={{color:"#9ca3af",marginBottom:14,fontSize:13}}>{level} - {topic}</p>
            <div style={{...CARD,marginBottom:10}}>
              <div style={{fontSize:38,fontWeight:900,color:"#f9fafb",marginBottom:3}}>{result.score}/{result.maxScore} pts</div>
              <div style={{marginBottom:10,fontSize:18}}>{"★".repeat(result.stars)+"☆".repeat(5-result.stars)}</div>
              <div style={{display:"flex",gap:7}}>
                {[{v:result.xp+" XP",l:"earned",c:lv?lv.color:"#34d399"},{v:result.pct+"%",l:"score",c:pctColor(result.pct)},{v:formatTime(result.timeSecs),l:"time",c:"#a78bfa"},{v:"#"+(result.rank+1),l:"rank",c:"#fbbf24"}].map(function(s){return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;})}
              </div>
              {result.timeBonus>0&&<div style={{marginTop:9,padding:"6px 11px",borderRadius:8,background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf24",fontSize:12,color:"#fbbf24"}}>Speed bonus: +{result.timeBonus} XP!</div>}
            </div>
            {result.newBadges&&result.newBadges.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(251,191,36,0.08)",borderColor:"rgba(251,191,36,0.4)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#fbbf24",marginBottom:10,textAlign:"left"}}>🏅 NEW BADGE{result.newBadges.length>1?"S":""} UNLOCKED!</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {result.newBadges.map(function(id){
                    var b=BADGES.find(function(x){return x.id===id;});
                    if(!b)return null;
                    return(<div key={id} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"8px 12px",flex:"1 1 auto"}}>
                      <span style={{fontSize:22}}>{b.icon}</span>
                      <div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{b.name}</div><div style={{fontSize:11,color:"#9ca3af"}}>{b.desc}</div></div>
                    </div>);
                  })}
                </div>
              </div>
            )}
            <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
              <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>BREAKDOWN</p>
              {result.answers&&result.answers.map?result.answers.map(function(ok,i){return<div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:6}}><span style={{fontSize:13,color:ok?"#34d399":"#ef4444"}}>{ok?"✓":"✕"}</span><span style={{fontSize:12,color:"#d1d5db",flex:1}}>{questions[i]?questions[i].q||questions[i].instruction||questions[i].sentence||("Q "+(i+1)):""}</span></div>;}):null}
            </div>
            {result.typeStats&&Object.keys(result.typeStats).length>1&&(
              <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:10}}>BY QUESTION TYPE</p>
                {Object.keys(result.typeStats).map(function(t){
                  var ts=result.typeStats[t];var tp=ts.max>0?Math.round(ts.earned/ts.max*100):0;
                  return(<div key={t} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"#9ca3af"}}>{Q_LABELS[t]||t}</span>
                      <span style={{color:pctColor(tp),fontWeight:700}}>{tp}%</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:tp+"%",background:pctColor(tp),borderRadius:999,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>);
                })}
              </div>
            )}
            {result.wasDaily&&dailyLb.length>0&&(
              <div style={{...CARD,marginBottom:10,textAlign:"left",borderColor:"rgba(251,191,36,0.3)"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#fbbf24",marginBottom:8}}>TODAY'S DAILY BOARD</p>
                {dailyLb.slice(0,5).map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(dailyLb.length,5)-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <span style={{width:22,fontSize:11,color:"#fbbf24",fontWeight:700}}>{i+1}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#fbbf24":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{e.xp} XP</span>
                    <span style={{fontSize:11,color:pctColor(e.pct)}}>{e.pct}%</span>
                  </div>);
                })}
              </div>
            )}
            <div style={{display:"flex",gap:7}}>
              <button onClick={function(){setLbLevel(level);setStage("leaderboard");}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12}}>Leaderboard</button>
              <button onClick={function(){setStage("profile");}} style={{...mkBtn("#7c3aed"),flex:1,fontSize:12}}>Profile</button>
              <button onClick={doRestart} style={{...mkBtn(lv?lv.color:"#34d399","#0d0d1a"),flex:1,fontSize:12}}>Play Again</button>
            </div>
          </div>
        )}

        {/* ── VOCAB NOTEBOOK ────────────────────────────────── */}
        {stage==="vocab"&&currentUser&&(function(){
          var words=vocab.slice().reverse();
          var reviewWords=words.filter(function(w){return w.status!=="known";});
          var display=vocabFilter==="review"?reviewWords:words;
          var safeIdx=display.length>0?vocabCard%display.length:0;
          var curWord=display.length>0?display[safeIdx]:null;
          function markKnown(){
            var nv=vocab.map(function(v){return v.word===curWord.word?{word:v.word,level:v.level,topic:v.topic,date:v.date,status:"known"}:v;});
            setVocab(nv);var nAll={};for(var k in allVocab)nAll[k]=allVocab[k];nAll[currentUser.name]=nv;setAllVocab(nAll);saveVocab(nAll);
            setVocabFlipped(false);
            setVocabCard(function(c){return display.length<=1?0:(c>=display.length-1?0:c+1);});
          }
          function next(){setVocabFlipped(false);setVocabCard(function(c){return display.length<=1?0:(c+1)%display.length;});}
          function prev(){setVocabFlipped(false);setVocabCard(function(c){return display.length<=1?0:(c>0?c-1:display.length-1);});}
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#06b6d4"}}>Vocabulary</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {[["all","All ("+words.length+")"],["review","Review ("+reviewWords.length+")"]].map(function(t){
                  return<button key={t[0]} onClick={function(){setVocabFilter(t[0]);setVocabCard(0);setVocabFlipped(false);}} style={{background:vocabFilter===t[0]?"#06b6d4":"rgba(255,255,255,0.05)",color:vocabFilter===t[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>;
                })}
              </div>
              {curWord?(
                <div>
                  <div onClick={function(){setVocabFlipped(function(f){return!f;});}} style={{...CARD,cursor:"pointer",textAlign:"center",minHeight:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:10,background:"rgba(6,182,212,0.06)",borderColor:"rgba(6,182,212,0.25)"}}>
                    {!vocabFlipped?(
                      <div><div style={{fontSize:28,fontWeight:900,color:"#06b6d4",marginBottom:6}}>{curWord.word}</div><div style={{fontSize:12,color:"#4b5563"}}>Tap to reveal context</div></div>
                    ):(
                      <div><div style={{fontSize:22,fontWeight:900,color:"#06b6d4",marginBottom:8}}>{curWord.word}</div><div style={{fontSize:13,color:"#9ca3af",marginBottom:4}}>From: <span style={{color:"#f3f4f6",fontWeight:600}}>{curWord.topic}</span></div><div style={{fontSize:12,color:"#6b7280"}}>{curWord.level} · {curWord.date}</div></div>
                    )}
                  </div>
                  {vocabFlipped&&(
                    <div style={{display:"flex",gap:7,marginBottom:10}}>
                      <button onClick={markKnown} style={{...mkBtn("#22c55e","#0d0d1a"),flex:1,fontSize:13}}>Know it</button>
                      <button onClick={next} style={{...mkBtn("#374151"),flex:1,fontSize:13}}>Study more</button>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={prev} style={{...GHOST,padding:"7px 14px",fontSize:13}}>Prev</button>
                    <span style={{fontSize:12,color:"#6b7280"}}>{safeIdx+1} / {display.length}</span>
                    <button onClick={next} style={{...GHOST,padding:"7px 14px",fontSize:13}}>Next</button>
                  </div>
                  {words.length>0&&(
                    <div style={{...CARD,marginTop:14}}>
                      <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>ALL WORDS ({words.length})</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {words.map(function(w,i){return<span key={i} onClick={function(){var idx=display.findIndex(function(d){return d.word===w.word;});if(idx!==-1){setVocabCard(idx);setVocabFlipped(false);}}} style={{background:w.status==="known"?"rgba(34,197,94,0.15)":"rgba(6,182,212,0.1)",color:w.status==="known"?"#22c55e":"#06b6d4",borderRadius:999,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{w.word}</span>;})}
                      </div>
                    </div>
                  )}
                </div>
              ):(
                <div style={{...CARD,textAlign:"center",padding:40}}>
                  <div style={{fontSize:36,marginBottom:10}}>📚</div>
                  <p style={{color:"#6b7280",fontSize:14}}>{vocabFilter==="review"?"All caught up! No words left to review.":"No saved words yet — tap words in the reading passage to save them."}</p>
                  <button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:14}}>Start Reading</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── DAILY LEADERBOARD ─────────────────────────────── */}
        {stage==="dailyleaderboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Daily Board</h2>
              <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
            </div>
            <p style={{color:"#6b7280",fontSize:12,marginBottom:12}}>Today · {new Date().toLocaleDateString()} · B1</p>
            {dailyLb.length===0?(
              <div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No one has played today's challenge yet.</p><button onClick={startDailyChallenge} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:14}}>Be First!</button></div>
            ):(
              <div style={CARD}>
                <div style={{display:"flex",padding:"0 0 7px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:5}}>
                  {["#","PLAYER","XP","%","TIME"].map(function(h,i){return<span key={h} style={{fontSize:10,color:"#4b5563",width:i===0?28:i===1?"1fr":i===2?55:i===3?36:46,flex:i===1?1:0,textAlign:i>1?"right":"left"}}>{h}</span>;})}
                </div>
                {dailyLb.map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:i<dailyLb.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:isMe?"rgba(251,191,36,0.06)":"transparent",borderRadius:7,marginBottom:2}}>
                    <span style={{width:28,fontSize:i<3?13:11,color:"#fbbf24",fontWeight:700}}>{i===0?"1st":i===1?"2nd":i===2?"3rd":(i+1)}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#fbbf24":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{width:55,textAlign:"right",fontWeight:800,color:"#fbbf24",fontSize:12}}>{e.xp}</span>
                    <span style={{width:36,textAlign:"right",fontSize:12,color:pctColor(e.pct)}}>{e.pct}%</span>
                    <span style={{width:46,textAlign:"right",fontSize:11,color:"#6b7280"}}>{formatTime(e.timeSecs)}</span>
                  </div>);
                })}
              </div>
            )}
            {!(dailyDone&&dailyDone.date===new Date().toLocaleDateString())&&<button onClick={startDailyChallenge} style={{...mkBtn("#06b6d4","#0d0d1a"),width:"100%",marginTop:12}}>Play Today's Challenge</button>}
          </div>
        )}

        {/* ── HISTORY ───────────────────────────────────────── */}
        {stage==="history"&&currentUser&&(function(){
          var games=(currentUser.games||[]).slice().reverse();
          var filtered=historyLevel?games.filter(function(g){return g.level===historyLevel;}):games;
          var totalXp=filtered.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=filtered.length?Math.round(filtered.reduce(function(s,g){return s+g.pct;},0)/filtered.length):0;
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#34d399"}}>Reading History</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>

              {/* level filter pills */}
              <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                <button onClick={function(){setHistoryLevel("");}} style={{background:historyLevel===""?"#34d399":"rgba(255,255,255,0.05)",color:historyLevel===""?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===""?"#34d399":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>All</button>
                {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setHistoryLevel(l.key);}} style={{background:historyLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:historyLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
              </div>

              {/* summary bar */}
              {filtered.length>0&&(
                <div style={{display:"flex",gap:7,marginBottom:12}}>
                  {[{v:filtered.length,l:"Sessions",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)}].map(function(s){
                    return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
                  })}
                </div>
              )}

              {/* entries */}
              {filtered.length===0&&(
                <div style={{...CARD,textAlign:"center",padding:40}}>
                  <div style={{fontSize:36,marginBottom:10}}>📖</div>
                  <p style={{color:"#6b7280",fontSize:14}}>{historyLevel?"No "+historyLevel+" sessions yet.":"No sessions yet — play your first game!"}</p>
                  <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),marginTop:14}}>Start Reading</button>
                </div>
              )}
              {filtered.length>0&&(
                <div style={CARD}>
                  {filtered.map(function(g,i){
                    var glv=getLv(g.level);
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                        <div style={{width:32,height:32,borderRadius:8,background:glv.glow,border:"2px solid "+glv.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:glv.color,flexShrink:0}}>{g.level}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.topic}</div>
                          <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{g.date} · {formatTime(g.timeSecs)}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:13,fontWeight:900,color:"#fbbf24"}}>{g.xp} XP</div>
                          <div style={{fontSize:11,color:pctColor(g.pct),marginTop:1}}>{g.pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {currentUser&&<button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:12}}>Play Again</button>}
            </div>
          );
        })()}

        {/* ── LEADERBOARD ───────────────────────────────────── */}
        {stage==="leaderboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Leaderboard</h2>
              <button onClick={function(){setStage(currentUser?"home":"auth");}} style={GHOST}>Back</button>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
              {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setLbLevel(l.key);}} style={{background:lbLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:lbLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(lbLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
            </div>
            {(function(){
              var bd=boards[lbLevel]||[];var lvd=getLv(lbLevel);
              if(!bd.length)return<div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No scores yet for {lbLevel}!</p></div>;
              return(<div style={CARD}>
                <div style={{display:"flex",padding:"0 0 7px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:5}}>
                  {["#","PLAYER","XP","%","TIME"].map(function(h,i){return<span key={h} style={{fontSize:10,color:"#4b5563",width:i===0?28:i===1?"1fr":i===2?55:i===3?36:46,flex:i===1?1:0,textAlign:i>1?"right":"left"}}>{h}</span>;})}
                </div>
                {bd.map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} className="rq-lb-row" onClick={function(){if(currentUser&&e.name===currentUser.name){setStage("profile");}else{setViewingUser(e.name);setStage("friendProfile");}}} style={{display:"flex",alignItems:"center",padding:"8px "+(isMe?"5px":"0"),borderBottom:i<bd.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:isMe?"rgba(52,211,153,0.06)":"transparent",borderRadius:7,marginBottom:2,cursor:"pointer",userSelect:"none"}}>
                    <span style={{width:28,fontSize:i<3?13:11,color:i<3?"#fbbf24":"#6b7280",fontWeight:700}}>{i===0?"1st":i===1?"2nd":i===2?"3rd":(i+1)}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:isMe?lvd.color:"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</div>
                      <div style={{fontSize:10,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.topic}</div>
                    </div>
                    <span style={{width:55,textAlign:"right",fontWeight:800,color:"#fbbf24",fontSize:12}}>{e.xp}</span>
                    <span style={{width:36,textAlign:"right",fontSize:12,color:pctColor(e.pct)}}>{e.pct}%</span>
                    <span style={{width:46,textAlign:"right",fontSize:11,color:"#6b7280"}}>{formatTime(e.timeSecs)}</span>
                  </div>);
                })}
              </div>);
            })()}
            {currentUser&&<button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:12}}>Play and Climb!</button>}
          </div>
        )}

        {/* ── FRIENDS ───────────────────────────────────────── */}
        {stage==="friends"&&currentUser&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>Friends</h2>
              <button onClick={function(){setStage("home");setSocialMsg("");}} style={GHOST}>Back</button>
            </div>
            {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

            {/* tabs */}
            <div style={{display:"flex",gap:5,marginBottom:14}}>
              {[["search","Search"],["requests","Requests ("+(myData.requests.length)+")"],["list","My Friends ("+myData.friends.length+")"]].map(function(t){
                return<button key={t[0]} onClick={function(){setFriendStage(t[0]);setSocialMsg("");}} style={{background:friendStage===t[0]?"#a78bfa":"rgba(255,255,255,0.05)",color:friendStage===t[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>;
              })}
            </div>

            {/* SEARCH */}
            {friendStage==="search"&&(
              <div>
                <div style={{position:"relative",marginBottom:8}}>
                  <input style={{...INP,paddingLeft:36}} placeholder="Search by username (min 2 chars)..." value={searchQuery} onChange={function(e){setSearchQuery(e.target.value);}}/>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.5}}>🔍</span>
                </div>
                <button onClick={function(){loadUsers().then(function(u){setAllUsers(u);setSocialMsg("User list refreshed!");});}} style={{...mkBtn("#374151"),width:"100%",marginBottom:12,fontSize:13,padding:"9px 0"}}>Refresh User List</button>
                {getSearchResults().map(function(u){
                  var isFriend=myData.friends.indexOf(u.name)!==-1;
                  var requested=(getSocial(social,u.name).requests||[]).indexOf(currentUser.name)!==-1;
                  var uData=getSocial(social,u.name);
                  var uTotalXp=u.games?u.games.reduce(function(s,g){return s+g.xp;},0):0;
                  var uLevel=getUserLevel(uTotalXp);
                  return(<div key={u.name} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>Lvl {uLevel} | Games: {u.games?u.games.length:0} | {uTotalXp} XP | Likes: {uData.likes||0}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={function(){setViewingUser(u.name);setStage("friendProfile");}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>View</button>
                      {!isFriend&&!requested&&<button onClick={function(){sendRequest(u.name);}} style={{...mkBtn("#6366f1"),padding:"5px 9px",fontSize:11}}>Add</button>}
                      {requested&&<span style={{fontSize:11,color:"#6b7280",padding:"5px 0"}}>Pending</span>}
                      {isFriend&&<span style={{fontSize:11,color:"#34d399",padding:"5px 0"}}>Friends</span>}
                    </div>
                  </div>);
                })}
                {searchQuery.length>=2&&getSearchResults().length===0&&<p style={{color:"#6b7280",textAlign:"center",padding:20}}>No users found for "{searchQuery}"</p>}
              </div>
            )}

            {/* REQUESTS */}
            {friendStage==="requests"&&(
              <div>
                {myData.requests.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No pending friend requests.</p></div>}
                {myData.requests.map(function(from){
                  return(<div key={from} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{from[0].toUpperCase()}</div>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:"#f3f4f6"}}>{from} wants to be friends</span>
                    <button onClick={function(){acceptRequest(from);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"6px 11px",fontSize:12}}>Accept</button>
                    <button onClick={function(){declineRequest(from);}} style={{...mkBtn("#374151"),padding:"6px 11px",fontSize:12}}>Decline</button>
                  </div>);
                })}
              </div>
            )}

            {/* FRIENDS LIST */}
            {friendStage==="list"&&(
              <div>
                {myData.friends.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No friends yet. Search to add some!</p></div>}
                {myData.friends.map(function(fname){
                  var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===fname){fu=allUsers[i];break;}}
                  var fuGames=fu&&fu.games?fu.games:[];
                  var fStreak=calcStreak(fuGames);
                  var fData=getSocial(social,fname);
                  fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
                  var fTotalXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
                  var fLevel=getUserLevel(fTotalXp);
                  return(<div key={fname} style={{...CARD,marginBottom:8,padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{fname[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{fname}</div>
                        <div style={{display:"flex",gap:7,marginTop:2}}>
                          <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥{fStreak}d</span>
                          <span style={pill("rgba(99,102,241,0.15)","#6366f1")}>Lvl {fLevel}</span>
                          <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes:{fData.likes||0}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={function(){setViewingUser(fname);setStage("friendProfile");}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>Profile</button>
                        <button onClick={function(){setChallengeTarget(fname);}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"5px 9px",fontSize:11}}>Challenge</button>
                      </div>
                    </div>
                    {challengeTarget===fname&&(
                      <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:10,padding:10,marginTop:4}}>
                        <p style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:7}}>Challenge Settings</p>
                        <div style={{display:"flex",gap:5,marginBottom:7,flexWrap:"wrap"}}>
                          {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setChallengeLevel(l.key);}} style={{background:challengeLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:challengeLevel===l.key?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
                        </div>
                        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                          {Object.keys(Q_LABELS).map(function(t){var on=challengeTypes.indexOf(t)!==-1;return<button key={t} onClick={function(){setChallengeTypes(function(prev){var on2=prev.indexOf(t)!==-1;if(on2&&prev.length===1)return prev;if(on2)return prev.filter(function(x){return x!==t;});return prev.concat([t]);});}} style={{background:on?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(on?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"3px 9px",fontSize:10,color:on?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>{Q_LABELS[t]}</button>;})}
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={sendChallenge} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12}}>Send Challenge</button>
                          <button onClick={function(){setChallengeTarget(null);}} style={{...mkBtn("#374151"),flex:1,fontSize:12}}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>);
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FRIEND PROFILE ────────────────────────────────── */}
        {stage==="friendProfile"&&viewingUser&&currentUser&&(function(){
          var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===viewingUser){fu=allUsers[i];break;}}
          if(!fu)return<div style={{textAlign:"center",padding:40}}><p style={{color:"#6b7280"}}>User not found.</p><button onClick={function(){setStage("friends");}} style={GHOST}>Back</button></div>;
          var fData=getSocial(social,viewingUser);
          fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
          var isFriend=myData.friends.indexOf(viewingUser)!==-1;
          var requested=(fData.requests||[]).indexOf(currentUser.name)!==-1;
          var alreadyLiked=hasLiked(social,currentUser.name,viewingUser);
          var fuGames=fu&&fu.games?fu.games:[];
          var fStreak=calcStreak(fuGames);
          var fBest=getBestLevel(fuGames);
          var totalXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct);},0)/fuGames.length):0;
          var fLvlInfo=getLevelProgress(totalXp);
          // comparison with current user
          var curGames=currentUser&&currentUser.games?currentUser.games:[];
          var myTotalXp=curGames.reduce(function(s,g){return s+g.xp;},0);
          var myAvgPct=curGames.length?Math.round(curGames.reduce(function(s,g){return s+g.pct;},0)/curGames.length):0;
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>{viewingUser}'s Profile</h2>
              <button onClick={function(){setStage("friends");setSocialMsg("");}} style={GHOST}>Back</button>
            </div>
            {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

            {/* identity */}
            <div style={{...CARD,marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>{viewingUser[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#f9fafb"}}>{viewingUser}</div>
                  <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",padding:"2px 8px",borderRadius:999,fontSize:12,fontWeight:900,color:"#0d0d1a"}}>⭐ Lvl {fLvlInfo.level}</div>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>Joined {fu.joined}</div>
                <div style={{display:"flex",gap:7,marginTop:4}}>
                  <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥 {fStreak} day streak</span>
                  <span style={pill("rgba(99,102,241,0.15)","#a78bfa")}>Best: {fBest}</span>
                  <span style={{...pill("rgba(236,72,153,0.15)","#ec4899"),fontWeight:fData.likes>0?700:400}}>❤️ {fData.likes||0} {fData.likes===1?"Like":"Likes"}</span>
                </div>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9ca3af"}}>LEVEL {fLvlInfo.level} PROGRESS</span>
                <span style={{fontSize:10,color:"#6b7280"}}>{fLvlInfo.xpNeeded} XP to next</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:fLvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s ease"}}/>
              </div>
            </div>

            {/* actions */}
            <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
              {!isFriend&&!requested&&<button onClick={function(){sendRequest(viewingUser);}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12,minWidth:100}}>Add Friend</button>}
              {requested&&<button disabled style={{...mkBtn("#374151"),flex:1,fontSize:12,minWidth:100}}>Request Sent</button>}
              {isFriend&&<button onClick={function(){removeFriend(viewingUser);setStage("friends");}} style={{...mkBtn("#374151"),flex:1,fontSize:12,minWidth:100}}>Remove Friend</button>}
              <button onClick={function(){likeProfile(viewingUser);}} disabled={alreadyLiked||viewingUser===currentUser.name} style={{...mkBtn(alreadyLiked?"#374151":"#ec4899"),flex:1,fontSize:12,minWidth:90,transition:"all 0.2s ease",transform:alreadyLiked?"scale(0.98)":"scale(1)"}}>{alreadyLiked?"❤️ Liked":"❤️ Like"}</button>
              {isFriend&&<button onClick={function(){setChallengeTarget(viewingUser);setStage("friends");setFriendStage("list");}} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12,minWidth:100}}>Challenge</button>}
            </div>

            {/* stats */}
            <div style={{display:"flex",gap:7,marginBottom:12}}>
              {[{v:fu&&fu.games?fu.games.length:0,l:"Games",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)},{v:fData.friends?fData.friends.length:0,l:"Friends",c:"#a78bfa"}].map(function(s){
                return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
              })}
            </div>

            {/* comparison */}
            {currentUser&&currentUser.games&&currentUser.games.length>0&&fu&&fu.games&&fu.games.length>0&&(
              <div style={{...CARD,marginBottom:12,padding:14}}>
                <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,marginBottom:10}}>HEAD TO HEAD</p>
                {[{label:"Total XP",my:myTotalXp,their:totalXp},{label:"Avg Score",my:myAvgPct,their:avgPct},{label:"Games Played",my:curGames.length,their:fuGames.length}].map(function(row){
                  var myWin=row.my>row.their;
                  var myPct=row.my+row.their>0?(row.my/(row.my+row.their)*100):50;
                  return(<div key={row.label} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginBottom:3}}><span style={{color:myWin?"#34d399":"#f3f4f6",fontWeight:myWin?700:400}}>{currentUser.name}: {row.my}</span><span style={{fontSize:10,color:"#4b5563"}}>{row.label}</span><span style={{color:!myWin?"#f472b6":"#f3f4f6",fontWeight:!myWin?700:400}}>{viewingUser}: {row.their}</span></div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6,overflow:"hidden",display:"flex"}}>
                      <div style={{height:"100%",width:myPct+"%",background:"#34d399",borderRadius:myPct>50?"999 0 0 999":"999"}}/>
                      <div style={{height:"100%",width:(100-myPct)+"%",background:"#f472b6",borderRadius:myPct<50?"999 0 0 999":"999"}}/>
                    </div>
                  </div>);
                })}
              </div>
            )}

            {/* game history chart */}
            {fu.games.length>0&&(
              <div style={{marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>XP HISTORY</p>
                <GameChart games={fu.games}/>
              </div>
            )}

            {/* recent games */}
            {fu.games.length>0&&(
              <div style={{...CARD,marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>RECENT GAMES</p>
                {fu.games.slice().reverse().slice(0,6).map(function(g,i){
                  var glv=getLv(g.level);
                  return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <span style={{fontSize:11,fontWeight:900,color:glv.color,width:20}}>{g.level}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,color:"#f3f4f6"}}>{g.topic}</div><div style={{fontSize:10,color:"#6b7280"}}>{g.date}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{g.xp} XP</div><div style={{fontSize:10,color:pctColor(g.pct)}}>{g.pct}%</div></div>
                  </div>);
                })}
              </div>
            )}
            {fu.games.length===0&&<div style={{...CARD,textAlign:"center",padding:28}}><p style={{color:"#6b7280"}}>No games played yet.</p></div>}
          </div>);
        })()}

        {/* ── MY PROFILE ────────────────────────────────────── */}
        {stage==="profile"&&currentUser&&(function(){
          var games=(currentUser&&currentUser.games)?currentUser.games:[];
          var totalXp=games.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
          var avgTime=games.length?Math.round(games.reduce(function(s,g){return s+g.timeSecs;},0)/games.length):0;
          var lvlInfo=getLevelProgress(totalXp);
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>My Profile</h2>
              <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
            </div>
            <div style={{...CARD,marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>{currentUser.name[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#f9fafb"}}>{currentUser.name}</div>
                  <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",padding:"2px 8px",borderRadius:999,fontSize:12,fontWeight:900,color:"#0d0d1a"}}>⭐ Lvl {lvlInfo.level}</div>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>Joined {currentUser.joined}</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:4}}>
                  <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥 {myStreak} day streak</span>
                  <span style={pill("rgba(167,139,250,0.15)","#a78bfa")}>Friends: {myData.friends.length}</span>
                  <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes: {myData.likes||0}</span>
                  <span style={pill("rgba(99,102,241,0.15)","#818cf8")}>Best: {myBestLevel}</span>
                </div>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9ca3af"}}>LEVEL {lvlInfo.level} PROGRESS</span>
                <span style={{fontSize:10,color:"#6b7280"}}>{lvlInfo.xpNeeded} XP to next</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:lvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s ease"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:7,marginBottom:10}}>
              {[{v:games.length,l:"Games",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)},{v:formatTime(avgTime),l:"Avg Time",c:"#a78bfa"}].map(function(s){
                return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
              })}
            </div>
            {games.length>0&&(
              <div style={{marginBottom:10}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>XP HISTORY</p>
                <GameChart games={games}/>
              </div>
            )}
            {(function(){
              var typeAgg={};
              games.forEach(function(g){if(!g.typeStats)return;Object.keys(g.typeStats).forEach(function(t){if(!typeAgg[t])typeAgg[t]={earned:0,max:0};typeAgg[t].earned+=g.typeStats[t].earned;typeAgg[t].max+=g.typeStats[t].max;});});
              var types=Object.keys(typeAgg);
              if(!types.length)return null;
              return(<div style={{...CARD,marginBottom:10}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:10}}>ACCURACY BY TYPE</p>
                {types.map(function(t){
                  var ts=typeAgg[t];var tp=ts.max>0?Math.round(ts.earned/ts.max*100):0;
                  return(<div key={t} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"#9ca3af"}}>{Q_LABELS[t]||t}</span>
                      <span style={{color:pctColor(tp),fontWeight:700}}>{tp}%</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:tp+"%",background:pctColor(tp),borderRadius:999}}/>
                    </div>
                  </div>);
                })}
              </div>);
            })()}
            {games.length>0&&(<div style={{...CARD,marginBottom:10}}>
              <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>RECENT GAMES</p>
              {games.slice().reverse().slice(0,8).map(function(g,i){
                var glv=getLv(g.level);
                return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<7?"1px solid rgba(255,255,255,0.05)":"none"}}>
                  <span style={{fontSize:11,fontWeight:900,color:glv.color,width:20}}>{g.level}</span>
                  <div style={{flex:1}}><div style={{fontSize:12,color:"#f3f4f6"}}>{g.topic}</div><div style={{fontSize:10,color:"#6b7280"}}>{g.date} - {formatTime(g.timeSecs)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{g.xp} XP</div><div style={{fontSize:10,color:pctColor(g.pct)}}>{g.pct}%</div></div>
                </div>);
              })}
            </div>)}
            {games.length===0&&<div style={{...CARD,textAlign:"center",padding:30}}><p style={{color:"#6b7280"}}>No games yet - start playing!</p></div>}
            {(function(){
              var myBadges=checkBadges(currentUser,vocab,myStreak);
              var earnedCount=BADGES.filter(function(b){return myBadges[b.id];}).length;
              return(<div style={{...CARD,marginBottom:10,cursor:"pointer"}} onClick={function(){setStage("badges");}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>🏅 My Badges</span>
                  <span style={{fontSize:12,color:"#6b7280"}}>{earnedCount} / {BADGES.length} earned →</span>
                </div>
                <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                  {BADGES.map(function(b){return<span key={b.id} style={{fontSize:18,opacity:myBadges[b.id]?1:0.2,filter:myBadges[b.id]?"none":"grayscale(1)"}}>{b.icon}</span>;})}
                </div>
              </div>);
            })()}
            <div style={{display:"flex",gap:7}}>
              <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),flex:1}}>Play Now</button>
              <button onClick={function(){localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} style={{...mkBtn("#374151"),flex:1}}>Log Out</button>
            </div>
          </div>);
        })()}

        {/* ── BADGES ────────────────────────────────────────── */}
        {stage==="badges"&&currentUser&&(function(){
          var myBadges=checkBadges(currentUser,vocab,myStreak);
          var earnedCount=BADGES.filter(function(b){return myBadges[b.id];}).length;
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:6}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Badges</h2>
                <button onClick={function(){setStage("profile");}} style={GHOST}>Back</button>
              </div>
              <p style={{color:"#6b7280",fontSize:13,marginBottom:14}}>{earnedCount} of {BADGES.length} earned</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {BADGES.map(function(b){
                  var earned=!!myBadges[b.id];
                  return(
                    <div key={b.id} style={{...CARD,padding:14,display:"flex",gap:10,alignItems:"flex-start",opacity:earned?1:0.45,border:"1px solid "+(earned?"rgba(251,191,36,0.35)":"rgba(255,255,255,0.08)"),background:earned?"rgba(251,191,36,0.06)":"rgba(255,255,255,0.03)"}}>
                      <span style={{fontSize:26,flexShrink:0,filter:earned?"none":"grayscale(1)"}}>{b.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:earned?"#fbbf24":"#6b7280",marginBottom:2}}>{b.name}</div>
                        <div style={{fontSize:11,color:"#4b5563",lineHeight:1.4}}>{b.desc}</div>
                        {earned&&<div style={{fontSize:10,color:"#22c55e",marginTop:4,fontWeight:700}}>✓ Unlocked</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={doRestart} style={{...mkBtn("#fbbf24","#0d0d1a"),width:"100%",marginTop:14}}>Keep Playing to Unlock More</button>
            </div>
          );
        })()}

      </div>
    </div>
    </>
  );
}

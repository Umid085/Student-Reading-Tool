import { useState, useRef, useEffect, lazy, Suspense, useMemo } from "react";
import { colors, spacing, typography, radius, styles } from "./src/designSystem.js";
import { announceToScreenReader, getOptionButtonA11y, focusRingStyle } from "./src/a11yUtils.jsx";

// Lazy-loaded screen components
var AuthScreen = lazy(function(){return import("./src/screens/AuthScreen.jsx");});
var HomeScreen = lazy(function(){return import("./src/screens/HomeScreen.jsx");});
var LoadingScreen = lazy(function(){return import("./src/screens/LoadingScreen.jsx");});
var ReadingScreen = lazy(function(){return import("./src/screens/ReadingScreen.jsx");});
var QuizScreen = lazy(function(){return import("./src/screens/QuizScreen.jsx");});
var ResultsScreen = lazy(function(){return import("./src/screens/ResultsScreen.jsx");});
var LeaderboardScreen = lazy(function(){return import("./src/screens/LeaderboardScreen.jsx");});
var FriendsScreen = lazy(function(){return import("./src/screens/FriendsScreen.jsx");});
var FriendProfileScreen = lazy(function(){return import("./src/screens/FriendProfileScreen.jsx");});
var ProfileScreen = lazy(function(){return import("./src/screens/ProfileScreen.jsx");});

var API        = "/.netlify/functions/generate";
var USERS_KEY  = "rq-users-v6";
var BOARDS_KEY = "rq-boards-v6";
var SOCIAL_KEY = "rq-social-v6";
var CREDS_KEY  = "rq-credentials";

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
function pctColor(p){return p>=80?colors.success:p>=60?colors.warning:colors.error;}
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
  n[to].challenges.push({from:from,level:level,types:types,date:new Date().toISOString().split('T')[0],status:"pending"});
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

// ── Virtual Scrolling Helper ─────────────────────────────────
// Renders only visible items in a scrollable container for performance
function useVirtualScroll(items, itemHeight, containerHeight) {
  var [scrollTop, setScrollTop] = useState(0);

  var startIndex = Math.floor(scrollTop / itemHeight);
  var visibleCount = Math.ceil(containerHeight / itemHeight) + 1; // +1 for buffer
  var endIndex = Math.min(startIndex + visibleCount, items.length);
  var visibleItems = items.slice(startIndex, endIndex);

  return {
    scrollTop,
    setScrollTop,
    startIndex,
    visibleItems,
    offsetY: startIndex * itemHeight,
    totalHeight: items.length * itemHeight
  };
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
  // virtual scrolling
  var [lbScroll,setLbScroll]=useState(0);
  var [friendsScroll,setFriendsScroll]=useState(0);

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

  // ── game ──────────────────────────────────────────────────
  function shuffleArr(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  async function generate(){
    if(!level){setError("Pick a level first!");return;}
    if(selectedTypes.length===0){setError("Select at least one question type.");return;}
    setError("");setQuestions([]);setUserAnswers([]);setMatchState({});setHeadingState({});setStage("loading");
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

  function startQuiz(){startTimeRef.current=Date.now();setTimerRunning(true);setStage("quiz");}
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
    var totalEarned=0,totalMax=0,ansArr=[];
    for(var i=0;i<questions.length;i++){
      var qs=questions[i],ans=null;
      if(qs.type==="matching")ans=matchState;
      else if(qs.type==="heading")ans=headingState;
      else ans=userAnswers[i]!==undefined?userAnswers[i]:null;
      var pts=scoreQuestion(qs,ans),mx=maxPoints(qs);
      ansArr.push(pts>=Math.ceil(mx/2));
      totalEarned+=pts;totalMax+=mx;
    }
    var pct=totalMax>0?Math.round((totalEarned/totalMax)*100):0;
    var stars=pct>=90?5:pct>=75?4:pct>=60?3:pct>=40?2:1;
    var lvObj=lv||LEVELS[0];
    var tb=Math.round(lvObj.timeBonus*Math.max(0,(lvObj.timeLimit-timeSecs)/lvObj.timeLimit));
    var finalXp=Math.round(totalEarned*lvObj.mult*100)+tb+(streak>=3?50:0);
    var today=new Date().toLocaleDateString();

    var gameEntry={level:lvObj.key,score:totalEarned,total:totalMax,xp:finalXp,pct:pct,timeSecs:timeSecs,timeBonus:tb,topic:topic,date:today};
    var updatedUser={name:currentUser.name,hash:currentUser.hash,games:currentUser.games.concat([gameEntry]),joined:currentUser.joined};
    var newUsers=[];for(var j=0;j<allUsers.length;j++){newUsers.push(allUsers[j].name===currentUser.name?updatedUser:allUsers[j]);}
    await saveUsers(newUsers);setAllUsers(newUsers);setCurrentUser(updatedUser);

    var lbEntry={name:currentUser.name,xp:finalXp,score:totalEarned,total:totalMax,pct:pct,timeSecs:timeSecs,topic:topic,date:today};
    var nb={};for(var k in boards){nb[k]=boards[k];}
    var cur=nb[lvObj.key]||[];var filtered=cur.filter(function(e){return e.name!==currentUser.name;});var merged=filtered.concat([lbEntry]);merged.sort(function(a,b){return b.xp-a.xp;});nb[lvObj.key]=merged.slice(0,20);
    await saveBoards(nb);setBoards(nb);

    var rank=0;for(var r=0;r<nb[lvObj.key].length;r++){if(nb[lvObj.key][r].name===currentUser.name&&nb[lvObj.key][r].xp===finalXp&&nb[lvObj.key][r].date===today){rank=r;break;}}
    setResult({xp:finalXp,score:totalEarned,maxScore:totalMax,pct:pct,stars:stars,timeBonus:tb,timeSecs:timeSecs,rank:rank,answers:ansArr});
    setStage("result");
  }

  function doRestart(){
    setLevel("");setPassage("");setTopic("");setQuestions([]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);
    setResult(null);setTimerRunning(false);setTimeExpired(false);setError("");
    setStage("home");
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
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <div style={{paddingTop:46,textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:8}}>📖</div>
              <h1 style={{fontSize:32,fontWeight:900,color:"#34d399",margin:"0 0 6px"}}>Reading Quest</h1>
              <p style={{color:"#6b7280",marginBottom:26,fontSize:15}}>6 question types · Friends · Compete</p>
              <AuthScreen {...{authMode, setAuthMode, authErr, setAuthErr, nameInput, setNameInput, passInput, setPassInput, doLogin, doRegister, CARD, mkBtn, INP}}/>
            </div>
          </Suspense>
        )}

        {/* ── HOME ──────────────────────────────────────────── */}
        {stage==="home"&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <HomeScreen {...{currentUser, myStreak, myData, pendingChallenges, GHOST, CARD, mkBtn, respondChallenge, selectedTypes, Q_LABELS, setSelectedTypes, pill, LEVELS, level, setLevel, setError, error, lv, generate, setStage, setLbLevel, formatTime}}/>
          </Suspense>
        )}

        {/* ── LOADING ───────────────────────────────────────── */}
        {stage==="loading"&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <LoadingScreen {...{loadMsg, level, selectedTypes, lv}}/>
          </Suspense>
        )}

        {/* ── READING ───────────────────────────────────────── */}
        {stage==="reading"&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <ReadingScreen {...{level, topic, passage, selectedTypes, lv, CARD, pill, mkBtn, formatTime, startQuiz}}/>
          </Suspense>
        )}

        {/* ── QUIZ ──────────────────────────────────────────── */}
        {stage==="quiz"&&q&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <QuizScreen {...{q, current, questions, passage, showPassage, setShowPassage, CARD, pill, Q_LABELS, lv, totalXpSoFar, Timer, timerRunning, handleExpire, McqQ, GapWordQ, GapSentQ, MatchingQ, HeadingQ, QAQ, TfnmQ, YnngQ, userAnswers, setUserAnswers, matchState, setMatchState, shuffledRights, headingState, setHeadingState, confirmed, doConfirm, doNext, canConfirm, mkBtn, streak}}/>
          </Suspense>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {stage==="result"&&result&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <ResultsScreen {...{result, level, topic, lv, CARD, mkBtn, pctColor, formatTime, questions, setLbLevel, setStage, setViewingUser, doRestart}}/>
          </Suspense>
        )}

        {/* ── LEADERBOARD ───────────────────────────────────── */}
        {stage==="leaderboard"&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <LeaderboardScreen {...{boards, lbLevel, setLbLevel, LEVELS, GHOST, CARD, mkBtn, currentUser, pctColor, formatTime, getLv, setViewingUser, setStage, doRestart}}/>
          </Suspense>
        )}

        {/* ── FRIENDS ───────────────────────────────────────── */}
        {stage==="friends"&&currentUser&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <FriendsScreen {...{GHOST, CARD, mkBtn, INP, pill, LEVELS, Q_LABELS, currentUser, myData, social, allUsers, friendStage, setFriendStage, socialMsg, setSocialMsg, searchQuery, setSearchQuery, challengeTarget, setChallengeTarget, challengeLevel, setChallengeLevel, challengeTypes, setChallengeTypes, getSearchResults, loadUsers, setAllUsers, getSocial, getUserLevel, calcStreak, acceptRequest, declineRequest, sendRequest, sendChallenge, setViewingUser, setStage}}/>
          </Suspense>
        )}

        {/* ── FRIEND PROFILE ────────────────────────────────── */}
        {stage==="friendProfile"&&viewingUser&&currentUser&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <FriendProfileScreen {...{viewingUser, currentUser, allUsers, social, myData, GHOST, CARD, mkBtn, getSocial, pctColor, formatTime, getLv, getLevelProgress, hasLiked, sendRequest, removeFriend, likeProfile, setChallengeTarget, setStage, setFriendStage, GameChart, socialMsg, setSocialMsg}}/>
          </Suspense>
        )}


        {/* ── MY PROFILE ────────────────────────────────────── */}
        {stage==="profile"&&currentUser&&(
          <Suspense fallback={<div style={{textAlign:"center",paddingTop:60,color:"#6b7280"}}>Loading...</div>}>
            <ProfileScreen {...{currentUser, myData, myStreak, myBestLevel, GHOST, CARD, mkBtn, pctColor, formatTime, getLv, getLevelProgress, doRestart, setStage, GameChart, setCurrentUser, setNameInput, setPassInput, CREDS_KEY}}/>
          </Suspense>
        )}

      </div>
    </div>
    </>
  );
}

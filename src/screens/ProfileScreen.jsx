import React from 'react';

// ProfileScreen Component - Extracted from main App component
// Displays current user's profile with game history and stats
export default function ProfileScreen(props) {
  var {
    currentUser, myData, myStreak, myBestLevel, GHOST, CARD, mkBtn,
    pctColor, formatTime, getLv, getLevelProgress,
    doRestart, setStage, GameChart, setCurrentUser, setNameInput, setPassInput, CREDS_KEY
  } = props;

  return (
    (function(){
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
              <span style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#fbbf24",fontWeight:700}}>🔥 {myStreak} day streak</span>
              <span style={{background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#a78bfa",fontWeight:700}}>Friends: {myData.friends.length}</span>
              <span style={{background:"rgba(236,72,153,0.15)",border:"1px solid rgba(236,72,153,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#f472b6",fontWeight:700}}>Likes: {myData.likes||0}</span>
              <span style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#818cf8",fontWeight:700}}>Best: {myBestLevel}</span>
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
        <div style={{display:"flex",gap:7}}>
          <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),flex:1}}>Play Now</button>
          <button onClick={function(){localStorage.removeItem("rq-session");localStorage.removeItem("rq-creds");setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} style={{...mkBtn("#374151"),flex:1}}>Log Out</button>
        </div>
      </div>);
    })()
  );
}

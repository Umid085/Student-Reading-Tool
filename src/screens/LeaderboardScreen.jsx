import React from 'react';

// LeaderboardScreen Component - Extracted from main App component
export default function LeaderboardScreen(props) {
  var {
    boards, lbLevel, setLbLevel, LEVELS, GHOST, CARD, mkBtn,
    currentUser, pctColor, formatTime, getLv,
    setViewingUser, setStage, doRestart
  } = props;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Leaderboard</h2>
        <button onClick={function(){setStage(currentUser?"home":"auth");}} style={GHOST}>Back</button>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setLbLevel(l.key);}} aria-label={"View leaderboard for CEFR level "+l.key} aria-pressed={lbLevel===l.key} style={{background:lbLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:lbLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(lbLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
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
  );
}

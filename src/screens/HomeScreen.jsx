import React from 'react';

// HomeScreen Component - Extracted from main App component
export default function HomeScreen(props) {
  var {
    currentUser, myStreak, myData, pendingChallenges,
    GHOST, CARD, mkBtn,
    respondChallenge, selectedTypes, Q_LABELS, setSelectedTypes,
    pill, LEVELS, level, setLevel, setError, error, lv,
    generate, setStage, setLbLevel, formatTime
  } = props;

  return (
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
          <button onClick={function(){setStage("friends");}} aria-label="View friends and social interactions" style={GHOST}>Friends</button>
          <button onClick={function(){setStage("profile");}} aria-label="View your profile and stats" style={GHOST}>Profile</button>
          <button onClick={function(){setLbLevel("A1");setStage("leaderboard");}} aria-label="View leaderboard rankings" style={GHOST}>Board</button>
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
      <button onClick={generate} disabled={!level} aria-label={level?"Start quiz for CEFR level "+level:"Select a language level to start quiz"} style={{...mkBtn(level?lv.color:"#374151",level?"#0d0d1a":"#6b7280"),width:"100%",fontSize:15}}>{level?"Start "+level+" Quest!":"Select a level to begin"}</button>
    </div>
  );
}

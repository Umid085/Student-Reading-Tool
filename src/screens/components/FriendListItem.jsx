import React from 'react';

// Memoized friend list item component to prevent unnecessary re-renders
var FriendListItem = React.memo(function FriendListItemComponent(props) {
  var {
    friendName, streak, level, likes, pill, mkBtn,
    onProfile, onChallenge, onChallengeTarget, challengeTarget,
    LEVELS, Q_LABELS, challengeLevel, setChallengeLevel,
    challengeTypes, setChallengeTypes, sendChallenge
  } = props;

  return (
    <div style={{CARD: true,marginBottom:8,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>
          {friendName[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{friendName}</div>
          <div style={{display:"flex",gap:7,marginTop:2}}>
            <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥{streak}d</span>
            <span style={pill("rgba(99,102,241,0.15)","#6366f1")}>Lvl {level}</span>
            <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes:{likes||0}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:5}}>
          <button onClick={onProfile} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>Profile</button>
          <button onClick={function(){onChallengeTarget(friendName);}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"5px 9px",fontSize:11}}>Challenge</button>
        </div>
      </div>
      {challengeTarget===friendName&&(
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
            <button onClick={function(){onChallengeTarget(null);}} style={{...mkBtn("#374151"),flex:1,fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}, function(prevProps, nextProps) {
  return prevProps.friendName === nextProps.friendName &&
         prevProps.streak === nextProps.streak &&
         prevProps.level === nextProps.level &&
         prevProps.likes === nextProps.likes &&
         prevProps.challengeTarget === nextProps.challengeTarget;
});

export default FriendListItem;

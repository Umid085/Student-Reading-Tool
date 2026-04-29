import React from 'react';

// Memoized leaderboard row component to prevent unnecessary re-renders
var LeaderboardRow = React.memo(function LeaderboardRowComponent(props) {
  var {
    entry, index, isCurrentUser, lvdColor, isClickable,
    onClick, formatTime, pctColor
  } = props;

  return (
    <div
      className="rq-lb-row"
      onClick={onClick}
      style={{
        display:"flex",
        alignItems:"center",
        padding:"8px "+(isCurrentUser?"5px":"0"),
        borderBottom:index>=0?"1px solid rgba(255,255,255,0.05)":"none",
        background:isCurrentUser?"rgba(52,211,153,0.06)":"transparent",
        borderRadius:7,
        marginBottom:2,
        cursor:isClickable?"pointer":"default",
        userSelect:"none"
      }}
    >
      <span style={{width:28,fontSize:index<3?13:11,color:index<3?"#fbbf24":"#6b7280",fontWeight:700}}>
        {index===0?"1st":index===1?"2nd":index===2?"3rd":(index+1)}
      </span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:isCurrentUser?lvdColor:"#f3f4f6"}}>
          {entry.name}{isCurrentUser?" (you)":""}
        </div>
        <div style={{fontSize:10,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {entry.topic}
        </div>
      </div>
      <span style={{width:55,textAlign:"right",fontWeight:800,color:"#fbbf24",fontSize:12}}>
        {entry.xp}
      </span>
      <span style={{width:36,textAlign:"right",fontSize:12,color:pctColor(entry.pct)}}>
        {entry.pct}%
      </span>
      <span style={{width:46,textAlign:"right",fontSize:11,color:"#6b7280"}}>
        {formatTime(entry.timeSecs)}
      </span>
    </div>
  );
}, function(prevProps, nextProps) {
  return prevProps.entry.xp === nextProps.entry.xp &&
         prevProps.isCurrentUser === nextProps.isCurrentUser &&
         prevProps.index === nextProps.index;
});

export default LeaderboardRow;

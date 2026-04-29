import React from 'react';

// ResultsScreen Component - Extracted from main App component
// Displays quiz results with score breakdown and action buttons
export default function ResultsScreen(props) {
  var {
    result, level, topic, lv, CARD, mkBtn,
    pctColor, formatTime, questions,
    setLbLevel, setStage, setViewingUser, doRestart
  } = props;

  return (
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
      <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
        <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>BREAKDOWN</p>
        {result.answers&&result.answers.map?result.answers.map(function(ok,i){return<div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:6}}><span style={{fontSize:13,color:ok?"#34d399":"#ef4444"}}>{ok?"✓":"✕"}</span><span style={{fontSize:12,color:"#d1d5db",flex:1}}>{questions[i]?questions[i].q||questions[i].instruction||questions[i].sentence||("Q "+(i+1)):""}</span></div>;}):null}
      </div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={function(){setLbLevel(level);setStage("leaderboard");}} aria-label="View leaderboard for this level" style={{...mkBtn("#6366f1"),flex:1,fontSize:12}}>Leaderboard</button>
        <button onClick={function(){setStage("profile");}} aria-label="View your profile and statistics" style={{...mkBtn("#7c3aed"),flex:1,fontSize:12}}>Profile</button>
        <button onClick={doRestart} aria-label="Take another quiz with new questions" style={{...mkBtn(lv?lv.color:"#34d399","#0d0d1a"),flex:1,fontSize:12}}>Play Again</button>
      </div>
    </div>
  );
}

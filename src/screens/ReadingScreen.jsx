import React from 'react';

// ReadingScreen Component - Extracted from main App component
// Shows reading passage before quiz starts
export default function ReadingScreen(props) {
  var {
    level, topic, passage, selectedTypes, lv, CARD, pill, mkBtn,
    formatTime, startQuiz
  } = props;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={pill(lv?lv.color:"#34d399","#fff")}>{level}</span>
        <span style={{color:"#6b7280",fontSize:12}}>{topic}</span>
      </div>
      <div style={{...CARD,marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:700,color:lv?lv.color:"#34d399",letterSpacing:0.8,marginBottom:8,textTransform:"uppercase"}}>Read carefully - timer starts on Begin</p>
        <p style={{lineHeight:2,fontSize:17,color:"#e5e7eb",margin:0}}>{passage}</p>
      </div>
      <div style={{...CARD,marginBottom:12,padding:12,fontSize:12,color:"#9ca3af",display:"flex",justifyContent:"space-between"}}>
        <span>{selectedTypes.length} question type(s)</span>
        <span>Limit: {formatTime(lv?lv.timeLimit:180)} | Bonus: up to {lv?lv.timeBonus:200} XP</span>
      </div>
      <button onClick={startQuiz} aria-label="Start the quiz timer and begin answering questions" style={{...mkBtn(lv?lv.color:"#f59e0b","#0d0d1a"),width:"100%",fontSize:15}}>Start Timer and Begin!</button>
    </div>
  );
}

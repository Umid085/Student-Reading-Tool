import React from 'react';

import React from 'react';

export default function ReadingScreen(props) {
  var {
    level, topic, passage, selectedTypes, lv, CARD, pill, mkBtn,
    formatTime, startQuiz, tts
  } = props;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={pill(lv?lv.color:"#34d399","#fff")}>{level}</span>
        <span style={{color:"#6b7280",fontSize:12}}>{topic}</span>
      </div>
      <div style={{...CARD,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <p style={{fontSize:11,fontWeight:700,color:lv?lv.color:"#34d399",letterSpacing:0.8,textTransform:"uppercase",margin:0}}>Read carefully - timer starts on Begin</p>
          <button onClick={function(){if(tts.isSpeaking){tts.stop();}else{tts.speak(passage);}}} aria-label={tts.isSpeaking?"Stop reading passage":"Read passage aloud"} style={{background:tts.isSpeaking?"rgba(99,102,241,0.25)":"transparent",border:"1px solid "+(tts.isSpeaking?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:6,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:13,color:tts.isSpeaking?"#c7d2fe":"#9ca3af",fontWeight:700,transition:"all 0.2s"}}>🔊 {tts.isSpeaking?"Stop":"Listen"}</button>
        </div>
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

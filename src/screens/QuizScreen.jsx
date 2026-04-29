import React from 'react';

// QuizScreen Component - Extracted from main App component
// Renders the main quiz interface with question types and answer checking
export default function QuizScreen(props) {
  var {
    q, current, questions, passage, showPassage, setShowPassage,
    CARD, pill, Q_LABELS, lv, totalXpSoFar,
    Timer, timerRunning, handleExpire,
    McqQ, GapWordQ, GapSentQ, MatchingQ, HeadingQ, QAQ, TfnmQ, YnngQ,
    userAnswers, setUserAnswers, matchState, setMatchState, shuffledRights,
    headingState, setHeadingState, confirmed, doConfirm, doNext,
    canConfirm, mkBtn, streak
  } = props;

  return (
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
          {!confirmed?<button onClick={doConfirm} disabled={!canConfirm()} aria-label="Submit answer to check if correct" style={mkBtn(canConfirm()?"#6366f1":"#374151")}>Check Answer</button>
          :<button onClick={doNext} aria-label={current+1>=questions.length?"View results and see your score":"Continue to next question"} style={mkBtn(lv?lv.color:"#34d399","#0d0d1a")}>{current+1>=questions.length?"See Results":"Next Question"}</button>}
        </div>
      </div>
    </div>
  );
}

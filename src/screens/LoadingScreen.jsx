import React from 'react';

// LoadingScreen Component - Extracted from main App component
// Shows loading state while generating quiz
export default function LoadingScreen(props) {
  var {
    loadMsg, level, selectedTypes, lv
  } = props;

  return (
    <div style={{textAlign:"center",paddingTop:90}}>
      <div style={{fontSize:44,marginBottom:14}}>...</div>
      <h3 style={{color:lv?lv.color:"#34d399",fontWeight:800,fontSize:17,marginBottom:8}}>{loadMsg}</h3>
      <p style={{color:"#6b7280",fontSize:13}}>Creating {selectedTypes.length} question type(s) for {level}...</p>
    </div>
  );
}

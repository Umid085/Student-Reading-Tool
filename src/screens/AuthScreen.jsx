import React from 'react';

// AuthScreen Component - Extracted from main App component
export default function AuthScreen(props) {
  var {
    authMode, setAuthMode, authErr, setAuthErr,
    nameInput, setNameInput, passInput, setPassInput,
    doLogin, doRegister,
    CARD, mkBtn, INP
  } = props;

  return (
    <div style={{paddingTop:46,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:8}}>📖</div>
      <h1 style={{fontSize:32,fontWeight:900,color:"#34d399",margin:"0 0 6px"}}>Reading Quest</h1>
      <p style={{color:"#6b7280",marginBottom:26,fontSize:15}}>6 question types · Friends · Compete</p>
      <div style={CARD}>
        <div style={{display:"flex",gap:4,marginBottom:18,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:4}}>
          {["register","login"].map(function(m){return<button key={m} onClick={function(){setAuthMode(m);setAuthErr("");}} aria-label={m==="login"?"Switch to login mode":"Switch to register mode"} style={{flex:1,padding:"10px 0",border:"none",borderRadius:8,fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer",background:authMode===m?"#34d399":"transparent",color:authMode===m?"#0d0d1a":"#6b7280"}}>{m==="login"?"Log In":"Register"}</button>;})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input style={INP} placeholder="Username" value={nameInput} onChange={function(e){setNameInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
          <input style={INP} type="password" placeholder="Password (min 4 chars)" value={passInput} onChange={function(e){setPassInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
        </div>
        {authErr&&<p style={{color:"#f87171",fontSize:14,marginTop:10}}>{authErr}</p>}
        <button onClick={authMode==="login"?doLogin:doRegister} aria-label={authMode==="login"?"Log in with username and password":"Create new account"} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:14}}>{authMode==="login"?"Log In":"Create Account"}</button>
      </div>
    </div>
  );
}

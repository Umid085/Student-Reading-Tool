import React from 'react';

// FriendProfileScreen Component - Extracted from main App component
// Displays another user's profile with comparison stats
export default function FriendProfileScreen(props) {
  var {
    viewingUser, currentUser, allUsers, social, myData, GHOST, CARD, mkBtn,
    getSocial, pctColor, formatTime, getLv, getLevelProgress, hasLiked,
    sendRequest, removeFriend, likeProfile, setChallengeTarget, setStage, setFriendStage,
    GameChart, socialMsg, setSocialMsg
  } = props;

  return (
    (function(){
      var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===viewingUser){fu=allUsers[i];break;}}
      if(!fu)return<div style={{textAlign:"center",padding:40}}><p style={{color:"#6b7280"}}>User not found.</p><button onClick={function(){setStage("friends");}} style={GHOST}>Back</button></div>;
      var fData=getSocial(social,viewingUser);
      fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
      var isFriend=myData.friends.indexOf(viewingUser)!==-1;
      var requested=(fData.requests||[]).indexOf(currentUser.name)!==-1;
      var alreadyLiked=hasLiked(social,currentUser.name,viewingUser);
      var fuGames=fu&&fu.games?fu.games:[];
      var fBest=(function(){for(var l of ["C2","C1","B2","B1","A2","A1"]){for(var g of fuGames){if(g.level===l)return l;}}return "N/A";})();
      var totalXp=fuGames.reduce(function(s,g){return s+(g.xp||0);},0);
      var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct||0);},0)/fuGames.length):0;
      var fLvlInfo=getLevelProgress(totalXp);
      var curGames=currentUser&&currentUser.games?currentUser.games:[];
      var myTotalXp=curGames.reduce(function(s,g){return s+(g.xp||0);},0);
      var myAvgPct=curGames.length?Math.round(curGames.reduce(function(s,g){return s+(g.pct||0);},0)/curGames.length):0;
      var fStreak=(function(){var s=0;var g=fuGames.slice().reverse();for(var i=0;i<g.length;i++){var d=new Date(g[i].date).toDateString();var prev=i>0?new Date(g[i-1].date).toDateString():"";var diff=i>0?(new Date(d)-new Date(prev))/(1000*60*60*24):1;if(diff!==1&&i>0)break;s++;}return s;})();

      return(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>{viewingUser}'s Profile</h2>
          <button onClick={function(){setStage("friends");setSocialMsg("");}} style={GHOST}>Back</button>
        </div>
        {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

        {/* identity */}
        <div style={{...CARD,marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>{viewingUser[0].toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <div style={{fontSize:18,fontWeight:900,color:"#f9fafb"}}>{viewingUser}</div>
              <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",padding:"2px 8px",borderRadius:999,fontSize:12,fontWeight:900,color:"#0d0d1a"}}>⭐ Lvl {fLvlInfo.level}</div>
            </div>
            <div style={{fontSize:11,color:"#6b7280"}}>Joined {fu.joined}</div>
            <div style={{display:"flex",gap:7,marginTop:4}}>
              <span style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#fbbf24",fontWeight:700}}>🔥 {fStreak} day streak</span>
              <span style={{background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#a78bfa",fontWeight:700}}>Best: {fBest}</span>
              <span style={{background:"rgba(236,72,153,0.15)",border:"1px solid rgba(236,72,153,0.3)",borderRadius:999,padding:"3px 9px",fontSize:11,color:"#ec4899",fontWeight:fData.likes>0?700:400}}>❤️ {fData.likes||0} {fData.likes===1?"Like":"Likes"}</span>
            </div>
          </div>
        </div>
        <div style={{...CARD,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:"#9ca3af"}}>LEVEL {fLvlInfo.level} PROGRESS</span>
            <span style={{fontSize:10,color:"#6b7280"}}>{fLvlInfo.xpNeeded} XP to next</span>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:fLvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s ease"}}/>
          </div>
        </div>

        {/* actions */}
        <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
          {!isFriend&&!requested&&<button onClick={function(){sendRequest(viewingUser);}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12,minWidth:100}}>Add Friend</button>}
          {requested&&<button disabled style={{...mkBtn("#374151"),flex:1,fontSize:12,minWidth:100}}>Request Sent</button>}
          {isFriend&&<button onClick={function(){removeFriend(viewingUser);setStage("friends");}} style={{...mkBtn("#374151"),flex:1,fontSize:12,minWidth:100}}>Remove Friend</button>}
          <button onClick={function(){likeProfile(viewingUser);}} disabled={alreadyLiked||viewingUser===currentUser.name} style={{...mkBtn(alreadyLiked?"#374151":"#ec4899"),flex:1,fontSize:12,minWidth:90,transition:"all 0.2s ease",transform:alreadyLiked?"scale(0.98)":"scale(1)"}}>{alreadyLiked?"❤️ Liked":"❤️ Like"}</button>
          {isFriend&&<button onClick={function(){setChallengeTarget(viewingUser);setStage("friends");setFriendStage("list");}} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12,minWidth:100}}>Challenge</button>}
        </div>

        {/* stats */}
        <div style={{display:"flex",gap:7,marginBottom:12}}>
          {[{v:fu&&fu.games?fu.games.length:0,l:"Games",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)},{v:fData.friends?fData.friends.length:0,l:"Friends",c:"#a78bfa"}].map(function(s){
            return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
          })}
        </div>

        {/* comparison */}
        {currentUser&&currentUser.games&&currentUser.games.length>0&&fu&&fu.games&&fu.games.length>0&&(
          <div style={{...CARD,marginBottom:12,padding:14}}>
            <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,marginBottom:10}}>HEAD TO HEAD</p>
            {[{label:"Total XP",my:myTotalXp,their:totalXp},{label:"Avg Score",my:myAvgPct,their:avgPct},{label:"Games Played",my:curGames.length,their:fuGames.length}].map(function(row){
              var myWin=row.my>row.their;
              var myPct=row.my+row.their>0?(row.my/(row.my+row.their)*100):50;
              return(<div key={row.label} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginBottom:3}}><span style={{color:myWin?"#34d399":"#f3f4f6",fontWeight:myWin?700:400}}>{currentUser.name}: {row.my}</span><span style={{fontSize:10,color:"#4b5563"}}>{row.label}</span><span style={{color:!myWin?"#f472b6":"#f3f4f6",fontWeight:!myWin?700:400}}>{viewingUser}: {row.their}</span></div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6,overflow:"hidden",display:"flex"}}>
                  <div style={{height:"100%",width:myPct+"%",background:"#34d399",borderRadius:myPct>50?"999 0 0 999":"999"}}/>
                  <div style={{height:"100%",width:(100-myPct)+"%",background:"#f472b6",borderRadius:myPct<50?"999 0 0 999":"999"}}/>
                </div>
              </div>);
            })}
          </div>
        )}

        {/* game history chart */}
        {fu.games.length>0&&(
          <div style={{marginBottom:12}}>
            <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>XP HISTORY</p>
            <GameChart games={fu.games}/>
          </div>
        )}

        {/* recent games */}
        {fu.games.length>0&&(
          <div style={{...CARD,marginBottom:12}}>
            <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>RECENT GAMES</p>
            {fu.games.slice().reverse().slice(0,6).map(function(g,i){
              var glv=getLv(g.level);
              return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.05)":"none"}}>
                <span style={{fontSize:11,fontWeight:900,color:glv.color,width:20}}>{g.level}</span>
                <div style={{flex:1}}><div style={{fontSize:12,color:"#f3f4f6"}}>{g.topic}</div><div style={{fontSize:10,color:"#6b7280"}}>{g.date}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{g.xp} XP</div><div style={{fontSize:10,color:pctColor(g.pct)}}>{g.pct}%</div></div>
              </div>);
            })}
          </div>
        )}
        {fu.games.length===0&&<div style={{...CARD,textAlign:"center",padding:28}}><p style={{color:"#6b7280"}}>No games played yet.</p></div>}
      </div>);
    })()
  );
}

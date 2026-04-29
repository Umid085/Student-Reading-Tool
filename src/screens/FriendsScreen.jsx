import React, { useCallback } from 'react';

function FriendsScreen(props) {
  var {
    GHOST, CARD, mkBtn, INP, pill, LEVELS, Q_LABELS,
    currentUser, myData, social, allUsers,
    friendStage, setFriendStage, socialMsg, setSocialMsg,
    searchQuery, setSearchQuery, challengeTarget, setChallengeTarget,
    challengeLevel, setChallengeLevel, challengeTypes, setChallengeTypes,
    getSearchResults, loadUsers, setAllUsers, getSocial, getUserLevel,
    calcStreak, acceptRequest, declineRequest, sendRequest, sendChallenge,
    setViewingUser, setStage
  } = props;

  var goHome = useCallback(function(){setStage("home");setSocialMsg("");}, [setStage, setSocialMsg]);
  var handleTabClick = useCallback(function(tab){setFriendStage(tab);setSocialMsg("");}, [setFriendStage, setSocialMsg]);
  var handleSearchChange = useCallback(function(e){setSearchQuery(e.target.value);}, [setSearchQuery]);
  var handleRefreshUsers = useCallback(function(){loadUsers().then(function(u){setAllUsers(u);setSocialMsg("User list refreshed!");});}, [loadUsers, setAllUsers, setSocialMsg]);
  var handleViewUser = useCallback(function(name){setViewingUser(name);setStage("friendProfile");}, [setViewingUser, setStage]);
  var handleChallengeTargetSet = useCallback(function(name){setChallengeTarget(name);}, [setChallengeTarget]);
  var handleChallengeTargetClear = useCallback(function(){setChallengeTarget(null);}, [setChallengeTarget]);
  var handleChallengeLevelSelect = useCallback(function(level){setChallengeLevel(level);}, [setChallengeLevel]);
  var handleChallengeTypeToggle = useCallback(function(type){setChallengeTypes(function(prev){var on=prev.indexOf(type)!==-1;if(on&&prev.length===1)return prev;if(on)return prev.filter(function(x){return x!==type;});return prev.concat([type]);});}, [setChallengeTypes]);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>Friends</h2>
        <button onClick={goHome} style={GHOST}>Back</button>
      </div>
      {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

      {/* tabs */}
      <div style={{display:"flex",gap:5,marginBottom:14}}>
        {[["search","Search"],["requests","Requests ("+(myData.requests.length)+")"],["list","My Friends ("+myData.friends.length+")"]].map(function(t){
          return<button key={t[0]} onClick={function(){handleTabClick(t[0]);}} style={{background:friendStage===t[0]?"#a78bfa":"rgba(255,255,255,0.05)",color:friendStage===t[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>;
        })}
      </div>

      {/* SEARCH TAB */}
      {friendStage==="search"&&(
        <div>
          <div style={{position:"relative",marginBottom:8}}>
            <input style={{...INP,paddingLeft:36}} placeholder="Search by username (min 2 chars)..." value={searchQuery} onChange={handleSearchChange}/>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.5}}>🔍</span>
          </div>
          <button onClick={handleRefreshUsers} style={{...mkBtn("#374151"),width:"100%",marginBottom:12,fontSize:13,padding:"9px 0"}}>Refresh User List</button>
          {getSearchResults().map(function(u){
            var isFriend=myData.friends.indexOf(u.name)!==-1;
            var requested=(getSocial(social,u.name).requests||[]).indexOf(currentUser.name)!==-1;
            var uData=getSocial(social,u.name);
            var uTotalXp=u.games?u.games.reduce(function(s,g){return s+g.xp;},0):0;
            var uLevel=getUserLevel(uTotalXp);
            return(<div key={u.name} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>{u.name[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{u.name}</div>
                <div style={{fontSize:11,color:"#6b7280"}}>Lvl {uLevel} | Games: {u.games?u.games.length:0} | {uTotalXp} XP | Likes: {uData.likes||0}</div>
              </div>
              <div style={{display:"flex",gap:5}}>
                <button onClick={function(){handleViewUser(u.name);}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>View</button>
                {!isFriend&&!requested&&<button onClick={function(){sendRequest(u.name);}} style={{...mkBtn("#6366f1"),padding:"5px 9px",fontSize:11}}>Add</button>}
                {requested&&<span style={{fontSize:11,color:"#6b7280",padding:"5px 0"}}>Pending</span>}
                {isFriend&&<span style={{fontSize:11,color:"#34d399",padding:"5px 0"}}>Friends</span>}
              </div>
            </div>);
          })}
          {searchQuery.length>=2&&getSearchResults().length===0&&<p style={{color:"#6b7280",textAlign:"center",padding:20}}>No users found for "{searchQuery}"</p>}
        </div>
      )}

      {/* REQUESTS TAB */}
      {friendStage==="requests"&&(
        <div>
          {myData.requests.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No pending friend requests.</p></div>}
          {myData.requests.map(function(from){
            return(<div key={from} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{from[0].toUpperCase()}</div>
              <span style={{flex:1,fontSize:14,fontWeight:600,color:"#f3f4f6"}}>{from} wants to be friends</span>
              <button onClick={function(){acceptRequest(from);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"6px 11px",fontSize:12}}>Accept</button>
              <button onClick={function(){declineRequest(from);}} style={{...mkBtn("#374151"),padding:"6px 11px",fontSize:12}}>Decline</button>
            </div>);
          })}
        </div>
      )}

      {/* FRIENDS LIST TAB */}
      {friendStage==="list"&&(
        <div>
          {myData.friends.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No friends yet. Search to add some!</p></div>}
          {myData.friends.map(function(fname){
            var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===fname){fu=allUsers[i];break;}}
            var fuGames=fu&&fu.games?fu.games:[];
            var fStreak=calcStreak(fuGames);
            var fData=getSocial(social,fname);
            fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
            var fTotalXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
            var fLevel=getUserLevel(fTotalXp);
            return(<div key={fname} style={{...CARD,marginBottom:8,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{fname[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{fname}</div>
                  <div style={{display:"flex",gap:7,marginTop:2}}>
                    <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥{fStreak}d</span>
                    <span style={pill("rgba(99,102,241,0.15)","#6366f1")}>Lvl {fLevel}</span>
                    <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes:{fData.likes||0}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={function(){handleViewUser(fname);}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>Profile</button>
                  <button onClick={function(){handleChallengeTargetSet(fname);}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"5px 9px",fontSize:11}}>Challenge</button>
                </div>
              </div>
              {challengeTarget===fname&&(
                <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:10,padding:10,marginTop:4}}>
                  <p style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:7}}>Challenge Settings</p>
                  <div style={{display:"flex",gap:5,marginBottom:7,flexWrap:"wrap"}}>
                    {LEVELS.map(function(l){return<button key={l.key} onClick={function(){handleChallengeLevelSelect(l.key);}} style={{background:challengeLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:challengeLevel===l.key?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                    {Object.keys(Q_LABELS).map(function(t){var on=challengeTypes.indexOf(t)!==-1;return<button key={t} onClick={function(){handleChallengeTypeToggle(t);}} style={{background:on?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(on?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"3px 9px",fontSize:10,color:on?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>{Q_LABELS[t]}</button>;})}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={sendChallenge} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12}}>Send Challenge</button>
                    <button onClick={handleChallengeTargetClear} style={{...mkBtn("#374151"),flex:1,fontSize:12}}>Cancel</button>
                  </div>
                </div>
              )}
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(FriendsScreen, function(prev, next) {
  return prev.friendStage === next.friendStage && prev.searchQuery === next.searchQuery && prev.myData === next.myData && prev.challengeTarget === next.challengeTarget && prev.challengeLevel === next.challengeLevel && prev.challengeTypes === next.challengeTypes;
});

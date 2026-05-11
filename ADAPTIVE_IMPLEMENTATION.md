# Adaptive Difficulty Implementation Guide

**Version:** 1.0  
**Ready-to-Code:** JavaScript/React snippets for integration

---

## Quick Start

This guide provides copy-paste code for integrating adaptive difficulty into the existing app.

---

## 1. Utility Functions Module

**File:** `src/adaptiveUtils.js` (NEW)

```javascript
// ── Adaptive Difficulty Utilities ──────────────────────────────

// Target WPM by CEFR level
const LEVEL_TARGET_WPM = {
  "A1": 90,
  "A2": 115,
  "B1": 145,
  "B2": 175,
  "C1": 205,
  "C2": 235
};

// Level progression mapping
const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getNextLevel(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx >= 0 && idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : level;
}

function getPrevLevel(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx > 0 ? LEVEL_ORDER[idx - 1] : level;
}

function calculateMasterScore(avgQuizScore, vocabMastery, readingSpeedRatio) {
  // Normalize vocab and speed to 0-1 range
  const vocabNorm = Math.min(vocabMastery / 100, 1.0);
  const speedNorm = Math.min(readingSpeedRatio, 2.0) / 2.0; // Cap at 2.0, normalize to 0-1
  
  return (avgQuizScore * 0.5) + (vocabNorm * 0.3) + (speedNorm * 0.2);
}

function calculateAverage(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getRecommendation(masterScore, currentLevel) {
  if (masterScore >= 0.80) {
    return getNextLevel(currentLevel);
  } else if (masterScore < 0.50) {
    return getPrevLevel(currentLevel);
  } else {
    return currentLevel;
  }
}

function initializeAdaptiveState(userId, startLevel) {
  return {
    userId: userId,
    currentLevel: startLevel || "A1",
    recommendedLevel: startLevel || "A1",
    recommendationHistory: [],
    recommendationCount: 0,
    lastRecommendationChange: new Date().toISOString(),
    masterScores: {},
    vocabMastery: {},
    readingSpeed: {},
    levelHistory: [
      {
        level: startLevel || "A1",
        startDate: new Date().toLocaleDateString(),
        endDate: null,
        quizzes: 0,
        avgScore: 0,
        avgWpm: 0,
        vocabMastery: 0,
        reason: "User initialization"
      }
    ],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastQuizDate: null,
    totalQuizzesCompleted: 0,
    recommendationsMade: 0,
    levelChanges: 0,
    averageMasterScore: 0
  };
}

export {
  calculateMasterScore,
  calculateAverage,
  getRecommendation,
  getNextLevel,
  getPrevLevel,
  initializeAdaptiveState,
  LEVEL_TARGET_WPM,
  LEVEL_ORDER
};
```

---

## 2. Adaptive Update Function

**File:** `src/adaptiveEngine.js` (NEW)

```javascript
import { 
  calculateMasterScore, 
  calculateAverage, 
  getRecommendation,
  getNextLevel,
  getPrevLevel,
  initializeAdaptiveState,
  LEVEL_TARGET_WPM 
} from './adaptiveUtils.js';

async function updateAdaptiveDifficulty(userId, currentLevel, gameEntry, vocab) {
  try {
    // Step 1: Fetch or initialize adaptive state
    let adaptive = await fetchAdaptiveDataSafe(userId);
    if (!adaptive) {
      adaptive = initializeAdaptiveState(userId, currentLevel);
    }

    // Step 2: Extract quiz metrics
    const quizScore = (gameEntry.pct || 0) / 100; // Normalize to 0-1
    const wpm = gameEntry.wpm || 0;
    
    // Step 3: Compute vocabulary snapshot
    const vocabKnown = vocab && vocab.filter(w => w.status === "known").length || 0;
    const vocabAttempted = vocab && vocab.length || 0;
    const vocabPct = vocabAttempted > 0 ? vocabKnown / vocabAttempted : 0.5;
    
    // Step 4: Update masterScores array (keep last 5)
    if (!adaptive.masterScores[currentLevel]) {
      adaptive.masterScores[currentLevel] = [];
    }
    // Note: masterScore will be computed after all components are updated
    adaptive.masterScores[currentLevel].push(quizScore);
    if (adaptive.masterScores[currentLevel].length > 5) {
      adaptive.masterScores[currentLevel].shift();
    }

    // Step 5: Update vocabulary mastery
    adaptive.vocabMastery[currentLevel] = {
      known: vocabKnown,
      attempted: vocabAttempted,
      pct: vocabPct
    };

    // Step 6: Update reading speed (running average)
    if (!adaptive.readingSpeed[currentLevel]) {
      adaptive.readingSpeed[currentLevel] = { wpm: 0, count: 0 };
    }
    const speedData = adaptive.readingSpeed[currentLevel];
    if (speedData.count === 0) {
      speedData.wpm = wpm;
    } else {
      speedData.wpm = (speedData.wpm * speedData.count + wpm) / (speedData.count + 1);
    }
    speedData.count += 1;

    // Step 7: Compute new masterScore
    const avgQuizScore = calculateAverage(adaptive.masterScores[currentLevel]);
    const vocabMastery = (adaptive.vocabMastery[currentLevel] || {}).pct || 0.5;
    const targetWpm = LEVEL_TARGET_WPM[currentLevel] || 115;
    const speedRatio = targetWpm > 0 ? wpm / targetWpm : 1.0;
    
    const newMasterScore = calculateMasterScore(avgQuizScore, vocabMastery * 100, speedRatio);

    // Step 8: Get recommendation
    const newRecommendation = getRecommendation(newMasterScore, currentLevel);
    const recommendationChanged = (newRecommendation !== adaptive.recommendedLevel);

    // Step 9: Handle hysteresis
    if (recommendationChanged) {
      adaptive.recommendationCount = 1;
      adaptive.recommendedLevel = newRecommendation;
      adaptive.lastRecommendationChange = new Date().toISOString();
    } else {
      // Same recommendation continues
      if (adaptive.recommendedLevel === newRecommendation) {
        adaptive.recommendationCount = (adaptive.recommendationCount || 0) + 1;
      } else {
        adaptive.recommendationCount = 0;
      }
      adaptive.recommendedLevel = newRecommendation;
    }

    // Step 10: Check if we should apply the recommendation
    let shouldApply = false;
    let levelChangeResult = null;
    
    if (adaptive.recommendationCount >= 2 && newRecommendation !== currentLevel) {
      shouldApply = true;
      levelChangeResult = {
        applied: true,
        oldLevel: currentLevel,
        newLevel: newRecommendation,
        reason: `masterScore=${newMasterScore.toFixed(2)} sustained across ${adaptive.recommendationCount} quizzes`,
        masterScore: newMasterScore,
        quizScore: avgQuizScore,
        vocabMastery: vocabMastery,
        readingSpeed: speedRatio
      };
    } else {
      levelChangeResult = {
        applied: false,
        suggestion: newRecommendation,
        masterScore: newMasterScore,
        quizzesNeeded: Math.max(0, 2 - adaptive.recommendationCount),
        quizScore: avgQuizScore,
        vocabMastery: vocabMastery,
        readingSpeed: speedRatio
      };
    }

    // Step 11: Update metadata
    adaptive.totalQuizzesCompleted = (adaptive.totalQuizzesCompleted || 0) + 1;
    adaptive.lastUpdated = new Date().toISOString();
    adaptive.lastQuizDate = new Date().toISOString();
    
    if (shouldApply) {
      adaptive.recommendationsMade = (adaptive.recommendationsMade || 0) + 1;
      adaptive.levelChanges = (adaptive.levelChanges || 0) + 1;
      
      // Update level history
      if (adaptive.levelHistory && adaptive.levelHistory.length > 0) {
        const currentEntry = adaptive.levelHistory[adaptive.levelHistory.length - 1];
        if (currentEntry.level === currentLevel) {
          currentEntry.endDate = new Date().toLocaleDateString();
          currentEntry.quizzes = (currentEntry.quizzes || 0) + 1;
          currentEntry.avgScore = newMasterScore;
          currentEntry.avgWpm = speedData.wpm;
          currentEntry.vocabMastery = vocabMastery;
        }
      }
      
      // Add new level to history
      adaptive.levelHistory.push({
        level: newRecommendation,
        startDate: new Date().toLocaleDateString(),
        endDate: null,
        quizzes: 0,
        avgScore: 0,
        avgWpm: 0,
        vocabMastery: 0,
        reason: `Recommended upgrade from ${currentLevel} (masterScore=${newMasterScore.toFixed(2)})`
      });
    } else {
      // Update current level's history
      if (adaptive.levelHistory && adaptive.levelHistory.length > 0) {
        const currentEntry = adaptive.levelHistory[adaptive.levelHistory.length - 1];
        if (currentEntry.level === currentLevel && !currentEntry.endDate) {
          currentEntry.quizzes = (currentEntry.quizzes || 0) + 1;
          currentEntry.avgScore = newMasterScore;
          currentEntry.avgWpm = speedData.wpm;
          currentEntry.vocabMastery = vocabMastery;
        }
      }
    }

    // Step 12: Save to Firebase (async, fire-and-forget)
    saveAdaptiveDataAsync(userId, adaptive);

    return {
      ...levelChangeResult,
      fullAdaptiveData: adaptive
    };
  } catch (err) {
    console.error("Error in updateAdaptiveDifficulty:", err);
    return {
      applied: false,
      error: err.message,
      fullAdaptiveData: null
    };
  }
}

async function fetchAdaptiveDataSafe(userId) {
  try {
    // Try Firebase first
    const resp = await fetch('/.netlify/functions/storage?key=rq-adaptive-v1-' + userId);
    if (resp.ok) {
      const data = await resp.json();
      if (data.value) {
        return JSON.parse(data.value);
      }
    }
  } catch (e) {
    console.log("Firebase fetch failed, falling back to localStorage");
  }

  // Fallback to localStorage
  const cached = localStorage.getItem('rq-adaptive-v1-' + userId);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Failed to parse cached adaptive data:", e);
    }
  }

  return null;
}

async function saveAdaptiveDataAsync(userId, data) {
  try {
    // Save to localStorage immediately
    localStorage.setItem('rq-adaptive-v1-' + userId, JSON.stringify(data));
    
    // Fire-and-forget Firebase write (don't await, don't block)
    fetch('/.netlify/functions/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'rq-adaptive-v1-' + userId,
        value: JSON.stringify(data)
      })
    }).catch(err => console.log("Firebase write failed (non-blocking):", err));
  } catch (err) {
    console.error("Error saving adaptive data:", err);
  }
}

export {
  updateAdaptiveDifficulty,
  fetchAdaptiveDataSafe,
  saveAdaptiveDataAsync
};
```

---

## 3. Integration into `doFinish()`

**File:** `src/student-reading-quest.jsx` (MODIFY)

In the `doFinish()` function, after the leaderboard and user save operations, add:

```javascript
async function doFinish(){
  var timeSecs=startTimeRef.current?Math.round((Date.now()-startTimeRef.current)/1000):(lv?lv.timeLimit:180);
  var totalEarned=0,totalMax=0,ansArr=[],typeStats={};
  for(var i=0;i<questions.length;i++){
    var qs=questions[i],ans=null;
    if(qs.type==="matching")ans=matchState;
    else if(qs.type==="heading")ans=headingState;
    else ans=userAnswers[i]!==undefined?userAnswers[i]:null;
    var pts=scoreQuestion(qs,ans),mx=maxPoints(qs);
    ansArr.push(pts>=Math.ceil(mx/2));totalEarned+=pts;totalMax+=mx;
    if(!typeStats[qs.type])typeStats[qs.type]={earned:0,max:0};
    typeStats[qs.type].earned+=pts;typeStats[qs.type].max+=mx;
  }
  var pct=totalMax>0?Math.round((totalEarned/totalMax)*100):0;
  var stars=pct>=90?5:pct>=75?4:pct>=60?3:pct>=40?2:1;
  var lvObj=lv||LEVELS[0];
  var tb=Math.round(lvObj.timeBonus*Math.max(0,(lvObj.timeLimit-timeSecs)/lvObj.timeLimit));
  var finalXp=Math.round(totalEarned*lvObj.mult*100)+tb+(streak>=3?50:0);
  var today=new Date().toLocaleDateString();

  // ... existing code for badgesBefore, quests, etc ...

  var wpm=getWpmFromSecs(passage.split(/\s+/).length,readingTimerSecs);
  var gameEntry={level:lvObj.key,score:totalEarned,total:totalMax,xp:finalXp,pct:pct,timeSecs:timeSecs,timeBonus:tb,topic:topic,date:today,typeStats:typeStats,isDaily:isDailyGame||false,storyId:currentStoryId||null,wpm:wpm};
  
  // ... existing user, boards, challenge, daily, weekly saves ...

  // ──── NEW: ADAPTIVE DIFFICULTY UPDATE ────
  try {
    const { updateAdaptiveDifficulty } = await import('./adaptiveEngine.js');
    const adaptiveResult = await updateAdaptiveDifficulty(
      currentUser.name,
      lvObj.key,
      gameEntry,
      vocab
    );
    
    if (adaptiveResult.fullAdaptiveData) {
      setAdaptiveData(adaptiveResult.fullAdaptiveData);
    }
    
    if (adaptiveResult.applied) {
      // Level was promoted after hysteresis
      setRecommendedLevel(adaptiveResult.newLevel);
      setShowLevelRecommendation(true);
      console.log("Level promotion triggered:", adaptiveResult);
    } else if (adaptiveResult.suggestion && adaptiveResult.suggestion !== lvObj.key) {
      // Suggestion shown but not yet applied
      setRecommendedLevel(adaptiveResult.suggestion);
      setRecommendationCountdown(adaptiveResult.quizzesNeeded);
    }
  } catch (err) {
    console.error("Adaptive difficulty update failed:", err);
  }
  // ────────────────────────────────────────

  // ... rest of doFinish() ...
  setResult({xp:finalXp,score:totalEarned,maxScore:totalMax,pct:pct,stars:stars,timeBonus:tb,timeSecs:timeSecs,rank:rank,answers:ansArr,typeStats:typeStats,wasDaily:wasDaily,newBadges:newBadgeIds,newQuests:newQuestItems,questBonus:questBonus,wpm:wpm,storyId:currentStoryId||null,earnedShield:newShields>shields,newStreakVal:newStreakVal,completedGoals:completedGoalIds});
  setStage("result");
}
```

---

## 4. Add React State Variables

**File:** `src/student-reading-quest.jsx` (ADD to useState declarations)

```javascript
// At the top with other useState declarations:

const [adaptiveData, setAdaptiveData] = useState(null);
const [masterScore, setMasterScore] = useState(null);
const [recommendedLevel, setRecommendedLevel] = useState(null);
const [showLevelRecommendation, setShowLevelRecommendation] = useState(false);
const [recommendationCountdown, setRecommendationCountdown] = useState(0);
```

---

## 5. Load Adaptive Data on Login

**File:** `src/student-reading-quest.jsx` (ADD to useEffect for login/user load)

```javascript
// In the useEffect that runs after currentUser is set:

useEffect(() => {
  if (!currentUser) return;
  
  const loadAdaptiveData = async () => {
    try {
      const { fetchAdaptiveDataSafe, initializeAdaptiveState } = await import('./adaptiveEngine.js');
      let data = await fetchAdaptiveDataSafe(currentUser.name);
      
      if (!data) {
        // Initialize for new user
        const { initializeAdaptiveState } = await import('./adaptiveUtils.js');
        data = initializeAdaptiveState(currentUser.name, 'A1');
      }
      
      setAdaptiveData(data);
      setRecommendedLevel(data.recommendedLevel);
    } catch (err) {
      console.error("Error loading adaptive data:", err);
    }
  };
  
  loadAdaptiveData();
}, [currentUser]);
```

---

## 6. Results Screen UI Update

**File:** `src/student-reading-quest.jsx` (MODIFY results screen render)

Add this section to the results screen display (after score/XP info):

```javascript
// In the results screen render (screen === "result"):

{result && (
  <div>
    {/* Existing result content */}
    
    {/* NEW: Adaptive Insights Card */}
    {adaptiveData && (
      <div style={{
        background:"rgba(99,102,241,0.1)",
        border:"1px solid rgba(99,102,241,0.3)",
        borderRadius:12,
        padding:16,
        marginTop:16
      }}>
        <div style={{fontSize:12,fontWeight:700,color:"#818cf8",marginBottom:8}}>
          📈 YOUR PROGRESS ({adaptiveData.currentLevel})
        </div>
        
        {masterScore !== null && (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:"#d1d5db"}}>Mastery Score</span>
              <span style={{color:"#34d399",fontWeight:700}}>
                {(masterScore * 100).toFixed(0)}%
              </span>
            </div>
            
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:"#d1d5db"}}>• Quiz avg</span>
              <span style={{color:"#f59e0b"}}>{(result.pct || 0)}%</span>
            </div>
            
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:"#d1d5db"}}>• Vocabulary mastery</span>
              <span style={{color:"#34d399"}}>
                {adaptiveData.vocabMastery[adaptiveData.currentLevel]?.pct 
                  ? (adaptiveData.vocabMastery[adaptiveData.currentLevel].pct * 100).toFixed(0) 
                  : '—'}%
              </span>
            </div>
            
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:"#d1d5db"}}>• Reading speed</span>
              <span style={{color:"#a78bfa"}}>{result.wpm || 0} WPM</span>
            </div>
          </div>
        )}
        
        {/* Level Recommendation */}
        {showLevelRecommendation && recommendedLevel && recommendedLevel !== adaptiveData.currentLevel && (
          <div style={{
            marginTop:12,
            padding:12,
            background:"rgba(52,211,153,0.15)",
            border:"1px solid rgba(52,211,153,0.3)",
            borderRadius:8
          }}>
            <div style={{fontSize:14,fontWeight:700,color:"#34d399",marginBottom:4}}>
              🎯 Ready for {recommendedLevel}!
            </div>
            <div style={{fontSize:12,color:"#a7f3d0"}}>
              You've shown consistent mastery. Try {recommendedLevel} next!
            </div>
          </div>
        )}
        
        {/* Recommendation Countdown */}
        {!showLevelRecommendation && recommendedLevel && recommendedLevel !== adaptiveData.currentLevel && recommendationCountdown > 0 && (
          <div style={{
            marginTop:12,
            padding:12,
            background:"rgba(251,191,36,0.1)",
            border:"1px solid rgba(251,191,36,0.3)",
            borderRadius:8
          }}>
            <div style={{fontSize:14,fontWeight:700,color:"#fbbf24",marginBottom:4}}>
              ✨ {recommendationCountdown} more quiz{recommendationCountdown !== 1 ? 'zes' : ''} for {recommendedLevel}
            </div>
            <div style={{fontSize:12,color:"#fcd34d"}}>
              Keep up this performance to unlock {recommendedLevel}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

---

## 7. Level Selector Badge

**File:** `src/student-reading-quest.jsx` (MODIFY home screen level buttons)

When rendering level selector buttons, add badge for recommended level:

```javascript
// In home screen rendering where levels are shown:

{LEVELS.map(function(lv) {
  var isRec = recommendedLevel === lv.key && recommendedLevel !== adaptiveData?.currentLevel;
  return (
    <button
      key={lv.key}
      onClick={function() { if (!disabled) { setLevel(lv.key); generate(); } }}
      style={{
        position: "relative",
        // ... existing button styles ...
      }}
    >
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: lv.color
      }}>
        {lv.key}
      </span>
      
      {/* Recommendation badge */}
      {isRec && (
        <span style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          background: "#34d399",
          color: "#0d0d1a",
          fontSize: "10px",
          fontWeight: "900",
          padding: "2px 6px",
          borderRadius: "999px"
        }}>
          READY!
        </span>
      )}
    </button>
  );
})}
```

---

## 8. Profile Screen Adaptive Insights Card

**File:** `src/student-reading-quest.jsx` (ADD to profile screen)

Add to profile screen render:

```javascript
{/* ADAPTIVE INSIGHTS CARD */}
{adaptiveData && (
  <div style={{
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  }}>
    <h3 style={{fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 12}}>
      📊 ADAPTIVE INSIGHTS
    </h3>
    
    <div style={{display: "flex", flexDirection: "column", gap: 10}}>
      {/* Level journey */}
      <div>
        <div style={{fontSize: 11, color: "#9ca3af", marginBottom: 4}}>Level Journey</div>
        {adaptiveData.levelHistory && adaptiveData.levelHistory.map((entry, idx) => (
          <div key={idx} style={{fontSize: 12, color: "#d1d5db"}}>
            {entry.level}
            {entry.endDate && ` (${entry.startDate} – ${entry.endDate})`}
            {!entry.endDate && ` (${entry.startDate} – now)`}
          </div>
        ))}
      </div>
      
      {/* Current mastery */}
      <div>
        <div style={{fontSize: 11, color: "#9ca3af", marginBottom: 4}}>Current Mastery</div>
        <div style={{fontSize: 12, color: "#34d399"}}>
          {adaptiveData.currentLevel}: 
          {adaptiveData.levelHistory && adaptiveData.levelHistory.length > 0
            ? (adaptiveData.levelHistory[adaptiveData.levelHistory.length - 1].avgScore * 100).toFixed(0)
            : '—'}%
        </div>
      </div>
      
      {/* Recommendation status */}
      <div>
        <div style={{fontSize: 11, color: "#9ca3af", marginBottom: 4}}>Recommendation</div>
        {adaptiveData.recommendedLevel === adaptiveData.currentLevel ? (
          <div style={{fontSize: 12, color: "#fbbf24"}}>
            ✓ Master {adaptiveData.currentLevel} — keep building!
          </div>
        ) : (
          <div style={{fontSize: 12, color: "#34d399"}}>
            → Next: {adaptiveData.recommendedLevel}
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div style={{display: "flex", gap: 12, fontSize: 12}}>
        <div>
          <span style={{color: "#6b7280"}}>Quizzes:</span>
          <span style={{color: "#f59e0b", fontWeight: 700, marginLeft: 4}}>
            {adaptiveData.totalQuizzesCompleted}
          </span>
        </div>
        <div>
          <span style={{color: "#6b7280"}}>Level Changes:</span>
          <span style={{color: "#34d399", fontWeight: 700, marginLeft: 4}}>
            {adaptiveData.levelChanges}
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 9. Unit Tests

**File:** `tests/adaptive.test.js` (NEW)

```javascript
import { 
  calculateMasterScore,
  calculateAverage,
  getRecommendation,
  getNextLevel,
  getPrevLevel
} from '../src/adaptiveUtils.js';

describe('Adaptive Difficulty Utils', () => {
  
  describe('calculateMasterScore', () => {
    test('perfect performance = 1.0', () => {
      const score = calculateMasterScore(1.0, 100, 2.0); // Quiz, vocab %, speed ratio
      expect(score).toBe(1.0);
    });

    test('weighted average correct', () => {
      // Quiz: 0.6 (60%) * 0.5 = 0.30
      // Vocab: 0.75 (75%) * 0.3 = 0.225
      // Speed: 1.0 ratio * 0.2 = 0.20
      // Total: 0.725
      const score = calculateMasterScore(0.6, 75, 1.0);
      expect(score).toBeCloseTo(0.725, 2);
    });

    test('speed capped at 2.0', () => {
      const score1 = calculateMasterScore(0.8, 80, 2.0);
      const score2 = calculateMasterScore(0.8, 80, 5.0); // Speed capped to 2.0
      expect(score1).toBe(score2);
    });
  });

  describe('calculateAverage', () => {
    test('average of array', () => {
      expect(calculateAverage([0.8, 0.85, 0.9])).toBeCloseTo(0.85, 2);
    });

    test('empty array returns 0', () => {
      expect(calculateAverage([])).toBe(0);
    });

    test('null returns 0', () => {
      expect(calculateAverage(null)).toBe(0);
    });
  });

  describe('getRecommendation', () => {
    test('masterScore >= 0.80 recommends nextLevel', () => {
      expect(getRecommendation(0.85, 'A2')).toBe('B1');
      expect(getRecommendation(0.80, 'B1')).toBe('B2');
    });

    test('masterScore < 0.50 recommends prevLevel', () => {
      expect(getRecommendation(0.45, 'B1')).toBe('A2');
      expect(getRecommendation(0.30, 'B2')).toBe('B1');
    });

    test('masterScore 0.50-0.79 recommends currentLevel', () => {
      expect(getRecommendation(0.50, 'A2')).toBe('A2');
      expect(getRecommendation(0.79, 'B1')).toBe('B1');
    });

    test('C2 cannot advance beyond C2', () => {
      expect(getRecommendation(0.95, 'C2')).toBe('C2');
    });

    test('A1 cannot regress below A1', () => {
      expect(getRecommendation(0.20, 'A1')).toBe('A1');
    });
  });

  describe('Level Progression', () => {
    test('getNextLevel progression', () => {
      expect(getNextLevel('A1')).toBe('A2');
      expect(getNextLevel('A2')).toBe('B1');
      expect(getNextLevel('C2')).toBe('C2');
    });

    test('getPrevLevel regression', () => {
      expect(getPrevLevel('B1')).toBe('A2');
      expect(getPrevLevel('C2')).toBe('C1');
      expect(getPrevLevel('A1')).toBe('A1');
    });
  });
});
```

---

## 10. Imports & Dependencies

**Update:** `package.json`

No new npm packages required! All utilities use standard JavaScript.

**Update:** `src/student-reading-quest.jsx` imports

At the top of the file, add:

```javascript
// Adaptive difficulty (lazy-loaded to avoid circular deps)
// import { updateAdaptiveDifficulty } from './adaptiveEngine.js';
// ^ Imported dynamically in doFinish() to avoid issues
```

---

## 11. Firebase Storage Function Compatibility

**File:** `netlify/functions/storage.js` (VERIFY - No changes needed)

The existing storage.js already supports any key matching `/^rq-[a-z0-9_-]{1,60}$/`

Our new key: `rq-adaptive-v1-{userId}` ✓ Matches pattern

No modifications needed!

---

## 12. Migration Script (For Existing Users)

**File:** `src/migration.js` (NEW - Optional)

To initialize adaptive data for existing users:

```javascript
async function migrateExistingUsersToAdaptive(allUsers) {
  const { initializeAdaptiveState } = await import('./adaptiveUtils.js');
  const { saveAdaptiveDataAsync } = await import('./adaptiveEngine.js');
  
  for (const user of allUsers) {
    // Get user's current level from games
    const currentLevel = user.games && user.games.length > 0
      ? user.games[user.games.length - 1].level
      : 'A1';
    
    // Initialize adaptive state
    const adaptive = initializeAdaptiveState(user.name, currentLevel);
    
    // Populate with historical quiz data
    if (user.games && user.games.length > 0) {
      user.games.forEach(game => {
        if (!adaptive.masterScores[game.level]) {
          adaptive.masterScores[game.level] = [];
        }
        adaptive.masterScores[game.level].push((game.pct || 0) / 100);
        
        // Keep only last 5
        if (adaptive.masterScores[game.level].length > 5) {
          adaptive.masterScores[game.level].shift();
        }
        
        // Track WPM
        if (game.wpm && game.wpm > 0) {
          if (!adaptive.readingSpeed[game.level]) {
            adaptive.readingSpeed[game.level] = { wpm: 0, count: 0 };
          }
          const speedData = adaptive.readingSpeed[game.level];
          speedData.wpm = (speedData.wpm * speedData.count + game.wpm) / (speedData.count + 1);
          speedData.count += 1;
        }
      });
    }
    
    // Estimate vocab mastery (60% if no vocab data)
    adaptive.vocabMastery[currentLevel] = {
      known: Math.round(100 * 0.6),
      attempted: 100,
      pct: 0.6
    };
    
    // Save
    await saveAdaptiveDataAsync(user.name, adaptive);
  }
  
  console.log(`Migrated ${allUsers.length} users to adaptive difficulty`);
}

// Run once on app startup:
// if (localStorage.getItem('adaptive-migration-done') !== 'true') {
//   migrateExistingUsersToAdaptive(allUsers).then(() => {
//     localStorage.setItem('adaptive-migration-done', 'true');
//   });
// }
```

---

## 13. Testing Checklist

- [ ] calculateMasterScore returns 0-1 range
- [ ] getRecommendation logic: 0.80+ up, <0.50 down, else stay
- [ ] Hysteresis: recommendation applied after 2 consecutive quizzes
- [ ] Level jump: A1 cannot jump to C1 (max 1 level)
- [ ] User can manually select non-recommended level
- [ ] Adaptive data persists in localStorage
- [ ] Firebase async write doesn't block UI
- [ ] Results screen shows recommendation when applicable
- [ ] Profile screen shows adaptive insights
- [ ] Level selector badge appears for ready levels

---

## 14. Debugging

**Enable verbose logging:**

```javascript
// In adaptiveEngine.js, set:
const DEBUG = true;

if (DEBUG) {
  console.log("Adaptive State:", adaptive);
  console.log("Master Score:", newMasterScore);
  console.log("Recommendation Count:", adaptive.recommendationCount);
  console.log("Should Apply:", shouldApply);
}
```

**Check localStorage:**

```javascript
// In browser console:
JSON.parse(localStorage.getItem('rq-adaptive-v1-username'))
```

**Check Firebase:**

```javascript
// Verify in Firebase Console:
// rq-adaptive-v1-username → view JSON
```

---

## 15. Rollback Plan

If adaptive difficulty causes issues:

1. Remove adaptive update call from `doFinish()`
2. Keep React state (display only, no recommendations)
3. Historical data remains in Firebase for analysis
4. Delete `src/adaptiveEngine.js` and `src/adaptiveUtils.js`
5. Remove adaptive imports from `student-reading-quest.jsx`

**No game data lost** — all quiz results preserved in user.games array

---

**Ready to implement!** Start with Phase 1 (Foundation) and test with 5 users.

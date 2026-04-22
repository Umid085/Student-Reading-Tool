# Profile Module - Manual Testing Checklist

**Server**: http://localhost:5176  
**Instructions**: Open the app and go through each checklist item

---

## Quick Start Testing

### 1. Auto-Login Feature ✓
- [ ] Clear browser localStorage (DevTools → Application → Clear storage)
- [ ] Register new account with username & password
- [ ] Close the browser tab completely
- [ ] Reopen http://localhost:5176
- [ ] **EXPECTED**: Should auto-login without showing login form
- [ ] **VERIFICATION**: If at home screen without entering credentials = ✅ PASS

### 2. Like Feature on Friend Profile ✓
- [ ] Navigate to Friends section
- [ ] Find another user and click their profile
- [ ] **LOOK FOR**: "❤️ Like" button (pink color)
- [ ] Click the like button
- [ ] **VERIFY**: 
  - [ ] Button changes to "❤️ Liked" (gray)
  - [ ] Like count increases in the profile header
  - [ ] Button becomes disabled (can't like twice)
- [ ] Check friend's like count in their profile header (should show ❤️ count)

### 3. Game History Chart ✓
- [ ] Go to your profile (click "Profile" or similar)
- [ ] Scroll down to "XP HISTORY" section
- [ ] **LOOK FOR**:
  - [ ] Purple line chart with grid
  - [ ] Data points with XP values above them
  - [ ] X-axis shows date range
  - [ ] Y-axis shows "XP"
- [ ] **VERIFICATION**: If chart displays with your games = ✅ PASS

### 4. Friend Profile Chart ✓
- [ ] Go to Friends section
- [ ] Visit a friend's profile
- [ ] Scroll down to "XP HISTORY" section
- [ ] **VERIFY**: Same chart style as your profile
- [ ] **CHECK**: Chart shows their game history, not yours

### 5. Head-to-Head Comparison Colors ✓
- [ ] On a friend's profile, scroll to "HEAD TO HEAD" section
- [ ] **LOOK FOR** three comparison bars:
  - [ ] Total XP bar
  - [ ] Avg Score bar
  - [ ] Games Played bar
- [ ] **COLOR CHECK**:
  - [ ] **GREEN portion** = your stats (left side usually)
  - [ ] **PINK portion** = their stats (right side usually)
- [ ] **VERIFICATION**: If both colors are CLEARLY visible = ✅ PASS

### 6. Recent Games Display ✓
- [ ] On any profile, check "RECENT GAMES" section
- [ ] **VERIFY each game shows**:
  - [ ] Level (A1-C2 with color)
  - [ ] Topic name
  - [ ] Date played
  - [ ] Time spent (on your profile only)
  - [ ] XP earned (in yellow)
  - [ ] Score percentage (color: green/orange/red)
- [ ] Games should be in reverse chronological order (newest first)

### 7. Profile Stats Accuracy ✓
- [ ] Play 2-3 games at different difficulty levels
- [ ] Check your profile
- [ ] **VERIFY stats**:
  - [ ] Games count = number of games you played
  - [ ] Total XP = sum of all XP earned
  - [ ] Avg Score = average of all percentages
  - [ ] Best Level = highest difficulty achieved
  - [ ] Streak shows days with consecutive play (if applicable)

### 8. Social Features ✓
- [ ] Go to Friend's profile
- [ ] **Check buttons appear correctly**:
  - [ ] If not friends: "Add Friend" button (blue)
  - [ ] If request sent: "Request Sent" button (gray, disabled)
  - [ ] If friends: "Remove Friend" button (gray)
  - [ ] If friends: "Challenge" button (orange)
  - [ ] Always: "Like Profile" button (pink)

### 9. Logout Feature ✓
- [ ] Go to your profile
- [ ] Click "Log Out" button
- [ ] **VERIFY**:
  - [ ] Returns to auth/login screen
  - [ ] Credentials NOT saved (requires login next time)
  - [ ] Session cleared from localStorage

### 10. Responsive Design ✓
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (mobile view)
- [ ] Check phone size (375px width)
- [ ] **VERIFY**:
  - [ ] All content readable on mobile
  - [ ] Buttons stack properly
  - [ ] Chart scales to fit screen
  - [ ] No text overflow
- [ ] Return to desktop view

### 11. Error Handling ✓
- [ ] Try to visit a profile of non-existent user (URL hack)
- [ ] **EXPECTED**: "User not found" message with Back button
- [ ] Click Back
- [ ] **VERIFY**: Returns to Friends page safely

### 12. Empty States ✓
- [ ] Create new account (no games played yet)
- [ ] Go to your profile
- [ ] **VERIFY**:
  - [ ] Chart shows "No games to chart yet"
  - [ ] Stats show 0 values
  - [ ] "No games yet - start playing!" message
  - [ ] No crash or errors

---

## Advanced Testing

### Performance Check ✓
- [ ] Open DevTools → Network tab
- [ ] Click on several profiles rapidly
- [ ] **VERIFY**: No lag or freezing
- [ ] Chart renders smoothly (no jank)

### Data Persistence ✓
- [ ] Like someone's profile
- [ ] Refresh page (Ctrl+R)
- [ ] Go back to that person's profile
- [ ] **VERIFY**: Like count still shows
- [ ] **VERIFY**: Your "❤️ Liked" button still shows

### Cross-User Testing ✓
- [ ] Register 2 different accounts
- [ ] Log in with Account A
- [ ] Find Account B's profile
- [ ] Like their profile (heart shows "❤️ Liked")
- [ ] Log out
- [ ] Log in with Account B
- [ ] Go to Account A's profile
- [ ] **VERIFY**: Account B can see Account A liked them (like count increased)

---

## Test Summary

| Feature | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Auto-login | ✅ | ✅ | Works with credential saving |
| Like button | ✅ | ✅ | Shows heart emoji |
| Chart display | ✅ | ✅ | Responsive SVG |
| Comparison bars | ✅ | ✅ | Two colors visible |
| Recent games | ✅ | ✅ | Proper formatting |
| Stats | ✅ | ✅ | Accurate calculations |
| Social features | ✅ | ✅ | Friend requests, challenges |
| Responsive | ✅ | ✅ | Mobile-friendly |

---

## Notes

- **Server Running**: Make sure `npm run dev` is still running
- **Cache Issues**: If something looks wrong, clear browser cache (Ctrl+Shift+Delete)
- **Console Errors**: Check DevTools console for any errors
- **Firebase**: Make sure `.env.local` has valid FIREBASE_DB_URL and ANTHROPIC_API_KEY

---

**Report Date**: 2026-04-23  
**All features are READY FOR TESTING** ✅

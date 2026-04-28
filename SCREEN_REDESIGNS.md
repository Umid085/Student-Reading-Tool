# UI Redesign Specifications
## Student Reading Tool — 4 High-Impact Screens

---

## Design Direction: Progressive Minimalism

**Aesthetic:** Clean, spacious layouts with vibrant accent colors and smooth interactions. Emphasis on visual progress and achievement. Premium feel through generous whitespace and intentional typography hierarchy.

**Key Principles:**
- Visual hierarchy through size, color, and spacing
- Clear progress visualization
- Touch-friendly interactions (44px+ targets)
- Color-coded status and feedback
- Micro-interactions for delight
- Mobile-first responsive design

---

## 1. QUIZ STAGE SCREEN

### Current Issues
- Dense text blocks
- Small answer buttons
- Progress indicator unclear
- Timer position inconsistent

### Redesigned Layout

```
┌─────────────────────────────────────────┐
│  Level B1  │  Question 3 of 6  │  1:45  │  ← Header bar
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Reading Passage               │   │
│  │  (Scrollable if needed)        │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  QUESTION TEXT (large, bold)           │
│  Color-coded by level                  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ◯ A  Large clickable button      │  │  44px min height
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ◯ B  Large clickable button      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ◯ C  Large clickable button      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ◯ D  Large clickable button      │  │
│  └──────────────────────────────────┘  │
│                                         │
│           [SUBMIT ANSWER]              │
│                                         │
└─────────────────────────────────────────┘
```

### Design Details

**Header Bar**
- Dark background with level color accent on left
- Shows: Level name | Progress (3/6) | Timer
- Timer color changes: green > amber > red as time runs out
- Sticky at top on scroll

**Question Text**
- Font size: 18px (h3 from design system)
- Font weight: 800
- Color: Level color (e.g., #f59e0b for B1)
- Margin bottom: 24px

**Answer Buttons**
- Height: 48-56px (touch-friendly)
- Full width with padding
- Border radius: 10px
- Background: transparent, border: 1px solid
- Font: 14px, weight 600
- Transitions: 150ms

**States:**
- Normal: border #border, text #text
- Hover: bg surface, border #primary
- Selected: bg primary 20%, border #primary, text #primaryLight
- Correct (confirmed): bg success 15%, border #success, text #success
- Wrong (confirmed): bg error 15%, border #error, text #error

**Submit Button**
- Prominent, full width
- Background: level color (dynamic)
- Padding: 12px
- Only enabled if answer selected
- Smooth color transition

---

## 2. RESULTS SCREEN

### Current Issues
- Stats scattered across page
- Score not emphasized
- Components breakdown unclear
- Action buttons hard to find

### Redesigned Layout

```
┌──────────────────────────────────────┐
│         🎉 RESULTS 🎉               │  ← Celebratory header
├──────────────────────────────────────┤
│                                      │
│         ┌──────────────────┐        │
│         │       85         │        │  ← Large percentage
│         │        %         │        │
│         └──────────────────┘        │
│                                      │
│  "Great job! Advanced level."       │  ← Contextual message
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ 850 XP   │  │ +150 XP  │         │  ← Score breakdown
│  │ Base     │  │ Time     │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ +100 XP  │  │ Level 7  │         │
│  │ Streak   │  │ Next     │         │
│  └──────────┘  └──────────┘         │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Question Breakdown:                 │
│  ✓ 5/6 Correct                       │
│  • MCQ: 1/1                          │
│  • Gap-Fill: 2/2                     │
│  • Matching: 2/3                     │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │  [Play Another Level]          │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  [View Leaderboard]            │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  [Share Challenge]             │ │
│  └────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### Design Details

**Score Display**
- Font size: 88px (massive, bold)
- Font weight: 900
- Color: Score-based (green >=80%, amber >=60%, red <60%)
- Animated entrance: grows from small to large over 400ms
- Could use confetti effect on very high scores

**Feedback Message**
- Contextual based on score
- Font: 16px, weight 600
- Color: Level color or success color
- Examples:
  - "Perfect! Mastery unlocked."
  - "Great job! Advanced level."
  - "Good effort! Keep practicing."
  - "Keep improving!"

**Score Breakdown Cards**
- 4 cards in 2x2 grid on desktop, stacked on mobile
- Each card shows: Number | Label
- Colors: XP=#fbbf24 (amber), Bonus=#34d399 (green), Level=#818cf8 (primary)
- Card background: surface color
- Border: 1px, subtle
- Padding: 16px

**Question Breakdown**
- Bullet points showing question types and performance
- Color-coded: ✓ green for correct, ✕ red for incorrect
- Shows ratio like "2/3 correct"

**Action Buttons**
- Full width
- Primary style (filled with level color)
- Stacked vertically
- Margin between: 12px
- Height: 48px
- Font weight: 600

---

## 3. LEADERBOARD SCREEN

### Current Issues
- Plain table layout
- Current user not highlighted
- Rank not visually emphasized
- Too dense on mobile

### Redesigned Layout

```
┌──────────────────────────────────────┐
│  Level Selector                      │
│  [A1] [A2] [B1] [B2] [C1] [C2]      │  ← Color-coded tabs
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │  1  👑 Your Name       │ 2450   │  ← Current user (highlighted)
│  │      85% • 12 Games    │ XP     │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  2      Friend Name    │ 2340   │
│  │         82% • 11 Games │ XP     │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  3      Another User   │ 2100   │
│  │         79% • 10 Games │ XP     │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  4      Player Name    │ 1950   │
│  │         75% • 9 Games  │ XP     │
│  └────────────────────────────────┘ │
│                                      │
│  (Scroll for more...)               │
│                                      │
└──────────────────────────────────────┘
```

### Design Details

**Level Tabs**
- Horizontal scroll on mobile, centered on desktop
- Background: level color
- Text: dark (contrasting)
- Active: filled with color, slight glow
- Inactive: border only, transparent bg
- Border radius: full (999px)
- Padding: 6px 16px
- Font: label size (12px), weight 700

**Leaderboard Cards**
- Each entry is a card with subtle border
- Padding: 16px (md)
- Border radius: 10px (lg)
- Background: surface color
- Margin bottom: 12px (md)

**Rank Badge**
- Left side, large: font-size 24px, weight 900
- Colors:
  - Rank 1: Gold (#fbbf24)
  - Rank 2: Silver (#d1d5db)
  - Rank 3: Bronze (#d97706)
  - Rank 4+: Primary (#818cf8)
- Optional: Medal emoji (👑, 🥈, 🥉) instead of numbers

**User Info**
- Name: 16px, weight 700, text color
- Stats: 13px, weight 500, text-secondary (e.g., "85% • 12 Games")
- Layout: Name on first line, stats on second

**XP Display**
- Right side, large numbers: 18px, weight 900
- Color: amber (#fbbf24)
- Label below: "XP" (caption size, muted)

**Current User Highlight**
- Slightly larger padding
- Different background (subtle, darker)
- Optional: Colored left border (level color, 4px)
- Optional: "You" badge

---

## 4. PROFILE & FRIENDS SCREEN

### Current Issues
- Scattered user information
- Profile comparison unclear
- Friend action buttons not obvious
- Game history missing

### Redesigned Layout — Friend Profile

```
┌──────────────────────────────────────┐
│  ◀ Back                              │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Friend Name              ★★★  │  ← Profile header card
│  │  Level 8 • Joined 3mo ago      │
│  │  👍 12 Likes              ♡     │  ← Like button
│  └────────────────────────────────┘ │
│                                      │
│  ┌──────────┬──────────┐             │
│  │  2450    │  85%     │             │
│  │  Total   │ Avg      │             │
│  │  XP      │ Score    │             │
│  └──────────┴──────────┘             │
│                                      │
├──────────────────────────────────────┤
│  COMPARISON WITH YOU                 │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  Total XP          2450 vs 2100  ││  ← Friend vs You
│  │  Avg Score         85% vs 82%    ││
│  │  Games Played      12 vs 11      ││
│  └──────────────────────────────────┘│
│                                      │
├──────────────────────────────────────┤
│  RECENT CHALLENGES                   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  B1 Quiz Challenge             │ │
│  │  Waiting for response...        │ │
│  └────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │  [Send Challenge]              │ │  ← Actions
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  [Remove Friend]               │ │
│  └────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### Design Details

**Profile Header Card**
- Full width card
- Padding: 16px
- Border radius: 12px
- Background: surface with subtle level-color left border (4px)

**User Name**
- Font: h3 size (18px), weight 800
- Color: text

**User Meta**
- Font: body-small (13px), weight 400
- Color: text-secondary
- Shows: Level | Join date

**Stars/Rating**
- Right side, if friend rating system exists
- Color: warning (#f59e0b)
- Size: 16px

**Like Button**
- Heart emoji or icon
- Shows count
- Clickable to like/unlike
- Animation: scale on like

**Stats Cards (2x1 grid)**
- Each shows: Big number | Small label
- Background: subtle
- Center aligned
- Colors: XP=amber, Score=primary

**Comparison Section**
- Label: "COMPARISON WITH YOU"
- Font: caption (11px), weight 700, color text-muted
- Each row: Label | Friend Value | Your Value
- Highlight difference if significant
- Layout: 3 columns on desktop, stacked on mobile

**Recent Challenges**
- Shows active/pending challenges
- Status badge: pending=amber, accepted=green, declined=red
- Challenge details: Level | Type | Status

**Action Buttons**
- Full width
- Primary style for main action (Send Challenge)
- Ghost/secondary style for destructive (Remove Friend)
- Height: 44px+

---

## Implementation Priorities

### Phase 1 (High Impact, Moderate Effort)
1. Quiz Stage — Progress bar + larger buttons
2. Results Screen — Large score display + XP breakdown

### Phase 2 (Medium Impact, Moderate Effort)
3. Leaderboard — Card-based layout + rank badges
4. Profile Screen — User info card + comparison

### Phase 3 (Polish & Refinement)
- Animations and transitions
- Micro-interactions
- Mobile responsive tweaks

---

## Code Changes Required

- Update `student-reading-quest.jsx` with new layout structure
- Use `designSystem.js` tokens for all colors/spacing
- Add new sections for:
  - QuizHeader component (progress + timer)
  - ResultsStats component (score breakdown cards)
  - LeaderboardEntry component (rank + user info)
  - ProfileHeader component (user stats card)
  - ComparisonCard component (side-by-side comparison)

---

## Success Metrics

✅ Visual hierarchy is clear at a glance  
✅ Touch targets are 44px+ (mobile accessible)  
✅ Color-coding helps identify status/performance  
✅ Layouts work on 320px, 640px, and desktop  
✅ No visual clutter; generous whitespace  
✅ Actions are obvious and easy to find  

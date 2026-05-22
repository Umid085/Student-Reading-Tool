// F5 — friend-comparison nudge picker.
// Pure function: given pre-aggregated friend rows + my weekly XP, pick at
// most one positive-framing nudge to surface on the home screen. Callers
// are responsible for resolving friend names to {name, weeklyXp, streak}
// rows (see student-reading-quest.jsx for the assembly).
//
// Return shape: null OR { category, params, ctaTo }
//   category: i18n suffix → "stu_nudge_<category>"
//   params:   placeholder values for the message template
//   ctaTo:    "play" (scroll to level picker) | "friends" (open friends page)
//
// Positive framing rules:
//   - "behind" only fires for an achievable gap (≤ 500 XP).
//   - "tied" fires inside ±50 XP — encourages overtaking with one quest.
//   - Streak match only fires when the user has NOT played today (so the
//     CTA is actionable today).

export function pickFriendNudge(opts) {
  var name = opts && opts.currentUserName;
  var rows = (opts && opts.friends) || [];
  var myWeeklyXp = Number(opts && opts.myWeeklyXp) || 0;
  var playedToday = !!(opts && opts.playedToday);
  if (!name) return null;
  if (!rows.length) return { category: "noFriends", params: {}, ctaTo: "friends" };

  if (!playedToday) {
    var best = rows
      .filter(function (r) { return (Number(r.streak) || 0) >= 3; })
      .sort(function (a, b) { return (Number(b.streak) || 0) - (Number(a.streak) || 0); })[0];
    if (best) return { category: "streakMatch", params: { name: best.name, days: Number(best.streak) || 0 }, ctaTo: "play" };
  }

  var ahead = rows
    .filter(function (r) { return (Number(r.weeklyXp) || 0) > myWeeklyXp; })
    .sort(function (a, b) { return (Number(a.weeklyXp) || 0) - (Number(b.weeklyXp) || 0); })[0];
  if (ahead) {
    var gap = (Number(ahead.weeklyXp) || 0) - myWeeklyXp;
    if (gap <= 50) return { category: "tied", params: { name: ahead.name }, ctaTo: "play" };
    if (gap <= 500) return { category: "behind", params: { name: ahead.name, xp: gap }, ctaTo: "play" };
  }

  var behind = rows
    .filter(function (r) { return (Number(r.weeklyXp) || 0) < myWeeklyXp; })
    .sort(function (a, b) { return (Number(b.weeklyXp) || 0) - (Number(a.weeklyXp) || 0); })[0];
  if (behind) {
    var lead = myWeeklyXp - (Number(behind.weeklyXp) || 0);
    if (lead >= 500) return { category: "topPack", params: {}, ctaTo: "play" };
    if (lead <= 300) return { category: "ahead", params: { name: behind.name }, ctaTo: "play" };
  }

  return null;
}

// Result-screen variant — fires immediately after a quiz, framed around
// what THIS quiz just changed on the weekly leaderboard. Categories:
//   passedFriend  — I just leapfrogged a friend's weekly XP
//   closingGap    — a friend is now within 200 XP of me (achievable next quiz)
//   defendingLead — closest friend is ≤ 100 XP behind me (don't get caught)
//
// Inputs:
//   currentUserName  : my username
//   friends          : [{name, weeklyXp}] pre-aggregated
//   myNewWeeklyXp    : my weekly XP AFTER this quiz
//   xpEarned         : XP from the quiz that just finished
export function pickResultNudge(opts) {
  var name = opts && opts.currentUserName;
  var rows = (opts && opts.friends) || [];
  var newXp = Number(opts && opts.myNewWeeklyXp) || 0;
  var earnedXp = Number(opts && opts.xpEarned) || 0;
  var prevXp = Math.max(0, newXp - earnedXp);
  if (!name || !rows.length) return null;

  // 1) Just leapfrogged a friend with this quiz — pick the highest-XP one
  var passed = rows
    .filter(function (r) { var fx = Number(r.weeklyXp) || 0; return fx > prevXp && fx <= newXp; })
    .sort(function (a, b) { return (Number(b.weeklyXp) || 0) - (Number(a.weeklyXp) || 0); })[0];
  if (passed) return { category: "passedFriend", params: { name: passed.name }, ctaTo: "weekly" };

  // 2) Closing gap — closest friend ahead, gap ≤ 200
  var ahead = rows
    .filter(function (r) { return (Number(r.weeklyXp) || 0) > newXp; })
    .sort(function (a, b) { return (Number(a.weeklyXp) || 0) - (Number(b.weeklyXp) || 0); })[0];
  if (ahead) {
    var gap = (Number(ahead.weeklyXp) || 0) - newXp;
    if (gap <= 200) return { category: "closingGap", params: { name: ahead.name, xp: gap }, ctaTo: "play" };
  }

  // 3) Defending lead — closest friend behind, lead ≤ 100
  var behind = rows
    .filter(function (r) { return (Number(r.weeklyXp) || 0) < newXp; })
    .sort(function (a, b) { return (Number(b.weeklyXp) || 0) - (Number(a.weeklyXp) || 0); })[0];
  if (behind) {
    var lead = newXp - (Number(behind.weeklyXp) || 0);
    if (lead <= 100) return { category: "defendingLead", params: { name: behind.name, xp: lead }, ctaTo: "play" };
  }

  return null;
}

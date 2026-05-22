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

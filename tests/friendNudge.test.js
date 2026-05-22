import { describe, it, expect } from "vitest";
import { pickFriendNudge } from "../src/friendNudge.js";

const me = "alice";

function row(name, weeklyXp = 0, streak = 0) {
  return { name, weeklyXp, streak };
}

describe("pickFriendNudge", () => {
  it("returns null when there's no current user", () => {
    expect(pickFriendNudge({ friends: [row("bob", 100)], myWeeklyXp: 0 })).toBeNull();
  });

  it("returns noFriends when the user has no friends yet", () => {
    const n = pickFriendNudge({ currentUserName: me, friends: [], myWeeklyXp: 200 });
    expect(n).toEqual({ category: "noFriends", params: {}, ctaTo: "friends" });
  });

  it("returns streakMatch when a friend has a >=3-day streak and I haven't played today", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 100, 5), row("carl", 50, 1)],
      myWeeklyXp: 80,
      playedToday: false,
    });
    expect(n).toEqual({ category: "streakMatch", params: { name: "bob", days: 5 }, ctaTo: "play" });
  });

  it("does NOT use streakMatch if I already played today (use XP-based framings instead)", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 100, 5)],
      myWeeklyXp: 80,
      playedToday: true,
    });
    // bob is 20 XP ahead → "tied"
    expect(n.category).toBe("tied");
    expect(n.params.name).toBe("bob");
  });

  it("returns tied when a friend is within 50 XP ahead", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 130)],
      myWeeklyXp: 100,
      playedToday: true,
    });
    expect(n).toEqual({ category: "tied", params: { name: "bob" }, ctaTo: "play" });
  });

  it("returns behind when a friend is 50-500 XP ahead", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 350)],
      myWeeklyXp: 100,
      playedToday: true,
    });
    expect(n).toEqual({ category: "behind", params: { name: "bob", xp: 250 }, ctaTo: "play" });
  });

  it("does NOT return behind for an unreachable gap (>500 XP)", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 2000)],
      myWeeklyXp: 100,
      playedToday: true,
    });
    // gap is 1900 → neither tied nor behind. No closer friend behind → null.
    expect(n).toBeNull();
  });

  it("picks the closest ahead friend (smallest beatable gap)", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 2000), row("carl", 130), row("dee", 800)],
      myWeeklyXp: 100,
      playedToday: true,
    });
    // carl is closest at 30 XP → tied
    expect(n.params.name).toBe("carl");
    expect(n.category).toBe("tied");
  });

  it("returns ahead when leading a close friend by ≤300 XP", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 50)],
      myWeeklyXp: 200,
      playedToday: true,
    });
    expect(n).toEqual({ category: "ahead", params: { name: "bob" }, ctaTo: "play" });
  });

  it("returns topPack when leading by 500+ XP", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 50), row("carl", 100)],
      myWeeklyXp: 800,
      playedToday: true,
    });
    expect(n).toEqual({ category: "topPack", params: {}, ctaTo: "play" });
  });

  it("returns null in dead-zone (lead 301-499, no friend ahead)", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 200)],
      myWeeklyXp: 600,
      playedToday: true,
    });
    // lead = 400. > 300 (no ahead), < 500 (no topPack) → null. By design:
    // user isn't dominating, but no actionable rival to highlight.
    expect(n).toBeNull();
  });

  it("ignores streak < 3", () => {
    const n = pickFriendNudge({
      currentUserName: me,
      friends: [row("bob", 0, 2)],
      myWeeklyXp: 0,
      playedToday: false,
    });
    // No XP signal either → null.
    expect(n).toBeNull();
  });

  it("CTA always points somewhere actionable", () => {
    const cases = [
      pickFriendNudge({ currentUserName: me, friends: [], myWeeklyXp: 0 }),
      pickFriendNudge({ currentUserName: me, friends: [row("bob", 0, 7)], myWeeklyXp: 0, playedToday: false }),
      pickFriendNudge({ currentUserName: me, friends: [row("bob", 30)], myWeeklyXp: 0, playedToday: true }),
    ];
    cases.forEach((c) => {
      expect(c).not.toBeNull();
      expect(["play", "friends"]).toContain(c.ctaTo);
    });
  });
});

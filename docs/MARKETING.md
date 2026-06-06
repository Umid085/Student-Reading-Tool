# Marketing Playbook — Student Reading Quest

Organic, no-budget growth plan. Built on what the analytics actually proved:
**word-of-mouth via Telegram, in Uzbekistan, trilingual (uz/ru/en).** Updated 2026-06-06.

## The one principle

The 2026-06-05 traffic spike (26 people in a day, ~58% clicked the CTA) was
all `$direct` / `org.telegram.plus` — i.e. Telegram word-of-mouth inside
Uzbekistan. The audience uses the app in **en / ru / uz** in roughly equal
parts. So: post in all three languages, lean on Telegram, make sharing easy.

No paid ads (no budget). When budget appears, the prepared Meta geo-test plan
in `[[go-to-market-analytics]]` memory is the first move.

---

## 1. Trackable links (always use these — never the bare URL)

Tagging the source lets the daily PostHog report attribute each signup to a
channel instead of lumping it as `$direct`.

| Channel | Link |
|---|---|
| Telegram | `https://student-reading-tool.vercel.app/welcome?utm_source=telegram&utm_medium=organic&utm_campaign=manual` |
| Instagram (bio/story) | `https://student-reading-tool.vercel.app/welcome?utm_source=instagram&utm_medium=organic&utm_campaign=manual` |

In-app "Invite friends" button already uses `utm_source=share&utm_campaign=invite`.

---

## 2. Where to post (priority order)

1. **Your own Telegram channel/groups** + ask 5–10 friends to forward. #1 channel.
2. **Uzbek English-learning Telegram groups** — search "ingliz tili", "IELTS",
   "English speaking Tashkent". Post value, not spam.
3. **Instagram** — Reel/screen-recording of the 2-min demo, link in bio.

---

## 3. Ready-to-post copy (paste as-is)

### Post A — Launch (trilingual block)
> 🇺🇿 Ingliz tilini bepul o'rganing — darajangizga moslangan AI matnlar va testlar (A1–C2). Kuniga 5 daqiqa. Ro'yxatdan o'tmasdan sinab ko'ring 👇
> 🇷🇺 Учи английский бесплатно — AI-тексты и тесты под твой уровень (A1–C2). 5 минут в день. Можно попробовать без регистрации 👇
> 🇬🇧 Learn English free — AI reading + quizzes for your exact level (A1–C2). 5 min a day. Try it, no signup 👇
> 🔗 https://student-reading-tool.vercel.app/welcome?utm_source=telegram&utm_medium=organic&utm_campaign=manual

### Post B — Demo hook (no-signup angle)
> 📖 2 daqiqada o'zingizni sinab ko'ring — ro'yxatdan o'tish shart emas. / Проверь свой уровень за 2 минуты — без регистрации. / Test your level in 2 minutes — no signup.
> 👉 [tagged Telegram link]

### Post C — Streak / habit angle
> 🔥 Har kuni 5 daqiqa = seriya (streak) + XP. O'rganishni o'yinga aylantiring. / 5 минут в день = серия + XP. Преврати учёбу в игру. / 5 min a day = streak + XP. Turn studying into a game.
> 👉 [tagged Telegram link]

---

## 4. Creative

### Free / fastest (no tools)
- **Screen-record the 2-min demo** on your phone — the single best ad. Post as
  Telegram video / Instagram Reel.
- **Canva** (free): 1080×1080, dark bg `#0d0d1a`, mint accent `#5af0b3`,
  headline "Learn English. Your level. Free."

### Higgsfield prompts (run in the Claude desktop app, where it's connected)
> ⚠️ AI image generators garble overlaid text. Generate these **without text**,
> then add uz/ru/en headlines in Canva on top.

- **Image 1 — Launch (1:1):** A sleek dark navy (#0d0d1a) mobile app scene, a
  smartphone showing an English reading passage with a clean quiz card, soft
  mint-green (#5af0b3) glow accents, minimal modern UI, floating subtle book and
  lightning-bolt icons, premium edtech aesthetic, high detail, no text. Square 1:1.
- **Image 2 — Demo / "no signup" (1:1):** Cinematic close-up of a young student
  smiling at a phone, screen emitting a soft mint-green glow, dark moody
  background, motivational learning vibe, shallow depth of field, no text, 1:1.
- **Image 3 — Streak/gamification (1:1):** Dark UI dashboard with a glowing
  "🔥 streak" counter and XP bar in mint-green and amber on near-black
  background, gamified learning aesthetic, clean, energetic, no text, 1:1.
- **Video — Reel/Telegram (9:16, ~5s):** Vertical 9:16. Smooth camera push-in on
  a phone showing an English reading app, mint-green light trails, words
  highlighting one by one, dark premium background, fast energetic edtech feel.

---

## 5. Cadence (sustainable)

- **3 posts/week:** Mon = Post A, Wed = Post B, Fri = Post C. Rotate the
  front language by audience.
- **Pin Post A** in your channel.

---

## 6. Measurement

The daily PostHog check (9:07am local, while a Claude session is open) reports
per-channel conversions, including `utm_source=telegram` and `instagram`. Watch:
landing → CTA → registered → quiz, broken out by source. The success signal is
the telegram/instagram cohorts going from 0 → nonzero, then converting.

SEO `/learn/` pages: check Google Search Console Performance from ~2026-06-12.

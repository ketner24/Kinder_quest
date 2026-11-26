/* Kinder Quest - saving, players, spaced-repetition learning engine, rewards.
   All data stays on this device (localStorage). Nothing is sent anywhere. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util;

  const KEY = 'kinderquest.v1';
  const DEFAULTS = {
    voiceURI: null, rate: 0.92, pitch: 1.1, sfx: true, voiceOff: false,
    lessonLen: 8, dailyLimit: 0, unlockAll: false, readChoices: true, bubbles: true,
  };
  let data = null;
  const blank = () => ({ version: 1, profiles: [], currentId: null, settings: { ...DEFAULTS } });

  const store = (KQ.store = {
    load() {
      try {
        data = JSON.parse(localStorage.getItem(KEY));
      } catch (e) {
        data = null;
      }
      if (!data || !Array.isArray(data.profiles)) data = blank();
      data.settings = { ...DEFAULTS, ...(data.settings || {}) };
      return data;
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save progress', e);
      }
    },
    settings: () => (data ? data.settings : DEFAULTS),
    set(k, v) {
      data.settings[k] = v;
      store.save();
    },
    profiles: () => data.profiles,
    current: () => (data ? data.profiles.find((p) => p.id === data.currentId) || null : null),
    setCurrent(id) {
      data.currentId = id;
      store.save();
    },
    addProfile({ name, theme, mascot }) {
      const p = {
        id: U.uid(), name: name || '', theme, mascot, created: Date.now(),
        stars: 0, lessons: 0, stickers: [], colors: KQ.themes.PAINT.slice(0, KQ.themes.FREE_COLORS).map((c) => c.id),
        trophies: [], skills: {}, log: {}, games: {},
      };
      if (!p.colors.includes(mascot.color)) p.colors.push(mascot.color);
      data.profiles.push(p);
      data.currentId = p.id;
      store.save();
      return p;
    },
    deleteProfile(id) {
      data.profiles = data.profiles.filter((p) => p.id !== id);
      if (data.currentId === id) data.currentId = data.profiles[0] ? data.profiles[0].id : null;
      store.save();
    },
    resetProfile(id) {
      const p = data.profiles.find((x) => x.id === id);
      if (!p) return;
      Object.assign(p, { stars: 0, lessons: 0, stickers: [], trophies: [], skills: {}, log: {}, games: {} });
      p.colors = KQ.themes.PAINT.slice(0, KQ.themes.FREE_COLORS).map((c) => c.id);
      if (!p.colors.includes(p.mascot.color)) p.colors.push(p.mascot.color);
      store.save();
    },
    exportJSON: () => JSON.stringify(data, null, 1),
    importJSON(text) {
      const d = JSON.parse(text);
      if (!d || !Array.isArray(d.profiles)) throw new Error('This file is not a Kinder Quest backup.');
      data = d;
      data.settings = { ...DEFAULTS, ...(data.settings || {}) };
      store.save();
    },
    /** Today's log entry for a player. */
    day(p = store.current(), key = U.dateKey()) {
      if (!p.log[key]) p.log[key] = { q: 0, c: 0, t: 0, l: 0 };
      return p.log[key];
    },
    addTime(sec) {
      const p = store.current();
      if (!p) return;
      store.day(p).t += sec;
      store.save();
    },
    minutesToday(p = store.current()) {
      return p ? Math.floor((p.log[U.dateKey()] || { t: 0 }).t / 60) : 0;
    },
    streak(p = store.current()) {
      if (!p) return 0;
      let n = 0;
      const d = new Date();
      if (!(p.log[U.dateKey(d)] || {}).q) d.setDate(d.getDate() - 1); // today not played yet: count from yesterday
      while ((p.log[U.dateKey(d)] || {}).q) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    },
  });

  /* ================= Spaced repetition (Leitner boxes) =================
     Each thing a child learns ("B" in "big letters") lives in a box 0-6.
     Right answer -> next box (but only once enough time has passed, so cramming
     doesn't count). Wrong answer -> back two boxes. Higher boxes come back less often.
     box 0-1: learning   box 2: knows it   box 3+: mastered (remembered on later days) */
  const MIN = 60e3, HOUR = 3600e3, DAY = 86400e3;
  const INTERVALS = [0, 1 * MIN, 20 * HOUR, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];

  const srs = (KQ.srs = {
    INTERVALS,
    state(skill, p = store.current()) {
      if (!p.skills[skill]) p.skills[skill] = { items: {} };
      return p.skills[skill];
    },
    item(skill, key, p = store.current()) {
      return p && p.skills[skill] ? p.skills[skill].items[key] : undefined;
    },
    box(skill, key, p) {
      const it = srs.item(skill, key, p);
      return it ? it.b : -1;
    },

    /** Choose what to practise next. Returns {key, isNew}. */
    pick(skill, pool, ctx = {}, opts = {}) {
      const st = srs.state(skill);
      const now = Date.now();
      const recent = (ctx.recent && ctx.recent[skill]) || [];
      const seen = pool.filter((k) => st.items[k]);
      const unseen = pool.filter((k) => !st.items[k]);
      const learning = seen.filter((k) => st.items[k].b < 2);
      const maxNew = opts.maxNew != null ? opts.maxNew : 3;
      ctx.newBy = ctx.newBy || {};
      const newSoFar = ctx.newBy[skill] || 0;
      const roomForNew = learning.length < (opts.learnSize || 3) && newSoFar < maxNew;
      if (unseen.length && (seen.length === 0 || roomForNew)) {
        const justIntroduced = ctx.lastNew === skill && seen.length >= 2;
        if (!justIntroduced || seen.length === 0) {
          ctx.newBy[skill] = newSoFar + 1;
          ctx.lastNew = skill;
          return { key: unseen[0], isNew: true };
        }
      }
      ctx.lastNew = null;
      const cands = seen.length ? seen : pool;
      const key = U.weightedPick(cands, (k) => {
        const it = st.items[k];
        if (!it) return 1;
        let w = now >= it.s + INTERVALS[it.b] ? Math.pow(7 - it.b, 2) : 0.6;
        if (it.h && it.h.slice(-3).includes('0')) w *= 1.6; // recently missed: practise more
        const ri = recent.lastIndexOf(k);
        if (ri !== -1) w *= ri === recent.length - 1 ? 0.02 : 0.25; // avoid repeats
        return w;
      });
      return { key, isNew: false };
    },

    record(skill, key, ok) {
      const p = store.current();
      if (!p) return;
      const st = srs.state(skill, p);
      const now = Date.now();
      let it = st.items[key];
      if (!it) it = st.items[key] = { b: 0, c: 0, w: 0, s: 0, n: now, h: '' };
      if (ok) {
        it.c++;
        if (it.b < 2 || now - it.s >= INTERVALS[it.b] * 0.5) it.b = Math.min(INTERVALS.length - 1, it.b + 1);
      } else {
        it.w++;
        it.b = Math.max(0, it.b - 2);
      }
      it.s = now;
      it.h = (it.h + (ok ? '1' : '0')).slice(-12);
      const d = store.day(p);
      d.q++;
      if (ok) d.c++;
      store.save();
    },

    counts(skill, pool, p = store.current()) {
      const items = (p && p.skills[skill] && p.skills[skill].items) || {};
      const r = { total: pool.length, seen: 0, learning: 0, known: 0, mastered: 0, right: 0, wrong: 0 };
      for (const k of pool) {
        const it = items[k];
        if (!it) continue;
        r.seen++;
        r.right += it.c;
        r.wrong += it.w;
        if (it.b >= 3) r.mastered++;
        if (it.b >= 2) r.known++;
        else r.learning++;
      }
      return r;
    },
    known(skill, pool, p) {
      return srs.counts(skill, pool, p).known;
    },
    allKnown(skill, keys, p) {
      return keys.every((k) => srs.box(skill, k, p) >= 2);
    },
    /** 0-3 stars for a world tile. */
    stars(skill, pool, p) {
      const c = srs.counts(skill, pool, p);
      if (c.mastered === c.total) return 3;
      if (c.known >= (c.total * 2) / 3) return 2;
      if (c.known >= c.total / 3) return 1;
      return 0;
    },
    /** Items this child keeps missing (for the grown-up report). */
    trouble(skill, p = store.current()) {
      const items = (p && p.skills[skill] && p.skills[skill].items) || {};
      return Object.entries(items)
        .filter(([, it]) => it.w > 0 && it.b < 3 && (it.h.slice(-4).match(/0/g) || []).length >= 1)
        .sort((a, b) => b[1].w - a[1].w)
        .slice(0, 6)
        .map(([k]) => k);
    },
  });

  /* ================= Rewards and trophies ================= */
  const D = () => KQ.D;
  const TROPHIES = [
    { id: 'first', icon: '🎉', name: 'First adventure!', test: (p) => p.lessons >= 1 },
    { id: 'l10', icon: '🥉', name: '10 adventures', test: (p) => p.lessons >= 10 },
    { id: 'l50', icon: '🥈', name: '50 adventures', test: (p) => p.lessons >= 50 },
    { id: 'l100', icon: '🥇', name: '100 adventures', test: (p) => p.lessons >= 100 },
    { id: 'streak3', icon: '🔥', name: 'Played 3 days in a row', test: (p) => store.streak(p) >= 3 },
    { id: 'streak7', icon: '🌟', name: 'Played 7 days in a row', test: (p) => store.streak(p) >= 7 },
    { id: 'count10', icon: '🔟', name: 'Counts to 10', test: (p) => srs.allKnown('count', U.range(1, 10), p) },
    { id: 'count20', icon: '🎯', name: 'Counts to 20', test: (p) => srs.allKnown('count', U.range(1, 20), p) },
    { id: 'numbers', icon: '🔢', name: 'Knows numbers 0 to 20', test: (p) => srs.allKnown('numbers', D().NUM_ORDER, p) },
    { id: 'upper', icon: '🔠', name: 'Knows all big letters', test: (p) => srs.allKnown('upper', D().LETTERS, p) },
    { id: 'lower', icon: '🔡', name: 'Knows all little letters', test: (p) => srs.allKnown('lower', D().LETTERS.map((l) => l.toLowerCase()), p) },
    { id: 'sounds', icon: '🗣️', name: 'Knows all letter sounds', test: (p) => srs.allKnown('sounds', D().LETTERS, p) },
    { id: 'colors', icon: '🎨', name: 'Knows all the colors', test: (p) => srs.allKnown('colors', D().COLORS.map((c) => c.id), p) },
    { id: 'shapes', icon: '🔷', name: 'Knows all flat shapes', test: (p) => srs.allKnown('shapes', D().SHAPES.filter((s) => !s.solid).map((s) => s.id), p) },
    { id: 'add5', icon: '➕', name: 'Adds up to 5', test: (p) => srs.allKnown('add', D().ADD_FACTS.filter((f) => f.split('+').reduce((a, b) => a + Number(b), 0) <= 5), p) },
    { id: 'add10', icon: '🧮', name: 'Adds up to 10', test: (p) => srs.allKnown('add', D().ADD_FACTS, p) },
    { id: 'sub10', icon: '➖', name: 'Takes away within 10', test: (p) => srs.allKnown('sub', D().SUB_FACTS, p) },
    { id: 'sight25', icon: '📖', name: 'Reads 25 sight words', test: (p) => srs.known('sight', D().SIGHT.map((s) => s[0]), p) >= 25 },
    { id: 'sight50', icon: '📚', name: 'Reads 50 sight words', test: (p) => srs.known('sight', D().SIGHT.map((s) => s[0]), p) >= 50 },
    { id: 'rhyme', icon: '🎵', name: 'Rhyme star', test: (p) => srs.known('rhyme', D().RHYME_ITEMS.map((r) => r.key), p) >= 20 },
    { id: 'spell', icon: '✏️', name: 'Spells 10 words', test: (p) => srs.counts('cvc', D().CVC.map((c) => c[0]), p).mastered >= 10 },
    { id: 'stickers', icon: '📒', name: 'Filled a whole sticker page', test: (p) => KQ.themes.get(p.theme).stickers.every((s) => p.stickers.includes(s[0])) },
  ];

  function stickerName(emoji) {
    for (const id of KQ.themes.list) {
      const s = KQ.themes.get(id).stickers.find((x) => x[0] === emoji);
      if (s) return s[1];
    }
    return 'sticker';
  }

  KQ.rewards = {
    TROPHIES,
    stickerName,
    COLOR_EVERY: 3,
    nextColorIn(p) {
      if (KQ.themes.PAINT.every((c) => p.colors.includes(c.id))) return null;
      return this.COLOR_EVERY - (p.lessons % this.COLOR_EVERY);
    },
    /** Called when a lesson ends. Returns what the child won. */
    lessonDone(p, stars) {
      p.lessons++;
      p.stars += stars;
      store.day(p).l++;
      const out = { sticker: null, color: null, trophies: [] };
      const owned = new Set(p.stickers);
      let options = KQ.themes.get(p.theme).stickers.filter((s) => !owned.has(s[0]));
      if (!options.length) options = KQ.themes.list.flatMap((id) => KQ.themes.get(id).stickers).filter((s) => !owned.has(s[0]));
      if (options.length) {
        const s = U.pick(options);
        p.stickers.push(s[0]);
        out.sticker = s;
      }
      if (p.lessons % this.COLOR_EVERY === 0) {
        const next = KQ.themes.PAINT.find((c) => !p.colors.includes(c.id));
        if (next) {
          p.colors.push(next.id);
          out.color = next;
        }
      }
      out.trophies = this.checkTrophies(p);
      store.save();
      return out;
    },
    checkTrophies(p) {
      const won = [];
      for (const t of TROPHIES) {
        if (!p.trophies.includes(t.id)) {
          let ok = false;
          try {
            ok = t.test(p);
          } catch (e) { /* ignore */ }
          if (ok) {
            p.trophies.push(t.id);
            won.push(t);
          }
        }
      }
      return won;
    },
  };
})();

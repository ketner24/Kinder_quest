/* Kinder Quest - learning activities (multiple-choice style).
   Each activity: picks what to practise from the spaced-repetition engine,
   builds a question, and says what to praise / correct. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util, D = KQ.D, E = KQ.engine, ui = KQ.ui, srs = KQ.srs;
  const { $, $$ } = U;

  /* ---------- registry ---------- */
  const A = (KQ.acts = {
    list: [],
    byId: {},
    add(a) {
      a.kind = a.kind || 'lesson';
      if (a.mixable == null) a.mixable = a.kind === 'lesson';
      this.list.push(a);
      this.byId[a.id] = a;
      return a;
    },
    inWorld: (w) => A.list.filter((a) => a.world === w || (a.alsoIn || []).includes(w)),
    unlocked(a, p = KQ.store.current()) {
      if (KQ.store.settings().unlockAll || !a.requires) return true;
      return a.requires.every((r) => {
        const ra = A.byId[r.act];
        return srs.known(ra.skill, ra.pool(), p) >= r.known;
      });
    },
    /** For locked tiles: how far along the child is. */
    lockInfo(a, p = KQ.store.current()) {
      const r = a.requires.find((r) => {
        const ra = A.byId[r.act];
        return srs.known(ra.skill, ra.pool(), p) < r.known;
      });
      if (!r) return null;
      const ra = A.byId[r.act];
      return { act: ra, have: srs.known(ra.skill, ra.pool(), p), need: r.known };
    },
    stars: (a, p) => (a.skill && a.pool ? srs.stars(a.skill, a.pool(), p) : 0),
  });

  /* ---------- shared bits ---------- */
  const glyph = (ch, cls = '') => `<span class="glyph ${cls}">${U.esc(ch)}</span>`;
  const hidden = (spoken) => ({ d: 'Tap the one you hear! 👂', s: spoken });
  const counter = () => U.pick(ui.theme().counters);
  const blob = (id) => {
    const c = D.colorById(id);
    return `<span class="blob${id === 'white' ? ' white' : ''}" style="--c:${c.hex}"></span>`;
  };
  /** Grid of n objects, laid out in rows of 5 like a ten-frame. */
  function objs(n, emoji, cls = '') {
    let h = `<div class="objs ${n > 10 ? 'many' : ''} ${cls}" style="--n:${n};--cols:${Math.min(5, n)}">`;
    for (let i = 0; i < n; i++) h += `<span class="obj" data-k="${i}">${emoji}</span>`;
    return h + '</div>';
  }
  /** Put a reward picture in the prompt area ("B is for bear 🐻"). */
  function showPic(emoji, word) {
    const p = $('.q-prompt');
    if (p) p.innerHTML = `<div class="reward-pic pop-in"><span class="rp-emoji">${emoji}</span>${word ? `<b>${U.esc(word)}</b>` : ''}</div>`;
  }
  /** Highlight and count objects out loud: "1, 2, 3!" */
  async function countAlong(els) {
    els = Array.from(els);
    if (els.length <= 10) {
      for (let i = 0; i < els.length; i++) {
        els[i].classList.add('counted');
        els[i].dataset.n = i + 1;
        KQ.sfx.count(i);
        await ui.say(String(i + 1));
      }
    } else {
      const words = els.map((_, i) => i + 1).join(', ');
      const step = Math.max(320, ((words.length * 70) / KQ.voice.rate) / els.length);
      const sp = ui.say(words);
      for (let i = 0; i < els.length; i++) {
        els[i].classList.add('counted');
        els[i].dataset.n = i + 1;
        KQ.sfx.count(i % 12);
        await U.sleep(step);
      }
      await sp;
    }
  }
  /** Let the child tap objects to count them while thinking. */
  function tapToCount(stage) {
    let k = 0;
    $$('.q-prompt .obj', stage).forEach((o) =>
      o.addEventListener('click', () => {
        if (o.classList.contains('counted')) return;
        k++;
        o.classList.add('counted');
        o.dataset.n = k;
        KQ.sfx.count(k);
        KQ.voice.say(String(k));
      })
    );
  }
  const numChoices = (answer, n, lo, hi, confuse = []) => {
    const pool = U.range(lo, hi);
    const out = [];
    for (const c of U.shuffle(confuse)) if (out.length < Math.min(1, n) && c !== answer && pool.includes(c)) out.push(c);
    const near = U.shuffle(pool.filter((x) => x !== answer && Math.abs(x - answer) <= 3 && !out.includes(x)));
    for (const x of near) if (out.length < n) out.push(x);
    for (const x of U.shuffle(pool)) if (out.length < n && x !== answer && !out.includes(x)) out.push(x);
    return U.shuffle([answer, ...out]);
  };
  const numTile = (n) => ({ value: n, html: glyph(String(n), 'num'), label: String(n), say: String(n) });

  /* ======================= LETTERS ======================= */
  A.add({
    id: 'abc-explore', world: 'letters', alsoIn: ['play'], kind: 'explore', title: 'ABC Explore', icon: '🔤', run: (ctx) => KQ.special.abcExplore(ctx),
  });

  A.add({
    id: 'find-upper', world: 'letters', title: 'Find the Letter', icon: glyph('A', 'icon-glyph'), skill: 'upper',
    intro: "Let's find big letters!",
    pool: () => D.LETTERS,
    make(ctx) {
      const { key: L, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const n = E.nChoices(this.skill, L);
      const opts = U.shuffle([L, ...E.distractors(this.skill, L, this.pool(), n - 1, D.CONFUSE_UPPER[L])]);
      const wi = U.rand(D.WORDS[L].length);
      const [w, e] = D.WORDS[L][wi];
      return {
        skill: this.skill, item: L, answer: L,
        teach: isNew && { html: glyph(L) + `<span class="teach-pic">${e}</span>`, say: ['New letter! This is ', D.ltr(L), '. Tap the ', D.ltr(L), '!'], after: D.isFor(L, wi) },
        say: hidden('Tap the letter ' + D.LETTER_SAY[L] + '.'),
        choices: opts.map((x) => ({ value: x, html: glyph(x), label: x })),
        afterRight: () => showPic(e, w),
        right: (c, first) => [first ? ui.praise() : "That's it!", ' ', D.isFor(L, wi)],
        wrong: (c) => [ui.oops(), ' That is ', D.ltr(c.value), '. Can you find ', D.ltr(L), '?'],
        reveal: (c) => ['That is ', D.ltr(c.value), '. Here is ', D.ltr(L), '. Tap ', D.ltr(L), '.'],
      };
    },
  });

  A.add({
    id: 'find-lower', world: 'letters', title: 'Little Letters', icon: glyph('a', 'icon-glyph'), skill: 'lower',
    intro: "Let's find little letters!",
    requires: [{ act: 'find-upper', known: 6 }],
    pool: () => D.LETTERS.map((l) => l.toLowerCase()),
    make(ctx) {
      const { key: l, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const L = l.toUpperCase();
      const n = E.nChoices(this.skill, l);
      const opts = U.shuffle([l, ...E.distractors(this.skill, l, this.pool(), n - 1, D.CONFUSE_LOWER[l])]);
      const wi = U.rand(D.WORDS[L].length);
      const [w, e] = D.WORDS[L][wi];
      return {
        skill: this.skill, item: l, answer: l,
        teach: isNew && { html: glyph(L + l), say: ['This is little ', D.ltr(l), '. Big ', D.ltr(L), ', little ', D.ltr(l), '. Tap it!'], after: D.isFor(L, wi) },
        say: hidden('Tap the little letter ' + D.LETTER_SAY[L] + '.'),
        choices: opts.map((x) => ({ value: x, html: glyph(x), label: x })),
        afterRight: () => showPic(e, w),
        right: (c, first) => [first ? ui.praise() : "That's it!", ' Little ', D.ltr(l), '! ', D.isFor(L, wi)],
        wrong: (c) => [ui.oops(), ' That is little ', D.ltr(c.value), '. Find little ', D.ltr(l), '.'],
        reveal: (c) => ['Here is little ', D.ltr(l), '. Tap it.'],
      };
    },
  });

  A.add({
    id: 'match-case', world: 'letters', title: 'Big & Little', icon: `<span class="icon-glyph glyph">Bb</span>`, skill: 'match',
    intro: 'Match big letters with little letters!',
    requires: [{ act: 'find-lower', known: 5 }],
    pool: () => D.LETTERS,
    make(ctx) {
      const { key: L } = srs.pick(this.skill, this.pool(), ctx);
      const l = L.toLowerCase();
      const n = E.nChoices(this.skill, L);
      const confuse = (D.CONFUSE_LOWER[l] || []).map((x) => x.toUpperCase());
      const opts = U.shuffle([L, ...E.distractors(this.skill, L, this.pool(), n - 1, confuse)]);
      return {
        skill: this.skill, item: L, answer: L,
        promptHTML: `<div class="prompt-card">${glyph(L, 'xl')}</div>`,
        say: ['Find the little letter that matches big ', D.ltr(L), '.'],
        choices: opts.map((x) => ({ value: x, html: glyph(x.toLowerCase()), label: x.toLowerCase() })),
        afterRight: () => {
          const p = $('.q-prompt .prompt-card');
          if (p) p.innerHTML = glyph(L + l, 'xl');
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' Big ', D.ltr(L), ' and little ', D.ltr(l), '!'],
        wrong: (c) => [ui.oops(), ' That is little ', D.ltr(c.value), '. Find little ', D.ltr(l), '.'],
        reveal: () => ['This is little ', D.ltr(l), '. It matches big ', D.ltr(L), '. Tap it.'],
      };
    },
  });

  A.add({
    id: 'letter-sounds', world: 'letters', title: 'Letter Sounds', icon: '🗣️', skill: 'sounds',
    intro: "Let's listen to letter sounds!",
    requires: [{ act: 'find-upper', known: 6 }],
    pool: () => D.LETTERS,
    make(ctx) {
      const { key: L, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const snd = D.LETTER_SOUND[L];
      const [w, e] = D.WORDS[L][0];
      const b = srs.box(this.skill, L);
      const n = E.nChoices(this.skill, L);
      const opts = U.shuffle([L, ...E.distractors(this.skill, L, this.pool(), n - 1, D.CONFUSE_UPPER[L])]);
      const tile = (x) => glyph(x + x.toLowerCase(), 'pair');
      const like = L === 'X' ? ', like at the end of ' + w : ', like ' + w;
      return {
        skill: this.skill, item: L, answer: L,
        teach: isNew && { html: tile(L) + `<span class="teach-pic">${e}</span>`, say: [D.ltr(L), ' says ', snd, like, '. Tap the ', D.ltr(L), '!'], after: [snd, ', ', snd, ', ', w, '!'] },
        promptHTML: b < 2 ? `<div class="prompt-pic">${e}</div>` : `<div class="prompt-pic ear">👂</div>`,
        say: { d: 'Which letter makes this sound? 👂', s: 'Which letter says ' + snd + (b < 2 ? like : '') + '?' },
        choices: opts.map((x) => ({ value: x, html: tile(x), label: x })),
        afterRight: () => showPic(e, w),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', D.ltr(L), ' says ', snd, '. ', snd, ', ', snd, ', ', w, '!'],
        wrong: (c) => [ui.oops(), ' ', D.ltr(c.value), ' says ', D.LETTER_SOUND[c.value], '. Which letter says ', snd, '?'],
        reveal: () => ['This is ', D.ltr(L), '. ', D.ltr(L), ' says ', snd, like, '. Tap ', D.ltr(L), '.'],
      };
    },
  });

  // Which letters start with the same sound (so we never offer two right answers).
  const SAME_START = { C: ['K', 'Q'], K: ['C', 'Q'], Q: ['C', 'K'], U: ['Y'], Y: ['U'] };
  A.add({
    id: 'first-sounds', world: 'letters', title: 'First Sounds', icon: '🐝', skill: 'begin',
    intro: "What sound does it start with? Let's listen!",
    requires: [{ act: 'letter-sounds', known: 5 }],
    pool: () => D.LETTERS.filter((l) => l !== 'X'),
    make(ctx) {
      const { key: L } = srs.pick(this.skill, this.pool(), ctx);
      const b = srs.box(this.skill, L);
      const words = D.WORDS[L];
      const [w, e] = U.pick(words);
      const snd = D.LETTER_SOUND[L];
      const n = Math.min(3, E.nChoices(this.skill, L));
      if (b < 2) {
        // Show the letter, pick the picture.
        const others = U.sample(this.pool(), n - 1, [L, ...(SAME_START[L] || [])]).map((x) => U.pick(D.WORDS[x]));
        const opts = U.shuffle([[w, e], ...others]);
        return {
          skill: this.skill, item: L, answer: w, readChoices: true,
          promptHTML: `<div class="prompt-card">${glyph(L + L.toLowerCase(), 'xl')}</div>`,
          say: ['Which one starts with ', D.ltr(L), '? ', snd, '... ', snd, '...'],
          choices: opts.map(([ww, ee]) => ({ value: ww, html: `<span class="emo">${ee}</span>`, label: ww, say: ww })),
          right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', U.cap(w), ' starts with ', D.ltr(L), '! ', snd, ', ', w, '!'],
          wrong: (c) => [U.cap(c.value), ' starts with ', D.ltr(c.value[0].toUpperCase()), '. Which one starts with ', snd, '?'],
          reveal: () => [U.cap(w), ' starts with ', D.ltr(L), '. ', snd, ', ', w, '. Tap the ', w, '.'],
        };
      }
      // Show the picture, pick the letter.
      const opts = U.shuffle([L, ...U.sample(this.pool(), n - 1, [L, ...(SAME_START[L] || [])])]);
      return {
        skill: this.skill, item: L, answer: L,
        promptHTML: `<div class="reward-pic"><span class="rp-emoji">${e}</span><b>${U.esc(w)}</b></div>`,
        say: ['What letter does ', w, ' start with?'],
        choices: opts.map((x) => ({ value: x, html: glyph(x + x.toLowerCase(), 'pair'), label: x })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', U.cap(w), ' starts with ', D.ltr(L), '! ', snd, ', ', w, '!'],
        wrong: (c) => [ui.oops(), ' That is ', D.ltr(c.value), '. ', D.ltr(c.value), ' says ', D.LETTER_SOUND[c.value], '. Listen: ', w, '.'],
        reveal: () => [U.cap(w), ' starts with ', D.ltr(L), '. Tap ', D.ltr(L), '.'],
      };
    },
  });

  A.add({
    id: 'abc-order', world: 'letters', title: 'ABC Order', icon: `<span class="icon-glyph glyph">ABC</span>`, skill: 'alpha',
    intro: 'What letter comes next?',
    requires: [{ act: 'find-upper', known: 13 }],
    pool: () => D.LETTERS.slice(1),
    make(ctx) {
      const { key: L } = srs.pick(this.skill, this.pool(), ctx);
      const i = D.LETTERS.indexOf(L);
      const b = srs.box(this.skill, L);
      const show = D.LETTERS.slice(Math.max(0, i - (b < 2 ? 3 : 2)), i);
      const n = E.nChoices(this.skill, L, 3);
      const near = [D.LETTERS[i + 1], D.LETTERS[i - 2], D.LETTERS[i + 2], ...D.LETTERS].filter((x) => x && x !== L && !show.slice(-1).includes(x));
      const opts = U.shuffle([L, ...[...new Set(near)].slice(0, n - 1)]);
      const seq = show.map((x) => D.ltr(x));
      const seqSay = seq.flatMap((x) => [x, ', ']);
      return {
        skill: this.skill, item: L, answer: L,
        promptHTML: `<div class="seq">${show.map((x) => `<span class="seq-cell">${x}</span>`).join('')}<span class="seq-cell q">?</span></div>`,
        say: [...seqSay, '... what letter comes next?'],
        choices: opts.map((x) => ({ value: x, html: glyph(x), label: x })),
        afterRight: () => {
          const q = $('.seq .q');
          if (q) (q.textContent = L), q.classList.add('filled');
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', ...seqSay, D.ltr(L), '!'],
        wrong: (c) => [ui.oops(), ' That is ', D.ltr(c.value), '. Say it with me: ', ...seqSay, '...'],
        reveal: () => [...seqSay, D.ltr(L), '! Tap ', D.ltr(L), '.'],
      };
    },
  });

  A.add({
    id: 'trace-letters', world: 'letters', title: 'Trace Letters', icon: '✍️', skill: 'traceL',
    intro: 'Trace the letter with your finger!',
    pool: () => [...D.LETTERS, ...D.LETTERS.map((l) => l.toLowerCase())],
    mixWeight: 0.5,
    run(ctx) {
      return KQ.special.trace(ctx, this);
    },
  });

  /* ======================= NUMBERS ======================= */
  A.add({ id: 'num-explore', world: 'numbers', alsoIn: ['play'], kind: 'explore', title: '123 Explore', icon: '🔢', run: (ctx) => KQ.special.numExplore(ctx) });

  A.add({
    id: 'find-number', world: 'numbers', title: 'Find the Number', icon: glyph('7', 'icon-glyph num'), skill: 'numbers',
    intro: "Let's find numbers!",
    pool: () => D.NUM_ORDER,
    make(ctx) {
      const { key: n, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const k = E.nChoices(this.skill, n);
      const opts = U.shuffle([n, ...E.distractors(this.skill, n, this.pool(), k - 1, D.CONFUSE_NUM[n] || [])]);
      const [emo, one, many] = counter();
      const word = U.plural(n, one, many);
      return {
        skill: this.skill, item: n, answer: n,
        teach: isNew && {
          html: glyph(String(n), 'num') + (n > 0 && n <= 10 ? objs(n, emo, 'mini') : ''),
          say: n === 0 ? ['This is zero. Zero means none at all! Tap the zero!'] : ['New number! This is ', String(n), '. Tap the ', String(n), '!'],
          after: n === 0 ? ['Zero!'] : n <= 10 ? [U.range(1, n).join(', '), '! ', String(n), ' ', word, '!'] : [String(n), '!'],
        },
        say: hidden('Tap the number ' + n + '.'),
        choices: opts.map(numTile),
        afterRight: () => {
          const p = $('.q-prompt');
          if (p && n > 0 && n <= 20) p.innerHTML = objs(n, emo, 'pop-in small');
        },
        right: (c, first) => [first ? ui.praise() : "That's it!", ' ', String(n), n > 0 ? '! ' + n + ' ' + word + '!' : '! Zero!'],
        wrong: (c) => [ui.oops(), ' That is ', String(c.value), '. Can you find ', String(n), '?'],
        reveal: (c) => ['That is ', String(c.value), '. Here is ', String(n), '. Tap ', String(n), '.'],
      };
    },
  });

  A.add({
    id: 'how-many', world: 'numbers', title: 'How Many?', icon: '🧮', skill: 'count',
    intro: "Let's count! You can tap each one to count it.",
    pool: () => D.COUNT_ORDER,
    make(ctx) {
      const { key: n } = srs.pick(this.skill, this.pool(), ctx);
      const [emo, one, many] = counter();
      const k = E.nChoices(this.skill, n, 3);
      const opts = numChoices(n, k - 1, 1, Math.max(10, n + 2));
      return {
        skill: this.skill, item: n, answer: n,
        promptHTML: objs(n, emo),
        setup: tapToCount,
        say: ['How many ', many, '?'],
        choices: opts.map(numTile),
        onWrong: async () => {
          await ui.say("Let's count together!");
          const els = $$('.q-prompt .obj');
          els.forEach((o) => (o.classList.remove('counted'), delete o.dataset.n));
          await countAlong(els);
          return 'reveal';
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', String(n), ' ', U.plural(n, one, many), '!'],
        wrong: () => '',
        reveal: () => ['There are ', String(n), ' ', U.plural(n, one, many), '. Tap ', String(n), '.'],
      };
    },
  });

  A.add({
    id: 'show-me', world: 'numbers', title: 'Tap & Count', icon: '👆', skill: 'count',
    intro: "Let's tap and count!",
    requires: [{ act: 'how-many', known: 4 }],
    pool: () => D.COUNT_ORDER.slice(0, 15),
    run(ctx) {
      return KQ.special.showMe(ctx, this);
    },
  });

  A.add({
    id: 'more-less', world: 'numbers', title: 'More or Less', icon: '⚖️', skill: 'compare',
    intro: "Let's find out which has more!",
    requires: [{ act: 'how-many', known: 5 }],
    pool: () => ['more', 'fewer', 'bigger', 'smaller'],
    make(ctx) {
      const { key: kind } = srs.pick(this.skill, this.pool(), ctx, { learnSize: 2 });
      const b = srs.box(this.skill, kind);
      const groups = kind === 'more' || kind === 'fewer';
      const hi = groups ? 10 : b < 2 ? 10 : 20;
      const gap = b < 1 ? 3 : 1;
      let x, y;
      do {
        x = U.rand(hi) + 1;
        y = U.rand(hi) + 1;
      } while (Math.abs(x - y) < gap);
      const want = kind === 'more' || kind === 'bigger' ? Math.max(x, y) : Math.min(x, y);
      const other = want === x ? y : x;
      const [emo, one, many] = counter();
      const word = { more: 'more', fewer: 'fewer', bigger: 'bigger', smaller: 'smaller' }[kind];
      const rel = kind === 'more' || kind === 'bigger' ? 'more than' : 'less than';
      const choices = [x, y].map((v) => (groups ? { value: v, html: objs(v, emo, 'in-choice'), label: v + ' ' + many } : numTile(v)));
      return {
        skill: this.skill, item: kind, answer: want,
        choiceClass: groups ? 'wide' : '',
        say: groups ? ['Which group has ', word, ' ', many, '?'] : ['Which number is ', word, '?'],
        choices,
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', String(want), ' is ', rel, ' ', String(other), '!'],
        wrong: (c) => [ui.oops(), ' That one has ', String(c.value), '. Look again. Which is ', word, '?'],
        reveal: () => [String(want), ' is ', rel, ' ', String(other), '. Tap ', groups ? 'the group with ' + want : String(want), '.'],
      };
    },
  });

  A.add({
    id: 'next-number', world: 'numbers', title: 'What Comes Next?', icon: `<span class="icon-glyph glyph num">1 2 ?</span>`, skill: 'order',
    intro: "Let's put numbers in order!",
    requires: [{ act: 'find-number', known: 8 }],
    pool: () => U.range(1, 20),
    make(ctx) {
      const { key: n } = srs.pick(this.skill, this.pool(), ctx);
      const b = srs.box(this.skill, n);
      let type = b < 2 ? 'after' : U.pick(['after', 'before', 'between']);
      if (n >= 20 && type !== 'after') type = 'after';
      let cells, say;
      if (type === 'after') {
        const show = U.range(Math.max(0, n - (b < 2 ? 3 : 2)), n - 1);
        cells = [...show, '?'];
        say = [show.join(', '), '... what number comes next?'];
      } else if (type === 'before') {
        cells = ['?', n + 1];
        say = ['What number comes just before ', String(n + 1), '?'];
      } else {
        cells = [n - 1, '?', n + 1];
        say = [String(n - 1), ', something, ', String(n + 1), '. What number is missing?'];
      }
      const k = E.nChoices(this.skill, n, 3);
      return {
        skill: this.skill, item: n, answer: n,
        promptHTML: `<div class="seq">${cells.map((c) => `<span class="seq-cell num ${c === '?' ? 'q' : ''}">${c}</span>`).join('')}</div>`,
        say,
        choices: numChoices(n, k - 1, Math.max(0, n - 3), n + 3).map(numTile),
        afterRight: () => {
          const q = $('.seq .q');
          if (q) (q.textContent = n), q.classList.add('filled');
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', cells.map((c) => (c === '?' ? n : c)).join(', '), '!'],
        wrong: (c) => [ui.oops(), ' That is ', String(c.value), '. Let’s count: ', cells.filter((c) => c !== '?' && c < n).join(', '), '...'],
        reveal: () => ['It is ', String(n), '! ', cells.map((c) => (c === '?' ? n : c)).join(', '), '. Tap ', String(n), '.'],
      };
    },
  });

  function factParts(f) {
    const [a, b] = f.split(/[+-]/).map(Number);
    return [a, b];
  }

  A.add({
    id: 'add', world: 'numbers', title: 'Add It Up', icon: '➕', skill: 'add',
    intro: "Let's add! Put them together and count them all.",
    requires: [{ act: 'how-many', known: 8 }],
    pool: () => D.ADD_FACTS,
    make(ctx) {
      const { key: f } = srs.pick(this.skill, this.pool(), ctx);
      const [a, b] = factParts(f);
      const sum = a + b;
      const [emo, one, many] = counter();
      const k = E.nChoices(this.skill, f, 3);
      const opts = numChoices(sum, k - 1, Math.max(1, sum - 3), Math.min(12, sum + 3));
      return {
        skill: this.skill, item: f, answer: sum,
        promptHTML: `<div class="eq"><div class="grp">${objs(a, emo, 'small')}<b>${a}</b></div><span class="op">+</span><div class="grp">${objs(b, emo, 'small')}<b>${b}</b></div><span class="op">=</span><span class="op q">?</span></div>`,
        setup: tapToCount,
        say: [`${a} ${U.plural(a, one, many)} plus ${b} ${U.plural(b, one, many)}. How many ${many} in all?`],
        choices: opts.map(numTile),
        afterRight: () => {
          const q = $('.eq .q');
          if (q) (q.textContent = sum), q.classList.add('filled');
        },
        onWrong: async () => {
          await ui.say("Let's count them all together!");
          const els = $$('.q-prompt .obj');
          els.forEach((o) => (o.classList.remove('counted'), delete o.dataset.n));
          await countAlong(els);
          return 'reveal';
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${a} plus ${b} equals ${sum}!`],
        wrong: () => '',
        reveal: () => [`${a} plus ${b} equals ${sum}. Tap ${sum}.`],
      };
    },
  });

  A.add({
    id: 'subtract', world: 'numbers', title: 'Take Away', icon: '➖', skill: 'sub',
    intro: "Let's take away! Some will zoom off. How many are left?",
    requires: [{ act: 'add', known: 8 }],
    pool: () => D.SUB_FACTS,
    make(ctx) {
      const { key: f } = srs.pick(this.skill, this.pool(), ctx);
      const [a, b] = factParts(f);
      const left = a - b;
      const [emo, one, many] = counter();
      const k = E.nChoices(this.skill, f, 3);
      const opts = numChoices(left, k - 1, Math.max(0, left - 3), Math.min(10, left + 3));
      let flown = false;
      return {
        skill: this.skill, item: f, answer: left,
        promptHTML: `<div class="eq">${objs(a, emo)}</div>`,
        preface: async (stage) => {
          await ui.say(`There are ${a} ${U.plural(a, one, many)}.`);
          const els = $$('.q-prompt .obj', stage).slice(a - b);
          els.forEach((o, i) => setTimeout(() => o.classList.add('gone'), i * 150));
          KQ.sfx.theme(ui.theme().sfx);
          flown = true;
          await ui.say(`${b} ${b === 1 ? 'goes' : 'go'} away!`);
        },
        say: () => (flown ? [`${a} take away ${b}. How many ${many} are left?`] : ['How many are left?']),
        choices: opts.map(numTile),
        onWrong: async () => {
          await ui.say("Let's count the ones that are left!");
          await countAlong($$('.q-prompt .obj:not(.gone)'));
          return 'reveal';
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${a} take away ${b} is ${left}!`],
        wrong: () => '',
        reveal: () => [`${a} take away ${b} is ${left}. Tap ${left}.`],
      };
    },
  });

  A.add({
    id: 'trace-numbers', world: 'numbers', title: 'Trace Numbers', icon: '✏️', skill: 'traceN',
    intro: 'Trace the number with your finger!',
    pool: () => U.range(0, 20).map(String),
    mixWeight: 0.5,
    run(ctx) {
      return KQ.special.trace(ctx, this);
    },
  });

  A.add({ id: 'hundred', world: 'numbers', kind: 'explore', title: 'Count to 100', icon: '💯', run: (ctx) => KQ.special.hundred(ctx) });

  /* ======================= COLORS & SHAPES ======================= */
  A.add({ id: 'color-explore', world: 'colors', alsoIn: ['play'], kind: 'explore', title: 'Color Explore', icon: '🌈', run: (ctx) => KQ.special.colorExplore(ctx) });

  A.add({
    id: 'find-color', world: 'colors', title: 'Find the Color', icon: '🎨', skill: 'colors',
    intro: "Let's find colors!",
    pool: () => D.COLORS.map((c) => c.id),
    make(ctx) {
      const { key: id, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const col = D.colorById(id);
      const k = E.nChoices(this.skill, id);
      const opts = U.shuffle([id, ...E.distractors(this.skill, id, this.pool(), k - 1)]);
      const [oe, on] = U.pick(col.objs);
      const objSay = (o) => `${U.cap(U.article(o[1]))} ${o[1]} is ${id}.`;
      return {
        skill: this.skill, item: id, answer: id,
        teach: isNew && {
          html: blob(id) + `<span class="teach-pic">${col.objs.slice(0, 2).map((o) => o[0]).join(' ')}</span>`,
          say: [`This color is ${id}! `, objSay(col.objs[0]), ` Tap ${id}!`],
          after: [objSay(col.objs[1] || col.objs[0])],
        },
        say: [`Tap ${id}.`],
        choices: opts.map((x) => ({ value: x, html: blob(x), label: x })),
        afterRight: () => showPic(oe, on),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` That is ${id}! `, objSay([oe, on])],
        wrong: (c) => [ui.oops(), ` That is ${c.value}. Can you find ${id}?`],
        reveal: (c) => [`That is ${c.value}. This is ${id}. Tap ${id}.`],
      };
    },
  });

  A.add({
    id: 'what-color', world: 'colors', title: 'What Color?', icon: '🍌', skill: 'colorobj',
    intro: 'What color is it?',
    requires: [{ act: 'find-color', known: 5 }],
    pool: () => D.COLOR_OBJECTS.map((o) => o.key),
    make(ctx) {
      const { key } = srs.pick(this.skill, this.pool(), ctx);
      const o = D.COLOR_OBJECTS.find((x) => x.key === key);
      const k = E.nChoices(this.skill, key);
      const opts = U.shuffle([o.color, ...U.sample(D.COLORS.map((c) => c.id), k - 1, [o.color])]);
      return {
        skill: this.skill, item: key, answer: o.color,
        promptHTML: `<div class="prompt-pic">${o.emoji}</div>`,
        say: [`What color is the ${o.key}?`],
        choices: opts.map((x) => ({ value: x, html: blob(x), label: x })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` The ${o.key} is ${o.color}!`],
        wrong: (c) => [ui.oops(), ` That is ${c.value}. Look at the ${o.key} again.`],
        reveal: () => [`The ${o.key} is ${o.color}. Tap ${o.color}.`],
      };
    },
  });

  A.add({
    id: 'mix-colors', world: 'colors', title: 'Color Mixing', icon: '🧪', skill: 'mix',
    intro: "Let's mix colors like magic!",
    requires: [{ act: 'find-color', known: 8 }],
    pool: () => D.MIXES.map((m) => m.make),
    make(ctx) {
      const { key } = srs.pick(this.skill, this.pool(), ctx, { learnSize: 2 });
      const m = D.MIXES.find((x) => x.make === key);
      const opts = U.shuffle([m.make, ...U.sample(['orange', 'green', 'purple', 'pink', 'gray', 'brown'], 2, [m.make])]);
      const mixAnim = async () => {
        const p = $('.q-prompt .mix');
        if (!p) return;
        p.classList.add('mixing');
        await U.sleep(700);
        p.innerHTML = blob(m.make);
        p.classList.remove('mixing');
        KQ.sfx.pop();
      };
      return {
        skill: this.skill, item: key, answer: m.make,
        promptHTML: `<div class="mix">${blob(m.a)}<span class="op">+</span>${blob(m.b)}<span class="op">=</span><span class="op q">?</span></div>`,
        say: [`${U.cap(m.a)} and ${m.b} mix together. What color do they make?`],
        choices: opts.map((x) => ({ value: x, html: blob(x), label: x })),
        afterRight: mixAnim,
        onWrong: async (c, n) => {
          if (n >= 1) {
            await ui.say("Let's mix them and see!");
            await mixAnim();
            return 'reveal';
          }
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${U.cap(m.a)} and ${m.b} make ${m.make}!`],
        wrong: () => '',
        reveal: () => [`${U.cap(m.a)} and ${m.b} make ${m.make}! Tap ${m.make}.`],
      };
    },
  });

  A.add({ id: 'shape-explore', world: 'colors', kind: 'explore', title: 'Shape Explore', icon: '🔺', run: (ctx) => KQ.special.shapeExplore(ctx) });

  const CONFUSE_SHAPE = {
    circle: ['oval', 'sphere'], square: ['rectangle', 'diamond', 'cube'], triangle: ['diamond', 'cone'], rectangle: ['square', 'cylinder'],
    oval: ['circle'], diamond: ['square', 'triangle'], hexagon: ['pentagon'], pentagon: ['hexagon'], star: ['heart'], heart: ['star'],
    sphere: ['circle', 'cylinder'], cube: ['square', 'cylinder'], cylinder: ['rectangle', 'cube'], cone: ['triangle', 'cylinder'],
  };
  A.add({
    id: 'find-shape', world: 'colors', title: 'Find the Shape', icon: '🔷', skill: 'shapes',
    intro: "Let's find shapes!",
    pool: () => D.SHAPES.map((s) => s.id),
    make(ctx) {
      const { key: id, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const sh = D.shapeById(id);
      const k = E.nChoices(this.skill, id);
      const opts = U.shuffle([id, ...E.distractors(this.skill, id, this.pool(), k - 1, CONFUSE_SHAPE[id])]);
      const fills = U.shuffle(D.SHAPE_FILLS);
      const nm = (x) => `${U.article(x)} ${x}`;
      return {
        skill: this.skill, item: id, answer: id,
        teach: isNew && { html: D.shapeSVG(id, fills[0]), say: [`This is ${nm(id)}! ${sh.fact} Tap the ${id}!`], after: [`${U.cap(id)}!`] },
        say: [`Tap the ${id}.`],
        choices: opts.map((x, i) => ({ value: x, html: D.shapeSVG(x, fills[i % fills.length]), label: x })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${sh.fact}`],
        wrong: (c) => [ui.oops(), ` That is ${nm(c.value)}. Find the ${id}.`],
        reveal: (c) => [`This is the ${id}. ${sh.fact} Tap it.`],
      };
    },
  });

  /* ======================= READING ======================= */
  A.add({
    id: 'sight-words', world: 'words', title: 'Sight Words', icon: '📖', skill: 'sight',
    intro: "Let's read words!",
    requires: [{ act: 'find-upper', known: 10 }],
    pool: () => D.SIGHT.map((s) => s[0]),
    make(ctx) {
      const { key: w, isNew } = srs.pick(this.skill, this.pool(), ctx);
      const pool = this.pool();
      const look = pool.filter((x) => x !== w && (x[0].toLowerCase() === w[0].toLowerCase() || x.slice(-1) === w.slice(-1)) && Math.abs(x.length - w.length) <= 1);
      const k = E.nChoices(this.skill, w);
      const opts = U.shuffle([w, ...E.distractors(this.skill, w, pool, k - 1, look)]);
      const sentence = D.sightSentence(w);
      const hl = U.esc(sentence).replace(new RegExp(`\\b(${w})\\b`, w === 'I' ? '' : 'i'), '<mark>$1</mark>');
      return {
        skill: this.skill, item: w, answer: w,
        teach: isNew && { html: `<span class="word-big">${U.esc(w)}</span>`, say: ['This word is ', D.word(w), '. ', sentence, ' Tap ', D.word(w), '!'], after: [D.word(w), '!'] },
        say: hidden('Tap the word: ' + (D.SIGHT_SAY[w] || w) + '.'),
        choices: opts.map((x) => ({ value: x, html: `<span class="word">${U.esc(x)}</span>`, label: x })),
        choiceClass: 'words',
        afterRight: () => {
          const p = $('.q-prompt');
          if (p) p.innerHTML = `<div class="sentence pop-in">${hl}</div>`;
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', D.word(w), '. ', sentence],
        wrong: (c) => [ui.oops(), ' That word is ', D.word(c.value), '. Find ', D.word(w), '.'],
        reveal: () => ['This word is ', D.word(w), '. Tap ', D.word(w), '.'],
      };
    },
  });

  A.add({
    id: 'rhyme', world: 'words', title: 'Rhyme Time', icon: '🎵', skill: 'rhyme',
    intro: 'Rhyming words sound the same at the end. Like cat and hat!',
    pool: () => D.RHYME_ITEMS.map((r) => r.key),
    make(ctx) {
      const { key } = srs.pick(this.skill, this.pool(), ctx);
      const t = D.rhymeItem(key);
      const mates = D.RHYME_ITEMS.filter((r) => r.group === t.group && r.key !== key);
      const ans = U.pick(mates);
      const k = Math.min(3, E.nChoices(this.skill, key));
      const others = U.sample(D.RHYME_ITEMS.filter((r) => r.group !== t.group), k - 1);
      const opts = U.shuffle([ans, ...others]);
      return {
        skill: this.skill, item: key, answer: ans.key, readChoices: true,
        promptHTML: `<div class="reward-pic"><span class="rp-emoji">${t.emoji}</span><b>${t.key}</b></div>`,
        say: [`Which one rhymes with ${key}?`],
        choices: opts.map((r) => ({ value: r.key, html: `<span class="emo">${r.emoji}</span><span class="cap">${r.key}</span>`, label: r.key, say: r.key })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${U.cap(key)}, ${ans.key}! They rhyme!`],
        wrong: (c) => [`${U.cap(key)}, ${c.value}. Those don't rhyme. Listen again!`],
        reveal: () => [`${U.cap(key)}, ${ans.key}! ${U.cap(ans.key)} rhymes with ${key}. Tap the ${ans.key}.`],
      };
    },
  });

  A.add({
    id: 'spell', world: 'words', title: 'Spell It', icon: '✏️', skill: 'cvc',
    intro: "Let's spell words by their sounds!",
    requires: [{ act: 'letter-sounds', known: 8 }],
    pool: () => D.CVC.map((c) => c[0]),
    run(ctx) {
      return KQ.special.spell(ctx, this);
    },
  });

  /* ======================= PUZZLES ======================= */
  const COLOR_PIECES = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'].map((id) => ({ key: id, html: blob(id), say: id }));
  A.add({
    id: 'patterns', world: 'puzzles', title: 'Patterns', icon: '🔴🔵', skill: 'pattern',
    intro: 'Patterns repeat again and again. What comes next?',
    pool: () => D.PATTERNS,
    make(ctx) {
      const { key: pat } = srs.pick(this.skill, this.pool(), ctx, { learnSize: 2 });
      const letters = [...new Set(pat.split(''))];
      let pieces;
      if (Math.random() < 0.5) {
        pieces = U.sample(ui.theme().counters, letters.length).map(([e, one]) => ({ key: one, html: `<span class="emo">${e}</span>`, say: one }));
      } else pieces = U.sample(COLOR_PIECES, letters.length);
      const map = {};
      letters.forEach((l, i) => (map[l] = pieces[i]));
      const k = U.rand(pat.length);
      const shown = [];
      for (let i = 0; i < pat.length * 2 + k; i++) shown.push(map[pat[i % pat.length]]);
      const ans = map[pat[k]];
      const choices = U.shuffle(letters.map((l) => map[l]));
      const seqSay = shown.map((x) => x.say).join(', ');
      return {
        skill: this.skill, item: pat, answer: ans.key,
        promptHTML: `<div class="pattern" style="--len:${shown.length + 1}">${shown.map((x) => `<span class="pc">${x.html}</span>`).join('')}<span class="pc q">?</span></div>`,
        say: [seqSay, '... what comes next?'],
        choices: choices.map((x) => ({ value: x.key, html: x.html, label: x.say })),
        afterRight: () => {
          const q = $('.pattern .q');
          if (q) (q.innerHTML = ans.html), q.classList.remove('q'), q.classList.add('filled');
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` ${seqSay}, ${ans.say}! The pattern keeps going!`],
        wrong: (c) => [ui.oops(), ` Listen to the pattern: ${seqSay}...`],
        reveal: () => [`${seqSay}, ${ans.say}! Tap the ${ans.say}.`],
      };
    },
  });

  A.add({
    id: 'odd-one', world: 'puzzles', title: 'Odd One Out', icon: '🍎🚗', skill: 'odd',
    intro: "Find the one that doesn't belong!",
    pool: () => D.CATEGORIES.map((c) => c.id),
    make(ctx) {
      const { key } = srs.pick(this.skill, this.pool(), ctx, { learnSize: 2 });
      const cat = D.CATEGORIES.find((c) => c.id === key);
      const otherCat = U.pick(D.CATEGORIES.filter((c) => c.id !== key));
      const odd = U.pick(otherCat.items);
      const easy = srs.box(this.skill, key) < 2;
      const same = easy ? Array(3).fill(U.pick(cat.items)) : U.sample(cat.items, 3);
      const items = U.shuffle([...same.map((x, i) => ({ v: 'same' + i, x })), { v: 'odd', x: odd }]);
      return {
        skill: this.skill, item: key, answer: 'odd',
        say: ['Which one does not belong?'],
        choices: items.map((it) => ({ value: it.v, html: `<span class="emo">${it.x[0]}</span>`, label: it.x[1] })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', easy ? ` The ${odd[1]} is different!` : ` The ${odd[1]} is not ${cat.desc}!`],
        wrong: (c) => [ui.oops(), easy ? ' That one is the same as the others. Find the different one.' : ` The ${c.label} is ${cat.desc}. Which one is not ${cat.desc}?`],
        reveal: () => [easy ? `The ${odd[1]} is different.` : `The ${odd[1]} is not ${cat.desc}.`, ` Tap the ${odd[1]}.`],
      };
    },
  });

  A.add({
    id: 'big-small', world: 'puzzles', title: 'Big & Small', icon: '🐘🐭', skill: 'size',
    intro: "Let's find big and small!",
    pool: () => ['biggest', 'smallest'],
    make(ctx) {
      const { key } = srs.pick(this.skill, this.pool(), ctx, { learnSize: 2 });
      const n = srs.box(this.skill, key) < 2 ? 3 : 4;
      const sizes = U.shuffle([0.38, 0.6, 0.8, 1].slice(4 - n));
      const [emo, one] = counter();
      const want = key === 'biggest' ? Math.max(...sizes) : Math.min(...sizes);
      return {
        skill: this.skill, item: key, answer: want,
        say: [`Tap the ${key} ${one}.`],
        choices: sizes.map((s) => ({ value: s, html: `<span class="emo" style="font-size:${s}em">${emo}</span>`, label: one })),
        right: (c, first) => [first ? ui.praise() : 'Yes!', ` That is the ${key} ${one}!`],
        wrong: () => [ui.oops(), ` That one is not the ${key}. Look again!`],
        reveal: () => [`This is the ${key} ${one}. Tap it.`],
      };
    },
  });

  A.add({ id: 'memory', world: 'puzzles', alsoIn: ['play'], kind: 'game', title: 'Memory Match', icon: '🃏', run: (ctx) => KQ.special.memory(ctx) });
  A.add({ id: 'paint', world: 'play', kind: 'explore', title: 'Paint', icon: '🖌️', run: (ctx) => KQ.special.paint(ctx) });
  A.add({ id: 'stickers', world: 'play', kind: 'link', title: 'Sticker Book', icon: '📒', run: () => KQ.nav.go(KQ.app.stickerBook) });

  /* ======================= Today's Adventure (mixed lesson) ======================= */
  /** Pick 3 activities that most need practice, from different worlds. */
  A.adventurePlan = function () {
    const p = KQ.store.current();
    const s = KQ.store.settings();
    const worlds = s.worlds || null;
    const now = Date.now();
    const cands = A.list.filter((a) => a.kind === 'lesson' && a.mixable && A.unlocked(a, p) && (!worlds || worlds.includes(a.world)));
    const score = (a) => {
      const pool = a.pool();
      const st = (p.skills[a.skill] && p.skills[a.skill].items) || {};
      let due = 0, unseen = 0;
      for (const k of pool) {
        const it = st[k];
        if (!it) unseen++;
        else if (now >= it.s + srs.INTERVALS[it.b]) due++;
      }
      const c = srs.counts(a.skill, pool, p);
      return ((1 + due * 2 + (unseen ? 4 : 0) + (c.mastered < c.total ? 2 : 0)) * (a.mixWeight || 1));
    };
    const picked = [];
    const usedWorlds = new Set();
    let pool = cands.slice();
    while (picked.length < 3 && pool.length) {
      const fresh = pool.filter((a) => !usedWorlds.has(a.world));
      const a = U.weightedPick(fresh.length ? fresh : pool, score);
      picked.push(a);
      usedWorlds.add(a.world);
      pool = pool.filter((x) => x !== a && x.skill !== a.skill);
    }
    return { acts: picked, len: Math.max(s.lessonLen || 8, picked.length * 3), title: "Today's Adventure", rebuild: () => A.adventurePlan() };
  };
})();

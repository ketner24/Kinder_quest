/* Kinder Quest - hands-on activities: tracing, tap & count, spelling, memory match,
   explore boards (ABC, 123, hundred chart, colors, shapes) and a paint studio. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util, D = KQ.D, E = KQ.engine, ui = KQ.ui, srs = KQ.srs, nav = KQ.nav;
  const { $, $$ } = U;
  const S = (KQ.special = {});
  const glyph = (ch, cls = '') => `<span class="glyph ${cls}">${U.esc(ch)}</span>`;
  const counter = () => U.pick(ui.theme().counters);

  /** Speech part for anything we trace: letters say their name, numbers read fine. */
  function nameOf(ch) {
    if (/^[A-Z]$/.test(ch)) return ['the letter ', D.ltr(ch)];
    if (/^[a-z]$/.test(ch)) return ['little ', D.ltr(ch)];
    return ['the number ', ch];
  }

  /* ======================= Tracing ======================= */
  S.trace = (ctx, act) =>
    new Promise(async (resolve) => {
      const { key } = srs.pick(act.skill, act.pool(), ctx, { learnSize: 2, maxNew: 2 });
      const ch = String(key);
      const stage = $('.stage');
      stage.innerHTML = `<div class="trace-wrap pop-in"><canvas class="trace-canvas"></canvas>
        <div class="trace-tools"><button class="icon-btn t-clear" aria-label="Start over">🔄</button><button class="icon-btn t-done big-check" aria-label="I'm done">✅</button></div></div>`;
      let finished = false;
      nav.onLeave(() => {
        finished = true;
        resolve({ aborted: true });
      });
      try {
        await document.fonts.load('700 200px Andika');
      } catch (e) { /* fallback font is fine */ }
      if (finished) return;
      const wrap = $('.trace-wrap', stage);
      const cv = $('.trace-canvas', stage);
      const rect = cv.getBoundingClientRect();
      const W = Math.max(200, rect.width), H = Math.max(200, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.scale(dpr, dpr);
      const FONT = (px) => `700 ${px}px Andika, "Comic Sans MS", sans-serif`;

      // Fit the character in the box.
      g.font = FONT(100);
      const m100 = g.measureText(ch);
      const w100 = (m100.actualBoundingBoxLeft || 0) + (m100.actualBoundingBoxRight || m100.width);
      const h100 = (m100.actualBoundingBoxAscent || 72) + (m100.actualBoundingBoxDescent || 0);
      const F = Math.min((H * 0.8 * 100) / h100, (W * 0.82 * 100) / w100);
      const brush = Math.max(18, F * 0.13);
      function place(gc, scale) {
        gc.font = FONT(F * scale);
        const m = gc.measureText(ch);
        const l = m.actualBoundingBoxLeft || 0, r = m.actualBoundingBoxRight || m.width;
        const a = m.actualBoundingBoxAscent || F * scale * 0.72, d = m.actualBoundingBoxDescent || 0;
        return { x: (W * scale - (l + r)) / 2 + l, y: (H * scale - (a + d)) / 2 + a };
      }
      function drawGuide() {
        g.clearRect(0, 0, W, H);
        const pos = place(g, 1);
        g.fillStyle = '#eceaf6';
        g.fillText(ch, pos.x, pos.y);
        g.setLineDash([10, 10]);
        g.lineWidth = 3;
        g.strokeStyle = '#a9a3cf';
        g.strokeText(ch, pos.x, pos.y);
        g.setLineDash([]);
      }
      drawGuide();

      // Low-resolution mask of where the character is, to score coverage.
      const CELL = 4;
      const GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
      const off = document.createElement('canvas');
      off.width = GW;
      off.height = GH;
      const og = off.getContext('2d');
      const opos = place(og, 1 / CELL);
      og.fillStyle = '#000';
      og.fillText(ch, opos.x, opos.y);
      const alpha = og.getImageData(0, 0, GW, GH).data;
      const mask = new Uint8Array(GW * GH);
      let maskN = 0;
      for (let i = 0; i < GW * GH; i++) if (alpha[i * 4 + 3] > 90) (mask[i] = 1), maskN++;
      const near = new Uint8Array(GW * GH); // mask grown by the brush size: "close enough"
      const grow = Math.ceil(brush / CELL);
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++)
          if (mask[y * GW + x])
            for (let dy = -grow; dy <= grow; dy++)
              for (let dx = -grow; dx <= grow; dx++) {
                const xx = x + dx, yy = y + dy;
                if (xx >= 0 && yy >= 0 && xx < GW && yy < GH) near[yy * GW + xx] = 1;
              }
      let painted = new Uint8Array(GW * GH);
      const markAt = (px, py) => {
        const r = Math.ceil(brush / 2 / CELL);
        const cx = Math.round(px / CELL), cy = Math.round(py / CELL);
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            const xx = cx + dx, yy = cy + dy;
            if (xx >= 0 && yy >= 0 && xx < GW && yy < GH) painted[yy * GW + xx] = 1;
          }
      };
      // Split the letter into a 3x3 grid so every part has to be traced, not just one half.
      let x0 = GW, x1 = 0, y0 = GH, y1 = 0;
      for (let i = 0; i < mask.length; i++)
        if (mask[i]) {
          const x = i % GW, y = (i / GW) | 0;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
      const region = new Int8Array(GW * GH).fill(-1);
      const regTotal = new Array(9).fill(0);
      for (let i = 0; i < mask.length; i++)
        if (mask[i]) {
          const x = i % GW, y = (i / GW) | 0;
          const rx = Math.min(2, Math.floor((3 * (x - x0)) / (x1 - x0 + 1)));
          const ry = Math.min(2, Math.floor((3 * (y - y0)) / (y1 - y0 + 1)));
          region[i] = ry * 3 + rx;
          regTotal[region[i]]++;
        }
      const score = () => {
        let hit = 0, tot = 0, out = 0;
        const regHit = new Array(9).fill(0);
        for (let i = 0; i < painted.length; i++)
          if (painted[i]) {
            tot++;
            if (mask[i]) {
              hit++;
              regHit[region[i]]++;
            }
            if (!near[i]) out++;
          }
        // weakest part of the letter (ignoring tiny slivers)
        let weakest = 1;
        for (let r = 0; r < 9; r++) if (regTotal[r] > maskN * 0.04) weakest = Math.min(weakest, regHit[r] / regTotal[r]);
        return { cover: maskN ? hit / maskN : 0, outside: tot ? out / tot : 0, weakest };
      };
      const traced = (s, loose) => s.cover >= (loose ? 0.6 : 0.7) && s.weakest >= (loose ? 0.35 : 0.45) && s.outside <= (loose ? 0.55 : 0.5);

      const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#e53935';
      let drawing = null, last = null, clears = 0, idleT = null;
      const strokeTo = (x, y) => {
        g.strokeStyle = color;
        g.lineWidth = brush;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(last.x, last.y);
        g.lineTo(x, y);
        g.stroke();
        // mark points along the segment
        const dist = Math.hypot(x - last.x, y - last.y);
        const steps = Math.max(1, Math.ceil(dist / CELL));
        for (let i = 1; i <= steps; i++) markAt(last.x + ((x - last.x) * i) / steps, last.y + ((y - last.y) * i) / steps);
        last = { x, y };
      };
      const pt = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      };
      cv.addEventListener('pointerdown', (e) => {
        if (finished || drawing != null) return;
        e.preventDefault();
        cv.setPointerCapture(e.pointerId);
        drawing = e.pointerId;
        last = pt(e);
        markAt(last.x, last.y);
        strokeTo(last.x + 0.1, last.y + 0.1);
        clearTimeout(idleT);
      });
      cv.addEventListener('pointermove', (e) => {
        if (drawing !== e.pointerId || finished) return;
        const p = pt(e);
        strokeTo(p.x, p.y);
      });
      const up = (e) => {
        if (drawing !== e.pointerId) return;
        drawing = null;
        if (traced(score())) success();
        else resetIdle();
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);

      const prompt = () => ui.say(['Trace ', nameOf(ch), ' with your finger.']);
      function resetIdle() {
        clearTimeout(idleT);
        idleT = setTimeout(() => !finished && prompt(), 16000);
      }
      $('.replay').onclick = () => (KQ.sfx.tap(), prompt());
      $('.t-clear', wrap).onclick = () => {
        KQ.sfx.tap();
        clears++;
        painted = new Uint8Array(GW * GH);
        drawGuide();
        ui.say("Let's try again!");
      };
      $('.t-done', wrap).onclick = () => {
        const s = score();
        if (traced(s, true)) return success();
        KQ.sfx.wrong();
        ui.mood('oops');
        if (s.outside > 0.55) ui.say(['Try to stay on the lines. Tap the arrows to start over.']);
        else ui.say(['Keep going! Trace all of ', nameOf(ch), '.']);
      };
      async function success() {
        if (finished) return;
        finished = true;
        clearTimeout(idleT);
        KQ.sfx.correct();
        ui.burst(cv);
        ui.mood('cheer');
        ui.starFly(cv, () => E.onStar && E.onStar());
        wrap.classList.add('traced');
        const extra = /^[A-Za-z]$/.test(ch) ? [' ', D.isFor(ch.toUpperCase())] : [];
        await ui.say([ui.praise(), ' You traced ', nameOf(ch), '!', ...extra]);
        await U.sleep(300);
        resolve({ ok: clears === 0, item: key, skill: act.skill });
      }
      await prompt();
      resetIdle();
    });

  /* ======================= Tap & Count ("Show me 5") ======================= */
  S.showMe = (ctx, act) =>
    new Promise((resolve) => {
      const { key: n } = srs.pick(act.skill, act.pool(), ctx);
      const [emo, one, many] = counter();
      const total = Math.min(20, n + 2 + U.rand(4));
      const stage = $('.stage');
      stage.innerHTML = `<div class="showme">
          <div class="showme-target pop-in">${glyph(String(n), 'num')}</div>
          <div class="objs tray ${total > 10 ? 'many' : ''}">${Array.from({ length: total }, (_, i) => `<button class="obj" data-k="${i}">${emo}</button>`).join('')}</div>
          <div class="showme-tools"><button class="icon-btn sm-reset" aria-label="Start over">🔄</button><button class="icon-btn big-check sm-check" aria-label="Check">✅</button></div>
        </div>`;
      let count = 0, attempts = 0, done = false;
      const objsEls = $$('.tray .obj', stage);
      const reset = () => {
        count = 0;
        objsEls.forEach((o) => (o.classList.remove('counted'), delete o.dataset.n));
      };
      const prompt = () => ui.say([`Tap ${n} ${U.plural(n, one, many)}. Then tap the green check!`]);
      objsEls.forEach((o) =>
        o.addEventListener('click', () => {
          if (done || o.classList.contains('counted')) return;
          count++;
          o.classList.add('counted');
          o.dataset.n = count;
          KQ.sfx.count(count);
          KQ.voice.say(String(count));
        })
      );
      $('.sm-reset', stage).onclick = () => (KQ.sfx.tap(), reset());
      $('.replay').onclick = () => (KQ.sfx.tap(), prompt());
      $('.sm-check', stage).onclick = async () => {
        if (done) return;
        if (count === n) {
          done = true;
          KQ.sfx.correct();
          ui.burst($('.showme-target', stage));
          ui.mood('cheer');
          if (attempts === 0) ui.starFly($('.sm-check', stage), () => E.onStar && E.onStar());
          await ui.say([attempts === 0 ? ui.praise() : 'Yes!', ` You tapped ${n} ${U.plural(n, one, many)}!`]);
          return resolve({ ok: attempts === 0, item: n, skill: act.skill });
        }
        attempts++;
        KQ.sfx.wrong();
        ui.mood('oops');
        if (attempts >= 3) {
          done = true;
          reset();
          await ui.say(`Watch me count ${n}!`);
          const sel = objsEls.slice(0, n);
          for (let i = 0; i < sel.length; i++) {
            sel[i].classList.add('counted');
            sel[i].dataset.n = i + 1;
            KQ.sfx.count(i);
            await ui.say(String(i + 1));
          }
          await ui.say(`${n} ${U.plural(n, one, many)}!`);
          return resolve({ ok: false, item: n, skill: act.skill });
        }
        if (count < n) await ui.say(`You tapped ${count}. We need ${n}. Tap ${n - count === 1 ? 'one more' : 'some more'}!`);
        else {
          await ui.say(`Oops, that is ${count}. We need ${n}. Let's start over!`);
          reset();
        }
      };
      nav.onLeave(() => {
        done = true;
        resolve({ aborted: true });
      });
      prompt();
    });

  /* ======================= Spelling (CVC words) ======================= */
  const spellOut = (w) => w.split('').flatMap((c) => [D.ltr(c), ', ']);
  S.spell = (ctx, act) => {
    const { key: w } = srs.pick(act.skill, act.pool(), ctx);
    const [, emo] = D.cvc(w);
    const b = srs.box(act.skill, w);
    if (b < 3) {
      // Fill in the missing letter: first letter while learning, then the middle (vowel).
      const miss = b < 2 ? 0 : 1;
      const ans = w[miss];
      const pool = miss === 1 ? 'aeiou'.split('') : 'bcdfghjklmnprstvwz'.split('');
      const opts = U.shuffle([ans, ...U.sample(pool, 2, [ans])]);
      const slots = w.split('').map((c, i) => `<span class="slot ${i === miss ? 'q' : ''}">${i === miss ? '?' : c}</span>`).join('');
      return E.mc({
        skill: act.skill, item: w, answer: ans,
        promptHTML: `<div class="spell-prompt"><span class="spell-pic">${emo}</span><div class="slots">${slots}</div></div>`,
        say: miss === 0 ? [`${U.cap(w)}. What letter does ${w} start with?`] : [`${U.cap(w)}. What letter is in the middle of ${w}? Listen: ${w}.`],
        choices: opts.map((x) => ({ value: x, html: glyph(x), label: x })),
        afterRight: () => {
          const q = $('.slot.q');
          if (q) (q.textContent = ans), q.classList.remove('q'), q.classList.add('filled');
        },
        right: (c, first) => [first ? ui.praise() : 'Yes!', ' ', ...spellOut(w), ` spells ${w}!`],
        wrong: (c) => [ui.oops(), ' That is ', D.ltr(c.value), '. It says ', D.LETTER_SOUND[c.value.toUpperCase()], '. Listen: ', w, '.'],
        reveal: () => [`${U.cap(w)} needs `, D.ltr(ans), '. Tap ', D.ltr(ans), '.'],
      });
    }
    // Build the whole word from letter tiles.
    return new Promise((resolve) => {
      const letters = U.shuffle([...w.split(''), ...U.sample('bcdfghjklmnoprstuvwz'.split(''), 2, w.split(''))]);
      const stage = $('.stage');
      stage.innerHTML = `<div class="q-prompt"><div class="spell-prompt"><span class="spell-pic">${emo}</span><div class="slots">${w
        .split('')
        .map(() => '<span class="slot"></span>')
        .join('')}</div></div></div><div class="choices n5 tiles">${letters.map((l, i) => `<button class="choice pop-in" data-i="${i}" style="animation-delay:${i * 60}ms">${glyph(l)}</button>`).join('')}</div>`;
      let pos = 0, mistakes = 0, slotMiss = 0, done = false;
      const slots = $$('.slot', stage);
      const tiles = $$('.choice', stage);
      const prompt = () => ui.say([`Spell ${w}! Tap the letters in order. ${w}.`]);
      $('.replay').onclick = () => (KQ.sfx.tap(), prompt());
      tiles.forEach((t) =>
        t.addEventListener('click', async () => {
          if (done || t.disabled) return;
          const l = letters[+t.dataset.i];
          if (l === w[pos]) {
            t.disabled = true;
            t.classList.remove('hint');
            t.classList.add('used');
            slots[pos].textContent = l;
            slots[pos].classList.add('filled');
            KQ.sfx.pop();
            pos++;
            slotMiss = 0;
            if (pos === w.length) {
              done = true;
              KQ.sfx.correct();
              ui.burst($('.slots', stage));
              ui.mood('cheer');
              if (mistakes === 0) ui.starFly($('.slots', stage), () => E.onStar && E.onStar());
              await ui.say([mistakes === 0 ? ui.praise() : 'You did it!', ' ', ...spellOut(w), ` spells ${w}!`]);
              resolve({ ok: mistakes === 0, item: w, skill: act.skill });
            } else KQ.voice.say(D.LETTER_SOUND[l.toUpperCase()]);
          } else {
            mistakes++;
            slotMiss++;
            KQ.sfx.wrong();
            ui.mood('oops');
            t.classList.remove('wrong');
            void t.offsetWidth;
            t.classList.add('wrong');
            setTimeout(() => t.classList.remove('wrong'), 600);
            if (slotMiss >= 2) {
              const right = tiles.find((x) => !x.disabled && letters[+x.dataset.i] === w[pos]);
              if (right) right.classList.add('hint');
            }
            await ui.say(pos === 0 ? `Listen: ${w}. What sound do you hear first?` : `Listen: ${w}. What comes next?`);
          }
        })
      );
      nav.onLeave(() => {
        done = true;
        resolve({ aborted: true });
      });
      prompt();
    });
  };

  /* ======================= Memory Match (game) ======================= */
  S.memory = (opts = {}) => {
    const p = KQ.store.current();
    const g = (p.games.memory = p.games.memory || { played: 0 });
    const pairs = g.played < 2 ? 3 : g.played < 5 ? 4 : 6;
    const modes = ['pics'];
    const lowKnown = D.LETTERS.filter((L) => srs.box('lower', L.toLowerCase()) >= 2);
    const numKnown = D.NUM_ORDER.filter((n) => n > 0 && n <= 10 && srs.box('numbers', n) >= 2);
    if (lowKnown.length >= pairs) modes.push('letters', 'letters');
    if (numKnown.length >= pairs) modes.push('numbers');
    const mode = U.pick(modes);
    let cards = [];
    if (mode === 'pics') {
      const t = ui.theme();
      U.sample(t.stickers, pairs).forEach(([e, name], i) => {
        cards.push({ id: i, html: `<span class="emo">${e}</span>`, say: name }, { id: i, html: `<span class="emo">${e}</span>`, say: name });
      });
    } else if (mode === 'letters') {
      U.sample(lowKnown, pairs).forEach((L, i) => {
        cards.push({ id: i, html: glyph(L), say: [D.ltr(L)], match: ['Big ', D.ltr(L), ' and little ', D.ltr(L), '!'] }, { id: i, html: glyph(L.toLowerCase()), say: ['little ', D.ltr(L)] });
      });
    } else {
      const [emo] = counter();
      U.sample(numKnown, pairs).forEach((n, i) => {
        cards.push({ id: i, html: glyph(String(n), 'num'), say: String(n), match: [`${n}! Match!`] }, { id: i, html: `<div class="objs mini" style="--n:${n};--cols:${Math.min(5, n)}">${Array(n).fill(`<span class="obj">${emo}</span>`).join('')}</div>`, say: String(n) });
      });
    }
    cards = U.shuffle(cards);
    const stage = ui.playScreen({ title: 'Memory Match', back: opts.back });
    const back = ui.theme().icon;
    stage.innerHTML = `<div class="memory c${cards.length}">${cards
      .map((c, i) => `<button class="mcard pop-in" data-i="${i}" style="animation-delay:${i * 50}ms"><span class="mc-back">${back}</span><span class="mc-face">${c.html}</span></button>`)
      .join('')}</div>`;
    let open = [], matched = 0, busy = false, tries = 0;
    const els = $$('.mcard', stage);
    const intro = () => ui.say('Find the matching pairs! Tap two cards.');
    $('.replay').onclick = () => (KQ.sfx.tap(), intro());
    els.forEach((el) =>
      el.addEventListener('click', async () => {
        if (busy || el.classList.contains('flip') || el.classList.contains('done')) return;
        const c = cards[+el.dataset.i];
        el.classList.add('flip');
        KQ.sfx.tap();
        open.push(el);
        if (open.length === 1) {
          KQ.voice.say(c.say);
          return;
        }
        busy = true;
        tries++;
        const [a, b] = open.map((x) => cards[+x.dataset.i]);
        open = [];
        if (a.id === b.id) {
          matched++;
          const pair = els.filter((x) => cards[+x.dataset.i].id === a.id);
          pair.forEach((x) => x.classList.add('done'));
          KQ.sfx.correct();
          ui.burst(el);
          ui.mood('cheer');
          await ui.say(a.match || b.match || ['Match! ', a.say, '!']);
          busy = false;
          if (matched === pairs) finish();
        } else {
          await ui.say(c.say);
          await U.sleep(500);
          els.forEach((x) => !x.classList.contains('done') && x.classList.remove('flip'));
          busy = false;
        }
      })
    );
    async function finish() {
      g.played++;
      const stars = pairs;
      p.stars += stars;
      KQ.store.save();
      ui.starCount(p.stars);
      ui.confetti();
      KQ.sfx.win();
      stage.insertAdjacentHTML('beforeend', `<div class="game-over pop-in"><div class="go-title">You matched them all! +${stars} ⭐</div><div class="go-actions"><button class="btn big again">🔁 Play again</button><button class="btn big alt home">🏠 Home</button></div></div>`);
      $('.again', stage).onclick = () => nav.go(S.memory, opts);
      $('.home', stage).onclick = () => nav.go(KQ.app.home);
      await ui.say(`Hooray! You found all the matches! You get ${stars} stars!`);
    }
    nav.onLeave(() => (busy = true));
    E.trackTime();
    intro();
  };

  /* ======================= Explore boards ======================= */
  /** Big pop-up card used by explore boards. */
  function spotlight(stage, html, onClose) {
    const s = U.el(`<div class="spot"><div class="spot-card pop-in">${html}</div><div class="spot-close">✖</div></div>`);
    stage.appendChild(s);
    s.onclick = () => {
      KQ.voice.stop();
      s.remove();
      onClose && onClose();
    };
    return s;
  }

  S.abcExplore = (opts = {}) => {
    const stage = ui.playScreen({ title: 'ABC Explore', back: opts.back });
    let lower = false, song = 0;
    const idx = {};
    const draw = () => {
      stage.innerHTML = `<div class="explore-tools"><button class="btn small case">${lower ? 'ABC' : 'abc'}</button><button class="btn small song">🎵 Say the ABCs</button></div>
        <div class="abc-grid">${D.LETTERS.map((L, i) => `<button class="abc-tile" data-l="${L}" style="--h:${(i * 37) % 360}">${lower ? L.toLowerCase() : L}</button>`).join('')}</div>`;
      $('.case', stage).onclick = () => {
        KQ.sfx.tap();
        lower = !lower;
        song++;
        draw();
      };
      $('.song', stage).onclick = async () => {
        KQ.sfx.tap();
        const my = ++song;
        const tiles = $$('.abc-tile', stage);
        await ui.say("Let's say the A B Cs!");
        for (const t of tiles) {
          if (my !== song) break;
          t.classList.add('lit');
          await ui.say([D.ltr(t.dataset.l)], { bubble: false, rate: 1 });
          t.classList.remove('lit');
        }
        if (my === song) ui.say('Now I know my A B Cs!');
      };
      $$('.abc-tile', stage).forEach((t) =>
        t.addEventListener('click', () => {
          song++;
          KQ.sfx.pop();
          const L = t.dataset.l;
          const words = D.WORDS[L];
          const i = (idx[L] = idx[L] == null ? 0 : (idx[L] + 1) % words.length);
          const [w, e] = words[i];
          spotlight(stage, `<div class="spot-letter glyph">${L}${L.toLowerCase()}</div><div class="spot-pic">${e}</div><div class="spot-word">${U.esc(w)}</div>`);
          ui.say([D.ltr(L), '. ', D.isFor(L, i), ' ', D.ltr(L), ' says ', D.LETTER_SOUND[L], '.']);
        })
      );
    };
    draw();
    $('.replay').onclick = () => ui.say('Tap a letter to hear its name and sound!');
    nav.onLeave(() => song++);
    E.trackTime();
    ui.say('Tap any letter to hear its name and sound!');
  };

  S.numExplore = (opts = {}) => {
    const stage = ui.playScreen({ title: '123 Explore', back: opts.back });
    let run = 0;
    stage.innerHTML = `<div class="num-grid">${U.range(0, 20).map((n) => `<button class="abc-tile num" data-n="${n}" style="--h:${(n * 47) % 360}">${n}</button>`).join('')}</div>`;
    $$('.abc-tile', stage).forEach((t) =>
      t.addEventListener('click', async () => {
        const my = ++run;
        KQ.sfx.pop();
        const n = +t.dataset.n;
        const [emo, one, many] = counter();
        const sp = spotlight(stage, `<div class="spot-letter glyph num">${n}</div>${n ? `<div class="objs ${n > 10 ? 'many' : ''} small" style="--n:${n};--cols:${Math.min(5, n)}">${Array(n).fill(`<span class="obj">${emo}</span>`).join('')}</div>` : '<div class="spot-word">zero = none!</div>'}`, () => run++);
        if (n === 0) return ui.say('Zero! Zero means none at all.');
        await ui.say(`${n}! Let's count ${n} ${U.plural(n, one, many)}.`);
        const els = $$('.obj', sp);
        if (n <= 10) {
          for (let i = 0; i < els.length && my === run; i++) {
            els[i].classList.add('counted');
            els[i].dataset.n = i + 1;
            KQ.sfx.count(i);
            await ui.say(String(i + 1), { bubble: false });
          }
        } else {
          const sp2 = ui.say(U.range(1, n).join(', '));
          for (let i = 0; i < els.length && my === run; i++) {
            els[i].classList.add('counted');
            els[i].dataset.n = i + 1;
            await U.sleep(420);
          }
          await sp2;
        }
        if (my === run) ui.say(`${n} ${U.plural(n, one, many)}!`);
      })
    );
    $('.replay').onclick = () => ui.say('Tap a number to count!');
    nav.onLeave(() => run++);
    E.trackTime();
    ui.say('Tap a number and we will count together!');
  };

  S.hundred = (opts = {}) => {
    const stage = ui.playScreen({ title: 'Count to 100', back: opts.back });
    let run = 0;
    stage.innerHTML = `<div class="explore-tools"><button class="btn small by1">Count by 1s</button><button class="btn small by10">Count by 10s</button><button class="btn small alt stop">⏹ Stop</button></div>
      <div class="hundred">${U.range(1, 100).map((n) => `<button class="h-cell ${n % 10 === 0 ? 'ten' : ''}" data-n="${n}">${n}</button>`).join('')}</div>`;
    const cells = $$('.h-cell', stage);
    cells.forEach((c) => c.addEventListener('click', () => {
      run++;
      KQ.sfx.tap();
      c.classList.add('lit');
      setTimeout(() => c.classList.remove('lit'), 900);
      KQ.voice.say(c.dataset.n);
    }));
    const countBy = async (step) => {
      const my = ++run;
      cells.forEach((c) => c.classList.remove('done'));
      for (let n = step; n <= 100 && my === run; n += step) {
        const c = cells[n - 1];
        c.classList.add('lit', 'done');
        c.scrollIntoView({ block: 'nearest' });
        await ui.say(String(n), { bubble: false, rate: step === 1 ? 1.15 : 1 });
        c.classList.remove('lit');
      }
      if (my === run) ui.say(step === 1 ? 'We counted all the way to 100!' : '10, 20, 30... all the way to 100!');
    };
    $('.by1', stage).onclick = () => (KQ.sfx.tap(), countBy(1));
    $('.by10', stage).onclick = () => (KQ.sfx.tap(), countBy(10));
    $('.stop', stage).onclick = () => (run++, KQ.voice.stop());
    $('.replay').onclick = () => ui.say('Tap a number, or count by ones or tens!');
    nav.onLeave(() => run++);
    E.trackTime();
    ui.say("Let's count to 100! Tap a button, or tap any number.");
  };

  S.colorExplore = (opts = {}) => {
    const stage = ui.playScreen({ title: 'Color Explore', back: opts.back });
    stage.innerHTML = `<div class="color-grid">${D.COLORS.map((c) => `<button class="color-tile${c.id === 'white' ? ' white' : ''}" data-c="${c.id}" style="--c:${c.hex}"><span>${c.id}</span></button>`).join('')}</div>`;
    $$('.color-tile', stage).forEach((t) =>
      t.addEventListener('click', () => {
        KQ.sfx.pop();
        const c = D.colorById(t.dataset.c);
        spotlight(stage, `<div class="spot-color${c.id === 'white' ? ' white' : ''}" style="--c:${c.hex}"></div><div class="spot-word">${c.id}</div><div class="spot-pic small">${c.objs.map((o) => o[0]).join(' ')}</div>`);
        const objs = c.objs.filter((o) => o[1] !== 'heart').slice(0, 3).map((o) => `${U.cap(U.article(o[1]))} ${o[1]} is ${c.id}.`);
        ui.say([`${U.cap(c.id)}! `, ...objs]);
      })
    );
    $('.replay').onclick = () => ui.say('Tap a color!');
    E.trackTime();
    ui.say('Tap a color to learn about it!');
  };

  S.shapeExplore = (opts = {}) => {
    const stage = ui.playScreen({ title: 'Shape Explore', back: opts.back });
    stage.innerHTML = `<div class="shape-grid">${D.SHAPES.map((s, i) => `<button class="shape-tile" data-s="${s.id}">${D.shapeSVG(s.id, D.SHAPE_FILLS[i % D.SHAPE_FILLS.length])}<span>${s.id}</span></button>`).join('')}</div>`;
    $$('.shape-tile', stage).forEach((t, i) =>
      t.addEventListener('click', () => {
        KQ.sfx.pop();
        const s = D.shapeById(t.dataset.s);
        spotlight(stage, `<div class="spot-shape">${D.shapeSVG(s.id, D.SHAPE_FILLS[i % D.SHAPE_FILLS.length])}</div><div class="spot-word">${s.id}</div>`);
        ui.say([`${U.cap(U.article(s.id))} ${s.id}! ${s.fact}`]);
      })
    );
    $('.replay').onclick = () => ui.say('Tap a shape!');
    E.trackTime();
    ui.say('Tap a shape to learn about it!');
  };

  /* ======================= Paint studio ======================= */
  S.paint = (opts = {}) => {
    const stage = ui.playScreen({ title: 'Paint', back: opts.back });
    const t = ui.theme();
    const stamps = t.stickers.slice(0, 8).map((s) => s[0]);
    stage.innerHTML = `<div class="paint">
        <canvas class="paint-canvas"></canvas>
        <div class="paint-bar">
          ${D.COLORS.map((c) => `<button class="pcol${c.id === 'white' ? ' white' : ''}" data-c="${c.id}" style="--c:${c.hex}" aria-label="${c.id}"></button>`).join('')}
          <span class="sep"></span>
          <button class="ptool size" data-size="10">•</button><button class="ptool size on" data-size="22">●</button><button class="ptool size" data-size="44">⬤</button>
          <span class="sep"></span>
          ${stamps.map((s) => `<button class="ptool stamp" data-stamp="${s}">${s}</button>`).join('')}
          <span class="sep"></span>
          <button class="ptool clear" aria-label="Clear">🗑️</button>
        </div></div>`;
    const cv = $('.paint-canvas', stage);
    const r = cv.getBoundingClientRect();
    const W = r.width, H = r.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    let color = '#e53935', size = 22, stamp = null, drawing = null, last = null;
    const setOn = (sel, el) => {
      $$(sel, stage).forEach((x) => x.classList.remove('on'));
      el && el.classList.add('on');
    };
    $$('.pcol', stage).forEach((b) =>
      b.addEventListener('click', () => {
        color = D.colorById(b.dataset.c).hex;
        stamp = null;
        setOn('.pcol', b);
        setOn('.stamp', null);
        KQ.sfx.tap();
        KQ.voice.say(b.dataset.c);
      })
    );
    setOn('.pcol', $('.pcol', stage));
    $$('.size', stage).forEach((b) => b.addEventListener('click', () => {
      size = +b.dataset.size;
      stamp = null;
      setOn('.size', b);
      setOn('.stamp', null);
      KQ.sfx.tap();
      KQ.voice.say(size < 15 ? 'Thin brush' : size < 30 ? 'Medium brush' : 'Big brush');
    }));
    $$('.stamp', stage).forEach((b) => b.addEventListener('click', () => {
      stamp = b.dataset.stamp;
      setOn('.stamp', b);
      KQ.sfx.tap();
      KQ.voice.say(KQ.rewards.stickerName(stamp) + ' stamp!');
    }));
    let clearArmed = false;
    const clearBtn = $('.clear', stage);
    clearBtn.onclick = () => {
      if (!clearArmed) {
        clearArmed = true;
        clearBtn.classList.add('armed');
        KQ.voice.say('Tap the trash can again to clear your picture.');
        setTimeout(() => {
          clearArmed = false;
          clearBtn.classList.remove('armed');
        }, 3000);
        return;
      }
      clearArmed = false;
      clearBtn.classList.remove('armed');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      KQ.sfx.theme(t.sfx);
    };
    const pt = (e) => {
      const rr = cv.getBoundingClientRect();
      return { x: ((e.clientX - rr.left) / rr.width) * W, y: ((e.clientY - rr.top) / rr.height) * H };
    };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = pt(e);
      if (stamp) {
        g.font = `${size * 2.6}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(stamp, p.x, p.y);
        KQ.sfx.pop();
        return;
      }
      if (drawing != null) return;
      cv.setPointerCapture(e.pointerId);
      drawing = e.pointerId;
      last = p;
      g.fillStyle = color;
      g.beginPath();
      g.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      g.fill();
    });
    cv.addEventListener('pointermove', (e) => {
      if (drawing !== e.pointerId) return;
      const p = pt(e);
      g.strokeStyle = color;
      g.lineWidth = size;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      last = p;
    });
    const up = (e) => drawing === e.pointerId && (drawing = null);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    $('.replay').onclick = () => ui.say('Pick a color and paint with your finger!');
    E.trackTime();
    ui.say('Pick a color and paint with your finger! You can use stamps too.');
  };
})();

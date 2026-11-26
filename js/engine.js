/* Kinder Quest - screen helpers, the talking buddy, the question runner and the lesson loop. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util;
  const { $, $$ } = U;

  /* ======================= Navigation ======================= */
  const nav = (KQ.nav = {
    _cleanups: [],
    onLeave(fn) {
      this._cleanups.push(fn);
    },
    /** Leave the current screen (stops talking, timers, open questions) and draw a new one. */
    go(render, ...args) {
      const fns = this._cleanups;
      this._cleanups = [];
      for (const f of fns) {
        try {
          f();
        } catch (e) {
          console.error(e);
        }
      }
      KQ.voice.stop();
      window.scrollTo(0, 0);
      render(...args);
    },
    timeout(fn, ms) {
      const t = setTimeout(fn, ms);
      this.onLeave(() => clearTimeout(t));
      return t;
    },
    interval(fn, ms) {
      const t = setInterval(fn, ms);
      this.onLeave(() => clearInterval(t));
      return t;
    },
  });

  /* ======================= UI helpers ======================= */
  const GENERAL_PRAISE = ['Great job!', 'You got it!', 'Awesome!', "That's right!", 'Way to go!', 'Fantastic!', 'Wonderful!', 'Nice work!', 'Hooray!', 'Excellent!', 'Yes! So smart!'];
  const GENERAL_OOPS = ['Oops, not quite.', 'Nice try!', 'Almost!', 'Hmm, not that one.', 'Good try!'];

  const ui = (KQ.ui = {
    app: () => document.getElementById('app'),
    render(html) {
      const a = ui.app();
      a.innerHTML = html;
      return a;
    },
    theme: () => KQ.themes.get((KQ.store.current() || {}).theme),
    praise() {
      const p = KQ.store.current();
      const t = ui.theme();
      let s = Math.random() < 0.55 ? U.pick(t.praise) : U.pick(GENERAL_PRAISE);
      if (p && p.name && Math.random() < 0.25) s = s.replace(/[!.]$/, '') + ', ' + p.name + '!';
      return s;
    },
    oops() {
      return Math.random() < 0.3 ? U.pick(ui.theme().tryAgain) : U.pick(GENERAL_OOPS);
    },
    bubble(text) {
      const b = $('.bubble');
      if (!b) return;
      if (KQ.store.settings().bubbles === false) {
        b.classList.remove('show');
        return;
      }
      b.textContent = text;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
    },
    /** Speak and animate the buddy while talking. */
    async say(parts, opts) {
      const buddy = $('.buddy');
      if (buddy) buddy.classList.add('talking');
      await KQ.voice.say(parts, opts);
      const tokenNow = KQ.voice._token;
      // only stop the talking animation if nothing newer started
      setTimeout(() => {
        if (KQ.voice._token === tokenNow && buddy) buddy.classList.remove('talking');
      }, 50);
    },
    mood(m) {
      const b = $('.buddy');
      if (!b) return;
      b.classList.remove('cheer', 'oops');
      void b.offsetWidth;
      if (m) b.classList.add(m);
      clearTimeout(ui._moodT);
      ui._moodT = setTimeout(() => b.classList.remove(m), 1400);
    },
    buddyHTML(p = KQ.store.current(), cls = '') {
      return `<div class="buddy ${cls}" data-theme="${p ? p.theme : ''}">${p ? KQ.themes.buddySVG(p) : ''}</div>`;
    },
    starCount(n) {
      const el = $('.star-num');
      if (el) {
        el.textContent = n;
        el.parentElement.classList.remove('bump');
        void el.offsetWidth;
        el.parentElement.classList.add('bump');
      }
    },
    /** Little star flies from an element to the star counter. */
    starFly(fromEl, onArrive) {
      const target = $('.star-pill');
      if (!target || !fromEl) return onArrive && onArrive();
      const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
      const s = document.createElement('div');
      s.className = 'fly-star';
      s.textContent = '⭐';
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
      s.style.left = x0 + 'px';
      s.style.top = y0 + 'px';
      document.body.appendChild(s);
      const dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0;
      const anim = s.animate(
        [
          { transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${dy * 0.35 - 90}px)) scale(1.9)`, offset: 0.4 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 0.9 },
        ],
        { duration: 950, easing: 'ease-in-out' }
      );
      anim.onfinish = () => {
        s.remove();
        KQ.sfx.star();
        onArrive && onArrive();
      };
    },
    /** Sparkle burst around an element. */
    burst(el, emojis) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const t = ui.theme();
      const set = emojis || ['⭐', '✨', '🌟', t.stickers[0][0]];
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('div');
        s.className = 'burst';
        s.textContent = U.pick(set);
        s.style.left = r.left + r.width / 2 + 'px';
        s.style.top = r.top + r.height / 2 + 'px';
        document.body.appendChild(s);
        const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        const dist = Math.max(r.width, 120) * (0.6 + Math.random() * 0.5);
        s.animate(
          [
            { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.2) rotate(${U.rand(360)}deg)`, opacity: 0 },
          ],
          { duration: 750 + U.rand(300), easing: 'cubic-bezier(.2,.8,.3,1)' }
        ).onfinish = () => s.remove();
      }
    },
    confetti(n = 70) {
      const fx = document.getElementById('fx');
      const colors = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#fb8c00', '#ec407a', '#00bcd4'];
      const t = ui.theme();
      for (let i = 0; i < n; i++) {
        const c = document.createElement('div');
        const useEmoji = i % 7 === 0;
        c.className = 'confetti' + (useEmoji ? ' emoji' : '');
        if (useEmoji) c.textContent = U.pick(t.stickers)[0];
        else c.style.background = U.pick(colors);
        c.style.left = Math.random() * 100 + 'vw';
        fx.appendChild(c);
        const fall = window.innerHeight + 80;
        c.animate(
          [
            { transform: `translate(0,-40px) rotate(0deg)` },
            { transform: `translate(${U.rand(160) - 80}px, ${fall}px) rotate(${U.rand(900) - 450}deg)` },
          ],
          { duration: 1800 + U.rand(1600), delay: U.rand(500), easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'both' }
        ).onfinish = () => c.remove();
      }
    },
    /** Standard play screen: top bar, buddy with speech bubble, stage. */
    playScreen({ dots = 0, title = '', back } = {}) {
      const p = KQ.store.current();
      ui.render(`
        <div class="screen play">
          <div class="topbar">
            <button class="icon-btn" data-back aria-label="Go back">${back === 'home' || !back ? '🏠' : '⬅️'}</button>
            <div class="dots">${title ? `<span class="play-title">${U.esc(title)}</span>` : ''}${Array.from({ length: dots }, () => '<i></i>').join('')}</div>
            <button class="icon-btn replay" aria-label="Hear it again">🔊</button>
            <div class="star-pill"><span>⭐</span><b class="star-num">${p ? p.stars : 0}</b></div>
          </div>
          <div class="play-body">
            <div class="buddy-dock">${ui.buddyHTML(p)}<div class="bubble"></div></div>
            <div class="stage"></div>
          </div>
        </div>`);
      $('[data-back]').onclick = () => {
        KQ.sfx.tap();
        if (typeof back === 'function') nav.go(back);
        else nav.go(KQ.app.home);
      };
      return $('.stage');
    },
    setDot(i, state) {
      const d = $$('.dots i')[i];
      if (d) d.className = state;
    },
  });

  KQ.voice.onText = (t) => ui.bubble(t);

  /* ======================= Engine ======================= */
  const engine = (KQ.engine = {});

  /** Pick wrong answers: tricky look-alikes once a child knows the answer, otherwise things they've seen. */
  engine.distractors = (skill, answer, pool, n, confuse = []) => {
    const st = KQ.srs.state(skill);
    const out = [];
    const box = KQ.srs.box(skill, answer);
    const ok = (k) => k !== answer && !out.includes(k) && pool.includes(k);
    if (box >= 1) for (const c of U.shuffle(confuse)) if (out.length < Math.min(n, 2) && ok(c) && Math.random() < 0.75) out.push(c);
    for (const k of U.shuffle(pool.filter((k) => st.items[k]))) if (out.length < n && ok(k)) out.push(k);
    for (const k of U.shuffle(pool)) if (out.length < n && ok(k)) out.push(k);
    return out;
  };
  /** How many answer buttons: 2 while new, up to 4 once known. */
  engine.nChoices = (skill, key, max = 4) => {
    const b = KQ.srs.box(skill, key);
    return Math.min(max, b <= 0 ? 2 : b === 1 ? 3 : 4);
  };

  /** "NEW!" card that introduces an item before it is quizzed. */
  engine.teach = (t) =>
    new Promise((resolve) => {
      const stage = $('.stage');
      stage.innerHTML = `<div class="teach"><div class="new-badge">NEW!</div><button class="teach-card pop-in">${t.html}</button><div class="teach-hint">👆</div></div>`;
      const card = $('.teach-card', stage);
      let done = false;
      const sayIt = () => ui.say(t.say).then(() => !done && card.classList.add('hint'));
      sayIt();
      const replay = $('.replay');
      if (replay) replay.onclick = () => (KQ.sfx.tap(), sayIt());
      const idle = setInterval(() => !done && sayIt(), 14000);
      card.onclick = async () => {
        if (done) return;
        done = true;
        clearInterval(idle);
        card.classList.remove('hint');
        card.classList.add('right');
        KQ.sfx.pop();
        ui.burst(card);
        ui.mood('cheer');
        if (t.after) await ui.say(t.after);
        await U.sleep(200);
        resolve({});
      };
      nav.onLeave(() => {
        done = true;
        clearInterval(idle);
        resolve({ aborted: true });
      });
    });

  /** Multiple-choice question runner. Talks, waits for a tap, praises or corrects,
      shows the answer after two misses. Resolves {ok, item, skill}. */
  engine.mc = (q) =>
    new Promise((resolve) => {
      const stage = $('.stage');
      stage.innerHTML = `<div class="q-prompt">${q.promptHTML || ''}</div><div class="choices n${q.choices.length} ${q.choiceClass || ''}"></div>`;
      const box = $('.choices', stage);
      q.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'choice pop-in ' + (c.cls || '');
        b.innerHTML = c.html;
        b.style.animationDelay = i * 70 + 'ms';
        b.dataset.i = i;
        if (c.label) b.setAttribute('aria-label', c.label);
        if (c.style) b.setAttribute('style', c.style + `;animation-delay:${i * 70}ms`);
        box.appendChild(b);
      });
      const btns = $$('.choice', box);
      const correctIdx = q.choices.findIndex((c) => c.value === q.answer);
      let attempts = 0, done = false, revealing = false, idleCount = 0, idleT = null, seq = 0;
      const settings = KQ.store.settings();
      const sayParts = () => (typeof q.say === 'function' ? q.say() : q.say);
      if (q.setup) q.setup(stage);

      function resetIdle(stopOnly) {
        clearTimeout(idleT);
        if (stopOnly || done) return;
        idleT = setTimeout(onIdle, 15000);
      }
      async function onIdle() {
        if (done) return;
        idleCount++;
        if (idleCount >= 2 && !revealing) btns[correctIdx].classList.add('hint');
        if (idleCount <= 4) await speakPrompt();
      }
      async function speakPrompt() {
        resetIdle(true);
        const my = ++seq;
        await ui.say(sayParts());
        if (q.readChoices && settings.readChoices !== false) {
          for (let i = 0; i < btns.length; i++) {
            if (done || my !== seq) break;
            if (btns[i].disabled) continue;
            btns[i].classList.add('reading');
            await ui.say(q.choices[i].say || q.choices[i].label || '', { bubble: false });
            btns[i].classList.remove('reading');
          }
        }
        if (my === seq) resetIdle();
      }
      const replay = $('.replay');
      if (replay) replay.onclick = () => (KQ.sfx.tap(), speakPrompt());

      box.addEventListener('click', async (e) => {
        const b = e.target.closest('.choice');
        if (!b || done || b.disabled) return;
        const i = +b.dataset.i;
        const choice = q.choices[i];
        seq++;
        btns.forEach((x) => x.classList.remove('reading'));
        resetIdle(true);
        if (i === correctIdx) {
          done = true;
          const first = attempts === 0;
          b.classList.remove('hint');
          b.classList.add('right');
          btns.forEach((x) => x !== b && x.classList.add('fade'));
          KQ.sfx.correct();
          ui.burst(b);
          ui.mood('cheer');
          if (first) ui.starFly(b, () => engine.onStar && engine.onStar());
          if (q.afterRight) await q.afterRight(b, first);
          await ui.say(q.right(choice, first));
          await U.sleep(300);
          resolve({ ok: first, item: q.item, skill: q.skill });
        } else {
          attempts++;
          KQ.sfx.wrong();
          ui.mood('oops');
          b.classList.add('wrong');
          b.disabled = true;
          const remaining = btns.filter((x) => !x.disabled).length;
          if (q.onWrong) {
            const r = await q.onWrong(choice, attempts);
            if (done) return;
            if (r === 'reveal') attempts = 2;
          }
          if (attempts >= 2 || remaining <= 1) {
            revealing = true;
            btns[correctIdx].classList.add('hint');
            await ui.say(q.reveal(choice));
          } else {
            await ui.say(q.wrong(choice));
          }
          resetIdle();
        }
      });
      nav.onLeave(() => {
        done = true;
        clearTimeout(idleT);
        resolve({ aborted: true });
      });
      (q.preface ? q.preface(stage) : Promise.resolve()).then(() => {
        if (!done) speakPrompt();
      });
    });

  /** Split a lesson between activities in runs of 2-3 so little ones aren't switching every question. */
  function schedule(acts, len) {
    if (acts.length === 1) return Array(len).fill(acts[0]);
    const out = [];
    const per = Math.max(2, Math.floor(len / acts.length));
    let i = 0;
    while (out.length < len) {
      const a = acts[i % acts.length];
      for (let k = 0; k < per && out.length < len; k++) out.push(a);
      i++;
    }
    return out;
  }

  /** Daily play limit reached? */
  engine.overLimit = () => {
    const s = KQ.store.settings();
    const p = KQ.store.current();
    if (!s.dailyLimit || !p) return false;
    const bonus = (p.log[U.dateKey()] || {}).bonus || 0;
    return KQ.store.minutesToday(p) >= s.dailyLimit + bonus;
  };

  /** Count active play time (only while the page is visible). */
  engine.trackTime = () => {
    let last = Date.now();
    nav.interval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') KQ.store.addTime(Math.min(15, Math.round((now - last) / 1000)));
      last = now;
    }, 10000);
  };

  /** Run a lesson. plan = {acts:[activity...], len, title, back} */
  engine.lesson = async (plan) => {
    if (engine.overLimit()) return nav.go(KQ.app.breakTime);
    const p = KQ.store.current();
    const settings = KQ.store.settings();
    const len = plan.len || settings.lessonLen || 8;
    const list = schedule(plan.acts, len);
    const ctx = { recent: {}, newBy: {}, results: [], aborted: false, stars: 0, plan };
    ui.playScreen({ dots: list.length, back: plan.back });
    nav.onLeave(() => (ctx.aborted = true));
    engine.trackTime();
    engine.onStar = () => ui.starCount(p.stars + ctx.stars);
    let last = null;
    for (let i = 0; i < list.length; i++) {
      if (ctx.aborted) return;
      const act = list[i];
      ui.setDot(i, 'now');
      if (act !== last) {
        last = act;
        const intro = typeof act.intro === 'function' ? act.intro() : act.intro;
        $('.stage').innerHTML = `<div class="act-intro pop-in"><div class="act-intro-icon">${act.icon}</div><div class="act-intro-title">${U.esc(act.title)}</div></div>`;
        if (i === 0) KQ.sfx.theme(ui.theme().sfx);
        await ui.say(intro || act.title);
        if (ctx.aborted) return;
      }
      let res;
      try {
        if (act.run) res = await act.run(ctx);
        else {
          const q = act.make(ctx);
          if (q.teach) {
            const r = await engine.teach(q.teach);
            if (r.aborted || ctx.aborted) return;
          }
          res = await engine.mc(q);
        }
      } catch (err) {
        console.error('Activity error', act.id, err);
        res = { ok: true };
      }
      if (!res || res.aborted || ctx.aborted) return;
      if (res.item != null && res.skill) {
        KQ.srs.record(res.skill, res.item, res.ok);
        const r = (ctx.recent[res.skill] = ctx.recent[res.skill] || []);
        r.push(res.item);
        if (r.length > 3) r.shift();
      }
      if (res.ok) ctx.stars++;
      ui.starCount(p.stars + ctx.stars);
      ctx.results.push(res);
      ui.setDot(i, res.ok ? 'ok' : 'tried');
    }
    if (!ctx.aborted) nav.go(engine.complete, ctx);
  };

  /** End-of-lesson celebration with a present to open. */
  engine.complete = async (ctx) => {
    const p = KQ.store.current();
    const t = ui.theme();
    const total = ctx.results.length || 1;
    const firstTry = ctx.results.filter((r) => r.ok).length;
    const won = KQ.rewards.lessonDone(p, ctx.stars);
    const rating = firstTry / total >= 0.85 ? 3 : firstTry / total >= 0.5 ? 2 : 1;
    ui.render(`
      <div class="screen complete">
        <div class="complete-top">
          <div class="big-stars">${[1, 2, 3].map((i) => `<span class="${i <= rating ? 'on' : ''}" style="animation-delay:${0.3 + i * 0.25}s">⭐</span>`).join('')}</div>
          <h1 class="complete-title">${U.cap(t.lessonWord)} complete!</h1>
          <div class="earned">+${ctx.stars} ⭐</div>
        </div>
        <div class="complete-mid">
          ${ui.buddyHTML(p, 'cheer-loop')}
          <div class="prize-area">
            ${won.sticker ? `<button class="gift pop-in" aria-label="Open your present">🎁</button>` : ''}
          </div>
        </div>
        <div class="bubble"></div>
        <div class="complete-actions hidden">
          <button class="btn big again">🔁 Play again</button>
          <button class="btn big alt home">🏠 Home</button>
        </div>
      </div>`);
    ui.confetti();
    KQ.sfx.win();
    nav.timeout(() => KQ.sfx.theme(t.sfx), 900);
    const actions = $('.complete-actions');
    const showActions = () => actions.classList.remove('hidden');
    $('.again').onclick = () => {
      KQ.sfx.tap();
      nav.go(() => engine.lesson(ctx.plan.rebuild ? ctx.plan.rebuild() : ctx.plan));
    };
    $('.home').onclick = () => {
      KQ.sfx.tap();
      nav.go(KQ.app.home);
    };
    const name = p.name ? ', ' + p.name : '';
    await ui.say([`Hooray${name}! You finished the ${t.lessonWord}! You got ${ctx.stars} ${U.plural(ctx.stars, 'star', 'stars')}!`, won.sticker ? ' Tap the present!' : '']);
    const gift = $('.gift');
    if (!gift) return showActions();
    gift.classList.add('hint');
    let opened = false;
    const remind = nav.interval(() => !opened && ui.say('Tap the present to open it!'), 12000);
    gift.onclick = async () => {
      if (opened) return;
      opened = true;
      clearInterval(remind);
      KQ.sfx.pop();
      gift.classList.add('open');
      await U.sleep(450);
      const area = $('.prize-area');
      area.innerHTML = `<div class="sticker-reveal">${won.sticker[0]}</div>`;
      ui.burst(area.firstElementChild);
      KQ.sfx.correct();
      await ui.say(`You got a new sticker! ${U.cap(U.article(won.sticker[1]))} ${won.sticker[1]}!`);
      if (won.color) {
        area.insertAdjacentHTML('beforeend', `<div class="unlock-card pop-in"><span class="swatch" style="background:${won.color.hex.startsWith('url') ? 'linear-gradient(90deg,#e53935,#fdd835,#43a047,#1e88e5,#8e24aa)' : won.color.hex}"></span> New color!</div>`);
        await ui.say(`And a new color for ${t.buddy}: ${won.color.id}! Tap ${t.buddy} on the home screen to try it.`);
      }
      showActions();
      if (won.trophies.length) {
        const shown = won.trophies.slice(0, 3);
        area.insertAdjacentHTML(
          'beforeend',
          `<div class="trophy-row pop-in">${shown.map((tr) => `<span class="unlock-card">${tr.icon} ${U.esc(tr.name)}</span>`).join('')}${won.trophies.length > 3 ? `<span class="unlock-card">+${won.trophies.length - 3} 🏆</span>` : ''}</div>`
        );
        ui.confetti(50);
        for (const tr of won.trophies.slice(0, 2)) await ui.say(`You earned a trophy! ${tr.name}!`);
        if (won.trophies.length > 2) await ui.say(`And ${won.trophies.length - 2} more trophies! Look in your sticker book!`);
      }
      if (engine.overLimit()) {
        await U.sleep(1200);
        nav.go(KQ.app.breakTime);
      }
    };
  };
})();

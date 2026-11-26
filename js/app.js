/* Kinder Quest - screens: start, players, new player, home, worlds, buddy customizer,
   sticker book, break time. Also start-up and offline support. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util, D = KQ.D, ui = KQ.ui, nav = KQ.nav, E = KQ.engine, A = KQ.acts, T = KQ.themes;
  const { $, $$ } = U;

  const WORLDS = [
    { id: 'letters', title: 'Letters', icon: '🔤', say: "Letters! Let's learn the A B Cs.", hue: '#ef5350' },
    { id: 'numbers', title: 'Numbers', icon: '🔢', say: "Numbers! Let's count.", hue: '#42a5f5' },
    { id: 'colors', title: 'Colors & Shapes', icon: '🎨', say: 'Colors and shapes!', hue: '#ab47bc' },
    { id: 'words', title: 'Reading', icon: '📖', say: "Reading! Let's read and rhyme.", hue: '#26a69a' },
    { id: 'puzzles', title: 'Puzzles', icon: '🧩', say: 'Puzzles! Patterns and thinking games.', hue: '#ffa726' },
    { id: 'play', title: 'Play & Explore', icon: '🎪', say: 'Play and explore! Paint, match, and discover.', hue: '#ec407a' },
  ];

  const app = (KQ.app = { WORLDS });
  let greeted = false;

  app.applyVoiceSettings = () => {
    const s = KQ.store.settings();
    KQ.voice.rate = s.rate;
    KQ.voice.pitch = s.pitch;
    KQ.voice.voice = KQ.voice.findVoice(s.voiceURI);
  };
  app.fullscreen = () => {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!document.fullscreenElement && req) req.call(el).catch(() => {});
    else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  };

  /* ---------------- Start screen ---------------- */
  app.splash = () => {
    T.applyNeutral();
    ui.render(`
      <div class="screen splash">
        <div class="float-icons">${['🦸', '🛻', '🏎️', '👸', '⭐', '🔤', '🔢', '🎨', '🦄', '🚀']
          .map((e, i) => {
            const [x, y] = [[6, 12], [80, 8], [4, 52], [88, 46], [16, 82], [70, 80], [40, 90], [90, 86], [24, 26], [62, 18]][i];
            return `<span style="--i:${i};left:${x}%;top:${y}%">${e}</span>`;
          })
          .join('')}</div>
        <h1 class="logo">Kinder<span>Quest</span></h1>
        <p class="tagline">Letters · Numbers · Colors · Reading · Puzzles</p>
        <button class="btn huge play-btn pulse">▶ Play</button>
        <button class="corner-btn grown" aria-label="Grown-ups">🔒</button>
      </div>`);
    $('.play-btn').onclick = () => {
      KQ.sfx.unlock();
      KQ.sfx.correct();
      // Speaking inside the tap unlocks speech on iPad/iPhone.
      KQ.voice.say('Welcome to Kinder Quest!', { bubble: false });
      nav.go(KQ.store.profiles().length ? app.profiles : app.newPlayer);
    };
    $('.grown').onclick = () => KQ.parent.gate(() => nav.go(KQ.parent.open, 'help'));
  };

  /* ---------------- Who's playing? ---------------- */
  app.profiles = () => {
    T.applyNeutral();
    const ps = KQ.store.profiles();
    ui.render(`
      <div class="screen profiles">
        <h1 class="screen-title">Who's playing?</h1>
        <div class="profile-grid">
          ${ps.map((p) => `<button class="profile-card pop-in" data-id="${p.id}" style="--pc:${T.get(p.theme).css['--bg1']}">${ui.buddyHTML(p)}<span class="pname">${U.esc(p.name || T.get(p.theme).buddy)}</span></button>`).join('')}
          <button class="profile-card add pop-in"><span class="plus">＋</span><span class="pname">New player</span></button>
        </div>
        <button class="corner-btn grown" aria-label="Grown-ups">🔒</button>
      </div>`);
    KQ.voice.say("Who's playing? Tap your picture!", { bubble: false });
    $$('.profile-card[data-id]').forEach(
      (b) =>
        (b.onclick = () => {
          KQ.sfx.pop();
          KQ.store.setCurrent(b.dataset.id);
          greeted = false;
          nav.go(app.home);
        })
    );
    $('.profile-card.add').onclick = () => (KQ.sfx.tap(), nav.go(app.newPlayer));
    $('.grown').onclick = () => KQ.parent.gate(() => nav.go(KQ.parent.open, 'report'));
  };

  /* ---------------- New player: theme -> look -> name ---------------- */
  app.newPlayer = (step = 'theme', draft = {}) => {
    if (step === 'theme') {
      T.applyNeutral();
      ui.render(`
        <div class="screen newp">
          <h1 class="screen-title">Pick your adventure!</h1>
          <div class="theme-grid">
            ${T.list.map((id) => {
              const t = T.get(id);
              return `<button class="theme-card pop-in ${draft.theme === id ? 'on' : ''}" data-t="${id}" style="--a:${t.css['--bg1']};--b:${t.css['--bg2']}">
                <div class="buddy">${t.draw({ color: t.defColor, skin: 0 })}</div><span class="tname">${t.name}</span></button>`;
            }).join('')}
          </div>
          <div class="newp-actions">${KQ.store.profiles().length ? '<button class="btn alt back">⬅ Back</button>' : ''}<button class="btn big next" ${draft.theme ? '' : 'disabled'}>That's me! ✔</button></div>
        </div>`);
      KQ.voice.say('Pick your adventure! Superheroes, monster trucks, race cars, or princesses?', { bubble: false });
      $$('.theme-card').forEach(
        (c) =>
          (c.onclick = () => {
            const t = T.get(c.dataset.t);
            draft.theme = t.id;
            $$('.theme-card').forEach((x) => x.classList.toggle('on', x === c));
            $('.next').disabled = false;
            KQ.sfx.theme(t.sfx);
            c.querySelector('.buddy').classList.remove('cheer');
            void c.offsetWidth;
            c.querySelector('.buddy').classList.add('cheer');
            KQ.voice.say(`${t.name}! ${t.hello}`, { bubble: false });
          })
      );
      $('.next').onclick = () => draft.theme && nav.go(app.newPlayer, 'look', draft);
      const back = $('.back');
      if (back) back.onclick = () => nav.go(app.profiles);
      return;
    }
    if (step === 'look') {
      const t = T.get(draft.theme);
      T.apply(t.id);
      draft.mascot = draft.mascot || { color: t.defColor, skin: 0, hair: t.id === 'princess' ? 2 : 0, num: 1 };
      app.lookEditor(draft, T.PAINT.slice(0, T.FREE_COLORS).map((c) => c.id).concat(t.defColor), {
        title: `Make ${t.buddy} yours!`,
        onDone: () => nav.go(app.newPlayer, 'name', draft),
        onBack: () => nav.go(app.newPlayer, 'theme', draft),
      });
      return;
    }
    if (step === 'name') {
      const t = T.get(draft.theme);
      ui.render(`
        <div class="screen newp name-step">
          <div class="name-buddy">${ui.buddyHTML({ theme: draft.theme, mascot: draft.mascot })}</div>
          <h1 class="screen-title">What's your name?</h1>
          <p class="hint">Grown-up: type your child's first name (optional). ${t.buddy} will use it to cheer them on.</p>
          <input class="name-input" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="First name" value="${U.esc(draft.name || '')}">
          <div class="newp-actions"><button class="btn alt back">⬅ Back</button><button class="btn big next">Let's go! 🚀</button></div>
        </div>`);
      KQ.voice.say("What's your name? Ask a grown-up to type it.", { bubble: false });
      const inp = $('.name-input');
      $('.back').onclick = () => ((draft.name = inp.value), nav.go(app.newPlayer, 'look', draft));
      const go = () => {
        KQ.store.addProfile({ name: inp.value.trim(), theme: draft.theme, mascot: draft.mascot });
        greeted = false;
        KQ.sfx.win();
        nav.go(app.home, true);
      };
      $('.next').onclick = go;
      inp.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    }
  };

  /** Color / skin / hair / number picker for the buddy (used for new players and the customizer). */
  app.lookEditor = (draft, unlocked, { title, onDone, onBack, themeSwitch }) => {
    const t = T.get(draft.theme);
    const m = draft.mascot;
    const hasPerson = t.id === 'hero' || t.id === 'princess';
    const draw = () => {
      $('.look-buddy').innerHTML = ui.buddyHTML({ theme: draft.theme, mascot: m }, 'big');
    };
    ui.render(`
      <div class="screen look">
        <h1 class="screen-title">${U.esc(title)}</h1>
        <div class="look-body">
          <div class="look-buddy"></div>
          <div class="look-opts">
            ${themeSwitch ? `<div class="opt-row"><span class="opt-label">Adventure</span>${T.list.map((id) => `<button class="opt theme-opt ${draft.theme === id ? 'on' : ''}" data-t="${id}" aria-label="${T.get(id).name}">${T.get(id).icon}</button>`).join('')}</div>` : ''}
            <div class="opt-row"><span class="opt-label">Color</span>${T.PAINT.map((c) => {
              const open = unlocked.includes(c.id);
              const bg = c.hex.startsWith('url') ? 'linear-gradient(135deg,#e53935,#fdd835,#43a047,#1e88e5,#8e24aa)' : c.hex;
              return `<button class="opt swatch ${m.color === c.id ? 'on' : ''} ${open ? '' : 'locked'}" data-c="${c.id}" style="background:${bg}" aria-label="${c.id}">${open ? '' : '🔒'}</button>`;
            }).join('')}</div>
            ${hasPerson ? `<div class="opt-row"><span class="opt-label">Skin</span>${T.SKIN.map((s, i) => `<button class="opt swatch ${m.skin === i ? 'on' : ''}" data-skin="${i}" style="background:${s}" aria-label="skin ${i + 1}"></button>`).join('')}</div>
            <div class="opt-row"><span class="opt-label">Hair</span>${T.HAIR.map((h, i) => `<button class="opt swatch ${m.hair === i ? 'on' : ''}" data-hair="${i}" style="background:${h}" aria-label="hair ${i + 1}"></button>`).join('')}</div>` : ''}
            ${t.id === 'race' ? `<div class="opt-row"><span class="opt-label">Number</span>${U.range(1, 9).map((n) => `<button class="opt num ${m.num === n ? 'on' : ''}" data-num="${n}">${n}</button>`).join('')}</div>` : ''}
          </div>
        </div>
        <div class="newp-actions">${onBack ? '<button class="btn alt back">⬅ Back</button>' : ''}<button class="btn big next">Done ✔</button></div>
      </div>`);
    draw();
    const sel = (attr, el) => {
      $$(`[${attr}]`).forEach((x) => x.classList.remove('on'));
      el.classList.add('on');
    };
    $$('[data-c]').forEach((b) => (b.onclick = () => {
      if (b.classList.contains('locked')) {
        KQ.sfx.wrong();
        const left = KQ.store.current() ? KQ.rewards.nextColorIn(KQ.store.current()) : null;
        return KQ.voice.say(left ? `Finish ${left} more ${U.plural(left, 'adventure', 'adventures')} to unlock a new color!` : 'Keep playing to unlock this color!');
      }
      m.color = b.dataset.c;
      sel('data-c', b);
      KQ.sfx.pop();
      KQ.voice.say(b.dataset.c, { bubble: false });
      draw();
    }));
    $$('[data-skin]').forEach((b) => (b.onclick = () => ((m.skin = +b.dataset.skin), sel('data-skin', b), KQ.sfx.pop(), draw())));
    $$('[data-hair]').forEach((b) => (b.onclick = () => ((m.hair = +b.dataset.hair), sel('data-hair', b), KQ.sfx.pop(), draw())));
    $$('[data-num]').forEach((b) => (b.onclick = () => ((m.num = +b.dataset.num), sel('data-num', b), KQ.sfx.pop(), KQ.voice.say('Number ' + b.dataset.num, { bubble: false }), draw())));
    $$('.theme-opt').forEach((b) => (b.onclick = () => {
      draft.theme = b.dataset.t;
      T.apply(draft.theme);
      KQ.sfx.theme(T.get(draft.theme).sfx);
      KQ.voice.say(T.get(draft.theme).name + '!', { bubble: false });
      app.lookEditor(draft, unlocked, { title: `Make ${T.get(draft.theme).buddy} yours!`, onDone, onBack, themeSwitch });
    }));
    $('.next').onclick = () => (KQ.sfx.tap(), onDone());
    if (onBack) $('.back').onclick = () => (KQ.sfx.tap(), onBack());
  };

  app.customize = () => {
    const p = KQ.store.current();
    const draft = { theme: p.theme, mascot: { ...p.mascot } };
    app.lookEditor(draft, p.colors, {
      title: 'Dress up your buddy!',
      themeSwitch: true,
      onDone: () => {
        p.theme = draft.theme;
        p.mascot = draft.mascot;
        KQ.store.save();
        nav.go(app.home);
      },
      onBack: () => nav.go(app.home),
    });
    KQ.voice.say('Pick a color for your buddy!', { bubble: false });
  };

  /* ---------------- Home ---------------- */
  app.home = (fresh) => {
    const p = KQ.store.current();
    if (!p) return nav.go(app.profiles);
    const t = T.get(p.theme);
    T.apply(t.id);
    const streak = KQ.store.streak(p);
    const nextColor = KQ.rewards.nextColorIn(p);
    ui.render(`
      <div class="screen home">
        <div class="topbar">
          <button class="player-chip" aria-label="Change player"><span class="chip-buddy">${KQ.themes.buddySVG(p)}</span><span>${U.esc(p.name || t.buddy)}</span></button>
          <div class="spacer"></div>
          ${streak > 1 ? `<div class="pill">🔥 ${streak}</div>` : ''}
          <div class="star-pill"><span>⭐</span><b class="star-num">${p.stars}</b></div>
          <button class="icon-btn stickers-btn" aria-label="Sticker book">📒</button>
          <button class="icon-btn grown" aria-label="Grown-ups">🔒</button>
        </div>
        <div class="home-body">
          <div class="home-buddy">
            <div class="bubble"></div>
            <button class="buddy-btn" aria-label="Dress up your buddy">${ui.buddyHTML(p, 'idle')}</button>
            ${nextColor ? `<div class="next-prize">🎁 ${nextColor} more for a new color</div>` : ''}
          </div>
          <div class="home-main">
            <button class="adventure-btn pulse"><span class="adv-icon">⭐</span><span class="adv-text">Today's Adventure</span><span class="adv-go">▶</span></button>
            <div class="world-grid">
              ${WORLDS.map((w) => `<button class="world-card pop-in" data-w="${w.id}" style="--wc:${w.hue}"><span class="w-icon">${w.icon}</span><span class="w-title">${w.title}</span></button>`).join('')}
            </div>
          </div>
        </div>
      </div>`);
    $('.player-chip').onclick = () => (KQ.sfx.tap(), nav.go(app.profiles));
    $('.stickers-btn').onclick = () => (KQ.sfx.tap(), nav.go(app.stickerBook));
    $('.grown').onclick = () => KQ.parent.gate(() => nav.go(KQ.parent.open, 'report'));
    $('.buddy-btn').onclick = () => (KQ.sfx.pop(), nav.go(app.customize));
    $('.adventure-btn').onclick = () => {
      KQ.sfx.theme(t.sfx);
      nav.go(() => E.lesson(A.adventurePlan()));
    };
    $$('.world-card').forEach((b) => (b.onclick = () => (KQ.sfx.pop(), nav.go(app.world, b.dataset.w))));
    if (E.overLimit()) return nav.go(app.breakTime);
    const name = p.name ? ' ' + p.name : '';
    if (fresh === true) ui.say(`Hi${name}! ${t.hello} Tap Today's Adventure to start!`);
    else if (!greeted) ui.say(`Hi${name}! Ready to learn? Tap Today's Adventure, or pick a world!`);
    else ui.say(U.pick(['What should we learn next?', 'Pick a world!', "Let's play again!", 'Where to next?']));
    greeted = true;
  };

  /* ---------------- World (activity list) ---------------- */
  app.world = (wid) => {
    const p = KQ.store.current();
    if (!p) return nav.go(app.profiles);
    T.apply(p.theme);
    const w = WORLDS.find((x) => x.id === wid) || WORLDS[0];
    const acts = A.inWorld(w.id);
    ui.render(`
      <div class="screen world" style="--wc:${w.hue}">
        <div class="topbar">
          <button class="icon-btn" data-home aria-label="Home">🏠</button>
          <h1 class="world-title">${w.icon} ${w.title}</h1>
          <div class="star-pill"><span>⭐</span><b class="star-num">${p.stars}</b></div>
        </div>
        <div class="world-body">
          <div class="buddy-dock">${ui.buddyHTML(p)}<div class="bubble"></div></div>
          <div class="act-grid">
            ${acts.map((a, i) => {
              const open = A.unlocked(a, p);
              const st = a.kind === 'lesson' ? A.stars(a, p) : -1;
              const li = open || !a.requires ? null : A.lockInfo(a, p);
              return `<button class="act-card pop-in ${open ? '' : 'locked'} ${a.kind}" data-a="${a.id}" style="animation-delay:${i * 50}ms">
                <span class="a-icon">${a.icon}</span><span class="a-title">${U.esc(a.title)}</span>
                ${st >= 0 ? `<span class="a-stars">${[1, 2, 3].map((k) => `<i class="${k <= st ? 'on' : ''}">★</i>`).join('')}</span>` : `<span class="a-tag">${a.kind === 'game' ? 'game' : a.kind === 'link' ? '' : 'explore'}</span>`}
                ${li ? `<span class="lock">🔒<small>${li.have}/${li.need}</small></span>` : ''}
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>`);
    $('[data-home]').onclick = () => (KQ.sfx.tap(), nav.go(app.home));
    $$('.act-card').forEach((b) => (b.onclick = () => app.launch(A.byId[b.dataset.a], w.id)));
    ui.say(w.say + ' Pick a game.');
  };

  app.launch = (act, wid) => {
    const p = KQ.store.current();
    if (!A.unlocked(act, p)) {
      KQ.sfx.wrong();
      const li = A.lockInfo(act, p);
      return ui.say(li ? `Almost! Learn ${li.need - li.have} more in ${li.act.title} to open ${act.title}!` : 'Keep learning to unlock this!');
    }
    KQ.sfx.pop();
    const back = () => app.world(wid);
    if (act.kind === 'lesson') nav.go(() => E.lesson({ acts: [act], back, title: act.title }));
    else if (act.kind === 'link') act.run();
    else {
      if (E.overLimit()) return nav.go(app.breakTime);
      nav.go(() => act.run({ back }));
    }
  };

  /* ---------------- Sticker book & trophies ---------------- */
  app.stickerBook = (page) => {
    const p = KQ.store.current();
    T.apply(p.theme);
    page = page || p.theme;
    const isTrophies = page === 'trophies';
    const t = T.get(isTrophies ? p.theme : page);
    const owned = new Set(p.stickers);
    const content = isTrophies
      ? `<div class="trophy-grid">${KQ.rewards.TROPHIES.map((tr) => {
          const has = p.trophies.includes(tr.id);
          return `<button class="trophy ${has ? 'has' : ''}" data-name="${U.esc(tr.name)}"><span class="t-icon">${has ? tr.icon : '🏆'}</span><span class="t-name">${U.esc(tr.name)}</span></button>`;
        }).join('')}</div>`
      : `<div class="sticker-grid">${t.stickers.map(([e, name]) => `<button class="sticker ${owned.has(e) ? 'has' : ''}" data-name="${U.esc(name)}">${owned.has(e) ? e : '?'}</button>`).join('')}</div>`;
    const count = isTrophies ? `${p.trophies.length} of ${KQ.rewards.TROPHIES.length}` : `${t.stickers.filter((s) => owned.has(s[0])).length} of ${t.stickers.length}`;
    ui.render(`
      <div class="screen book">
        <div class="topbar">
          <button class="icon-btn" data-home aria-label="Home">🏠</button>
          <h1 class="world-title">📒 ${isTrophies ? 'Trophies' : 'Sticker Book'} <small>${count}</small></h1>
          <div class="star-pill"><span>⭐</span><b class="star-num">${p.stars}</b></div>
        </div>
        <div class="book-tabs">${T.list.map((id) => `<button class="${page === id ? 'on' : ''}" data-page="${id}">${T.get(id).icon}</button>`).join('')}<button class="${isTrophies ? 'on' : ''}" data-page="trophies">🏆</button></div>
        <div class="book-body"><div class="bubble"></div>${content}</div>
      </div>`);
    $('[data-home]').onclick = () => (KQ.sfx.tap(), nav.go(app.home));
    $$('[data-page]').forEach((b) => (b.onclick = () => (KQ.sfx.tap(), nav.go(app.stickerBook, b.dataset.page))));
    $$('.sticker').forEach((s) => (s.onclick = () => {
      if (s.classList.contains('has')) {
        KQ.sfx.pop();
        ui.burst(s);
        ui.say(`${U.cap(U.article(s.dataset.name))} ${s.dataset.name}!`);
      } else {
        KQ.sfx.tap();
        ui.say('Finish an adventure to win more stickers!');
      }
    }));
    $$('.trophy').forEach((s) => (s.onclick = () => {
      KQ.sfx.tap();
      ui.say(s.classList.contains('has') ? `You earned this trophy! ${s.dataset.name}!` : `Keep learning to win this trophy: ${s.dataset.name}.`);
    }));
    ui.say(isTrophies ? 'Your trophies!' : `You have ${count} stickers!`);
  };

  /* ---------------- Break time ---------------- */
  app.breakTime = () => {
    const p = KQ.store.current();
    if (p) T.apply(p.theme);
    ui.render(`
      <div class="screen break">
        <div class="sleepy">${p ? ui.buddyHTML(p, 'sleep') : ''}<span class="zzz">💤</span></div>
        <h1 class="screen-title">Time for a break!</h1>
        <div class="bubble"></div>
        <p class="hint">You did great learning today. Come back tomorrow for more adventures!</p>
        <div class="newp-actions"><button class="btn alt players">👋 Change player</button><button class="btn more">🔒 Grown-up: 15 more minutes</button></div>
      </div>`);
    ui.say(`Great learning today${p && p.name ? ', ' + p.name : ''}! Time for a break. Let's play again tomorrow!`);
    $('.players').onclick = () => nav.go(app.profiles);
    $('.more').onclick = () =>
      KQ.parent.gate(() => {
        const d = KQ.store.day(p);
        d.bonus = (d.bonus || 0) + 15;
        KQ.store.save();
        nav.go(app.home);
      });
  };

  /* ---------------- Start-up ---------------- */
  function init() {
    KQ.store.load();
    KQ.voice.init();
    app.applyVoiceSettings();
    // Stop long-press menus and double-tap zoom getting in the way of little fingers.
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('input, textarea, .grownup')) e.preventDefault();
    });
    document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
    // Pause speech when the app is hidden.
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && KQ.voice.stop());
    nav.go(app.splash);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

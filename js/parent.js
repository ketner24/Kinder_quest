/* Kinder Quest - Grown-up Corner: parent gate, progress report, settings, players, backup. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util, D = KQ.D, srs = KQ.srs, nav = KQ.nav;
  const { $, $$ } = U;
  const P = (KQ.parent = {});

  /* ---------- Parent gate: a times-table question small kids can't answer ---------- */
  P.gate = (onPass, onCancel) => {
    const a = 3 + U.rand(7), b = 3 + U.rand(7);
    let entry = '';
    const ov = U.el(`<div class="gate"><div class="gate-card pop-in">
        <div class="gate-title">Grown-ups only</div>
        <div class="gate-q">What is ${a} × ${b}?</div>
        <div class="gate-entry">&nbsp;</div>
        <div class="gate-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>
        <button class="gate-cancel" aria-label="Cancel">✖</button></div></div>`);
    document.body.appendChild(ov);
    const show = () => ($('.gate-entry', ov).textContent = entry || ' ');
    ov.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]');
      if (!k) return;
      const v = k.dataset.k;
      if (v === '⌫') entry = entry.slice(0, -1);
      else if (v === 'OK') {
        if (+entry === a * b) {
          ov.remove();
          onPass();
          return;
        }
        ov.querySelector('.gate-card').classList.add('shake');
        setTimeout(() => {
          ov.remove();
          P.gate(onPass, onCancel);
        }, 500);
        return;
      } else if (entry.length < 3) entry += v;
      show();
    });
    $('.gate-cancel', ov).onclick = () => {
      ov.remove();
      onCancel && onCancel();
    };
  };

  /* ---------- Skill catalogue for the report ---------- */
  const SKILLS = () => [
    { skill: 'upper', name: 'Big letters (A-Z)', pool: D.LETTERS, grid: true },
    { skill: 'lower', name: 'Little letters (a-z)', pool: D.LETTERS.map((l) => l.toLowerCase()), grid: true },
    { skill: 'match', name: 'Matching big & little', pool: D.LETTERS },
    { skill: 'sounds', name: 'Letter sounds', pool: D.LETTERS, grid: true },
    { skill: 'begin', name: 'First sounds in words', pool: D.LETTERS.filter((l) => l !== 'X') },
    { skill: 'alpha', name: 'ABC order', pool: D.LETTERS.slice(1) },
    { skill: 'traceL', name: 'Letter tracing', pool: [...D.LETTERS, ...D.LETTERS.map((l) => l.toLowerCase())] },
    { skill: 'numbers', name: 'Number recognition (0-20)', pool: D.NUM_ORDER, grid: true, sort: (a, b) => a - b },
    { skill: 'count', name: 'Counting objects (1-20)', pool: D.COUNT_ORDER, grid: true },
    { skill: 'compare', name: 'More / less', pool: ['more', 'fewer', 'bigger', 'smaller'] },
    { skill: 'order', name: 'Number order', pool: U.range(1, 20) },
    { skill: 'add', name: 'Addition within 10', pool: D.ADD_FACTS },
    { skill: 'sub', name: 'Subtraction within 10', pool: D.SUB_FACTS },
    { skill: 'traceN', name: 'Number tracing', pool: U.range(0, 20).map(String) },
    { skill: 'colors', name: 'Colors', pool: D.COLORS.map((c) => c.id), grid: true },
    { skill: 'colorobj', name: 'Colors of things', pool: D.COLOR_OBJECTS.map((o) => o.key) },
    { skill: 'mix', name: 'Color mixing', pool: D.MIXES.map((m) => m.make) },
    { skill: 'shapes', name: 'Shapes (flat & solid)', pool: D.SHAPES.map((s) => s.id), grid: true },
    { skill: 'sight', name: 'Sight words', pool: D.SIGHT.map((s) => s[0]), grid: true },
    { skill: 'rhyme', name: 'Rhyming', pool: D.RHYME_ITEMS.map((r) => r.key) },
    { skill: 'cvc', name: 'Spelling 3-letter words', pool: D.CVC.map((c) => c[0]), grid: true },
    { skill: 'pattern', name: 'Patterns', pool: D.PATTERNS },
    { skill: 'odd', name: 'Odd one out (sorting)', pool: D.CATEGORIES.map((c) => c.id) },
    { skill: 'size', name: 'Big & small', pool: ['biggest', 'smallest'] },
  ];

  const LEVELS = [
    { cls: 'lv0', label: 'Not started' },
    { cls: 'lv1', label: 'Learning' },
    { cls: 'lv2', label: 'Knows it' },
    { cls: 'lv3', label: 'Mastered (remembered on later days)' },
  ];
  const levelOf = (b) => (b < 0 ? 0 : b < 2 ? 1 : b < 3 ? 2 : 3);

  function fmtDay(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function reportHTML(p) {
    // 14-day activity
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = U.dateKey(d);
      days.push({ k, ...(p.log[k] || { q: 0, c: 0, t: 0, l: 0 }) });
    }
    const maxMin = Math.max(5, ...days.map((d) => Math.round(d.t / 60)));
    const week = days.slice(7);
    const wq = week.reduce((a, d) => a + d.q, 0), wc = week.reduce((a, d) => a + d.c, 0);
    const wmin = Math.round(week.reduce((a, d) => a + d.t, 0) / 60);
    const today = days[13];
    const bars = days
      .map((d, i) => {
        const min = Math.round(d.t / 60);
        const h = (min / maxMin) * 100;
        const label = i === 13 || (min === maxMin && min > 0) ? `<span class="bar-val">${min}</span>` : '';
        return `<div class="bar-slot" tabindex="0" data-tip="${U.esc(fmtDay(d.k))}: ${min} min, ${d.q} questions${d.q ? `, ${Math.round((100 * d.c) / d.q)}% right first try` : ''}">
          <div class="bar" style="height:${min ? Math.max(3, h) : 0}%">${label}</div><span class="bar-day">${fmtDay(d.k).split(' ')[0].slice(0, 2)}</span></div>`;
      })
      .join('');

    const rows = SKILLS()
      .map((s) => {
        const c = srs.counts(s.skill, s.pool, p);
        if (!c.seen) return { s, c, html: '' };
        const acc = c.right + c.wrong ? Math.round((100 * c.right) / (c.right + c.wrong)) : 0;
        const trouble = srs.trouble(s.skill, p);
        let grid = '';
        if (s.grid) {
          const pool = s.sort ? s.pool.slice().sort(s.sort) : s.pool;
          grid = `<div class="mgrid">${pool.map((k) => `<span class="mcell ${LEVELS[levelOf(srs.box(s.skill, k, p))].cls}" title="${U.esc(String(k))}: ${LEVELS[levelOf(srs.box(s.skill, k, p))].label}">${U.esc(String(k))}</span>`).join('')}</div>`;
        }
        return {
          s, c,
          html: `<div class="skill-row">
            <div class="skill-head"><b>${U.esc(s.name)}</b><span>${c.known} of ${c.total} known · ${c.mastered} mastered · ${acc}% right</span></div>
            <div class="meter"><span class="m-known" style="width:${(100 * c.known) / c.total}%"></span><span class="m-learning" style="width:${(100 * c.learning) / c.total}%"></span></div>
            ${grid}
            ${trouble.length ? `<div class="trouble">Needs practice: <b>${trouble.map((t) => U.esc(t)).join(', ')}</b></div>` : ''}
          </div>`,
        };
      });
    const started = rows.filter((r) => r.html);
    const notStarted = rows.filter((r) => !r.html).map((r) => r.s.name);
    const locked = KQ.acts.list.filter((a) => a.kind === 'lesson' && !KQ.acts.unlocked(a, p));

    return `
      <div class="cards4">
        <div class="stat"><b>${p.lessons}</b><span>adventures finished</span></div>
        <div class="stat"><b>${KQ.store.streak(p)}</b><span>day streak</span></div>
        <div class="stat"><b>${wmin}</b><span>minutes this week</span></div>
        <div class="stat"><b>${wq ? Math.round((100 * wc) / wq) + '%' : '—'}</b><span>right first try (7 days)</span></div>
      </div>
      <section class="panel">
        <h3>Minutes played per day <small>last 14 days · today ${Math.round(today.t / 60)} min</small></h3>
        <div class="bars" style="--max:${maxMin}">${bars}</div>
        <div class="bar-tip" hidden></div>
      </section>
      <section class="panel">
        <h3>Skills</h3>
        <div class="legend">${LEVELS.map((l) => `<span><i class="mcell ${l.cls}"></i>${l.label}</span>`).join('')}</div>
        ${started.length ? started.map((r) => r.html).join('') : '<p class="muted">No practice yet. Start with Today’s Adventure on the home screen.</p>'}
        ${notStarted.length ? `<p class="muted">Not started yet: ${notStarted.map(U.esc).join(', ')}.</p>` : ''}
        ${locked.length ? `<p class="muted">Unlocks as your child learns: ${locked.map((a) => U.esc(a.title)).join(', ')}. (You can unlock everything in Settings.)</p>` : ''}
      </section>`;
  }

  function settingsHTML() {
    const s = KQ.store.settings();
    const voices = KQ.voice.voices;
    const cur = KQ.voice.voice;
    const opt = (v, label, sel) => `<option value="${v}" ${sel ? 'selected' : ''}>${label}</option>`;
    const worlds = KQ.app.WORLDS.filter((w) => w.id !== 'play');
    const chosen = s.worlds || worlds.map((w) => w.id);
    return `
      <section class="panel">
        <h3>Voice</h3>
        ${KQ.voice.supported ? '' : '<p class="warn">This browser has no text-to-speech. Try Chrome, Edge or Safari.</p>'}
        <label class="row">Voice
          <select id="s-voice">${voices.map((v) => opt(U.esc(v.voiceURI), U.esc(`${v.name} (${v.lang})`), cur && v.voiceURI === cur.voiceURI)).join('') || '<option>Default</option>'}</select>
          <button class="btn small" id="s-test">▶ Test</button></label>
        <label class="row">Speaking speed <input type="range" id="s-rate" min="0.6" max="1.3" step="0.05" value="${s.rate}"><output>${s.rate}</output></label>
        <label class="row">Voice pitch <input type="range" id="s-pitch" min="0.7" max="1.5" step="0.05" value="${s.pitch}"><output>${s.pitch}</output></label>
        <label class="row check"><input type="checkbox" id="s-readChoices" ${s.readChoices !== false ? 'checked' : ''}> Read picture answers out loud (rhymes, first sounds)</label>
        <label class="row check"><input type="checkbox" id="s-bubbles" ${s.bubbles !== false ? 'checked' : ''}> Show speech bubbles (text of what the buddy says)</label>
        <label class="row check"><input type="checkbox" id="s-sfx" ${s.sfx !== false ? 'checked' : ''}> Sound effects</label>
        <label class="row check"><input type="checkbox" id="s-voiceOff" ${s.voiceOff ? 'checked' : ''}> Turn the voice off (not recommended)</label>
      </section>
      <section class="panel">
        <h3>Lessons</h3>
        <label class="row">Questions per adventure
          <select id="s-lessonLen">${[5, 8, 10, 12, 15].map((n) => opt(n, n, s.lessonLen === n)).join('')}</select></label>
        <label class="row">Daily play limit
          <select id="s-dailyLimit">${[0, 10, 15, 20, 30, 45, 60].map((n) => opt(n, n ? n + ' minutes' : 'No limit', s.dailyLimit === n)).join('')}</select></label>
        <div class="row">Today's Adventure includes:
          <div class="checks">${worlds.map((w) => `<label><input type="checkbox" class="s-world" value="${w.id}" ${chosen.includes(w.id) ? 'checked' : ''}> ${w.icon} ${w.title}</label>`).join('')}</div></div>
        <label class="row check"><input type="checkbox" id="s-unlockAll" ${s.unlockAll ? 'checked' : ''}> Unlock all activities (skip the learning order)</label>
      </section>
      <section class="panel">
        <h3>Screen</h3>
        <button class="btn small" id="s-full">⛶ Full screen</button>
        <p class="muted">Tip: on a tablet, use “Add to Home Screen” so Kinder Quest opens full screen like an app and works offline.</p>
      </section>`;
  }

  function playersHTML() {
    return `
      <section class="panel">
        <h3>Players</h3>
        ${KQ.store.profiles().map((p) => `<div class="player-row" data-id="${p.id}">
            <div class="mini-buddy">${KQ.themes.buddySVG(p)}</div>
            <input class="p-name" value="${U.esc(p.name)}" placeholder="Name" maxlength="20" aria-label="Name">
            <select class="p-theme">${KQ.themes.list.map((id) => `<option value="${id}" ${p.theme === id ? 'selected' : ''}>${KQ.themes.get(id).name}</option>`).join('')}</select>
            <button class="btn small alt p-reset">Reset progress</button>
            <button class="btn small danger p-del">Delete</button>
          </div>`).join('')}
        <button class="btn small" id="p-add">+ Add a player</button>
      </section>
      <section class="panel">
        <h3>Backup</h3>
        <p class="muted">Progress is saved only on this device. Save a backup file to move it to another device or keep it safe.</p>
        <button class="btn small" id="b-export">⬇ Save backup file</button>
        <label class="btn small alt file-btn">⬆ Load backup file<input type="file" id="b-import" accept=".json,application/json" hidden></label>
      </section>`;
  }

  function helpHTML() {
    return `
      <section class="panel prose">
        <h3>How Kinder Quest teaches</h3>
        <p><b>Talk, tap, repeat.</b> Every question is spoken. A right answer gets praise plus a reminder (“B is for ball!”). A wrong answer gets a gentle correction that names what was tapped, and after two misses the right answer glows so your child always finishes on a success.</p>
        <p><b>Spaced repetition.</b> Each letter, number, word and fact has its own memory box. New things come back within the same lesson; known things come back the next day, then after 3, 7, 16 and 35 days. Getting something right only moves it up when enough time has passed, so cramming doesn’t count as mastery. Mistakes move it back down for more practice.</p>
        <p><b>Small steps.</b> Only about three new things are introduced at a time, with a “NEW!” card first. Answer choices grow from 2 to 4 as an item becomes familiar, and look-alikes (b/d, 6/9, M/W) appear once your child knows the basics.</p>
        <p><b>Learning order.</b> Some activities unlock when the skills before them are known (for example Letter Sounds after 6 big letters, Spell It after 8 letter sounds, Take Away after addition). Turn on “Unlock all activities” in Settings to skip this.</p>
        <p><b>Today’s Adventure</b> mixes three activities that most need practice right now, so it is the best daily choice.</p>
        <h3>Tips</h3>
        <ul>
          <li>10–15 minutes a day beats one long session. Use the daily play limit in Settings if it helps.</li>
          <li>Sit with your child for the first few sessions and repeat the sounds together.</li>
          <li>Look at “Needs practice” on the Progress tab and point those letters out in books and signs.</li>
          <li>Rewards: a star for every first-try answer, a sticker for every adventure, a new buddy color every 3 adventures, and trophies for big milestones.</li>
        </ul>
        <h3>Privacy</h3>
        <p>No accounts, no ads, no tracking. Everything is stored in this browser on this device. The voice is your device’s built-in text-to-speech.</p>
      </section>`;
  }

  /** Grown-up Corner screen. */
  P.open = (tab = 'report', viewId) => {
    const profiles = KQ.store.profiles();
    const cur = KQ.store.current();
    const p = profiles.find((x) => x.id === viewId) || cur || profiles[0];
    KQ.themes.applyNeutral();
    const tabs = [['report', '📊 Progress'], ['settings', '⚙️ Settings'], ['players', '👨‍👩‍👧 Players'], ['help', '💡 How it works']];
    let body = '';
    if (tab === 'report')
      body = p
        ? `${profiles.length > 1 ? `<div class="viewer">Showing: ${profiles.map((x) => `<button class="chip ${x.id === p.id ? 'on' : ''}" data-view="${x.id}">${U.esc(x.name || 'Player')}</button>`).join('')}</div>` : ''}${reportHTML(p)}`
        : '<p class="muted">No players yet.</p>';
    else if (tab === 'settings') body = settingsHTML();
    else if (tab === 'players') body = playersHTML();
    else body = helpHTML();
    KQ.ui.render(`
      <div class="screen grownup">
        <header class="g-head"><h2>Grown-up Corner</h2><button class="btn small" id="g-close">✔ Done</button></header>
        <nav class="g-tabs">${tabs.map(([id, label]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}">${label}</button>`).join('')}</nav>
        <main class="g-body">${body}</main>
      </div>`);
    $('#g-close').onclick = () => (cur ? nav.go(KQ.app.home) : nav.go(KQ.app.profiles));
    $$('.g-tabs button').forEach((b) => (b.onclick = () => nav.go(P.open, b.dataset.tab, viewId)));
    $$('[data-view]').forEach((b) => (b.onclick = () => nav.go(P.open, 'report', b.dataset.view)));

    if (tab === 'report') {
      const tip = $('.bar-tip');
      $$('.bar-slot').forEach((s) => {
        const show = () => {
          tip.hidden = false;
          tip.textContent = s.dataset.tip;
          const r = s.getBoundingClientRect(), pr = s.parentElement.getBoundingClientRect();
          tip.style.left = Math.min(pr.width - 200, Math.max(0, r.left - pr.left - 60)) + 'px';
        };
        s.addEventListener('pointerenter', show);
        s.addEventListener('focus', show);
        s.addEventListener('click', show);
        s.addEventListener('pointerleave', () => (tip.hidden = true));
      });
    }
    if (tab === 'settings') {
      const set = (k, v) => {
        KQ.store.set(k, v);
        KQ.app.applyVoiceSettings();
      };
      $('#s-voice').onchange = (e) => set('voiceURI', e.target.value);
      $('#s-test').onclick = () => KQ.voice.say("Hi! I'm your learning buddy. B is for ball!", { bubble: false });
      ['rate', 'pitch'].forEach((k) => {
        const el = $('#s-' + k);
        el.oninput = () => (el.nextElementSibling.textContent = el.value);
        el.onchange = () => set(k, +el.value);
      });
      ['readChoices', 'bubbles', 'sfx', 'voiceOff', 'unlockAll'].forEach((k) => ($('#s-' + k).onchange = (e) => set(k, e.target.checked)));
      ['lessonLen', 'dailyLimit'].forEach((k) => ($('#s-' + k).onchange = (e) => set(k, +e.target.value)));
      $$('.s-world').forEach(
        (c) =>
          (c.onchange = () => {
            const on = $$('.s-world').filter((x) => x.checked).map((x) => x.value);
            set('worlds', on.length ? on : null);
          })
      );
      $('#s-full').onclick = () => KQ.app.fullscreen();
    }
    if (tab === 'players') {
      $$('.player-row').forEach((row) => {
        const pl = profiles.find((x) => x.id === row.dataset.id);
        $('.p-name', row).onchange = (e) => ((pl.name = e.target.value.trim()), KQ.store.save());
        $('.p-theme', row).onchange = (e) => {
          pl.theme = e.target.value;
          const t = KQ.themes.get(pl.theme);
          if (!pl.colors.includes(pl.mascot.color)) pl.mascot.color = t.defColor;
          KQ.store.save();
          nav.go(P.open, 'players');
        };
        $('.p-reset', row).onclick = () => {
          if (confirm(`Reset all progress, stars and stickers for ${pl.name || 'this player'}? This cannot be undone.`)) {
            KQ.store.resetProfile(pl.id);
            nav.go(P.open, 'players');
          }
        };
        $('.p-del', row).onclick = () => {
          if (confirm(`Delete ${pl.name || 'this player'} and all their progress? This cannot be undone.`)) {
            KQ.store.deleteProfile(pl.id);
            nav.go(P.open, 'players');
          }
        };
      });
      $('#p-add').onclick = () => nav.go(KQ.app.newPlayer);
      $('#b-export').onclick = () => {
        const blob = new Blob([KQ.store.exportJSON()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `kinder-quest-backup-${U.dateKey()}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
      };
      $('#b-import').onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
          const text = await f.text();
          if (!confirm('Replace all progress on this device with the backup file?')) return;
          KQ.store.importJSON(text);
          alert('Backup loaded!');
          nav.go(P.open, 'players');
        } catch (err) {
          alert('Could not load that file: ' + err.message);
        }
      };
    }
  };
})();

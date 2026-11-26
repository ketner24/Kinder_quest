/* Kinder Quest - talking voice (Web Speech API) and sound effects (Web Audio API).
   No audio files: the voice comes from the device and the sounds are synthesized. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = KQ.util;

  /* ======================= Voice ======================= */
  // Friendly voices to prefer, best first. Falls back to any English voice.
  const PREFERRED = [
    /Microsoft (Ana|Aria|Jenny|Ava|Emma|Michelle).*Natural/i, /Google US English/i, /Samantha/i, /Ava/i, /Allison/i,
    /Karen/i, /Moira/i, /Tessa/i, /Microsoft (Zira|Aria|Jenny)/i, /Google UK English Female/i, /female/i,
  ];

  const V = (KQ.voice = {
    voices: [],
    voice: null,
    rate: 0.92,
    pitch: 1.1,
    supported: 'speechSynthesis' in window,
    _token: 0,
    _keep: null,
    onText: null, // set by UI: called with display text for the speech bubble

    init() {
      if (!this.supported) return;
      const load = () => {
        this.voices = speechSynthesis.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
        this.voice = this.findVoice(KQ.store && KQ.store.settings().voiceURI);
      };
      load();
      speechSynthesis.onvoiceschanged = load;
      // Some browsers load voices late.
      setTimeout(load, 500);
      setTimeout(load, 2000);
    },

    findVoice(uri) {
      if (!this.voices.length) return null;
      if (uri) {
        const v = this.voices.find((x) => x.voiceURI === uri);
        if (v) return v;
      }
      for (const re of PREFERRED) {
        const v = this.voices.find((x) => re.test(x.name) && /en[-_]US/i.test(x.lang)) || this.voices.find((x) => re.test(x.name));
        if (v) return v;
      }
      return this.voices.find((x) => /en[-_]US/i.test(x.lang)) || this.voices[0];
    },

    /** parts: string | {d,s} | array of those. d = what to show, s = what to say. */
    split(parts) {
      const arr = Array.isArray(parts) ? parts.flat(Infinity) : [parts];
      let d = '', s = '';
      for (const p of arr) {
        if (p == null || p === false) continue;
        if (typeof p === 'object') {
          d += p.d;
          s += p.s != null ? p.s : p.d;
        } else {
          d += p;
          s += p;
        }
      }
      return { d: d.replace(/\s+/g, ' ').trim(), s: s.replace(/\s+/g, ' ').trim() };
    },

    /** Speak. Resolves when finished (or interrupted). */
    say(parts, opts = {}) {
      const { d, s } = this.split(parts);
      if (!s) return Promise.resolve();
      if (this.onText && opts.bubble !== false) this.onText(d);
      const token = ++this._token;
      const est = (s.length * 70) / this.rate + 700;
      const st = KQ.store ? KQ.store.settings() : {};
      if (!this.supported || st.voiceOff) return U.sleep(Math.min(est, 4000));
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(token === this._token);
        };
        try {
          if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
          if (speechSynthesis.paused) speechSynthesis.resume();
          const u = new SpeechSynthesisUtterance(s);
          if (this.voice) {
            u.voice = this.voice;
            u.lang = this.voice.lang;
          } else u.lang = 'en-US';
          u.rate = opts.rate || this.rate;
          u.pitch = this.pitch;
          u.volume = 1;
          u.onend = finish;
          u.onerror = finish;
          this._keep = u; // keep a reference (Chrome can garbage-collect and never fire onend)
          speechSynthesis.speak(u);
        } catch (e) {
          finish();
        }
        var timer = setTimeout(finish, est + 4000);
      });
    },

    stop() {
      this._token++;
      if (this.supported) {
        try {
          speechSynthesis.cancel();
        } catch (e) { /* ignore */ }
      }
    },
  });

  /* ======================= Sound effects ======================= */
  let ctx = null;
  let master = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function on() {
    return !KQ.store || KQ.store.settings().sfx !== false;
  }
  function tone(freq, t0, dur, { type = 'sine', gain = 0.25, to = null, attack = 0.01 } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(t0, dur, { gain = 0.2, from = 400, to = 4000, q = 1.5 } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + t0;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur);
  }

  KQ.sfx = {
    unlock() {
      const c = ac();
      if (c) tone(1, 0, 0.01, { gain: 0.0002 });
    },
    tap() {
      if (on()) tone(520, 0, 0.08, { type: 'sine', gain: 0.15, to: 880 });
    },
    pop() {
      if (on()) tone(380, 0, 0.12, { type: 'triangle', gain: 0.2, to: 1100 });
    },
    correct() {
      if (!on()) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.28, { type: 'triangle', gain: 0.22 }));
      tone(2093, 0.34, 0.25, { type: 'sine', gain: 0.08 });
    },
    wrong() {
      if (!on()) return;
      tone(330, 0, 0.18, { type: 'triangle', gain: 0.18, to: 250 });
      tone(250, 0.17, 0.26, { type: 'triangle', gain: 0.16, to: 190 });
    },
    count(n) {
      if (on()) tone(440 * Math.pow(2, Math.min(n, 20) / 12), 0, 0.15, { type: 'sine', gain: 0.18 });
    },
    star() {
      if (!on()) return;
      for (let i = 0; i < 5; i++) tone(1300 + Math.random() * 900, i * 0.05, 0.15, { type: 'sine', gain: 0.07 });
    },
    win() {
      if (!on()) return;
      const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      seq.forEach((f, i) => tone(f, i * 0.13, i === seq.length - 1 ? 0.7 : 0.18, { type: 'square', gain: 0.09 }));
      [523.25, 659.25, 783.99].forEach((f) => tone(f, 0.8, 0.8, { type: 'triangle', gain: 0.1 }));
    },
    /** Theme signature sound */
    theme(kind) {
      if (!on()) return;
      if (kind === 'engine') {
        tone(55, 0, 0.9, { type: 'sawtooth', gain: 0.16, to: 150 });
        tone(58, 0.05, 0.85, { type: 'square', gain: 0.06, to: 140 });
      } else if (kind === 'zoom') {
        tone(180, 0, 0.6, { type: 'sawtooth', gain: 0.1, to: 900 });
        noise(0, 0.6, { gain: 0.12, from: 600, to: 3000 });
      } else if (kind === 'sparkle') {
        [1568, 1760, 2093, 2349, 2637].forEach((f, i) => tone(f, i * 0.07, 0.3, { type: 'sine', gain: 0.08 }));
      } else {
        noise(0, 0.5, { gain: 0.25, from: 300, to: 5000, q: 0.8 });
      }
    },
  };
})();

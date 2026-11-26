/* Kinder Quest - small shared helpers.
   Everything hangs off one global object (window.KQ) so the app works from
   plain <script> tags: no build step, works on GitHub Pages and from file://. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const U = (KQ.util = {});

  U.rand = (n) => Math.floor(Math.random() * n);
  U.pick = (arr) => arr[U.rand(arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = U.rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  /** n random items from arr, skipping anything in `exclude`. */
  U.sample = (arr, n, exclude = []) => U.shuffle(arr.filter((x) => !exclude.includes(x))).slice(0, n);
  U.range = (a, b) => {
    const r = [];
    for (let i = a; i <= b; i++) r.push(i);
    return r;
  };
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  U.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  U.dateKey = (d = new Date()) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  U.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  /** "a ball" / "an apple" (with the usual "a unicorn" exception). */
  U.article = (word) => (/^(uni|use|eu|one)/i.test(word) ? 'a' : /^[aeiou]/i.test(word) ? 'an' : 'a');

  /** "hat, dog, or sun" */
  U.listify = (arr, conj = 'or') =>
    arr.length <= 1 ? arr.join('') : arr.length === 2 ? arr[0] + ' ' + conj + ' ' + arr[1] : arr.slice(0, -1).join(', ') + ', ' + conj + ' ' + arr[arr.length - 1];

  /** Pick one item; weightFn(item) >= 0. */
  U.weightedPick = (items, weightFn) => {
    const ws = items.map((it) => Math.max(0, weightFn(it)));
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) return U.pick(items);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  /** Number word for small counts used in text ("3 stars"). TTS reads digits fine. */
  U.plural = (n, one, many) => (n === 1 ? one : many);
})();

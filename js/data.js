/* Kinder Quest - learning content.
   Letters, sounds, picture words, numbers, colors, shapes, sight words,
   rhymes, CVC words and puzzle sets. Edit this file to change what is taught. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});
  const D = (KQ.D = {});

  /* ---------------- Letters ---------------- */
  D.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // How the voice should SAY each letter name. Checked against the Windows voices' phoneme
  // output: "ay" is read as "eye", "eff"/"ee" get spelled out, "jee" comes out as "dzee",
  // so A, E, F and G use the plain capital letter, which every engine reads as the letter name.
  D.LETTER_SAY = {
    A: 'A', B: 'bee', C: 'see', D: 'dee', E: 'E', F: 'F', G: 'G', H: 'aitch', I: 'eye',
    J: 'jay', K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are',
    S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee',
  };

  // Short letter sounds, spelled so speech engines say a syllable instead of spelling letters out.
  // Avoid repeated consonants ("sss", "zzz") and "ks"/"ih": voices read those as S-S-S, Z-Z-Z, K-S, I-H.
  D.LETTER_SOUND = {
    A: 'ah', B: 'bah', C: 'kuh', D: 'duh', E: 'eh', F: 'fuh', G: 'gah', H: 'huh', I: 'ihh',
    J: 'juh', K: 'kuh', L: 'lah', M: 'muh', N: 'nuh', O: 'aw', P: 'puh', Q: 'kwuh', R: 'ruh',
    S: 'sah', T: 'tuh', U: 'uh', V: 'vuh', W: 'wuh', X: 'ecks', Y: 'yah', Z: 'zah',
  };

  // Picture words. First word is the classic "A is for apple" word.
  D.WORDS = {
    A: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊']],
    B: [['ball', '⚽'], ['bear', '🐻'], ['banana', '🍌'], ['bus', '🚌'], ['bee', '🐝']],
    C: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'], ['cow', '🐮'], ['cookie', '🍪']],
    D: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['dinosaur', '🦕'], ['donut', '🍩']],
    E: [['egg', '🥚'], ['elephant', '🐘']],
    F: [['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊'], ['fire', '🔥'], ['flower', '🌼']],
    G: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁'], ['guitar', '🎸'], ['gorilla', '🦍']],
    H: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['heart', '❤️'], ['hamburger', '🍔']],
    I: [['iguana', '🦎'], ['insect', '🐛']],
    J: [['juice', '🧃'], ['jeans', '👖'], ['jack-o-lantern', '🎃']],
    K: [['kite', '🪁'], ['key', '🔑'], ['koala', '🐨'], ['kangaroo', '🦘'], ['king', '🤴']],
    L: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋'], ['lollipop', '🍭']],
    M: [['moon', '🌙'], ['monkey', '🐵'], ['mouse', '🐭'], ['milk', '🥛']],
    N: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅'], ['nine', '9️⃣']],
    O: [['octopus', '🐙'], ['otter', '🦦'], ['ox', '🐂']],
    P: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧'], ['popcorn', '🍿'], ['panda', '🐼']],
    Q: [['queen', '👑'], ['question mark', '❓'], ['quiet', '🤫']],
    R: [['rabbit', '🐰'], ['rainbow', '🌈'], ['rocket', '🚀'], ['robot', '🤖'], ['ring', '💍']],
    S: [['sun', '☀️'], ['snake', '🐍'], ['star', '⭐'], ['sock', '🧦'], ['strawberry', '🍓']],
    T: [['tiger', '🐯'], ['turtle', '🐢'], ['train', '🚂'], ['tree', '🌳'], ['truck', '🚚']],
    U: [['umbrella', '☂️'], ['unicorn', '🦄']],
    V: [['volcano', '🌋'], ['violin', '🎻'], ['van', '🚐'], ['vest', '🦺']],
    W: [['whale', '🐳'], ['watermelon', '🍉'], ['watch', '⌚'], ['wolf', '🐺']],
    X: [['box', '📦'], ['six', '6️⃣']], // X words end in X (ks)
    Y: [['yo-yo', '🪀'], ['yarn', '🧶']],
    Z: [['zebra', '🦓'], ['zero', '0️⃣']],
  };
  D.X_ENDS = true; // X is taught as the ending sound in box / six

  /** Speech part for a letter name: shows "B", says "bee". */
  D.ltr = (L) => ({ d: L, s: D.LETTER_SAY[L.toUpperCase()] });
  /** "B is for ball" (X: "X is at the end of box") */
  D.isFor = (L, wordIdx = 0) => {
    const U = L.toUpperCase();
    const [w] = D.WORDS[U][wordIdx % D.WORDS[U].length];
    if (U === 'X') return [D.ltr('X'), ' is at the end of ' + w + '!'];
    return [D.ltr(U), ' is for ' + w + '!'];
  };
  D.firstWord = (L) => D.WORDS[L.toUpperCase()][0];

  // Letters that kids mix up - used as tricky wrong answers once a child knows a letter.
  D.CONFUSE_UPPER = {
    B: ['D', 'P', 'R'], D: ['B', 'O', 'P'], P: ['B', 'R', 'F'], R: ['P', 'B', 'K'], E: ['F', 'B'], F: ['E', 'P'],
    M: ['N', 'W'], N: ['M', 'H', 'Z'], W: ['M', 'V'], V: ['U', 'Y', 'W'], U: ['V', 'J'], O: ['Q', 'C', 'D'],
    Q: ['O', 'G'], C: ['G', 'O'], G: ['C', 'Q'], I: ['L', 'T', 'J'], L: ['I', 'J'], T: ['I', 'F'],
    J: ['I', 'L'], K: ['X', 'R'], X: ['K', 'Y'], Y: ['V', 'X'], Z: ['N', 'S'], S: ['Z', 'C'], H: ['N', 'A'], A: ['H', 'V'],
  };
  D.CONFUSE_LOWER = {
    b: ['d', 'p', 'q'], d: ['b', 'q', 'p'], p: ['q', 'b', 'd'], q: ['p', 'g', 'd'], m: ['n', 'w'], n: ['u', 'h', 'm'],
    u: ['n', 'v'], w: ['m', 'v'], h: ['n', 'b'], i: ['l', 'j'], l: ['i', 't'], j: ['i', 'g'], g: ['q', 'j'],
    a: ['o', 'e', 'd'], e: ['a', 'o', 'c'], o: ['a', 'c'], c: ['o', 'e'], t: ['f', 'l'], f: ['t'], v: ['w', 'y'], y: ['v', 'g'],
    r: ['n'], s: ['z'], z: ['s'], k: ['h'], x: ['k'],
  };

  /* ---------------- Numbers ---------------- */
  D.NUM_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  D.COUNT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  D.CONFUSE_NUM = { 6: [9, 8], 9: [6, 8], 1: [7, 4], 7: [1, 4], 2: [5, 7], 5: [2, 3], 3: [8, 5], 8: [3, 0], 0: [8, 6], 12: [20, 21], 13: [30, 31], 16: [19, 61], 19: [16, 9], 14: [41, 40], 15: [51, 50], 17: [71, 11], 18: [81, 13], 11: [17, 1], 10: [1, 0], 20: [12, 2] };

  // Addition facts within 10 (no zeros), easiest first.
  D.ADD_FACTS = [];
  for (let s = 2; s <= 10; s++) for (let a = 1; a < s; a++) D.ADD_FACTS.push(a + '+' + (s - a));
  // Subtraction facts within 10, easiest first.
  D.SUB_FACTS = [];
  for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) D.SUB_FACTS.push(a + '-' + b);

  /* ---------------- Colors ---------------- */
  D.COLORS = [
    { id: 'red', hex: '#e53935', objs: [['🍎', 'apple'], ['🍓', 'strawberry'], ['🚒', 'fire truck'], ['🍅', 'tomato']] },
    { id: 'blue', hex: '#1e88e5', objs: [['🐳', 'whale'], ['🧢', 'cap'], ['🦋', 'butterfly'], ['💙', 'heart']] },
    { id: 'yellow', hex: '#fdd835', objs: [['🍌', 'banana'], ['🐥', 'chick'], ['🍋', 'lemon'], ['🧀', 'cheese']] },
    { id: 'green', hex: '#43a047', objs: [['🐸', 'frog'], ['🥦', 'broccoli'], ['🍀', 'clover'], ['🥒', 'cucumber']] },
    { id: 'orange', hex: '#fb8c00', objs: [['🍊', 'orange'], ['🥕', 'carrot'], ['🎃', 'pumpkin'], ['🏀', 'basketball']] },
    { id: 'purple', hex: '#8e24aa', objs: [['🍇', 'grapes'], ['🍆', 'eggplant'], ['💜', 'heart']] },
    { id: 'pink', hex: '#f06292', objs: [['🐷', 'pig'], ['🌸', 'flower'], ['🦩', 'flamingo'], ['💗', 'heart']] },
    { id: 'brown', hex: '#795548', objs: [['🐻', 'bear'], ['🍫', 'chocolate'], ['🍪', 'cookie'], ['🥔', 'potato']] },
    { id: 'black', hex: '#212121', objs: [['🎩', 'top hat'], ['🎱', 'eight ball'], ['🖤', 'heart'], ['🕷️', 'spider']] },
    { id: 'white', hex: '#ffffff', objs: [['☁️', 'cloud'], ['⛄', 'snowman'], ['🥛', 'milk'], ['👻', 'ghost']] },
    { id: 'gray', hex: '#9e9e9e', objs: [['🐘', 'elephant'], ['🐨', 'koala'], ['🦏', 'rhino']] },
  ];
  D.colorById = (id) => D.COLORS.find((c) => c.id === id);
  // "What color is the ___?" items (skip hearts - too easy to argue about).
  D.COLOR_OBJECTS = [];
  {
    const max = Math.max(...D.COLORS.map((c) => c.objs.length));
    for (let i = 0; i < max; i++)
      for (const c of D.COLORS) {
        const o = c.objs[i];
        if (o && o[1] !== 'heart') D.COLOR_OBJECTS.push({ key: o[1], emoji: o[0], color: c.id });
      }
  }
  D.MIXES = [
    { a: 'red', b: 'yellow', make: 'orange' },
    { a: 'blue', b: 'yellow', make: 'green' },
    { a: 'red', b: 'blue', make: 'purple' },
    { a: 'red', b: 'white', make: 'pink' },
    { a: 'black', b: 'white', make: 'gray' },
  ];

  /* ---------------- Shapes ---------------- */
  function poly(n, r = 44, rot = -90, cx = 50, cy = 52) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = ((rot + (360 / n) * i) * Math.PI) / 180;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  function starPts(cx = 50, cy = 53, R = 46, r = 19) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = ((-90 + 36 * i) * Math.PI) / 180;
      const rr = i % 2 ? r : R;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  const S = 'stroke="rgba(0,0,0,.28)" stroke-width="3" stroke-linejoin="round"';
  D.SHAPES = [
    { id: 'circle', fact: 'A circle is round. It has no corners.', svg: (f) => `<circle cx="50" cy="50" r="43" fill="${f}" ${S}/>` },
    { id: 'square', fact: 'A square has 4 sides that are all the same.', svg: (f) => `<rect x="9" y="9" width="82" height="82" rx="3" fill="${f}" ${S}/>` },
    { id: 'triangle', fact: 'A triangle has 3 sides and 3 corners.', svg: (f) => `<polygon points="50,7 95,90 5,90" fill="${f}" ${S}/>` },
    { id: 'rectangle', fact: 'A rectangle has 4 sides. Two sides are long and two are short.', svg: (f) => `<rect x="3" y="24" width="94" height="52" rx="3" fill="${f}" ${S}/>` },
    { id: 'star', fact: 'A star has 5 points.', svg: (f) => `<polygon points="${starPts()}" fill="${f}" ${S}/>` },
    { id: 'heart', fact: 'A heart is the shape of love!', svg: (f) => `<path d="M50 90 C 22 68 4 50 4 31 C 4 15 17 6 30 6 C 40 6 47 12 50 21 C 53 12 60 6 70 6 C 83 6 96 15 96 31 C 96 50 78 68 50 90 Z" fill="${f}" ${S}/>` },
    { id: 'oval', fact: 'An oval is like a stretched circle. An egg is an oval.', svg: (f) => `<ellipse cx="50" cy="50" rx="30" ry="44" fill="${f}" ${S}/>` },
    { id: 'diamond', fact: 'A diamond has 4 sides, like a kite.', svg: (f) => `<polygon points="50,3 88,50 50,97 12,50" fill="${f}" ${S}/>` },
    { id: 'hexagon', fact: 'A hexagon has 6 sides, like a honeycomb.', svg: (f) => `<polygon points="${poly(6, 46, 0)}" fill="${f}" ${S}/>` },
    { id: 'pentagon', fact: 'A pentagon has 5 sides.', svg: (f) => `<polygon points="${poly(5, 46)}" fill="${f}" ${S}/>` },
    {
      id: 'sphere', solid: true, fact: 'A sphere is round all over, like a ball.',
      svg: (f, id = 'g' + Math.random().toString(36).slice(2, 7)) =>
        `<defs><radialGradient id="${id}" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".25" stop-color="${f}"/><stop offset="1" stop-color="${f}" stop-opacity=".75"/></radialGradient></defs><circle cx="50" cy="50" r="43" fill="url(#${id})" ${S}/>`,
    },
    {
      id: 'cube', solid: true, fact: 'A cube is like a block. It has 6 square faces.',
      svg: (f) =>
        `<polygon points="14,32 62,32 62,88 14,88" fill="${f}" ${S}/><polygon points="14,32 36,12 84,12 62,32" fill="${f}" ${S}/><polygon points="14,32 36,12 84,12 62,32" fill="#fff" opacity=".35"/><polygon points="62,32 84,12 84,68 62,88" fill="${f}" ${S}/><polygon points="62,32 84,12 84,68 62,88" fill="#000" opacity=".18"/>`,
    },
    {
      id: 'cylinder', solid: true, fact: 'A cylinder is like a can.',
      svg: (f) =>
        `<path d="M18 22 L18 80 A32 11 0 0 0 82 80 L82 22" fill="${f}" ${S}/><ellipse cx="50" cy="22" rx="32" ry="11" fill="${f}" ${S}/><ellipse cx="50" cy="22" rx="32" ry="11" fill="#fff" opacity=".35"/>`,
    },
    {
      id: 'cone', solid: true, fact: 'A cone is like an ice cream cone.',
      svg: (f) =>
        `<path d="M50 6 L84 80 A34 11 0 0 1 16 80 Z" fill="${f}" ${S}/><path d="M16 80 A34 11 0 0 0 84 80" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="3"/><path d="M50 6 L84 80 A34 11 0 0 1 50 91 Z" fill="#000" opacity=".12"/>`,
    },
  ];
  D.shapeById = (id) => D.SHAPES.find((s) => s.id === id);
  D.shapeSVG = (id, fill) => `<svg viewBox="0 0 100 100" class="shape-svg" aria-hidden="true">${D.shapeById(id).svg(fill)}</svg>`;
  D.SHAPE_FILLS = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#fb8c00', '#8e24aa', '#f06292', '#00acc1'];

  /* ---------------- Sight words (Dolch pre-primer / primer) ---------------- */
  D.SIGHT = [
    ['I', 'I am happy.'], ['a', 'I see a dog.'], ['the', 'Look at the sun.'], ['see', 'I see a bird.'], ['can', 'I can jump.'],
    ['my', 'This is my hat.'], ['is', 'It is big.'], ['it', 'I like it.'], ['like', 'I like cake.'], ['to', 'Go to bed.'],
    ['we', 'We can play.'], ['go', 'Go, go, go!'], ['me', 'Look at me!'], ['you', 'I love you.'], ['and', 'You and me.'],
    ['in', 'The cat is in the box.'], ['up', 'Look up!'], ['look', 'Look at the moon.'], ['at', 'Look at the dog.'], ['am', 'I am five.'],
    ['he', 'He can run.'], ['she', 'She can sing.'], ['said', 'Mom said yes.'], ['for', 'This is for you.'], ['on', 'The hat is on my head.'],
    ['no', 'No, thank you.'], ['yes', 'Yes, please!'], ['big', 'A big truck.'], ['little', 'A little bug.'], ['come', 'Come and play.'],
    ['play', "Let's play!"], ['here', 'Come here.'], ['jump', 'I can jump high.'], ['run', 'Run fast!'], ['down', 'Sit down.'],
    ['what', 'What is that?'], ['was', 'It was fun.'], ['they', 'They are my friends.'], ['are', 'We are happy.'], ['this', 'This is fun.'],
    ['with', 'Play with me.'], ['have', 'I have a ball.'], ['all', 'We all clap.'], ['do', 'I can do it!'], ['be', 'Be kind.'],
    ['will', 'I will try.'], ['into', 'Jump into the pool.'], ['get', 'Get the ball.'], ['that', 'I like that.'], ['so', 'I am so happy.'],
  ];
  D.SIGHT_SAY = { a: 'A', I: 'eye' };
  D.sightSentence = (w) => (D.SIGHT.find((s) => s[0] === w) || [w, ''])[1];
  D.word = (w) => ({ d: w, s: D.SIGHT_SAY[w] || w });

  /* ---------------- Rhymes ---------------- */
  D.RHYMES = [
    [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇']],
    [['bee', '🐝'], ['tree', '🌳'], ['key', '🔑']],
    [['car', '🚗'], ['star', '⭐'], ['guitar', '🎸']],
    [['duck', '🦆'], ['truck', '🚚']],
    [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈']],
    [['goat', '🐐'], ['coat', '🧥'], ['boat', '⛵']],
    [['fox', '🦊'], ['box', '📦'], ['socks', '🧦']],
    [['cake', '🎂'], ['snake', '🐍']],
    [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']],
    [['house', '🏠'], ['mouse', '🐭']],
    [['train', '🚂'], ['rain', '🌧️'], ['plane', '✈️']],
    [['king', '🤴'], ['ring', '💍']],
    [['fish', '🐟'], ['dish', '🍽️']],
    [['bed', '🛏️'], ['sled', '🛷'], ['bread', '🍞']],
    [['kite', '🪁'], ['light', '💡'], ['night', '🌃']],
    [['hen', '🐔'], ['ten', '🔟'], ['pen', '🖊️']],
    [['bell', '🔔'], ['shell', '🐚']],
    [['snail', '🐌'], ['whale', '🐳']],
    [['ball', '⚽'], ['wall', '🧱']],
    [['nose', '👃'], ['rose', '🌹']],
    [['shoe', '👟'], ['two', '2️⃣']],
    [['door', '🚪'], ['four', '4️⃣'], ['dinosaur', '🦖']],
    [['bug', '🐛'], ['mug', '☕']],
    [['tie', '👔'], ['pie', '🥧'], ['eye', '👁️']],
  ];
  D.RHYME_ITEMS = [];
  D.RHYMES.forEach((g, gi) => g.forEach(([w, e]) => D.RHYME_ITEMS.push({ key: w, emoji: e, group: gi })));
  D.rhymeItem = (k) => D.RHYME_ITEMS.find((r) => r.key === k);

  /* ---------------- CVC words (short-vowel words for spelling) ---------------- */
  D.CVC = [
    ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['bed', '🛏️'], ['hat', '🎩'], ['fox', '🦊'], ['bus', '🚌'],
    ['six', '6️⃣'], ['hen', '🐔'], ['bat', '🦇'], ['box', '📦'], ['bug', '🐛'], ['web', '🕸️'], ['map', '🗺️'], ['pot', '🍲'],
    ['cup', '🥤'], ['pen', '🖊️'], ['van', '🚐'], ['net', '🥅'], ['rat', '🐀'], ['ten', '🔟'], ['cap', '🧢'], ['jet', '✈️'],
  ];
  D.cvc = (w) => D.CVC.find((c) => c[0] === w);

  /* ---------------- Puzzles ---------------- */
  D.CATEGORIES = [
    { id: 'fruit', desc: 'a fruit', items: [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍊', 'orange'], ['🍐', 'pear'], ['🍉', 'watermelon'], ['🍒', 'cherries']] },
    { id: 'animal', desc: 'an animal', items: [['🐶', 'dog'], ['🐱', 'cat'], ['🐮', 'cow'], ['🐷', 'pig'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🐰', 'bunny'], ['🦁', 'lion'], ['🐯', 'tiger'], ['🐻', 'bear']] },
    { id: 'go', desc: 'something that goes', items: [['🚗', 'car'], ['🚌', 'bus'], ['🚒', 'fire truck'], ['🚓', 'police car'], ['🚜', 'tractor'], ['🚲', 'bike'], ['✈️', 'airplane'], ['🚂', 'train']] },
    { id: 'wear', desc: 'something you wear', items: [['👕', 'shirt'], ['👖', 'pants'], ['🧦', 'socks'], ['👟', 'shoe'], ['🧢', 'cap'], ['👗', 'dress'], ['🧤', 'gloves'], ['🧣', 'scarf']] },
    { id: 'toy', desc: 'a toy', items: [['⚽', 'ball'], ['🧸', 'teddy bear'], ['🪁', 'kite'], ['🎈', 'balloon'], ['🪀', 'yo-yo'], ['🧩', 'puzzle']] },
  ];
  D.PATTERNS = ['AB', 'AAB', 'ABB', 'ABC', 'AABB', 'ABCD'];
})();

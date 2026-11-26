/* Kinder Quest - themes.
   Each theme has its own colors, learning buddy (drawn in SVG - all original art),
   praise words, counting objects, stickers and background scene. */
(function () {
  'use strict';
  const KQ = (window.KQ = window.KQ || {});

  // Colors a buddy can be painted. The first 4 are free; the rest unlock as the child plays.
  const PAINT = [
    { id: 'red', hex: '#e53935' }, { id: 'blue', hex: '#1e88e5' }, { id: 'green', hex: '#43a047' }, { id: 'purple', hex: '#8e24aa' },
    { id: 'orange', hex: '#fb8c00' }, { id: 'pink', hex: '#ec407a' }, { id: 'teal', hex: '#00897b' }, { id: 'yellow', hex: '#fdd835' },
    { id: 'black', hex: '#37474f' }, { id: 'gold', hex: '#ffb300' }, { id: 'sky', hex: '#29b6f6' }, { id: 'lime', hex: '#7cb342' },
    { id: 'silver', hex: '#90a4ae' }, { id: 'rainbow', hex: 'url(#rainbow)' },
  ];
  const SKIN = ['#f9d4b4', '#eab68f', '#c98b5f', '#8d5a3b', '#5c3a24'];
  const HAIR = ['#3e2723', '#6d4c41', '#f2c14e', '#c0562b', '#111111'];

  const RAINBOW_DEF =
    '<defs><linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e53935"/><stop offset=".2" stop-color="#fb8c00"/><stop offset=".4" stop-color="#fdd835"/><stop offset=".6" stop-color="#43a047"/><stop offset=".8" stop-color="#1e88e5"/><stop offset="1" stop-color="#8e24aa"/></linearGradient></defs>';

  const paintHex = (id) => (PAINT.find((p) => p.id === id) || PAINT[0]).hex;
  // A second color that looks good next to the main one.
  const PARTNER = { red: 'blue', blue: 'red', green: 'yellow', purple: 'gold', orange: 'blue', pink: 'purple', teal: 'orange', yellow: 'red', black: 'red', gold: 'purple', sky: 'yellow', lime: 'purple', silver: 'blue', rainbow: 'gold' };

  /* ---------- Buddy drawings (200 x 200) ---------- */
  function hero(m) {
    const c1 = paintHex(m.color), c2 = paintHex(PARTNER[m.color] || 'yellow');
    const skin = SKIN[m.skin || 0], hair = HAIR[m.hair == null ? 0 : m.hair];
    return `<svg viewBox="0 0 200 200" class="buddy-svg">${RAINBOW_DEF}
      <g class="b-cape"><path d="M70 98 Q100 90 130 98 L170 188 Q100 200 30 188 Z" fill="${c2}"/><path d="M70 98 Q100 90 130 98 L150 150 Q100 140 50 150Z" fill="#000" opacity=".12"/></g>
      <rect x="78" y="146" width="19" height="36" rx="9" fill="${c1}"/><rect x="103" y="146" width="19" height="36" rx="9" fill="${c1}"/>
      <rect x="73" y="171" width="27" height="16" rx="8" fill="${c2}"/><rect x="100" y="171" width="27" height="16" rx="8" fill="${c2}"/>
      <rect x="69" y="95" width="62" height="60" rx="22" fill="${c1}"/>
      <rect x="69" y="137" width="62" height="9" fill="#ffd54f"/><rect x="94" y="136" width="12" height="11" rx="2" fill="#ffb300"/>
      <circle cx="100" cy="117" r="14" fill="#ffd54f"/>
      <path d="M100 106 l3.4 7 7.6 1 -5.5 5.3 1.4 7.6 -6.9-3.7 -6.9 3.7 1.4-7.6 -5.5-5.3 7.6-1z" fill="${c2}"/>
      <g class="b-arm-l"><rect x="52" y="99" width="19" height="42" rx="9.5" fill="${c1}" transform="rotate(18 61 100)"/><circle cx="50" cy="140" r="10" fill="${skin}"/></g>
      <g class="b-arm-r"><rect x="129" y="62" width="19" height="46" rx="9.5" fill="${c1}" transform="rotate(24 138 108)"/><circle cx="154" cy="64" r="11" fill="${skin}"/></g>
      <circle cx="100" cy="62" r="34" fill="${skin}"/>
      <path d="M65 60 Q66 25 100 25 Q135 25 135 60 Q124 40 100 42 Q78 40 65 60Z" fill="${hair}"/>
      <path d="M67 57 Q100 46 133 57 L133 70 Q116 77 100 68 Q84 77 67 70 Z" fill="${c2}"/>
      <g class="b-eyes"><ellipse cx="86" cy="63" rx="7.5" ry="8.5" fill="#fff"/><circle cx="87" cy="64" r="4.3" fill="#1a1a1a"/><circle cx="88.5" cy="62" r="1.4" fill="#fff"/>
      <ellipse cx="114" cy="63" rx="7.5" ry="8.5" fill="#fff"/><circle cx="115" cy="64" r="4.3" fill="#1a1a1a"/><circle cx="116.5" cy="62" r="1.4" fill="#fff"/></g>
      <circle cx="78" cy="80" r="5" fill="#ff8a80" opacity=".45"/><circle cx="122" cy="80" r="5" fill="#ff8a80" opacity=".45"/>
      <path class="b-mouth" d="M87 81 Q100 93 113 81" stroke="#6d2e22" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function truck(m) {
    const c1 = paintHex(m.color), c2 = paintHex(PARTNER[m.color] || 'yellow');
    const wheel = (cx) => `<g class="b-wheel">
        <circle cx="${cx}" cy="150" r="37" fill="#1f1f1f"/>
        <circle cx="${cx}" cy="150" r="31" fill="none" stroke="#3a3a3a" stroke-width="7" stroke-dasharray="9 6"/>
        <circle cx="${cx}" cy="150" r="16" fill="#b0bec5"/><circle cx="${cx}" cy="150" r="6" fill="#607d8b"/>
        <path d="M${cx} 136 L${cx} 164 M${cx - 14} 150 L${cx + 14} 150" stroke="#78909c" stroke-width="3"/></g>`;
    return `<svg viewBox="0 0 200 200" class="buddy-svg">${RAINBOW_DEF}
      <ellipse cx="100" cy="190" rx="88" ry="7" fill="#000" opacity=".2"/>
      <rect x="44" y="114" width="112" height="10" rx="4" fill="#546e7a"/>
      <path d="M48 124 l6 10 -6 10 M152 124 l-6 10 6 10" stroke="#90a4ae" stroke-width="5" fill="none"/>
      <g class="b-body">
        <path d="M16 110 L20 84 Q22 76 32 76 L68 76 L85 45 Q89 39 97 39 L142 39 Q152 39 156 47 L167 76 L180 78 Q188 80 188 90 L188 110 Q188 117 181 117 L23 117 Q16 117 16 110Z" fill="${c1}"/>
        <path d="M92 49 L79 73 L119 73 L119 49 Z" fill="#bfe9ff"/>
        <path d="M126 49 L126 73 L159 73 L149 49 Z" fill="#bfe9ff"/>
        <circle cx="106" cy="62" r="10" fill="${c2}"/><path d="M106 57 h9 a5 5 0 0 1 0 10 h-9z" fill="#263238"/>
        <path d="M22 98 Q60 88 80 100 Q100 88 120 100 Q150 88 186 98" stroke="${c2}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M30 88 l14 -6 -6 8 14 -4" stroke="#ffd54f" stroke-width="3" fill="none"/>
        <rect x="176" y="84" width="10" height="9" rx="3" fill="#fff59d"/>
        <rect x="14" y="88" width="7" height="12" rx="2" fill="#ff5252"/>
      </g>
      ${wheel(52)}${wheel(148)}
    </svg>`;
  }

  function race(m) {
    const c1 = paintHex(m.color), c2 = paintHex(PARTNER[m.color] || 'yellow');
    const num = m.num || 1;
    const wheel = (cx) => `<g class="b-wheel"><circle cx="${cx}" cy="146" r="21" fill="#1f1f1f"/><circle cx="${cx}" cy="146" r="10" fill="#cfd8dc"/><path d="M${cx} 138 L${cx} 154 M${cx - 8} 146 L${cx + 8} 146" stroke="#90a4ae" stroke-width="3"/></g>`;
    return `<svg viewBox="0 0 200 200" class="buddy-svg">${RAINBOW_DEF}
      <ellipse cx="104" cy="170" rx="90" ry="6" fill="#000" opacity=".22"/>
      <g class="b-speed" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".75"><line x1="0" y1="104" x2="16" y2="104"/><line x1="4" y1="120" x2="14" y2="120"/><line x1="0" y1="136" x2="12" y2="136"/></g>
      <g class="b-body">
        <rect x="22" y="90" width="9" height="30" fill="#37474f"/><rect x="14" y="83" width="38" height="11" rx="3" fill="${c2}"/>
        <path d="M20 140 L22 115 Q24 107 34 105 L78 99 Q93 82 113 82 Q130 82 140 97 L178 107 Q196 112 196 125 L196 136 Q196 142 189 142 L26 142 Q20 142 20 140Z" fill="${c1}"/>
        <path d="M24 127 L194 127" stroke="${c2}" stroke-width="7"/>
        <circle cx="110" cy="91" r="15" fill="${c2}"/><path d="M111 83 h11 a6 6 0 0 1 0 12 h-11z" fill="#263238"/>
        <path d="M150 104 L184 112" stroke="#fff" stroke-width="3" opacity=".6"/>
        <circle cx="70" cy="119" r="13" fill="#fff" stroke="#263238" stroke-width="2"/>
        <text x="70" y="125" font-size="17" text-anchor="middle" font-weight="700" font-family="Fredoka, Arial, sans-serif" fill="#263238">${num}</text>
        <rect x="186" y="116" width="9" height="7" rx="2" fill="#fff59d"/>
      </g>
      ${wheel(56)}${wheel(162)}
    </svg>`;
  }

  function princess(m) {
    const c1 = paintHex(m.color), c2 = paintHex(PARTNER[m.color] || 'gold');
    const skin = SKIN[m.skin || 0], hair = HAIR[m.hair == null ? 2 : m.hair];
    return `<svg viewBox="0 0 200 200" class="buddy-svg">${RAINBOW_DEF}
      <path d="M63 58 Q58 118 70 132 L130 132 Q142 118 137 58 Q100 28 63 58Z" fill="${hair}"/>
      <path d="M80 104 L120 104 L164 186 Q100 199 36 186 Z" fill="${c1}"/>
      <path d="M100 108 L100 190" stroke="#fff" stroke-width="3" opacity=".25"/>
      <path d="M42 178 Q58 189 74 180 Q90 191 100 182 Q112 191 126 180 Q142 189 158 178" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>
      <g fill="#fff" opacity=".8"><circle cx="70" cy="160" r="2.5"/><circle cx="128" cy="150" r="2.5"/><circle cx="96" cy="140" r="2"/><circle cx="116" cy="170" r="2.5"/><circle cx="82" cy="174" r="2"/></g>
      <path d="M79 95 Q100 88 121 95 L123 121 Q100 128 77 121 Z" fill="${c2}"/>
      <g class="b-arm-l"><rect x="58" y="98" width="16" height="38" rx="8" fill="${skin}" transform="rotate(22 66 100)"/></g>
      <g class="b-arm-r"><rect x="126" y="70" width="16" height="40" rx="8" fill="${skin}" transform="rotate(28 134 110)"/>
        <line x1="152" y1="72" x2="168" y2="34" stroke="#8d6e63" stroke-width="4" stroke-linecap="round"/>
        <path class="b-wand" d="M168 18 l4 9 10 1 -7.5 6.7 2.2 9.8 -8.7-5 -8.7 5 2.2-9.8 -7.5-6.7 10-1z" fill="#ffd54f" stroke="#ffb300" stroke-width="1.5"/></g>
      <rect x="93" y="84" width="14" height="13" fill="${skin}"/>
      <circle cx="100" cy="62" r="30" fill="${skin}"/>
      <path d="M69 60 Q70 32 100 32 Q130 32 131 60 Q118 44 100 47 Q82 44 69 60Z" fill="${hair}"/>
      <path d="M75 37 L81 15 L91 29 L100 10 L109 29 L119 15 L125 37 Z" fill="#ffca28" stroke="#f9a825" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="27" r="3.6" fill="#e91e63"/><circle cx="85" cy="31" r="2.6" fill="#29b6f6"/><circle cx="115" cy="31" r="2.6" fill="#29b6f6"/>
      <g class="b-eyes"><ellipse cx="88" cy="64" rx="5.5" ry="7" fill="#1a1a1a"/><circle cx="89.5" cy="61.5" r="1.8" fill="#fff"/>
      <ellipse cx="112" cy="64" rx="5.5" ry="7" fill="#1a1a1a"/><circle cx="113.5" cy="61.5" r="1.8" fill="#fff"/>
      <path d="M81 57 l-3 -3 M84 56 l-1.5 -3.5 M119 57 l3 -3 M116 56 l1.5 -3.5" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round"/></g>
      <circle cx="80" cy="76" r="5.5" fill="#ff80ab" opacity=".5"/><circle cx="120" cy="76" r="5.5" fill="#ff80ab" opacity=".5"/>
      <path class="b-mouth" d="M90 77 Q100 86 110 77" stroke="#ad1457" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  /* ---------- Background scenes (repeat along the bottom of the screen) ---------- */
  const svgUrl = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const SCENES = {
    hero: `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><g fill="#0b1f4d" opacity=".55"><rect x="0" y="70" width="50" height="90"/><rect x="55" y="40" width="40" height="120"/><rect x="100" y="90" width="45" height="70"/><rect x="150" y="20" width="36" height="140"/><rect x="160" y="8" width="16" height="14"/><rect x="192" y="60" width="54" height="100"/><rect x="252" y="100" width="40" height="60"/><rect x="298" y="45" width="44" height="115"/><rect x="348" y="80" width="50" height="80"/><rect x="404" y="30" width="38" height="130"/><rect x="446" y="75" width="34" height="85"/></g><g fill="#ffe082" opacity=".7"><rect x="62" y="52" width="6" height="8"/><rect x="78" y="52" width="6" height="8"/><rect x="62" y="70" width="6" height="8"/><rect x="158" y="36" width="6" height="8"/><rect x="172" y="56" width="6" height="8"/><rect x="306" y="60" width="6" height="8"/><rect x="322" y="80" width="6" height="8"/><rect x="412" y="44" width="6" height="8"/><rect x="426" y="64" width="6" height="8"/><rect x="204" y="74" width="6" height="8"/></g></svg>`,
    truck: `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><path d="M0 90 Q60 40 120 85 T240 80 T360 70 T480 90 V160 H0Z" fill="#6d4c41" opacity=".75"/><path d="M0 120 Q80 95 160 118 T320 112 T480 120 V160 H0Z" fill="#4e342e"/><g fill="#3e2723" opacity=".8"><rect x="20" y="132" width="14" height="5" rx="2"/><rect x="44" y="132" width="14" height="5" rx="2"/><rect x="68" y="132" width="14" height="5" rx="2"/><rect x="250" y="138" width="14" height="5" rx="2"/><rect x="274" y="138" width="14" height="5" rx="2"/><rect x="298" y="138" width="14" height="5" rx="2"/></g><g fill="#ffb300"><path d="M400 105 l10 -22 10 22z"/><rect x="398" y="104" width="24" height="4"/></g></svg>`,
    race: `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><rect x="0" y="70" width="480" height="90" fill="#37474f"/><rect x="0" y="112" width="480" height="6" fill="#fff" opacity=".0"/><g fill="#fff" opacity=".85"><rect x="10" y="112" width="40" height="6" rx="3"/><rect x="90" y="112" width="40" height="6" rx="3"/><rect x="170" y="112" width="40" height="6" rx="3"/><rect x="250" y="112" width="40" height="6" rx="3"/><rect x="330" y="112" width="40" height="6" rx="3"/><rect x="410" y="112" width="40" height="6" rx="3"/></g><g><rect x="0" y="60" width="480" height="10" fill="#fff"/>${Array.from({ length: 48 }, (_, i) => `<rect x="${i * 10}" y="${i % 2 ? 60 : 65}" width="10" height="5" fill="#111"/>`).join('')}</g><g fill="#e53935"><rect x="0" y="152" width="20" height="8"/><rect x="40" y="152" width="20" height="8"/><rect x="80" y="152" width="20" height="8"/><rect x="120" y="152" width="20" height="8"/><rect x="160" y="152" width="20" height="8"/><rect x="200" y="152" width="20" height="8"/><rect x="240" y="152" width="20" height="8"/><rect x="280" y="152" width="20" height="8"/><rect x="320" y="152" width="20" height="8"/><rect x="360" y="152" width="20" height="8"/><rect x="400" y="152" width="20" height="8"/><rect x="440" y="152" width="20" height="8"/></g></svg>`,
    princess: `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><path d="M0 110 Q120 70 240 105 T480 100 V160 H0Z" fill="#ce93d8" opacity=".7"/><g fill="#f3e5f5" opacity=".9"><rect x="300" y="60" width="90" height="60"/><rect x="290" y="30" width="22" height="90"/><rect x="378" y="30" width="22" height="90"/><rect x="333" y="20" width="24" height="60"/><path d="M286 32 l15 -26 15 26z M374 32 l15 -26 15 26z M330 22 l15 -26 15 26z" fill="#f48fb1"/><path d="M332 120 v-26 a13 13 0 0 1 26 0 v26z" fill="#ba68c8"/></g><path d="M0 130 Q100 112 220 132 T480 128 V160 H0Z" fill="#ab47bc" opacity=".55"/><g fill="#fff"><circle cx="60" cy="40" r="2"/><circle cx="150" cy="25" r="2.5"/><circle cx="220" cy="55" r="1.8"/><circle cx="440" cy="35" r="2.2"/></g></svg>`,
  };

  const T = {};
  T.hero = {
    id: 'hero', name: 'Superheroes', buddy: 'Captain Comet', icon: '🦸', draw: hero, defColor: 'red',
    css: { '--bg1': '#3f7fe0', '--bg2': '#13306e', '--primary': '#e53935', '--accent': '#ffca28', '--soft': '#e3f2fd' },
    hello: "I'm Captain Comet! Together we have super learning powers!",
    praise: ['Super job, hero!', 'Hero power!', 'Pow! You got it!', 'You saved the day!', 'Super smart!', 'Zoom! Hero brain power!', 'Boom! That is right!'],
    tryAgain: ['Heroes never give up!', 'Even heroes practice!', 'Hero, try again!'],
    counters: [['⭐', 'star', 'stars'], ['🛡️', 'shield', 'shields'], ['⚡', 'lightning bolt', 'lightning bolts'], ['🚀', 'rocket', 'rockets'], ['🦸', 'hero', 'heroes'], ['💎', 'power gem', 'power gems']],
    stickers: [['🦸', 'super hero'], ['⚡', 'lightning bolt'], ['🛡️', 'shield'], ['🚀', 'rocket'], ['💥', 'pow'], ['🦅', 'eagle'], ['🌟', 'super star'], ['🔥', 'fire power'], ['🏙️', 'hero city'], ['🛸', 'space ship'], ['☄️', 'comet'], ['🧲', 'magnet'], ['🌀', 'whirlwind'], ['🦾', 'robot arm'], ['🎖️', 'medal'], ['🏆', 'trophy'], ['🌙', 'moon'], ['🔦', 'flashlight'], ['🗝️', 'secret key'], ['🎯', 'bullseye'], ['🌈', 'rainbow'], ['🐺', 'wolf'], ['🦁', 'lion'], ['🐉', 'dragon']],
    lessonWord: 'mission', sfx: 'whoosh',
  };
  T.truck = {
    id: 'truck', name: 'Monster Trucks', buddy: 'Rumble', icon: '🛻', draw: truck, defColor: 'green',
    css: { '--bg1': '#ffb74d', '--bg2': '#8d4f1f', '--primary': '#ef6c00', '--accent': '#c6ff00', '--soft': '#fff3e0' },
    hello: "I'm Rumble, the monster truck! Let's crush some learning!",
    praise: ['Crushed it!', 'Monster smart!', 'Vroom vroom! You got it!', 'Big wheels, big brain!', 'Smash! That is right!', 'Monster truck champion!', 'Rumble rumble! Awesome!'],
    tryAgain: ['Back it up and try again!', 'Rev it up! Try again!', 'Monster trucks keep rolling!'],
    counters: [['🛻', 'truck', 'trucks'], ['🚜', 'tractor', 'tractors'], ['🔧', 'wrench', 'wrenches'], ['🚧', 'roadblock', 'roadblocks'], ['🚚', 'big truck', 'big trucks'], ['🏁', 'flag', 'flags']],
    stickers: [['🛻', 'monster truck'], ['🚜', 'tractor'], ['🚚', 'big truck'], ['🏗️', 'crane'], ['🚧', 'roadblock'], ['⛽', 'gas pump'], ['🔧', 'wrench'], ['🔩', 'bolt'], ['💨', 'dust cloud'], ['🔥', 'flames'], ['⛰️', 'mountain'], ['🌋', 'volcano'], ['🏆', 'trophy'], ['⚙️', 'gear'], ['🚛', 'semi truck'], ['🚒', 'fire truck'], ['🦖', 'dino'], ['💥', 'crash'], ['🎆', 'fireworks'], ['🌪️', 'tornado'], ['🥇', 'gold medal'], ['🚨', 'siren'], ['🪖', 'helmet'], ['🦬', 'bison']],
    lessonWord: 'race', sfx: 'engine',
  };
  T.race = {
    id: 'race', name: 'Race Cars', buddy: 'Zippy', icon: '🏎️', draw: race, defColor: 'blue',
    css: { '--bg1': '#4fc3f7', '--bg2': '#1a237e', '--primary': '#d32f2f', '--accent': '#ffd600', '--soft': '#e1f5fe' },
    hello: "I'm Zippy, the race car! Ready, set, learn!",
    praise: ['Zoom! You got it!', 'First place!', 'Speedy smart!', 'You are winning the race!', 'Checkered flag! That is right!', 'Vroom! So fast!', 'Turbo brain!'],
    tryAgain: ['Pit stop! Try again!', 'Keep racing! Try again!', 'Rev up and try again!'],
    counters: [['🏎️', 'race car', 'race cars'], ['🏁', 'flag', 'flags'], ['🏆', 'trophy', 'trophies'], ['🚦', 'traffic light', 'traffic lights'], ['⏱️', 'stopwatch', 'stopwatches'], ['🥇', 'medal', 'medals']],
    stickers: [['🏎️', 'race car'], ['🏁', 'checkered flag'], ['🏆', 'trophy'], ['🥇', 'gold medal'], ['🚦', 'traffic light'], ['⏱️', 'stopwatch'], ['🛣️', 'race track'], ['🔧', 'wrench'], ['⛽', 'fuel'], ['🎌', 'flags'], ['🚗', 'car'], ['🚓', 'police car'], ['🏍️', 'motorcycle'], ['💨', 'zoom'], ['⚡', 'turbo'], ['🔥', 'hot wheels'], ['🌟', 'star'], ['🎉', 'party'], ['🥈', 'silver medal'], ['🎖️', 'badge'], ['🗺️', 'map'], ['🔑', 'car key'], ['🚀', 'rocket'], ['🪖', 'helmet']],
    lessonWord: 'race', sfx: 'zoom',
  };
  T.princess = {
    id: 'princess', name: 'Princesses', buddy: 'Princess Twinkle', icon: '👸', draw: princess, defColor: 'pink',
    css: { '--bg1': '#f8bbd9', '--bg2': '#9575cd', '--primary': '#d81b60', '--accent': '#ffd54f', '--soft': '#fce4ec' },
    hello: "I'm Princess Twinkle! Let's go on a magical learning adventure!",
    praise: ['Royal job!', 'Magical!', 'Sparkle sparkle! That is right!', 'You shine like a jewel!', 'Wonderful, your highness!', 'Fairy-tale smart!', 'Twinkle twinkle, you got it!'],
    tryAgain: ["Let's try again, your highness!", 'A little more magic! Try again!', 'Princesses keep trying!'],
    counters: [['👑', 'crown', 'crowns'], ['💎', 'jewel', 'jewels'], ['🦄', 'unicorn', 'unicorns'], ['🏰', 'castle', 'castles'], ['🦋', 'butterfly', 'butterflies'], ['🌸', 'flower', 'flowers']],
    stickers: [['👑', 'crown'], ['💎', 'jewel'], ['🦄', 'unicorn'], ['🏰', 'castle'], ['🌸', 'flower'], ['🦋', 'butterfly'], ['🌈', 'rainbow'], ['✨', 'sparkles'], ['💖', 'heart'], ['🎀', 'bow'], ['🧚', 'fairy'], ['🌷', 'tulip'], ['🐎', 'horse'], ['🍰', 'cake'], ['🌙', 'moon'], ['⭐', 'star'], ['🐉', 'friendly dragon'], ['💍', 'ring'], ['🎠', 'carousel'], ['🌹', 'rose'], ['🦢', 'swan'], ['🐸', 'frog prince'], ['🍓', 'strawberry'], ['🫖', 'tea pot']],
    lessonWord: 'quest', sfx: 'sparkle',
  };

  KQ.themes = {
    list: ['hero', 'truck', 'race', 'princess'],
    get: (id) => T[id] || T.hero,
    PAINT, SKIN, HAIR, paintHex,
    FREE_COLORS: 4,
    /** SVG markup for a profile's buddy. */
    buddySVG(profile) {
      const t = T[profile.theme] || T.hero;
      return t.draw(profile.mascot || { color: t.defColor });
    },
    /** Apply colors + background scene for a theme. */
    apply(id) {
      const t = T[id] || T.hero;
      const root = document.documentElement;
      for (const [k, v] of Object.entries(t.css)) root.style.setProperty(k, v);
      root.style.setProperty('--scene', svgUrl(SCENES[t.id]));
      document.body.dataset.theme = t.id;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t.css['--bg2']);
    },
    /** Neutral look for screens shown before a player is chosen. */
    applyNeutral() {
      const root = document.documentElement;
      const css = { '--bg1': '#7e57c2', '--bg2': '#283593', '--primary': '#ff7043', '--accent': '#ffd54f', '--soft': '#ede7f6' };
      for (const [k, v] of Object.entries(css)) root.style.setProperty(k, v);
      root.style.setProperty('--scene', 'none');
      document.body.dataset.theme = 'neutral';
    },
  };
})();

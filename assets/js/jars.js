/* ==========================================================================
   Coin Jar - the English board engine
   Each team keeps a clear glass jar. Every correct answer drops one coin
   through the slot, and the coins settle row on row. The team that saves
   the most money wins.
   ========================================================================== */
(function (global) {
  'use strict';

  var C = {
    glass:   'rgba(214,234,242,.38)',
    glassHi: 'rgba(255,255,255,.9)',
    rim:     '#BFD3DC',
    rimDeep: '#9BB4C0',
    shade:   'rgba(42,63,77,.13)',
    cream:   '#FFF8EC',
    ink:     '#2A3F4D'
  };

  /* فضّة ٥٠ بيسة، وبينها قطع ذهبيّة تكسر الرتابة */
  var SILVER = { face: '#D2D9DE', edge: '#A9B3BA', deep: '#8C98A1' };
  var GOLD   = { face: '#EBCE78', edge: '#C9A227', deep: '#A8841A' };

  var VIEWBOX = '0 0 240 170';
  var CX = 120;
  var JAR = { top: 46, bottom: 152, left: 76, right: 164 };   /* داخل الزجاج */
  var SLOTS = [0, -17, 17, -33, 33];        /* تملأ من الوسط إلى الطرفين */
  var ROW_H = 7.6;                          /* ارتفاع الصفّ: القطع تتراكب */
  var MAX_ROWS = 13;
  var MAX_VISIBLE = SLOTS.length * MAX_ROWS;

  function f(n) { return Math.round(n * 100) / 100; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* =============================== الحصّالة =============================== */

  function jarBody(p) {
    var L = JAR.left, R = JAR.right, T = JAR.top, B = JAR.bottom;
    var body = 'M' + L + ' ' + (T + 6) +
      ' C' + (L - 3) + ' ' + (B - 26) + ' ' + (L + 1) + ' ' + B + ' ' + (L + 16) + ' ' + B +
      ' H' + (R - 16) +
      ' C' + (R - 1) + ' ' + B + ' ' + (R + 3) + ' ' + (B - 26) + ' ' + R + ' ' + (T + 6) +
      ' Z';
    return '<ellipse cx="' + CX + '" cy="' + (B + 7) + '" rx="54" ry="8" fill="' + C.shade + '"/>' +
      '<path d="' + body + '" fill="' + C.glass + '" stroke="' + C.rim + '" stroke-width="2.6"/>' +
      /* العنق والغطاء */
      '<path d="M' + (CX - 30) + ' ' + (T + 8) + ' q0 -14 4 -18 h52 q4 4 4 18" fill="' + C.glass +
        '" stroke="' + C.rim + '" stroke-width="2.4"/>' +
      '<rect x="' + (CX - 36) + '" y="' + (T - 20) + '" width="72" height="13" rx="5" fill="' + p.lid +
        '" stroke="' + C.cream + '" stroke-width="2.2"/>' +
      '<rect x="' + (CX - 32) + '" y="' + (T - 17) + '" width="64" height="3.4" rx="1.7" fill="#FFFFFF" opacity=".35"/>' +
      '<rect x="' + (CX - 13) + '" y="' + (T - 15) + '" width="26" height="4.6" rx="2.3" fill="' + p.slot + '"/>' +
      /* لمعة الزجاج */
      '<path d="M' + (L + 11) + ' ' + (T + 18) + ' q-4 42 2 70" fill="none" stroke="' + C.glassHi +
        '" stroke-width="5" stroke-linecap="round" opacity=".75"/>' +
      '<path d="M' + (R - 13) + ' ' + (T + 30) + ' q4 30 0 48" fill="none" stroke="' + C.glassHi +
        '" stroke-width="3" stroke-linecap="round" opacity=".45"/>';
  }

  /* الملصق على الزجاج يحمل لون المجموعة */
  function label(p) {
    return '<g>' +
      '<rect x="' + (CX - 27) + '" y="' + (JAR.top + 14) + '" width="54" height="17" rx="5" fill="' + p.lid +
        '" opacity=".92" stroke="' + C.cream + '" stroke-width="1.8"/>' +
      '<rect x="' + (CX - 20) + '" y="' + (JAR.top + 19) + '" width="40" height="2.6" rx="1.3" fill="' + C.cream + '" opacity=".8"/>' +
      '<rect x="' + (CX - 14) + '" y="' + (JAR.top + 24) + '" width="28" height="2.2" rx="1.1" fill="' + C.cream + '" opacity=".6"/>' +
      '</g>';
  }

  /* بريق يظهر كلّما امتلأت الحصّالة أكثر */
  function sparkles() {
    function s(x, y, r, cls) {
      return '<g class="lf ' + cls + '" style="transform-origin:' + x + 'px ' + y + 'px">' +
        '<path d="M' + x + ' ' + (y - r) + ' L' + (x + r * 0.34) + ' ' + (y - r * 0.34) +
        ' L' + (x + r) + ' ' + y + ' L' + (x + r * 0.34) + ' ' + (y + r * 0.34) +
        ' L' + x + ' ' + (y + r) + ' L' + (x - r * 0.34) + ' ' + (y + r * 0.34) +
        ' L' + (x - r) + ' ' + y + ' L' + (x - r * 0.34) + ' ' + (y - r * 0.34) + ' Z" fill="#F0C23C"/></g>';
    }
    return s(188, 62, 7, 's1') + s(52, 86, 5.5, 's2') + s(196, 110, 6, 's3');
  }

  function build(p) {
    return jarBody(p) + label(p) + sparkles();
  }

  /* ================================ القطع ================================ */
  function coin(v) {
    var k = v && v.g ? GOLD : SILVER;
    return '<ellipse cx="0" cy="0" rx="9" ry="8.4" fill="' + k.edge + '"/>' +
      '<ellipse cx="0" cy="-0.7" rx="8" ry="7.4" fill="' + k.face + '"/>' +
      '<ellipse cx="0" cy="-0.7" rx="5" ry="4.6" fill="none" stroke="' + k.deep + '" stroke-width="1"/>' +
      '<path d="M-2.3 -0.7 h4.6" stroke="' + k.deep + '" stroke-width="1.3" stroke-linecap="round"/>' +
      '<ellipse cx="-2.6" cy="-3.2" rx="2.6" ry="1.5" fill="#FFFFFF" opacity=".5"/>';
  }

  /* ============================ مواضع التراكم ============================= */
  function buildPositions(p) {
    var out = [], rnd = mulberry32(p.seed * 17 + 5), row, i, odd;
    for (row = 0; row < MAX_ROWS; row++) {
      odd = row % 2;
      for (i = 0; i < SLOTS.length; i++) {
        if (odd && i === SLOTS.length - 1) continue;         /* صفّ مزاح فيه قطعة أقل */
        /* الصفّ المزاح يميل إلى اليسار قليلًا ليبدو التراكم طبيعيًّا */
        out.push({
          x: CX + SLOTS[i] + (odd ? 8 : 0) + (rnd() * 2 - 1) * 1.6,
          y: JAR.bottom - 9 - row * ROW_H + (rnd() * 2 - 1) * 0.9,
          rot: (rnd() * 2 - 1) * 16,
          g: rnd() < 0.22
        });
      }
    }
    return out;
  }

  /* ============================ حالة وحسابات ============================= */
  var THRESHOLDS = [0, 6, 16, 30];
  function stageOf(count) {
    var s = 0, i;
    for (i = 0; i < THRESHOLDS.length; i++) if (count > THRESHOLDS[i]) s = i;
    return Math.min(s, 3);
  }
  function scaleOf() { return 1; }
  function fruitSize(count) {
    if (count <= 40) return 1;
    if (count <= 55) return 0.92;
    return 0.84;
  }

  function unitFor(id, n) { return n === 1 ? byId[id].fruit : byId[id].few; }
  function dualOf(w) { return w + 's'; }
  function countLabel(id, n) {
    if (n === 0) return 'no coins yet';
    return n + ' ' + unitFor(id, n);
  }

  function fruitMarkup(id, index, size) {
    var p = byId[id];
    var q = p.positions[index % MAX_VISIBLE];
    var s = size == null ? 1 : size;
    return '<g class="fruit" data-i="' + index + '" transform="translate(' + f(q.x) + ',' + f(q.y) +
      ') rotate(' + f(q.rot) + ') scale(' + f(s) + ')">' + coin(q) + '</g>';
  }

  var STAGE_CSS =
    '.tree-body .lf{transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}' +
    '.tree-body[data-stage="0"] .s1,.tree-body[data-stage="0"] .s2,.tree-body[data-stage="0"] .s3,' +
    '.tree-body[data-stage="1"] .s2,.tree-body[data-stage="1"] .s3,' +
    '.tree-body[data-stage="2"] .s3{opacity:0;transform:scale(.2)}' +
    '@keyframes jarTwinkle{50%{opacity:.45;transform:scale(.82) rotate(18deg)}}' +
    '.tree-body .lf{animation:jarTwinkle 3.6s ease-in-out infinite}' +
    '.tree-body .s2{animation-delay:.7s}.tree-body .s3{animation-delay:1.4s}';

  /* ============================= الحصّالات الستّ ========================== */
  var LIST = [
    { id: 'ruby',   name: 'Ruby Jar',   lid: '#E36559', slot: '#A8392F', seed: 11 },
    { id: 'ocean',  name: 'Ocean Jar',  lid: '#2E7596', slot: '#1A4A61', seed: 23 },
    { id: 'forest', name: 'Forest Jar', lid: '#6BA368', slot: '#45703F', seed: 37 },
    { id: 'amber',  name: 'Amber Jar',  lid: '#F0B64B', slot: '#B5801D', seed: 53 },
    { id: 'violet', name: 'Violet Jar', lid: '#B06FA8', slot: '#7E4A77', seed: 71 },
    { id: 'coral',  name: 'Coral Jar',  lid: '#E8956B', slot: '#B4653D', seed: 89 }
  ];

  LIST.forEach(function (p) {
    p.fruit = 'coin'; p.few = 'coins'; p.many = 'coins'; p.dual = 'coins';
    p.emoji = '🪙'; p.tone = p.lid; p.shape = 'coin';
  });

  var byId = {};
  LIST.forEach(function (p) {
    p.body_svg = build(p);
    p.positions = buildPositions(p);
    byId[p.id] = p;
  });

  function treeSvg(id, count) {
    var p = byId[id];
    var n = Math.max(0, count | 0);
    var size = fruitSize(n), coins = [], i;
    for (i = 0; i < n; i++) coins.push(fruitMarkup(id, i, size));
    return '<g class="tree-body" data-stage="' + stageOf(n) + '" data-fruit="' + (n ? 1 : 0) + '">' +
      p.body_svg + '<g class="fruit-layer">' + coins.join('') + '</g></g>';
  }

  function defs() { return ''; }

  function standalone(id, count) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '" width="240" height="170">' +
      '<style>' + STAGE_CSS + '</style>' + treeSvg(id, count) + '</svg>';
  }

  var API = {
    LIST: LIST, byId: byId, COLORS: C, VIEWBOX: VIEWBOX,
    CHIP_VIEWBOX: '-10 -10 20 20',
    treeSvg: treeSvg, standalone: standalone, defs: defs, STAGE_CSS: STAGE_CSS,
    fruitMarkup: fruitMarkup, fruitSize: fruitSize,
    stageOf: stageOf, scaleOf: scaleOf,
    unitFor: unitFor, countLabel: countLabel, dualOf: dualOf,
    fruitShape: function () { return coin({ g: false }); }
  };

  global.ItemSets = global.ItemSets || {};
  global.ItemSets.jars = API;
})(window);

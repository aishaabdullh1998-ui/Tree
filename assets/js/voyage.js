/* ==========================================================================
   Treasure Voyage - the English board engine
   Each team sails a ship along a dotted route. Every correct answer drops a
   coin on the route and moves the ship one station forward. Ten coins reach
   the island, a flag is planted there, and a fresh leg of the voyage begins.
   ========================================================================== */
(function (global) {
  'use strict';

  var C = {
    sky:     '#DCEEF7',
    sea:     '#9CC6D8',
    seaDeep: '#7FB0C6',
    sand:    '#E8D49B',
    sandDp:  '#C7AE74',
    wood:    '#9C5B3C',
    woodDp:  '#7B4630',
    rope:    '#B08A52',
    gold:    '#F0C23C',
    goldDp:  '#D9A227',
    cream:   '#FFF8EC',
    ink:     '#2A3F4D',
    cloud:   '#FFFFFF'
  };

  var VIEWBOX = '0 0 240 170';
  var SEA_Y = 78;                  /* سطح البحر */
  var STEPS = 10;                  /* محطّات الرحلة قبل الوصول إلى الجزيرة */
  var X0 = 26, X1 = 188;           /* أول محطّة وآخرها */
  var ISLAND_X = 212;

  function f(n) { return Math.round(n * 100) / 100; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* موضع المحطّة رقم i على خطّ الرحلة */
  function station(i) {
    return { x: X0 + i * ((X1 - X0) / (STEPS - 1)), y: 114 + Math.sin(i * 0.78) * 6 };
  }

  function routePath() {
    var d = 'M' + f(station(0).x - 8) + ' ' + f(station(0).y), i, p;
    for (i = 1; i < STEPS; i++) {
      p = station(i);
      d += ' L' + f(p.x) + ' ' + f(p.y);
    }
    return d + ' L' + (ISLAND_X - 10) + ' ' + f(station(STEPS - 1).y - 4);
  }

  /* ============================== رسم الخلفية ============================= */

  function clouds(seed) {
    var rnd = mulberry32(seed), out = [], i, x, y, s;
    for (i = 0; i < 3; i++) {
      x = 24 + rnd() * 180; y = 18 + rnd() * 34; s = 0.7 + rnd() * 0.6;
      out.push('<g transform="translate(' + f(x) + ',' + f(y) + ') scale(' + f(s) + ')" opacity=".9">' +
        '<ellipse cx="0" cy="0" rx="22" ry="9" fill="' + C.cloud + '"/>' +
        '<ellipse cx="12" cy="-5" rx="14" ry="8" fill="' + C.cloud + '"/>' +
        '<ellipse cx="-11" cy="-3" rx="11" ry="6.5" fill="' + C.cloud + '"/></g>');
    }
    return out.join('');
  }

  function waves() {
    var out = [], rows = [[92, 0], [142, 26], [160, 12]], i, y, off;
    for (i = 0; i < rows.length; i++) {
      y = rows[i][0]; off = rows[i][1];
      out.push('<path d="M' + (-10 + off) + ' ' + y + ' q9 -5 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" ' +
        'fill="none" stroke="' + C.seaDeep + '" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>');
    }
    return out.join('');
  }

  function island() {
    return '<g>' +
      '<ellipse cx="' + ISLAND_X + '" cy="' + (SEA_Y + 26) + '" rx="30" ry="7" fill="' + C.sandDp + '" opacity=".45"/>' +
      '<path d="M' + (ISLAND_X - 28) + ' ' + (SEA_Y + 26) + ' q10 -22 28 -22 q18 0 28 22 z" fill="' + C.sand +
        '" stroke="' + C.cream + '" stroke-width="2"/>' +
      '<path d="M' + ISLAND_X + ' ' + (SEA_Y + 4) + ' c-10 -5 -21 -4 -27 0 c6 -8 19 -10 27 -4 z" fill="#6BA368"/>' +
      '<path d="M' + ISLAND_X + ' ' + (SEA_Y + 4) + ' c10 -5 21 -4 27 0 c-6 -8 -19 -10 -27 -4 z" fill="#55905B"/>' +
      '<path d="M' + ISLAND_X + ' ' + (SEA_Y + 2) + ' c-3 -9 -1 -16 2 -20 c3 5 3 13 1 20 z" fill="#8CBE86"/>' +
      '<rect x="' + (ISLAND_X - 2) + '" y="' + (SEA_Y + 3) + '" width="4" height="22" rx="2" fill="' + C.wood + '"/>' +
      '</g>';
  }

  /* زينة تظهر كلّما بلغت الرحلة جزيرة جديدة */
  function decor() {
    return '<g class="lf s1" style="transform-origin:62px 142px">' +
        '<path d="M52 148 q10 -20 22 -4 q-12 -4 -22 4 z" fill="#5E93A8" stroke="' + C.cream + '" stroke-width="1.6"/>' +
        '<circle cx="70" cy="140" r="1.6" fill="' + C.ink + '"/>' +
      '</g>' +
      '<g class="lf s2" style="transform-origin:18px 100px">' +
        '<path d="M10 100 h16 l-3 -28 h-10 z" fill="' + C.cream + '" stroke="' + C.sandDp + '" stroke-width="1.6"/>' +
        '<rect x="12" y="80" width="12" height="5" fill="#E36559"/>' +
        '<rect x="13.5" y="63" width="9" height="9" rx="2" fill="' + C.gold + '" stroke="' + C.ink + '" stroke-width="1.2"/>' +
      '</g>' +
      '<g class="lf s3" style="transform-origin:150px 150px">' +
        '<path d="M138 158 q12 -12 26 -2 q-6 6 -26 2 z" fill="#6E9FB5" stroke="' + C.cream + '" stroke-width="1.6"/>' +
        '<path d="M156 150 q2 -10 8 -12 q-3 7 -2 12 z" fill="' + C.cream + '" opacity=".85"/>' +
      '</g>';
  }

  function build(p) {
    var dots = [], i, s;
    for (i = 0; i < STEPS; i++) {
      s = station(i);
      dots.push('<circle cx="' + f(s.x) + '" cy="' + f(s.y) + '" r="2" fill="' + C.cream + '" opacity=".75"/>');
    }
    return '<rect x="0" y="0" width="240" height="' + SEA_Y + '" fill="' + C.sky + '"/>' +
      '<circle cx="36" cy="26" r="15" fill="#F7D583"/>' +
      clouds(p.seed) +
      '<rect x="0" y="' + SEA_Y + '" width="240" height="' + (170 - SEA_Y) + '" fill="' + C.sea + '"/>' +
      waves() +
      island() +
      '<path d="' + routePath() + '" fill="none" stroke="' + C.rope +
        '" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round" opacity=".85"/>' +
      dots.join('') +
      decor();
  }

  /* =============================== القطع ================================= */

  function coin() {
    return '<circle cx="0" cy="0" r="6.4" fill="' + C.gold + '" stroke="' + C.cream + '" stroke-width="1.6"/>' +
      '<circle cx="0" cy="0" r="3.4" fill="none" stroke="' + C.goldDp + '" stroke-width="1.4"/>' +
      '<path d="M0 -2.4 v4.8" stroke="' + C.goldDp + '" stroke-width="1.4" stroke-linecap="round"/>' +
      '<circle cx="-2" cy="-2.4" r="1.4" fill="' + C.cream + '" opacity=".9"/>';
  }

  function ship(p) {
    return '<g class="ship">' +
      '<path d="M-13 4 h26 l-5 9 h-16 z" fill="' + C.wood + '" stroke="' + C.cream + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<rect x="-1" y="-20" width="2.4" height="24" rx="1" fill="' + C.woodDp + '"/>' +
      '<path d="M1.4 -19 l12 15 h-12 z" fill="' + C.cream + '" stroke="' + C.sandDp + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M-1 -15 l-11 11 h11 z" fill="' + p.sail + '" stroke="' + C.cream + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M1.4 -20 v-5 l8 2.5 z" fill="' + p.sail + '"/>' +
      '</g>';
  }

  function flag(i) {
    var x = ISLAND_X - 15 + (i % 4) * 10, y = SEA_Y + 24 - Math.floor(i / 4) * 11;
    return '<g class="flag">' +
      '<rect x="' + f(x) + '" y="' + f(y - 18) + '" width="2.4" height="18" rx="1.2" fill="' + C.woodDp + '"/>' +
      '<path d="M' + f(x + 2.4) + ' ' + f(y - 18) + ' l10 3.6 l-10 3.6 z" fill="' + C.gold +
      '" stroke="' + C.cream + '" stroke-width="1.2" stroke-linejoin="round"/></g>';
  }

  /* ============================= حالة وحسابات ============================= */
  function stageOf(count) { return Math.min(3, Math.floor(count / STEPS)); }
  function scaleOf() { return 1; }
  function fruitSize() { return 1; }

  function unitFor(id, n) { return n === 1 ? byId[id].fruit : byId[id].few; }
  function dualOf(w) { return w + 's'; }
  function countLabel(id, n) {
    if (n === 0) return 'no coins yet';
    return n + ' ' + unitFor(id, n);
  }

  /* قطعة واحدة في موضعها - تُستعمل حين لا يدعم المضيف رسم الطبقة كاملة */
  function fruitMarkup(id, index) {
    var s = station(index % STEPS);
    return '<g class="fruit" data-i="' + index + '" transform="translate(' + f(s.x) + ',' + f(s.y - 15) + ')">' +
      coin() + '</g>';
  }

  /* طبقة الرحلة كاملة: القطع على الطريق، والسفينة في محطّتها، وأعلام الجزر */
  function layerMarkup(id, count) {
    var p = byId[id];
    var n = Math.max(0, count | 0);
    var laps = Math.floor(n / STEPS);
    var pos = n - laps * STEPS;
    var out = [], i, s;
    for (i = 0; i < laps && i < 8; i++) out.push(flag(i));
    for (i = 0; i < pos; i++) {
      s = station(i);
      out.push('<g class="fruit" data-i="' + i + '" transform="translate(' + f(s.x) + ',' + f(s.y - 15) + ')">' +
        coin() + '</g>');
    }
    s = station(pos % STEPS);
    out.push('<g class="ship-wrap" transform="translate(' + f(s.x) + ',' + f(s.y - 6) + ')">' + ship(p) + '</g>');
    return out.join('');
  }

  var STAGE_CSS =
    '.tree-body .lf{transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}' +
    '.tree-body[data-stage="0"] .s1,.tree-body[data-stage="0"] .s2,.tree-body[data-stage="0"] .s3,' +
    '.tree-body[data-stage="1"] .s2,.tree-body[data-stage="1"] .s3,' +
    '.tree-body[data-stage="2"] .s3{opacity:0;transform:scale(.2)}' +
    '.tree-body .ship-wrap{transition:transform .5s cubic-bezier(.3,1.2,.5,1)}' +
    '@keyframes shipBob{50%{transform:translateY(-2.4px) rotate(-2deg)}}' +
    '.tree-body .ship{animation:shipBob 3.4s ease-in-out infinite}' +
    '.tree-body .flag{animation:none}';

  /* =============================== السفن الستّ ============================ */
  var LIST = [
    { id: 'dolphin', name: 'The Dolphin', sail: '#E36559', seed: 11 },
    { id: 'falcon',  name: 'The Falcon',  sail: '#2E7596', seed: 23 },
    { id: 'pearl',   name: 'The Pearl',   sail: '#94BEBB', seed: 37 },
    { id: 'compass', name: 'The Compass', sail: '#F0B64B', seed: 53 },
    { id: 'anchor',  name: 'The Anchor',  sail: '#6BA368', seed: 71 },
    { id: 'comet',   name: 'The Comet',   sail: '#B06FA8', seed: 89 }
  ];

  LIST.forEach(function (p) {
    p.fruit = 'coin'; p.few = 'coins'; p.many = 'coins'; p.dual = 'coins';
    p.emoji = '⛵'; p.tone = p.sail; p.shape = 'coin';
  });

  var byId = {};
  LIST.forEach(function (p) { p.body_svg = build(p); byId[p.id] = p; });

  function treeSvg(id, count) {
    var p = byId[id];
    var n = Math.max(0, count | 0);
    return '<g class="tree-body" data-stage="' + stageOf(n) + '" data-fruit="' + (n ? 1 : 0) + '">' +
      p.body_svg + '<g class="fruit-layer">' + layerMarkup(id, n) + '</g></g>';
  }

  function defs() { return ''; }

  function standalone(id, count) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '" width="240" height="170">' +
      '<style>' + STAGE_CSS + '</style>' + treeSvg(id, count) + '</svg>';
  }

  var API = {
    LIST: LIST, byId: byId, COLORS: C, VIEWBOX: VIEWBOX,
    CHIP_VIEWBOX: '-9 -9 18 18',
    treeSvg: treeSvg, standalone: standalone, defs: defs, STAGE_CSS: STAGE_CSS,
    fruitMarkup: fruitMarkup, layerMarkup: layerMarkup, fruitSize: fruitSize,
    stageOf: stageOf, scaleOf: scaleOf,
    unitFor: unitFor, countLabel: countLabel, dualOf: dualOf,
    fruitShape: function () { return coin(); }
  };

  global.ItemSets = global.ItemSets || {};
  global.ItemSets.voyage = API;
})(window);

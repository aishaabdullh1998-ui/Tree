/* ==========================================================================
   مجرّة الأرقام - محرك رسم الكواكب ونجومها
   كل مجموعة كوكب، وكل إجابة صحيحة تضيف نجمة إلى مداره.
   ========================================================================== */
(function (global) {
  'use strict';

  var C = {
    space:     '#E9F0F2',
    spaceDeep: '#D7E4E8',
    orbit:     '#AFC6CF',
    orbitDim:  '#C7D8DF',
    star:      '#F4D892',
    starDeep:  '#DCBB64',
    starEdge:  '#F7FAFB',
    moon:      '#C3D4DA',
    moonDark:  '#9FB6BF',
    ink:       '#1E3A48',
    glow:      'rgba(148,190,187,.30)'
  };

  var CX = 100, CY = 100;
  var VIEWBOX = '0 38 200 124';   /* إطار عريض يملأ البطاقة */
  var RINGS = [
    { rx: 50, ry: 17, n: 8  },
    { rx: 66, ry: 23, n: 10 },
    { rx: 82, ry: 28, n: 12 },
    { rx: 95, ry: 33, n: 14 }
  ];

  function f(n) { return Math.round(n * 100) / 100; }
  function rad(d) { return d * Math.PI / 180; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* نقطة على مدار مائل */
  function orbitPoint(rx, ry, tilt, deg) {
    var a = rad(deg), t = rad(tilt);
    var x = rx * Math.cos(a), y = ry * Math.sin(a);
    return { x: CX + x * Math.cos(t) - y * Math.sin(t),
             y: CY + x * Math.sin(t) + y * Math.cos(t) };
  }

  function orbitEllipse(r, tilt, stage, dim) {
    return '<ellipse class="orbit lf s' + stage + '" cx="' + CX + '" cy="' + CY +
      '" rx="' + r.rx + '" ry="' + r.ry + '" fill="none" stroke="' + (dim ? C.orbitDim : C.orbit) +
      '" stroke-width="1.6" stroke-dasharray="5 6" stroke-linecap="round"' +
      ' transform="rotate(' + tilt + ')"' +
      ' style="transform-origin:' + CX + 'px ' + CY + 'px"/>';
  }

  /* ============================= رسم الكواكب ============================= */

  function craters(seed, r, dark) {
    var rnd = mulberry32(seed), out = [], i;
    for (i = 0; i < 4; i++) {
      var a = rnd() * Math.PI * 2, d = (0.25 + rnd() * 0.5) * r;
      out.push('<circle cx="' + f(CX + Math.cos(a) * d) + '" cy="' + f(CY + Math.sin(a) * d) +
        '" r="' + f(2.2 + rnd() * 3) + '" fill="' + dark + '" opacity=".5"/>');
    }
    return out.join('');
  }

  function shade(r, dark) {
    return '<path d="M' + (CX + r) + ' ' + CY + ' a' + r + ' ' + r + ' 0 0 1 ' + (-2 * r) + ' 0 a' + r + ' ' + r +
      ' 0 0 0 ' + (2 * r) + ' 0 Z" fill="' + dark + '" opacity=".22"/>' +
      '<circle cx="' + f(CX - r * 0.34) + '" cy="' + f(CY - r * 0.36) + '" r="' + f(r * 0.3) +
      '" fill="#FFFFFF" opacity=".22"/>';
  }

  function bands(r, dark, rows) {
    var out = [], i, y, w;
    for (i = 0; i < rows; i++) {
      y = CY - r * 0.55 + (i * r * 1.1) / (rows - 1 || 1);
      w = Math.sqrt(Math.max(0, r * r - (y - CY) * (y - CY)));
      out.push('<rect x="' + f(CX - w) + '" y="' + f(y - r * 0.09) + '" width="' + f(w * 2) +
        '" height="' + f(r * 0.18) + '" rx="' + f(r * 0.09) + '" fill="' + dark + '" opacity=".38"/>');
    }
    return out.join('');
  }

  function planetBody(p, r) {
    var clip = 'pc' + p.id;
    var inner = '';
    if (p.feature === 'craters') inner = craters(p.seed, r, p.dark);
    else if (p.feature === 'bands') inner = bands(r, p.dark, 4) +
      '<ellipse cx="' + f(CX + r * 0.3) + '" cy="' + f(CY + r * 0.2) + '" rx="' + f(r * 0.24) +
      '" ry="' + f(r * 0.15) + '" fill="' + p.dark + '" opacity=".6"/>';
    else if (p.feature === 'cap') inner =
      '<path d="M' + f(CX - r * 0.52) + ' ' + f(CY - r * 0.72) + ' a' + f(r * 0.62) + ' ' + f(r * 0.62) +
      ' 0 0 1 ' + f(r * 1.04) + ' 0 Z" fill="#F2F7F8" opacity=".75"/>' + craters(p.seed, r * 0.8, p.dark);
    else if (p.feature === 'swirl') inner =
      '<path d="M' + f(CX - r * 0.8) + ' ' + f(CY - r * 0.25) + ' q' + f(r * 0.8) + ' ' + f(-r * 0.3) + ' ' + f(r * 1.6) + ' 0" ' +
        'fill="none" stroke="' + p.dark + '" stroke-width="' + f(r * 0.14) + '" stroke-linecap="round" opacity=".5"/>' +
      '<path d="M' + f(CX - r * 0.72) + ' ' + f(CY + r * 0.3) + ' q' + f(r * 0.72) + ' ' + f(r * 0.3) + ' ' + f(r * 1.44) + ' 0" ' +
        'fill="none" stroke="' + p.dark + '" stroke-width="' + f(r * 0.12) + '" stroke-linecap="round" opacity=".45"/>';
    else inner = bands(r, p.dark, 3);

    return '<clipPath id="' + clip + '"><circle cx="' + CX + '" cy="' + CY + '" r="' + f(r) + '"/></clipPath>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + f(r) + '" fill="' + p.body + '"/>' +
      '<g clip-path="url(#' + clip + ')">' + inner + shade(r, p.dark) + '</g>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + f(r) + '" fill="none" stroke="' + C.starEdge + '" stroke-width="1.6" opacity=".7"/>';
  }

  function planetRing(p, r) {
    if (!p.ring) return '';
    return '<g transform="rotate(-18 ' + CX + ' ' + CY + ')">' +
      '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + f(r * 1.85) + '" ry="' + f(r * 0.55) +
        '" fill="none" stroke="' + p.ring + '" stroke-width="' + f(r * 0.3) + '" opacity=".9"/>' +
      '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + f(r * 1.85) + '" ry="' + f(r * 0.55) +
        '" fill="none" stroke="' + C.starEdge + '" stroke-width="1.2" opacity=".55"/></g>';
  }

  function moonAt(deg, dist, r, stage) {
    var p = orbitPoint(dist, dist * 0.34, -14, deg);
    return '<g class="lf s' + stage + '" style="transform-origin:' + f(p.x) + 'px ' + f(p.y) + 'px">' +
      '<circle cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="' + r + '" fill="' + C.moon + '"/>' +
      '<circle cx="' + f(p.x - r * 0.3) + '" cy="' + f(p.y + r * 0.25) + '" r="' + f(r * 0.3) +
      '" fill="' + C.moonDark + '" opacity=".6"/></g>';
  }

  function build(p) {
    var r = 27, o = [];
    o.push('<ellipse class="lf s3" cx="' + CX + '" cy="' + CY + '" rx="104" ry="46" fill="none" stroke="' + C.glow +
      '" stroke-width="7" stroke-dasharray="2 9" stroke-linecap="round" transform="rotate(' + p.tilt + ')"' +
      ' style="transform-origin:' + CX + 'px ' + CY + 'px"/>');
    o.push(orbitEllipse(RINGS[0], p.tilt, 0));
    o.push(orbitEllipse(RINGS[1], p.tilt, 1));
    o.push(orbitEllipse(RINGS[2], p.tilt, 2, true));
    o.push(orbitEllipse(RINGS[3], p.tilt, 3, true));
    o.push(planetRing(p, r));
    o.push(planetBody(p, r));
    o.push(moonAt(p.tilt + 200, 44, 5.5, 2));
    o.push(moonAt(p.tilt + 40, 58, 4, 3));
    return o.join('');
  }

  /* ============================== رسم النجوم ============================= */
  function starShape() {
    var pts = [], i, a, rr;
    for (i = 0; i < 10; i++) {
      a = rad(-90 + i * 36);
      rr = i % 2 ? 3.4 : 8.2;
      pts.push(f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + C.star + '" stroke="' + C.starEdge +
      '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<polygon points="' + pts.slice(0, 4).join(' ') + '" fill="' + C.starDeep + '" opacity=".35"/>' +
      '<circle cx="-1.6" cy="-2" r="1.8" fill="#FFF6DC" opacity=".9"/>';
  }

  var FRUIT = { star: starShape };

  /* ========================== تعريف الكواكب الستّ ======================== */
  var LIST = [
    { id: 'utarid',  name: 'عُطارد',  body: '#92A8BA', dark: '#6F879B', tilt: -16, seed: 11, feature: 'craters' },
    { id: 'zuhra',   name: 'الزهرة',  body: '#F4D892', dark: '#DCBB64', tilt: -12, seed: 23, feature: 'swirl'   },
    { id: 'mirrikh', name: 'المرّيخ', body: '#E36559', dark: '#C04A3F', tilt: -22, seed: 37, feature: 'cap'     },
    { id: 'mushtari',name: 'المشتري', body: '#E89C73', dark: '#CE7B4E', tilt: -10, seed: 53, feature: 'bands'   },
    { id: 'zuhal',   name: 'زُحل',    body: '#2E7596', dark: '#1E5A77', tilt: -20, seed: 71, feature: 'bands', ring: '#BFD6DC' },
    { id: 'nabtun',  name: 'نبتون',   body: '#4D8FA8', dark: '#356F86', tilt: -14, seed: 89, feature: 'swirl'   }
  ];

  LIST.forEach(function (p) {
    p.fruit = 'نجمة'; p.few = 'نجوم'; p.many = 'نجمة';
    p.emoji = '🪐'; p.tone = p.body; p.shape = 'star';
  });

  /* مواضع النجوم: تملأ المدار الأول ثم الذي يليه، فتتمدّد المجرّة للخارج */
  var MAX_VISIBLE = 150;
  function buildPositions(p) {
    var out = [], rnd = mulberry32(p.seed * 7 + 3), ring, i, lap = 0;
    while (out.length < MAX_VISIBLE) {
      for (ring = 0; ring < RINGS.length && out.length < MAX_VISIBLE; ring++) {
        var R = RINGS[ring];
        for (i = 0; i < R.n && out.length < MAX_VISIBLE; i++) {
          var deg = (i / R.n) * 360 + (ring * 13) + lap * 9 + (rnd() * 2 - 1) * 5;
          var pull = 1 + lap * 0.045;
          var q = orbitPoint(R.rx * pull, R.ry * pull, p.tilt, deg);
          out.push({ x: q.x, y: q.y, rot: (rnd() * 2 - 1) * 26 });
        }
      }
      lap++;
      if (lap > 12) break;
    }
    return out;
  }

  var byId = {};
  LIST.forEach(function (p) {
    p.body_svg = build(p);
    p.positions = buildPositions(p);
    byId[p.id] = p;
  });

  /* ============================ حالة وحسابات ============================= */
  var THRESHOLDS = [0, 3, 8, 16];
  function stageOf(count) {
    var s = 0, i;
    for (i = 0; i < THRESHOLDS.length; i++) if (count > THRESHOLDS[i]) s = i;
    return Math.min(s, 3);
  }
  function scaleOf(count) { return 0.82 + Math.min(count, 30) / 30 * 0.18; }
  function fruitSize(count) {
    if (count <= 24) return 1;
    if (count <= 45) return 0.85;
    if (count <= 80) return 0.72;
    return 0.6;
  }

  function unitFor(id, n) { var p = byId[id]; return (n >= 3 && n <= 10) ? p.few : p.many; }
  function dualOf(w) { return (w.slice(-1) === 'ة' ? w.slice(0, -1) : w) + 'تان'; }
  function countLabel(id, n) {
    var p = byId[id];
    if (n === 0) return 'لا توجد نجوم بعد';
    if (n === 1) return p.fruit + ' واحدة';
    if (n === 2) return dualOf(p.fruit);
    return n + ' ' + unitFor(id, n);
  }

  function fruitMarkup(id, index, size) {
    var p = byId[id];
    var q = p.positions[index % MAX_VISIBLE];
    var ring = Math.floor(index / MAX_VISIBLE);
    var s = size == null ? 1 : size;
    var ox = ring ? (ring % 2 ? 4 : -4) : 0;
    return '<g class="fruit" data-i="' + index + '" transform="translate(' + f(q.x + ox) + ',' + f(q.y) +
      ') rotate(' + f(q.rot) + ') scale(' + f(s) + ')">' + FRUIT[p.shape]() + '</g>';
  }

  var STAGE_CSS =
    '.tree-body .lf{transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}' +
    '.tree-body[data-stage="0"] .s1,.tree-body[data-stage="0"] .s2,.tree-body[data-stage="0"] .s3,' +
    '.tree-body[data-stage="1"] .s2,.tree-body[data-stage="1"] .s3,' +
    '.tree-body[data-stage="2"] .s3{opacity:0;transform:scale(.15)}';

  function treeSvg(id, count, opts) {
    var p = byId[id];
    var n = Math.max(0, count | 0);
    var size = fruitSize(n), fruits = [], i;
    for (i = 0; i < n; i++) fruits.push(fruitMarkup(id, i, size));
    return '<g class="tree-body" data-stage="' + stageOf(n) + '" data-fruit="' + (n ? 1 : 0) + '">' +
      p.body_svg + '<g class="fruit-layer">' + fruits.join('') + '</g></g>';
  }

  function defs() { return ''; }

  function standalone(id, count, opts) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '" width="200" height="124">' +
      '<style>' + STAGE_CSS + '</style>' +
      '<g transform="translate(' + CX + ',' + CY + ') scale(' + f(scaleOf(count)) + ') translate(' + (-CX) + ',' + (-CY) + ')">' +
      treeSvg(id, count, opts) + '</g></svg>';
  }

  var API = {
    LIST: LIST, byId: byId, COLORS: C, VIEWBOX: VIEWBOX,
    treeSvg: treeSvg, standalone: standalone, defs: defs, STAGE_CSS: STAGE_CSS,
    fruitMarkup: fruitMarkup, fruitSize: fruitSize,
    stageOf: stageOf, scaleOf: scaleOf,
    unitFor: unitFor, countLabel: countLabel, dualOf: dualOf,
    fruitShape: function (id) { return FRUIT[byId[id].shape](); }
  };

  global.ItemSets = global.ItemSets || {};
  global.ItemSets.planets = API;
})(window);

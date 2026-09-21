/* ==========================================================================
   بستان المجموعات - محرك رسم الأشجار العمانية
   يرسم كل شجرة بأسلوب الطباعة اليدوية (Linocut) بالألوان الكريمية الهادئة
   ========================================================================== */
(function (global) {
  'use strict';

  /* ----------------------------- لوحة الألوان ----------------------------- */
  var C = {
    cream:      '#FAF4D8',
    creamDeep:  '#F1E6BE',
    leaf:       '#4F7C33',
    leafDark:   '#3B6026',
    leafLight:  '#6E9A46',
    leafPale:   '#89AE5B',
    bark:       '#C6AA82',
    barkDark:   '#A98A61',
    barkLight:  '#DCC69F',
    yellow:     '#EFCE4B',
    yellowDeep: '#DFB52E',
    red:        '#D9482F',
    redDeep:    '#B63A22',
    orange:     '#EE9A3C',
    lime:       '#A9BE47',
    limeDeep:   '#8CA337',
    coco:       '#B08A5E',
    cocoDark:   '#8E6B45',
    shadow:     'rgba(93,110,60,.13)'
  };

  /* ------------------------------ أدوات رياضية ---------------------------- */
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

  function bez(p0, p1, p2, t) {
    var u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  }
  function bezT(p0, p1, p2, t) {
    var u = 1 - t;
    return { x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
             y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y) };
  }

  /* ورقة رفيعة مدببة (سعفة صغيرة) من نقطة إلى نقطة */
  function sliver(ax, ay, bx, by, w, bend) {
    var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    bend = bend || 0;
    var mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
    return 'M' + f(ax + nx * w / 2) + ' ' + f(ay + ny * w / 2) +
           ' Q' + f(mx + nx * w * 0.6) + ' ' + f(my + ny * w * 0.6) + ' ' + f(bx) + ' ' + f(by) +
           ' Q' + f(mx - nx * w * 0.45) + ' ' + f(my - ny * w * 0.45) + ' ' + f(ax - nx * w / 2) + ' ' + f(ay - ny * w / 2) + ' Z';
  }

  var uid = 0;
  function nextId(p) { uid += 1; return p + uid; }

  /* --------------------------- سعفة نخيل مريّشة --------------------------- */
  function palmFrond(x, y, angDeg, len, opt) {
    opt = opt || {};
    var stage = opt.stage || 0;
    var color = opt.color || C.leaf;
    var rib = opt.rib || C.leafDark;
    var droop = opt.droop == null ? 0.40 : opt.droop;
    var arch = opt.arch == null ? 0.22 : opt.arch;
    var a = rad(angDeg);
    var p0 = { x: x, y: y };
    var p2 = { x: x + Math.cos(a) * len, y: y + Math.sin(a) * len + len * droop };
    var p1 = { x: x + Math.cos(a) * len * 0.52, y: y + Math.sin(a) * len * 0.52 - len * arch };

    var parts = [];
    /* العرق الأوسط */
    parts.push('<path d="M' + f(p0.x) + ' ' + f(p0.y) + ' Q' + f(p1.x) + ' ' + f(p1.y) + ' ' + f(p2.x) + ' ' + f(p2.y) +
      '" fill="none" stroke="' + rib + '" stroke-width="' + f(len * 0.042) + '" stroke-linecap="round"/>');

    /* الوريقات على الجانبين */
    var steps = opt.steps || 13;
    for (var i = 1; i <= steps; i++) {
      var t = 0.10 + (i / steps) * 0.86;
      var b = bez(p0, p1, p2, t);
      var d = bezT(p0, p1, p2, t);
      var L = Math.hypot(d.x, d.y) || 1;
      var tx = d.x / L, ty = d.y / L, nx = -ty, ny = tx;
      var env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.62);
      var ll = len * 0.34 * env;
      var th = rad(52);
      for (var s = -1; s <= 1; s += 2) {
        var dxr = tx * Math.cos(th) + nx * Math.sin(th) * s;
        var dyr = ty * Math.cos(th) + ny * Math.sin(th) * s;
        parts.push('<path d="' + sliver(b.x, b.y, b.x + dxr * ll, b.y + dyr * ll, len * 0.055, s * len * 0.028) +
          '" fill="' + color + '"/>');
      }
    }
    /* وريقة الطرف */
    parts.push('<path d="' + sliver(p2.x, p2.y, p2.x + Math.cos(a) * len * 0.14, p2.y + Math.sin(a) * len * 0.14 + len * 0.10, len * 0.05, 0) + '" fill="' + color + '"/>');

    return '<g class="lf s' + stage + '" style="transform-origin:' + f(x) + 'px ' + f(y) + 'px">' + parts.join('') + '</g>';
  }

  /* ------------------------ ورقة موز عريضة بعروق ------------------------- */
  function broadLeaf(x, y, angDeg, len, wid, opt) {
    opt = opt || {};
    var stage = opt.stage || 0;
    var color = opt.color || C.leaf;
    var vein = opt.vein || C.cream;
    var droop = opt.droop == null ? 0.30 : opt.droop;
    var arch = opt.arch == null ? 0.16 : opt.arch;
    var a = rad(angDeg);
    var p0 = { x: x, y: y };
    var p2 = { x: x + Math.cos(a) * len, y: y + Math.sin(a) * len + len * droop };
    var p1 = { x: x + Math.cos(a) * len * 0.5, y: y + Math.sin(a) * len * 0.5 - len * arch };

    var N = 26, left = [], right = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      var b = bez(p0, p1, p2, t);
      var d = bezT(p0, p1, p2, t);
      var L = Math.hypot(d.x, d.y) || 1;
      var nx = -d.y / L, ny = d.x / L;
      var w = wid * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.75);
      left.push([b.x + nx * w, b.y + ny * w]);
      right.push([b.x - nx * w, b.y - ny * w]);
    }
    var dPath = 'M' + f(left[0][0]) + ' ' + f(left[0][1]);
    for (var j = 1; j <= N; j++) dPath += ' L' + f(left[j][0]) + ' ' + f(left[j][1]);
    for (var k = N; k >= 0; k--) dPath += ' L' + f(right[k][0]) + ' ' + f(right[k][1]);
    dPath += ' Z';

    var cid = nextId('clip');
    var veins = [];
    var vc = opt.veins || 10;
    for (var v = 1; v < vc; v++) {
      var tv = v / vc;
      var bb = bez(p0, p1, p2, tv);
      var dd = bezT(p0, p1, p2, tv);
      var LL = Math.hypot(dd.x, dd.y) || 1;
      var ux = dd.x / LL, uy = dd.y / LL, nnx = -uy, nny = ux;
      var th2 = rad(58);
      for (var s2 = -1; s2 <= 1; s2 += 2) {
        var vx = ux * Math.cos(th2) + nnx * Math.sin(th2) * s2;
        var vy = uy * Math.cos(th2) + nny * Math.sin(th2) * s2;
        veins.push('<line x1="' + f(bb.x) + '" y1="' + f(bb.y) + '" x2="' + f(bb.x + vx * wid * 2.4) +
          '" y2="' + f(bb.y + vy * wid * 2.4) + '" stroke="' + vein + '" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>');
      }
    }

    return '<g class="lf s' + stage + '" style="transform-origin:' + f(x) + 'px ' + f(y) + 'px">' +
      '<clipPath id="' + cid + '"><path d="' + dPath + '"/></clipPath>' +
      '<path d="' + dPath + '" fill="' + color + '"/>' +
      '<g clip-path="url(#' + cid + ')">' + veins.join('') +
      '<path d="M' + f(p0.x) + ' ' + f(p0.y) + ' Q' + f(p1.x) + ' ' + f(p1.y) + ' ' + f(p2.x) + ' ' + f(p2.y) +
      '" fill="none" stroke="' + vein + '" stroke-width="2.4" stroke-linecap="round" opacity=".9"/></g></g>';
  }

  /* --------------------- تاج ورقي مفصّص (هالة الشجرة) --------------------- */
  function leafyBlob(cx, cy, rx, ry, lobes, seed, fill, stage) {
    var rnd = mulberry32(seed);
    var pts = [];
    for (var i = 0; i < lobes; i++) {
      var ang = (i / lobes) * Math.PI * 2 - Math.PI / 2;
      var r = 0.86 + rnd() * 0.22;
      pts.push([cx + Math.cos(ang) * rx * r, cy + Math.sin(ang) * ry * r]);
    }
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var j = 1; j <= lobes; j++) {
      var p = pts[j % lobes], q = pts[j - 1];
      var chord = Math.hypot(p[0] - q[0], p[1] - q[1]);
      var rr = f(chord * 0.66);
      d += ' A' + rr + ' ' + rr + ' 0 0 1 ' + f(p[0]) + ' ' + f(p[1]);
    }
    d += ' Z';
    return '<g class="lf s' + (stage || 0) + '" style="transform-origin:' + f(cx) + 'px ' + f(cy + ry * 0.7) + 'px">' +
      '<path d="' + d + '" fill="' + fill + '"/></g>';
  }

  /* ------------------------------- جذع الشجرة ----------------------------- */
  function trunkPath(xb, yb, xt, yt, wb, wt, bend) {
    bend = bend || 0;
    var mx = (xb + xt) / 2 + bend, my = (yb + yt) / 2;
    return 'M' + f(xb - wb / 2) + ' ' + f(yb) +
      ' Q' + f(mx - wb * 0.34) + ' ' + f(my) + ' ' + f(xt - wt / 2) + ' ' + f(yt) +
      ' L' + f(xt + wt / 2) + ' ' + f(yt) +
      ' Q' + f(mx + wb * 0.34) + ' ' + f(my) + ' ' + f(xb + wb / 2) + ' ' + f(yb) + ' Z';
  }

  function ground() {
    return '<ellipse cx="100" cy="230" rx="52" ry="7.5" fill="' + C.shadow + '"/>';
  }

  /* ============================ بناء كل شجرة ============================= */

  /* ------------------------- مُولّد الأغصان المتفرّعة ---------------------- */
  /* ينشئ هيكل أغصان حقيقي ويُعيد أطراف الأغصان لتتعلّق عليها الثمار */
  function branchSystem(x0, y0, ang0, len0, w0, depth, seed, color) {
    var rnd = mulberry32(seed), paths = [], tips = [];
    function grow(x, y, ang, len, w, d) {
      var a = rad(ang);
      var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      var bend = (rnd() * 2 - 1) * len * 0.20;
      var mx = (x + x2) / 2 - Math.sin(a) * bend, my = (y + y2) / 2 + Math.cos(a) * bend;
      paths.push('<path d="M' + f(x) + ' ' + f(y) + ' Q' + f(mx) + ' ' + f(my) + ' ' + f(x2) + ' ' + f(y2) +
        '" fill="none" stroke="' + color + '" stroke-width="' + f(Math.max(1.4, w)) + '" stroke-linecap="round"/>');
      if (d <= 0) { tips.push({ x: x2, y: y2 }); return; }
      if (d <= 1) tips.push({ x: x + (x2 - x) * 0.62, y: y + (y2 - y) * 0.62 });
      if (d === 1 && rnd() < 0.34) { tips.push({ x: x2, y: y2 }); return; }
      var spread = 25 + rnd() * 21;
      grow(x2, y2, ang - spread, len * (0.56 + rnd() * 0.22), w * 0.66, d - 1);
      grow(x2, y2, ang + spread, len * (0.56 + rnd() * 0.22), w * 0.66, d - 1);
      if (d >= 2 && rnd() > 0.40) grow(x2, y2, ang + (rnd() * 18 - 9), len * 0.56, w * 0.56, d - 1);
    }
    grow(x0, y0, ang0, len0, w0, depth);
    return { markup: '<g class="limbs">' + paths.join('') + '</g>', tips: tips };
  }

  /* مواضع أطراف الأغصان تُخزّن هنا أثناء البناء */
  var ANCHORS = {};

  /* ============================ بناء كل شجرة ============================= */

  /* 1) النخلة - الرطب: عذوق متدلّية من قلب النخلة */
  function dateBunch(x, y) {
    var o = [], tips = [], s, k, m;
    for (s = -1; s <= 1; s += 2) {
      for (k = 0; k < 3; k++) {
        var p0 = { x: x + s * 2, y: y },
            p1 = { x: x + s * (10 + k * 5), y: y + 10 + k * 2 },
            p2 = { x: x + s * (15 + k * 7), y: y + 27 + k * 6 };
        o.push('<path d="M' + f(p0.x) + ' ' + f(p0.y) + ' Q' + f(p1.x) + ' ' + f(p1.y) + ' ' + f(p2.x) + ' ' + f(p2.y) +
          '" fill="none" stroke="' + C.barkDark + '" stroke-width="' + f(3 - k * 0.5) + '" stroke-linecap="round"/>');
        for (m = 1; m <= 5; m++) {
          var b = bez(p0, p1, p2, 0.30 + m * 0.145);
          tips.push({ x: b.x + s * 3.5, y: b.y + 1.5 });
          tips.push({ x: b.x - s * 2.5, y: b.y + 3.5 });
        }
      }
    }
    return { markup: '<g class="bunch">' + o.join('') + '</g>', tips: tips };
  }

  function buildPalm() {
    var o = [], i;
    o.push(ground());
    o.push('<path d="' + trunkPath(100, 230, 101, 118, 23, 14, 3) + '" fill="' + C.bark + '"/>');
    for (i = 0; i < 9; i++) {
      var yy = 214 - i * 11;
      o.push('<path d="M' + f(90 + i * 0.5) + ' ' + f(yy) + ' Q100 ' + f(yy - 5) + ' ' + f(110 - i * 0.5) + ' ' + f(yy) +
        '" fill="none" stroke="' + C.barkDark + '" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>');
    }
    var top = { x: 101, y: 118 };
    o.push(palmFrond(top.x, top.y, -90, 74, { stage: 0, arch: 0.30, droop: 0.06 }));
    o.push(palmFrond(top.x, top.y, -146, 76, { stage: 0, color: C.leafDark }));
    o.push(palmFrond(top.x, top.y, -34, 76, { stage: 0, color: C.leafDark }));
    o.push(palmFrond(top.x, top.y, -118, 82, { stage: 1 }));
    o.push(palmFrond(top.x, top.y, -62, 82, { stage: 1 }));
    o.push(palmFrond(top.x, top.y, 177, 72, { stage: 2, color: C.leafLight, droop: 0.52 }));
    o.push(palmFrond(top.x, top.y, 3, 72, { stage: 2, color: C.leafLight, droop: 0.52 }));
    o.push(palmFrond(top.x, top.y, -162, 66, { stage: 3, color: C.leafPale, droop: 0.58 }));
    o.push(palmFrond(top.x, top.y, -18, 66, { stage: 3, color: C.leafPale, droop: 0.58 }));
    var bunch = dateBunch(101, 122);
    o.push(bunch.markup);
    ANCHORS.nakhla = bunch.tips;
    return o.join('');
  }

  /* 2) شجرة الموز: عذق بأكفّ متراصّة وزهرة حمراء */
  function buildBanana() {
    var o = [], i;
    o.push(ground());
    o.push('<path d="' + trunkPath(133, 230, 135, 170, 15, 10, 2) + '" fill="' + C.barkLight + '"/>');
    o.push('<path d="' + trunkPath(98, 230, 99, 114, 27, 17, 0) + '" fill="' + C.bark + '"/>');
    for (i = -2; i <= 2; i++) {
      o.push('<line x1="' + f(99 + i * 4.8) + '" y1="228" x2="' + f(99 + i * 2.8) + '" y2="118" stroke="' + C.barkDark +
        '" stroke-width="1.3" opacity=".42" stroke-linecap="round"/>');
    }
    var t = { x: 99, y: 114 };
    o.push(broadLeaf(t.x, t.y, -96, 80, 21, { stage: 0, color: C.leaf, arch: 0.24, droop: 0.14 }));
    o.push(broadLeaf(t.x, t.y, -150, 76, 20, { stage: 0, color: C.leafDark, droop: 0.34, arch: 0.22 }));
    o.push(broadLeaf(t.x, t.y, -34, 76, 20, { stage: 0, color: C.leafDark, droop: 0.34, arch: 0.22 }));
    o.push(broadLeaf(t.x, t.y, -176, 66, 18, { stage: 1, color: C.leaf, droop: 0.46, arch: 0.16 }));
    o.push(broadLeaf(t.x, t.y, -6, 66, 18, { stage: 1, color: C.leaf, droop: 0.46, arch: 0.16 }));
    o.push(broadLeaf(t.x, t.y, -122, 70, 18, { stage: 2, color: C.leafLight, droop: 0.30, arch: 0.26 }));
    o.push(broadLeaf(135, 170, -62, 52, 16, { stage: 2, color: C.leafLight, droop: 0.24, veins: 8 }));
    o.push(broadLeaf(135, 170, -16, 46, 14, { stage: 3, color: C.leafPale, droop: 0.28, veins: 8 }));

    var p0 = { x: 95, y: 121 }, p1 = { x: 80, y: 132 }, p2 = { x: 77, y: 158 };
    var bo = ['<path d="M' + f(p0.x) + ' ' + f(p0.y) + ' Q' + f(p1.x) + ' ' + f(p1.y) + ' ' + f(p2.x) + ' ' + f(p2.y) +
      '" fill="none" stroke="' + C.barkDark + '" stroke-width="3.8" stroke-linecap="round"/>'];
    var tips = [];
    for (i = 0; i < 5; i++) {
      var tt = 0.24 + i * 0.17;
      var b = bez(p0, p1, p2, tt);
      bo.push('<line x1="' + f(b.x - 7) + '" y1="' + f(b.y - 1) + '" x2="' + f(b.x + 7) + '" y2="' + f(b.y - 1) +
        '" stroke="' + C.barkDark + '" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>');
      tips.push({ x: b.x - 6.5, y: b.y + 2 }, { x: b.x + 6.5, y: b.y + 2 }, { x: b.x, y: b.y + 3.5 });
    }
    bo.push('<path d="M' + f(p2.x) + ' ' + f(p2.y) + ' q-1 6 -1 9" fill="none" stroke="' + C.barkDark + '" stroke-width="2.6" stroke-linecap="round"/>');
    bo.push('<path d="M76 176 q-8 -6 -6 -14 q6 -6 12 0 q2 8 -6 14 Z" fill="' + C.red + '"/>');
    bo.push('<path d="M76 176 q-8 -6 -6 -14 q4 6 6 14 Z" fill="' + C.redDeep + '" opacity=".45"/>');
    o.push('<g class="bunch">' + bo.join('') + '</g>');
    ANCHORS.mawz = tips;
    return o.join('');
  }

  /* 3) شجرة الرمان */
  function buildPomegranate() {
    var o = [];
    var b = branchSystem(100, 176, -90, 36, 8.5, 3, 404, C.barkDark);
    o.push(ground());
    o.push('<path d="' + trunkPath(100, 230, 100, 174, 19, 12, -3) + '" fill="' + C.bark + '"/>');
    o.push(leafyBlob(100, 124, 58, 46, 13, 21, C.leafDark, 0));
    o.push(leafyBlob(70, 136, 30, 25, 10, 55, C.leaf, 1));
    o.push(leafyBlob(130, 136, 30, 25, 10, 91, C.leaf, 1));
    o.push(leafyBlob(100, 100, 38, 28, 11, 133, C.leaf, 2));
    o.push(leafyBlob(100, 84, 26, 19, 9, 177, C.leafLight, 3));
    o.push(b.markup);
    ANCHORS.ruman = b.tips;
    return o.join('');
  }

  /* 4) شجرة المانجو (الأمبا) */
  function buildMango() {
    var o = [];
    var b = branchSystem(100, 168, -90, 40, 9.5, 3, 811, C.barkDark);
    o.push(ground());
    o.push('<path d="' + trunkPath(100, 230, 100, 166, 22, 13, 3) + '" fill="' + C.barkDark + '"/>');
    o.push(leafyBlob(100, 116, 64, 48, 15, 7, C.leafDark, 0));
    o.push(leafyBlob(66, 128, 31, 26, 10, 43, C.leaf, 1));
    o.push(leafyBlob(134, 128, 31, 26, 10, 71, C.leaf, 1));
    o.push(leafyBlob(100, 92, 42, 31, 13, 109, C.leaf, 2));
    o.push(leafyBlob(100, 72, 29, 21, 10, 151, C.leafLight, 3));
    o.push(b.markup);
    ANCHORS.manju = b.tips;
    return o.join('');
  }

  /* 5) شجرة الليمون العماني (اللومي) */
  function buildLoomi() {
    var o = [];
    var b = branchSystem(100, 190, -90, 33, 7.5, 3, 1215, C.barkDark);
    o.push(ground());
    o.push('<path d="' + trunkPath(100, 230, 100, 188, 17, 11, 2) + '" fill="' + C.bark + '"/>');
    o.push(leafyBlob(100, 142, 56, 44, 13, 29, C.leaf, 0));
    o.push(leafyBlob(72, 150, 29, 24, 10, 63, C.leafLight, 1));
    o.push(leafyBlob(128, 150, 29, 24, 10, 97, C.leafLight, 1));
    o.push(leafyBlob(100, 118, 38, 28, 12, 139, C.leafPale, 2));
    o.push(leafyBlob(100, 100, 25, 18, 9, 181, C.leafLight, 3));
    o.push(b.markup);
    ANCHORS.loomi = b.tips;
    return o.join('');
  }

  /* 6) شجرة جوز الهند (النارجيل): عناقيد على أعناق قصيرة تحت التاج */
  function buildCoconut() {
    var o = [], i;
    o.push(ground());
    o.push('<path d="' + trunkPath(96, 230, 107, 104, 19, 12, 12) + '" fill="' + C.barkLight + '"/>');
    for (i = 0; i < 11; i++) {
      var tt = i / 11;
      var yy = 218 - i * 10.6;
      var xx = 96 + tt * 11 + Math.sin(tt * Math.PI) * 5;
      o.push('<line x1="' + f(xx - 7.5) + '" y1="' + f(yy) + '" x2="' + f(xx + 7.5) + '" y2="' + f(yy - 1.6) +
        '" stroke="' + C.barkDark + '" stroke-width="1.5" opacity=".42" stroke-linecap="round"/>');
    }
    var t = { x: 107, y: 104 };
    o.push(palmFrond(t.x, t.y, -90, 78, { stage: 0, arch: 0.36, droop: 0.06, color: C.leafDark }));
    o.push(palmFrond(t.x, t.y, -142, 80, { stage: 0, color: C.leaf, droop: 0.30, arch: 0.26 }));
    o.push(palmFrond(t.x, t.y, -38, 80, { stage: 0, color: C.leaf, droop: 0.30, arch: 0.26 }));
    o.push(palmFrond(t.x, t.y, -116, 84, { stage: 1, color: C.leafDark, droop: 0.36, arch: 0.22 }));
    o.push(palmFrond(t.x, t.y, -64, 84, { stage: 1, color: C.leafDark, droop: 0.36, arch: 0.22 }));
    o.push(palmFrond(t.x, t.y, 174, 72, { stage: 2, color: C.leafLight, droop: 0.44 }));
    o.push(palmFrond(t.x, t.y, 6, 72, { stage: 2, color: C.leafLight, droop: 0.44 }));
    o.push(palmFrond(t.x, t.y, -160, 64, { stage: 3, color: C.leafPale, droop: 0.52 }));
    o.push(palmFrond(t.x, t.y, -20, 64, { stage: 3, color: C.leafPale, droop: 0.52 }));

    var co = [], tips = [], j;
    var tiers = [
      { y: 118, xs: [95, 107, 119] },
      { y: 128, xs: [88, 100, 113, 125] },
      { y: 138, xs: [95, 107, 119] }
    ];
    for (i = 0; i < tiers.length; i++) {
      for (j = 0; j < tiers[i].xs.length; j++) {
        var ex = tiers[i].xs[j], ey = tiers[i].y;
        if (i < 2) {
          co.push('<path d="M' + f(t.x) + ' ' + f(t.y + 4) + ' Q' + f((t.x + ex) / 2) + ' ' + f(ey - 9) + ' ' + f(ex) + ' ' + f(ey - 4) +
            '" fill="none" stroke="' + C.barkDark + '" stroke-width="' + (i === 0 ? 2.8 : 2.2) + '" stroke-linecap="round"/>');
        }
        tips.push({ x: ex, y: ey });
      }
    }
    o.push('<g class="bunch">' + co.join('') + '</g>');
    ANCHORS.narjeel = tips;
    return o.join('');
  }

  /* ============================== رسم الثمار ============================== */
  var FRUIT = {
    date: function () {
      return '<path d="M0 -6 v-3.5" stroke="' + C.barkDark + '" stroke-width="1.3" stroke-linecap="round" fill="none"/>' +
             '<ellipse cx="0" cy="0" rx="3.5" ry="5" fill="' + C.yellow + '"/>' +
             '<ellipse cx="-1" cy="-1.2" rx="1.5" ry="2" fill="#F7E38C" opacity=".8"/>';
    },
    banana: function () {
      return '<path d="M-5 -3 Q0 6 6 1 Q1 2 -3 -4 Z" fill="' + C.yellow + '"/>' +
             '<path d="M-5 -3 Q0 6 6 1" fill="none" stroke="' + C.yellowDeep + '" stroke-width="1.1" stroke-linecap="round"/>' +
             '<circle cx="-4.6" cy="-3.4" r="1" fill="' + C.barkDark + '"/>';
    },
    pomegranate: function () {
      return '<path d="M0 -6 v-4" stroke="' + C.barkDark + '" stroke-width="1.4" stroke-linecap="round" fill="none"/>' +
             '<circle cx="0" cy="0" r="5.2" fill="' + C.red + '"/>' +
             '<circle cx="-1.6" cy="-1.8" r="1.8" fill="#E9765C" opacity=".75"/>' +
             '<path d="M-2 -5 L0 -8 L2 -5 L0 -4 Z" fill="' + C.redDeep + '"/>';
    },
    mango: function () {
      return '<path d="M1 -7 q1.5 -3 3.5 -4" fill="none" stroke="' + C.barkDark + '" stroke-width="1.4" stroke-linecap="round"/>' +
             '<path d="M0 -5.4 Q6 -3 5 2.4 Q3.4 6 0 5.6 Q-5 4.6 -5.2 -0.6 Q-5 -4.4 0 -5.4 Z" fill="' + C.orange + '"/>' +
             '<path d="M0 -5.4 Q6 -3 5 2.4 Q2 -1 0 -5.4 Z" fill="' + C.red + '" opacity=".7"/>';
    },
    lime: function () {
      return '<path d="M0 -5.5 v-4" stroke="' + C.barkDark + '" stroke-width="1.3" stroke-linecap="round" fill="none"/>' +
             '<circle cx="0" cy="0" r="4.8" fill="' + C.lime + '"/>' +
             '<circle cx="-1.5" cy="-1.6" r="1.7" fill="#C6D877" opacity=".8"/>' +
             '<path d="M0 -4.6 q2.6 -3 5 -2 q-1.4 3 -4.4 2.6 Z" fill="' + C.leafDark + '"/>';
    },
    coconut: function () {
      return '<circle cx="0" cy="0" r="4.9" fill="' + C.coco + '"/>' +
             '<path d="M-4.9 0 a4.9 4.9 0 0 1 9.8 0 Z" fill="' + C.cocoDark + '" opacity=".35"/>' +
             '<circle cx="-1.8" cy="1.4" r=".9" fill="' + C.cocoDark + '"/>' +
             '<circle cx="1.6" cy="1.4" r=".9" fill="' + C.cocoDark + '"/>' +
             '<circle cx="-.1" cy="-1.2" r=".9" fill="' + C.cocoDark + '"/>';
    }
  };

  /* ========================== تعريف الأشجار الستّ ========================= */
  var LIST = [
    { id: 'nakhla',  name: 'النخلة',          fruit: 'رطبة',   few: 'رطبات',       many: 'رطبة',      emoji: '🌴',
      tone: C.yellow,     build: buildPalm,         shape: 'date',
      zones: [ { x: 80, y: 150, rx: 13, ry: 19, w: 1 }, { x: 122, y: 150, rx: 13, ry: 19, w: 1 } ] },

    { id: 'mawz',    name: 'شجرة الموز',      fruit: 'موزة',   few: 'موزات',       many: 'موزة',      emoji: '🍌',
      tone: C.yellowDeep, build: buildBanana,       shape: 'banana',
      zones: [ { x: 80, y: 146, rx: 9, ry: 16, w: 1.6, rot: 10 }, { x: 124, y: 158, rx: 8, ry: 12, w: .5, rot: 10 } ] },

    { id: 'ruman',   name: 'شجرة الرمان',     fruit: 'رمانة',  few: 'رمانات',      many: 'رمانة',     emoji: '🍎',
      tone: C.red,        build: buildPomegranate,  shape: 'pomegranate',
      zones: [ { x: 100, y: 126, rx: 46, ry: 32, w: 1 } ] },

    { id: 'manju',   name: 'شجرة المانجو',    fruit: 'مانجوة', few: 'حبات مانجو',  many: 'حبة مانجو', emoji: '🥭',
      tone: C.orange,     build: buildMango,        shape: 'mango',
      zones: [ { x: 100, y: 116, rx: 50, ry: 36, w: 1 } ] },

    { id: 'loomi',   name: 'الليمون العماني', fruit: 'لومية',  few: 'لوميات',      many: 'لومية',     emoji: '🍋',
      tone: C.lime,       build: buildLoomi,        shape: 'lime',
      zones: [ { x: 100, y: 142, rx: 44, ry: 32, w: 1 } ] },

    { id: 'narjeel', name: 'جوز الهند',       fruit: 'جوزة',   few: 'جوزات',       many: 'جوزة',      emoji: '🥥',
      tone: C.coco,       build: buildCoconut,      shape: 'coconut',
      zones: [ { x: 107, y: 122, rx: 20, ry: 11, w: 1 }, { x: 107, y: 134, rx: 22, ry: 8, w: .6 } ] }
  ];

  /* ترتيب الأطراف بحيث تتوزّع الثمار على الشجرة كلها لا في زاوية واحدة */
  function spreadOrder(pts) {
    var rest = pts.slice(), out = [], i, j, bi, bd, d, dd;
    if (!rest.length) return out;
    bi = 0;
    for (i = 1; i < rest.length; i++) if (rest[i].y < rest[bi].y) bi = i;
    out.push(rest.splice(bi, 1)[0]);
    while (rest.length) {
      bi = 0; bd = -1;
      for (i = 0; i < rest.length; i++) {
        d = 1e9;
        for (j = 0; j < out.length; j++) {
          dd = (rest[i].x - out[j].x) * (rest[i].x - out[j].x) + (rest[i].y - out[j].y) * (rest[i].y - out[j].y);
          if (dd < d) d = dd;
        }
        if (d > bd) { bd = d; bi = i; }
      }
      out.push(rest.splice(bi, 1)[0]);
    }
    return out;
  }

  /* مواضع الثمار: أطراف الأغصان أولًا ثم توزيع متباعد داخل التاج */
  function buildPositions(anchors, zones, n, seed) {
    var rnd = mulberry32(seed), out = [], i, k, m, ring;
    var ordered = spreadOrder(anchors || []);
    for (i = 0; i < ordered.length && out.length < n; i++) {
      out.push({ x: ordered[i].x + (rnd() * 2 - 1) * 1.4, y: ordered[i].y + 2.5 + rnd() * 1.5, rot: (rnd() * 2 - 1) * 14 });
    }
    ring = 1;
    while (out.length < n && ordered.length && ring <= 10) {
      for (i = 0; i < ordered.length && out.length < n; i++) {
        var a = rnd() * Math.PI * 2, rr = 6 + ring * 3.6;
        out.push({ x: ordered[i].x + Math.cos(a) * rr, y: ordered[i].y + Math.sin(a) * rr * 0.7 + 2, rot: (rnd() * 2 - 1) * 20 });
      }
      ring++;
    }
    if (out.length < n && zones && zones.length) {
      var totalW = 0;
      for (k = 0; k < zones.length; k++) totalW += (zones[k].w == null ? 1 : zones[k].w);
      while (out.length < n) {
        var best = null, bestD = -1;
        for (k = 0; k < 14; k++) {
          var r = rnd() * totalW, z = zones[0];
          for (m = 0; m < zones.length; m++) { r -= (zones[m].w == null ? 1 : zones[m].w); if (r <= 0) { z = zones[m]; break; } }
          var ang = rnd() * Math.PI * 2, rad2 = Math.sqrt(rnd());
          var p = { x: z.x + Math.cos(ang) * z.rx * rad2, y: z.y + Math.sin(ang) * z.ry * rad2, rot: (rnd() * 2 - 1) * (z.rot == null ? 22 : z.rot) };
          var dmin = 1e9;
          for (var q = 0; q < out.length; q++) {
            var d2 = (out[q].x - p.x) * (out[q].x - p.x) + (out[q].y - p.y) * (out[q].y - p.y);
            if (d2 < dmin) dmin = d2;
          }
          if (dmin > bestD) { bestD = dmin; best = p; }
        }
        out.push(best);
      }
    }
    return out;
  }

  var VIEWBOX = '6 20 188 218';
  var MAX_VISIBLE = 150;
  var byId = {};
  LIST.forEach(function (t, idx) {
    t.body = t.build();
    t.anchors = ANCHORS[t.id] || [];
    t.positions = buildPositions(t.anchors, t.zones, MAX_VISIBLE, 1000 + idx * 137);
    byId[t.id] = t;
  });

  /* مراحل النمو حسب عدد الثمار */
  var THRESHOLDS = [0, 3, 8, 16];
  function stageOf(count) {
    var s = 0;
    for (var i = 0; i < THRESHOLDS.length; i++) if (count > THRESHOLDS[i]) s = i;
    return Math.min(s, 3);
  }
  function scaleOf(count) {
    return 0.80 + Math.min(count, 30) / 30 * 0.22;
  }

  function fruitMarkup(treeId, index, size) {
    var t = byId[treeId];
    var p = t.positions[index % MAX_VISIBLE];
    var ring = Math.floor(index / MAX_VISIBLE);
    var s = size == null ? 1 : size;
    var ox = ring ? (ring % 2 ? 3.5 : -3.5) : 0;
    return '<g class="fruit" data-i="' + index + '" transform="translate(' + f(p.x + ox) + ',' + f(p.y) +
      ') rotate(' + f(p.rot) + ') scale(' + f(s) + ')">' + FRUIT[t.shape]() + '</g>';
  }

  /* صيغة العدّ العربية: ٣-١٠ جمع، وما فوقها مفرد */
  function unitFor(treeId, n) {
    var t = byId[treeId];
    return (n >= 3 && n <= 10) ? t.few : t.many;
  }
  function dualOf(word) {
    return (word.slice(-1) === 'ة' ? word.slice(0, -1) : word) + 'تان';
  }
  function countLabel(treeId, n) {
    var t = byId[treeId];
    if (n === 0) return 'لا توجد ثمار بعد';
    if (n === 1) return t.fruit + ' واحدة';
    if (n === 2) return dualOf(t.fruit);
    return n + ' ' + unitFor(treeId, n);
  }

  function fruitSize(count) {
    if (count <= 45) return 1;
    if (count <= 80) return 0.86;
    if (count <= 120) return 0.76;
    return 0.66;
  }

  function treeSvg(treeId, count, opts) {
    opts = opts || {};
    var t = byId[treeId];
    var n = Math.max(0, count | 0);
    var size = fruitSize(n);
    var fruits = [];
    for (var i = 0; i < n; i++) fruits.push(fruitMarkup(treeId, i, size));
    var grain = opts.texture === false ? '' : ' filter="url(#printGrain)"';
    return '<g class="tree-body" data-stage="' + stageOf(n) + '" data-fruit="' + (n ? 1 : 0) + '"' + grain + '>' +
      t.body + '<g class="fruit-layer">' + fruits.join('') + '</g></g>';
  }

  function standalone(treeId, count, opts) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '" width="188" height="218">' +
      defs() + '<style>' + STAGE_CSS + '</style>' +
      '<g transform="translate(100,228) scale(' + f(scaleOf(count)) + ') translate(-100,-228)">' +
      treeSvg(treeId, count, opts) + '</g></svg>';
  }

  /* قواعد مراحل النمو - تُستخدم أيضًا عند تصدير الصورة */
  var STAGE_CSS =
    '.tree-body .lf{transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}' +
    '.tree-body[data-stage="0"] .s1,.tree-body[data-stage="0"] .s2,.tree-body[data-stage="0"] .s3,' +
    '.tree-body[data-stage="1"] .s2,.tree-body[data-stage="1"] .s3,' +
    '.tree-body[data-stage="2"] .s3{opacity:0;transform:scale(.15) rotate(-6deg)}' +
    '.tree-body .bunch{transition:opacity .4s ease}' +
    '.tree-body[data-fruit="0"] .bunch{opacity:0}';

  function defs() {
    return '<defs><filter id="printGrain" x="-12%" y="-12%" width="124%" height="124%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="2" seed="9" result="noise"/>' +
      '<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.98  0 0 0 0 0.95  0 0 0 0 0.84  0 0 0 0.42 0" result="grain"/>' +
      '<feComposite in="grain" in2="SourceGraphic" operator="in" result="gin"/>' +
      '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gin"/></feMerge></filter></defs>';
  }

  global.Trees = {
    LIST: LIST, byId: byId, COLORS: C, VIEWBOX: VIEWBOX,
    treeSvg: treeSvg, standalone: standalone, defs: defs, STAGE_CSS: STAGE_CSS,
    fruitMarkup: fruitMarkup, fruitSize: fruitSize,
    stageOf: stageOf, scaleOf: scaleOf,
    unitFor: unitFor, countLabel: countLabel, dualOf: dualOf,
    fruitShape: function (id) { return FRUIT[byId[id].shape](); }
  };
})(window);

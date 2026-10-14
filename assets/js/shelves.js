/* ==========================================================================
   رفوف الإنجاز - محرك رسم الخزائن وما يُرصّ عليها
   كل مجموعة خزانة لها مجموعتها الخاصّة: كتب، برطمانات، أصص، كؤوس،
   صناديق، فوانيس. وكل إجابة صحيحة تضع قطعة على الرفّ من اليمين إلى اليسار،
   فإذا قارب الرفّ أن يمتلئ ظهر رفّ جديد فوقه، فلا تتزاحم القطع أبدًا.
   ========================================================================== */
(function (global) {
  'use strict';

  var C = {
    plank:     '#D9A868',   /* وجه الرفّ */
    plankTop:  '#EFC98F',   /* حرف الرفّ المضيء */
    plankEdge: '#B5823F',   /* ظلّ أسفل الرفّ */
    post:      '#C08F4E',   /* قائمتا الخزانة */
    postDark:  '#A4702F',   /* القاعدة */
    cream:     '#FFF8EC',   /* الحدّ الكريمي حول كل شكل */
    ink:       '#4A3A22',
    gold:      '#C9A227',
    goldLt:    '#F0C23C',
    shade:     'rgba(104,70,26,.16)'
  };

  var CX = 120;                         /* منتصف الخزانة */
  var FLOOR = 194;                      /* أرضيّة الخزانة */
  var VIEWBOX = '0 20 240 184';
  var OUT0 = 32, OUT1 = 208;            /* حدّا الخزانة الخارجيان */
  var X0 = 43, X1 = 197;                /* الحدّان الداخليان: مكان القطع */
  var SLOTS = 10;                        /* عدد القطع على الرفّ الواحد */
  var SLOT_W = (X1 - X0) / SLOTS;
  var PLANK_H = 7;                      /* سُمك الرفّ */
  var SHELF_Y = [178, 138, 98, 58];     /* سطح كل رفّ، من الأسفل إلى الأعلى */
  var ITEM_S = 1.5;                     /* حجم القطعة على الرفّ */

  /* صفوف إضافية أمام الصفّ الأول حين تكثر النقاط */
  var LAP_DX = [0, -4, 4, -2, 2];
  var LAP_DY = [0, 4, 7.5, 2, 6];
  var LAP_S  = [1, 0.97, 0.94, 0.99, 0.95];
  var LAPS = LAP_DX.length;
  var MAX_VISIBLE = SLOTS * SHELF_Y.length * LAPS;

  function f(n) { return Math.round(n * 100) / 100; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function line(x, y, w, h, r, fill, op) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) +
      '" rx="' + f(r) + '" fill="' + fill + '"' + (op == null ? '' : ' opacity="' + op + '"') + '/>';
  }

  /* ============================ بناء الخزانة ============================= */

  /* عروق الخشب على اللوح الخلفي */
  function grain(seed, x, y, w, h) {
    var rnd = mulberry32(seed), out = [], i, gx;
    for (i = 0; i < 5; i++) {
      gx = x + (0.12 + 0.19 * i + rnd() * 0.05) * w;
      out.push('<rect x="' + f(gx) + '" y="' + f(y + 2) + '" width="1.4" height="' + f(h - 4) +
        '" rx=".7" fill="' + C.postDark + '" opacity=".07"/>');
    }
    return out.join('');
  }

  /* لوح الرفّ: سطح تقف عليه القطع، وحرفٌ مضيء، وظلٌّ تحته */
  function plank(y) {
    return line(OUT0, y, OUT1 - OUT0, PLANK_H, 3, C.plank) +
      line(OUT0, y, OUT1 - OUT0, 2.6, 1.3, C.plankTop) +
      line(OUT0 + 2, y + PLANK_H, OUT1 - OUT0 - 4, 2.2, 1.1, C.plankEdge, '.55') +
      '<rect x="' + OUT0 + '" y="' + y + '" width="' + (OUT1 - OUT0) + '" height="' + PLANK_H +
      '" rx="3" fill="none" stroke="' + C.cream + '" stroke-width="1.2" opacity=".85"/>';
  }

  /* الحجيرة أسفل رفٍّ ما: قائمتان ولوح خلفي يحيطان بقطع الرفّ الذي تحته */
  function compartment(top, bottom, back, seed) {
    var y = top + PLANK_H, h = bottom - y;
    if (h <= 0) return '';
    return line(X0, y, X1 - X0, h, 2, back) +
      grain(seed, X0, y, X1 - X0, h) +
      line(OUT0, y, X0 - OUT0, h, 2, C.post) +
      line(X1, y, OUT1 - X1, h, 2, C.post) +
      '<rect x="' + f(OUT0) + '" y="' + f(y) + '" width="' + f(OUT1 - OUT0) + '" height="' + f(h) +
      '" rx="2" fill="none" stroke="' + C.cream + '" stroke-width="1.1" opacity=".6"/>';
  }

  function base() {
    var y = SHELF_Y[0] + PLANK_H;
    return line(OUT0 + 4, y, OUT1 - OUT0 - 8, FLOOR - y, 3, C.postDark) +
      line(OUT0 + 4, y, OUT1 - OUT0 - 8, 2.4, 1.2, C.post) +
      line(OUT0 + 10, FLOOR, 16, 4, 2, C.postDark) +
      line(OUT1 - 26, FLOOR, 16, 4, 2, C.postDark) +
      '<ellipse cx="' + CX + '" cy="' + (FLOOR + 7) + '" rx="' + ((OUT1 - OUT0) / 2 + 8) +
      '" ry="6" fill="' + C.shade + '" opacity=".75"/>';
  }

  /* الخزانة تُبنى طبقةً طبقة: الرفّ الأسفل دائمًا، ثم رفٌّ فوق رفّ */
  function build(p) {
    var out = [], k;
    out.push(base());
    out.push(plank(SHELF_Y[0]));
    for (k = 1; k < SHELF_Y.length; k++) {
      out.push('<g class="lf s' + k + '" style="transform-origin:' + CX + 'px ' + SHELF_Y[k - 1] + 'px">' +
        compartment(SHELF_Y[k], SHELF_Y[k - 1], p.back, p.seed + k * 17) +
        plank(SHELF_Y[k]) + '</g>');
    }
    return out.join('');
  }

  /* ========================== أشكال القطع الستّة =========================
     كل شكل قاعدته عند y = 0 ويعلو إلى الأعلى، فيقف على الرفّ وقوفًا طبيعيًّا */

  var SPINES = ['#E36559', '#2E7596', '#E89C73', '#6BA368', '#B06FA8', '#F0B64B', '#4D8FA8'];
  var GIFTS  = ['#E36559', '#B06FA8', '#4D8FA8', '#6BA368', '#F0B64B'];

  function edge(d, fill, sw) {
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + C.cream +
      '" stroke-width="' + (sw || 1.2) + '" stroke-linejoin="round"/>';
  }
  function rectEdge(x, y, w, h, r, fill) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) +
      '" rx="' + f(r) + '" fill="' + fill + '" stroke="' + C.cream +
      '" stroke-width="1.2" stroke-linejoin="round"/>';
  }

  /* كتاب واقف: كعبٌ ضيّق طويل، بشريطين وعنوان صغير وحرف أوراق */
  function book(v, p) {
    var pal = (p && p.spines) || SPINES;
    var col = pal[(v.c || 0) % pal.length];
    var h = v.h || 19, w = v.w || 8;
    return rectEdge(-w / 2, -h, w, h, Math.min(1.5, w * 0.2), col) +
      line(w / 2 - w * 0.26, -h + 0.9, w * 0.22, h - 1.8, 0.4, C.cream, '.5') +
      line(-w / 2 + 0.5, -h + h * 0.15, w - 1, 1.2, 0.55, C.cream, '.8') +
      line(-w / 2 + 0.5, -h + h * 0.25, w - 1, 0.8, 0.4, C.cream, '.55') +
      line(-w / 2 + 0.5, -h * 0.2, w - 1, 1.2, 0.55, C.cream, '.7') +
      line(-w * 0.23, -h * 0.62, w * 0.46, h * 0.17, 0.5, C.cream, '.88');
  }

  /* برطمان عسل: غطاءٌ ذهبي وعسلٌ يلمع */
  function jar() {
    return rectEdge(-7.4, -16.2, 14.8, 3.2, 1.6, C.gold) +
      rectEdge(-5.6, -19, 11.2, 3.2, 1.6, C.goldLt) +
      rectEdge(-6.4, -13.4, 12.8, 13.4, 3.4, '#F7D583') +
      '<path d="M-6.4 -8 h12.8 v8 q0 1.4 -1.4 1.4 h-10 q-1.4 0 -1.4 -1.4 z" fill="#E09A28" opacity=".95"/>' +
      line(-4, -11.6, 2.2, 7, 1.1, C.cream, '.5');
  }

  /* أصيص فيه نبتة صغيرة */
  function pot() {
    return edge('M0 -9.4 q-1.2 -6.2 -6.6 -8.4 q1.2 6.4 6.6 8.4 z', '#6BA368') +
      edge('M0 -9.4 q1.2 -6.2 6.6 -8.4 q-1.2 6.4 -6.6 8.4 z', '#8CBE86') +
      edge('M0 -9.4 q-2.2 -7.4 0 -10.8 q2.2 3.4 0 10.8 z', '#55905B') +
      edge('M-5.8 -7 L5.8 -7 L4.4 0 L-4.4 0 Z', '#D98355') +
      rectEdge(-6.8, -9.6, 13.6, 3, 1.5, '#C96F42') +
      line(-3.4, -5.6, 2, 4, 1, C.cream, '.4');
  }

  /* كأس بمقبضين ونجمة */
  function cup() {
    var pts = [], i, a, rr;
    for (i = 0; i < 10; i++) {
      a = (-90 + i * 36) * Math.PI / 180;
      rr = i % 2 ? 1.4 : 3.2;
      pts.push(f(Math.cos(a) * rr) + ' ' + f(-13.8 + Math.sin(a) * rr));
    }
    return '<path d="M-5.9 -17 q-2.9 0.4 -2.4 3 q0.5 2.4 2.6 2.8" fill="none" stroke="' + C.gold +
      '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M5.9 -17 q2.9 0.4 2.4 3 q-0.5 2.4 -2.6 2.8" fill="none" stroke="' + C.gold +
      '" stroke-width="1.5" stroke-linecap="round"/>' +
      edge('M-5.8 -18.4 L5.8 -18.4 L4.8 -12.4 Q4.8 -8.2 0 -8.2 Q-4.8 -8.2 -4.8 -12.4 Z', C.goldLt) +
      '<polygon points="' + pts.join(' ') + '" fill="' + C.cream + '" opacity=".92"/>' +
      line(-1.5, -8.4, 3, 4.6, 0.6, C.gold) +
      rectEdge(-3.8, -4.2, 7.6, 1.8, 0.8, C.gold) +
      rectEdge(-5.6, -2.6, 11.2, 2.6, 1.2, C.gold);
  }

  /* صندوق هديّة بشريط وعقدة */
  function box(v) {
    var col = GIFTS[(v.c || 0) % GIFTS.length];
    return rectEdge(-7.2, -11.4, 14.4, 11.4, 1.8, col) +
      line(-1.5, -11.4, 3, 11.4, 0.5, C.cream, '.92') +
      rectEdge(-8.2, -15, 16.4, 3.8, 1.6, col) +
      line(-1.5, -15, 3, 3.8, 0.5, C.cream, '.92') +
      '<path d="M-0.6 -15.2 q-5.4 -1.2 -4.6 -4 q0.8 -2.6 4.6 1.6 z" fill="' + C.cream +
      '" stroke="' + C.gold + '" stroke-width=".7" stroke-linejoin="round"/>' +
      '<path d="M0.6 -15.2 q5.4 -1.2 4.6 -4 q-0.8 -2.6 -4.6 1.6 z" fill="' + C.cream +
      '" stroke="' + C.gold + '" stroke-width=".7" stroke-linejoin="round"/>' +
      '<circle cx="0" cy="-15.4" r="1.3" fill="' + C.goldLt + '" stroke="' + C.gold + '" stroke-width=".6"/>';
  }

  /* فانوس يضيء */
  function lantern() {
    return '<path d="M-2.4 -19.8 q2.4 -3 4.8 0" fill="none" stroke="' + C.gold +
      '" stroke-width="1.6" stroke-linecap="round"/>' +
      edge('M-5.6 -17.8 L5.6 -17.8 L3.8 -14.4 L-3.8 -14.4 Z', C.gold) +
      edge('M-5 -14.4 L5 -14.4 L6.4 -4.4 L-6.4 -4.4 Z', '#F7D583') +
      '<path d="M-3.6 -12.8 L3.6 -12.8 L4.6 -6 L-4.6 -6 Z" fill="#FDF0CA" opacity=".85"/>' +
      '<path d="M0 -12.4 q2.4 2.6 0 5.4 q-2.4 -2.8 0 -5.4 z" fill="' + C.goldLt + '"/>' +
      edge('M-6.4 -4.4 L6.4 -4.4 L4.6 0 L-4.6 0 Z', C.gold);
  }

  /* بنك الأشكال: الرفوف كلّها كتب الآن، وتبقى البقيّة جاهزة لنسخة قادمة
     يكفي تغيير shape في تعريف الرفّ أدناه */
  var SHAPES = { book: book, jar: jar, pot: pot, cup: cup, box: box, lantern: lantern };

  /* ========================= تعريف الرفوف الستّة ========================= */
  var LIST = [
    { id: 'qisas',   name: 'رفّ القصص',    back: '#EFE0C4', tone: '#C04A3F', seed: 11,
      spines: ['#E36559', '#C04A3F', '#E89C73', '#F0B64B'] },
    { id: 'ulum',    name: 'رفّ العلوم',   back: '#DDE8E7', tone: '#2E7596', seed: 23,
      spines: ['#2E7596', '#4D8FA8', '#94BEBB', '#23617E'] },
    { id: 'shir',    name: 'رفّ الشعر',    back: '#E1EAD6', tone: '#657652', seed: 37,
      spines: ['#6BA368', '#657652', '#8CA173', '#C0B05B'] },
    { id: 'hikam',   name: 'رفّ الحكمة',   back: '#F2E3C6', tone: '#C9A227', seed: 53,
      spines: ['#F0B64B', '#C9A227', '#E89C73', '#DCBB64'] },
    { id: 'mughamar',name: 'رفّ المغامرة', back: '#F3DCD6', tone: '#B06FA8', seed: 71,
      spines: ['#B06FA8', '#E36559', '#8E6BA8', '#F2B6A3'] },
    { id: 'hikayat', name: 'رفّ الحكايات', back: '#E6DEEE', tone: '#4D8FA8', seed: 89,
      spines: ['#4D8FA8', '#6BA368', '#F0B64B', '#B06FA8'] }
  ];

  /* الرفوف كلّها تجمع الكتب */
  LIST.forEach(function (p) {
    p.shape = 'book'; p.emoji = '📚'; p.lean = 9;
    p.fruit = 'كتاب'; p.dual = 'كتابان'; p.few = 'كتب'; p.many = 'كتابًا';
  });

  /* مواضع القطع: الرفّ الأسفل أولًا من اليمين إلى اليسار، ثم الرفّ الذي فوقه،
     فإذا امتلأت الرفوف كلّها بدأ صفٌّ أمامها أقرب إلى الناظر */
  function buildPositions(p) {
    var out = [], rnd = mulberry32(p.seed * 13 + 7), lap, sh, i, x;
    for (lap = 0; lap < LAPS; lap++) {
      for (sh = 0; sh < SHELF_Y.length; sh++) {
        for (i = 0; i < SLOTS; i++) {
          x = X1 - (i + 0.5) * SLOT_W + LAP_DX[lap] + (rnd() * 2 - 1) * 1.1;
          out.push({
            x: x,
            y: SHELF_Y[sh] + LAP_DY[lap],
            s: LAP_S[lap],
            rot: (rnd() < 0.22 ? (rnd() * 2 - 1) * p.lean : (rnd() * 2 - 1) * 1.6),
            shelf: sh,
            c: Math.floor(rnd() * 7),
            h: 17 + rnd() * 5,
            w: 6.9 + rnd() * 2.2
          });
        }
      }
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
  /* الرفّ الجديد يظهر قبل أن يمتلئ الذي تحته، فيبقى في الصورة متّسعٌ دائمًا */
  var THRESHOLDS = [0, 8, 18, 28];
  function stageOf(count) {
    var s = 0, i;
    for (i = 0; i < THRESHOLDS.length; i++) if (count > THRESHOLDS[i]) s = i;
    return Math.min(s, 3);
  }

  /* الاتّساع والإزاحة يتولّاهما CSS، فلا حاجة إلى تكبير خارجي */
  function scaleOf() { return 1; }

  function fruitSize(count) {
    if (count <= 40) return 1;
    if (count <= 80) return 0.9;
    if (count <= 120) return 0.82;
    return 0.74;
  }

  function unitFor(id, n) { var p = byId[id]; return n < 3 ? p.fruit : (n <= 10 ? p.few : p.many); }
  function dualOf(w) { return (w.slice(-1) === 'ة' ? w.slice(0, -1) : w) + 'تان'; }
  function countLabel(id, n) {
    var p = byId[id];
    if (n === 0) return 'لا توجد ' + p.few + ' بعد';
    if (n === 1) return p.fruit + ' واحد';
    if (n === 2) return p.dual || dualOf(p.fruit);
    return n + ' ' + unitFor(id, n);
  }

  function fruitMarkup(id, index, size) {
    var p = byId[id];
    var q = p.positions[index % MAX_VISIBLE];
    var s = (size == null ? 1 : size) * q.s * ITEM_S;
    return '<g class="fruit" data-i="' + index + '" transform="translate(' + f(q.x) + ',' + f(q.y) +
      ') rotate(' + f(q.rot) + ') scale(' + f(s) + ')">' +
      '<ellipse cx="0" cy="0" rx="' + f((q.w || 12) * 0.62) + '" ry="1.8" fill="' + C.shade + '"/>' +
      SHAPES[p.shape](q, p) + '</g>';
  }

  var STAGE_CSS =
    '.tree-body .lf{transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}' +
    '.tree-body[data-stage="0"] .s1,.tree-body[data-stage="0"] .s2,.tree-body[data-stage="0"] .s3,' +
    '.tree-body[data-stage="1"] .s2,.tree-body[data-stage="1"] .s3,' +
    '.tree-body[data-stage="2"] .s3{opacity:0;transform:scaleY(.08)}' +
    '.tree-body .shelf-view{transform-origin:' + CX + 'px ' + FLOOR + 'px;' +
      'transition:transform .6s cubic-bezier(.3,1.25,.5,1)}' +
    '.tree-body[data-stage="0"] .shelf-view{transform:translateY(-54px) scale(1.3)}' +
    '.tree-body[data-stage="1"] .shelf-view{transform:translateY(-35px) scale(1.14)}' +
    '.tree-body[data-stage="2"] .shelf-view{transform:translateY(-20px)}' +
    '.tree-body[data-stage="3"] .shelf-view{transform:scale(.97)}';

  function treeSvg(id, count) {
    var p = byId[id];
    var n = Math.max(0, count | 0);
    var size = fruitSize(n), fruits = [], i;
    for (i = 0; i < n; i++) fruits.push(fruitMarkup(id, i, size));
    return '<g class="tree-body" data-stage="' + stageOf(n) + '" data-fruit="' + (n ? 1 : 0) + '">' +
      '<g class="shelf-view">' + p.body_svg +
      '<g class="fruit-layer">' + fruits.join('') + '</g></g></g>';
  }

  function defs() { return ''; }

  function standalone(id, count) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '" width="240" height="184">' +
      '<style>' + STAGE_CSS + '</style>' + treeSvg(id, count) + '</svg>';
  }

  var API = {
    LIST: LIST, byId: byId, COLORS: C, VIEWBOX: VIEWBOX,
    CHIP_VIEWBOX: '-10 -21 20 22',
    treeSvg: treeSvg, standalone: standalone, defs: defs, STAGE_CSS: STAGE_CSS,
    fruitMarkup: fruitMarkup, fruitSize: fruitSize,
    stageOf: stageOf, scaleOf: scaleOf,
    unitFor: unitFor, countLabel: countLabel, dualOf: dualOf,
    fruitShape: function (id) { return SHAPES[byId[id].shape]({ c: 0, h: 17 }, byId[id]); }
  };

  global.ItemSets = global.ItemSets || {};
  global.ItemSets.shelves = API;
})(window);

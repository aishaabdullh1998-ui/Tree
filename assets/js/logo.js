/* ==========================================================================
   لوجو متحرّك لكل لوحة: بُستان · مجرّة · مكتبة
   يُرسم بالكامل داخل الصفحة (SVG + CSS)، فلا صور خارجية ولا خطوط ناقصة.
   كل نسخة تحمل معرّفًا خاصًّا بها حتى لا تتداخل تنسيقاتها مع غيرها.
   ========================================================================== */
(function (global) {
  'use strict';

  var seq = 0;

  var WORD = { garden: 'بُستان', galaxy: 'مجرّة', shelves: 'مكتبة',
               voyage: 'Voyage', coinjar: 'Coin Jar' };

  var SKIN = {
    garden:  { ink: '#35402E', soft: '#7E8A72', line: '#C0B05B', bg: '#F3E7DA' },
    galaxy:  { ink: '#1E3A48', soft: '#6D8795', line: '#94BEBB', bg: '#E9F0F2' },
    shelves: { ink: '#4A3A22', soft: '#8A6E4B', line: '#C9A227', bg: '#FBF1E2' },
    voyage:  { ink: '#2A3F4D', soft: '#7A8B96', line: '#C9954E', bg: '#EFE3C8' },
    coinjar: { ink: '#2A3F4D', soft: '#7A8B96', line: '#9DBDCB', bg: '#EAF0F3' }
  };

  /* ------------------------------ العلامات -------------------------------- */

  /* نخلة تنبت: الجذع يُرسم، ثم تتفتّح السعفات، ثم يسقط العذق */
  function markGarden() {
    var fronds = [
      { d: 'M160 92 C140 80 120 76 104 80 C122 72 144 74 160 86',  c: '#657652', t: .50 },
      { d: 'M160 92 C180 80 200 76 216 80 C198 72 176 74 160 86',  c: '#657652', t: .56 },
      { d: 'M160 90 C142 70 128 56 124 42 C140 54 154 70 160 84',  c: '#8CA173', t: .62 },
      { d: 'M160 90 C178 70 192 56 196 42 C180 54 166 70 160 84',  c: '#8CA173', t: .68 },
      { d: 'M160 88 C154 68 156 50 160 36 C166 50 166 68 160 86',  c: '#4A573B', t: .74 }
    ];
    var out = '<path class="trunk" d="M160 128 C156 114 156 102 160 90" />';
    fronds.forEach(function (f, i) {
      out += '<path class="frond f' + i + '" style="--t:' + f.t + 's" d="' + f.d + '" fill="' + f.c + '"/>';
    });
    out += '<g class="dates">' +
      '<circle cx="150" cy="100" r="6.5" fill="#E36559"/>' +
      '<circle cx="162" cy="106" r="5.5" fill="#C04A3F"/>' +
      '<circle cx="172" cy="99" r="6" fill="#E89C73"/>' +
      '</g>';
    out += '<path class="ground" d="M118 130 H202"/>';
    return out;
  }

  /* كوكب ونجمة تدور في مداره ثم تستقرّ */
  function markGalaxy() {
    var orbit = 'M160 82 a62 27 0 1 0 .1 0 Z';
    return '<g class="orbit-wrap">' +
      '<path class="orbit" d="' + orbit + '" />' +
      '</g>' +
      '<circle class="planet" cx="160" cy="82" r="25" fill="#23617E"/>' +
      '<path class="band" d="M136 76 h48 M139 88 h42" />' +
      '<circle class="shine" cx="151" cy="72" r="7" fill="#FFFFFF" opacity=".22"/>' +
      '<g class="ring"><ellipse cx="160" cy="82" rx="44" ry="13" /></g>' +
      '<g class="star">' +
        '<polygon points="0,-11 3,-3.4 11,-3.4 4.6,1.5 7,9 0,4.4 -7,9 -4.6,1.5 -11,-3.4 -3.4,-3.4" fill="#F4D892"/>' +
        '<animateMotion dur="1.9s" begin=".35s" fill="freeze" keyPoints="0;0.62" keyTimes="0;1" ' +
          'calcMode="spline" keySplines=".3 0 .2 1" path="' + orbit + '"/>' +
      '</g>';
  }

  /* رفّ تقف عليه كتب، كتابًا بعد كتاب */
  function markShelves() {
    var books = [
      { x: 118, h: 48, c: '#E36559' }, { x: 134, h: 56, c: '#2E7596' },
      { x: 150, h: 44, c: '#6BA368' }, { x: 166, h: 54, c: '#F0B64B' },
      { x: 182, h: 50, c: '#B06FA8' }, { x: 198, h: 42, c: '#4D8FA8' }
    ];
    var out = '';
    books.forEach(function (b, i) {
      out += '<g class="book" style="--t:' + (.42 + i * .08) + 's;--o:' + b.x + 'px">' +
        '<rect x="' + b.x + '" y="' + (118 - b.h) + '" width="12" height="' + b.h + '" rx="2.5" fill="' + b.c + '"/>' +
        '<rect x="' + (b.x + 1.5) + '" y="' + (118 - b.h + 6) + '" width="9" height="2.6" rx="1.3" fill="#FFF8EC" opacity=".75"/>' +
        '<rect x="' + (b.x + 1.5) + '" y="' + (112) + '" width="9" height="2.6" rx="1.3" fill="#FFF8EC" opacity=".6"/>' +
        '</g>';
    });
    out += '<g class="plank">' +
      '<rect x="104" y="118" width="112" height="9" rx="4" fill="#D9A868"/>' +
      '<rect x="104" y="118" width="112" height="3" rx="1.5" fill="#EFC98F"/>' +
      '<rect x="112" y="127" width="10" height="7" rx="2" fill="#A4702F"/>' +
      '<rect x="198" y="127" width="10" height="7" rx="2" fill="#A4702F"/>' +
      '</g>';
    return out;
  }

  /* حصّالة شفافة تسقط فيها قطعة نقود */
  function markJar() {
    var coins = '';
    [[150, 118, 0], [166, 116, -14], [136, 115, 12], [158, 110, 8], [143, 108, -8]].forEach(function (c, i) {
      coins += '<g class="jc jc' + i + '" transform="translate(' + c[0] + ',' + c[1] + ') rotate(' + c[2] + ')">' +
        '<ellipse cx="0" cy="0" rx="9" ry="8.4" fill="#A9B3BA"/>' +
        '<ellipse cx="0" cy="-0.7" rx="8" ry="7.4" fill="#D2D9DE"/>' +
        '<ellipse cx="0" cy="-0.7" rx="5" ry="4.6" fill="none" stroke="#8C98A1" stroke-width="1"/>' +
        '</g>';
    });
    return '<path class="jar" d="M126 60 C120 102 124 124 140 124 H162 C178 124 182 102 176 60 Z" ' +
        'fill="rgba(206,230,240,.55)" stroke="#9DBDCB" stroke-width="3.6"/>' +
      '<path class="jar" d="M136 62 q0 -12 3 -16 h24 q3 4 3 16" fill="rgba(206,230,240,.55)" stroke="#9DBDCB" stroke-width="3"/>' +
      '<rect class="lid" x="133" y="40" width="36" height="11" rx="4.5" fill="#2E7596" stroke="#FFF8EC" stroke-width="2.2"/>' +
      '<rect class="lid" x="144" y="43.6" width="14" height="4" rx="2" fill="#1A4A61"/>' +
      '<g class="drop"><ellipse cx="151" cy="26" rx="9" ry="8.4" fill="#C9A227"/>' +
        '<ellipse cx="151" cy="25.3" rx="8" ry="7.4" fill="#EBCE78"/>' +
        '<ellipse cx="151" cy="25.3" rx="5" ry="4.6" fill="none" stroke="#A8841A" stroke-width="1"/></g>' +
      coins +
      '<path class="shine" d="M133 70 q-3 30 1 46" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity=".8"/>';
  }

  /* سفينة تُبحر على موجة نحو جزيرة عليها علم */
  function markVoyage() {
    return '<g class="isle">' +
        '<path d="M190 122 q8 -16 20 -16 q12 0 20 16 z" fill="#E8D49B"/>' +
        '<rect x="208" y="92" width="2.6" height="16" rx="1.3" fill="#7B4630"/>' +
        '<path d="M210.6 92 l9 3.4 l-9 3.4 z" fill="#F0C23C"/>' +
      '</g>' +
      '<g class="boat" transform="translate(150,104)">' +
        '<path class="hull" d="M-26 6 h52 l-10 18 h-32 z" fill="#9C5B3C" stroke="#FFF8EC" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<rect x="-1.6" y="-38" width="3.4" height="44" rx="1.7" fill="#7B4630"/>' +
        '<path class="sail1" d="M3 -36 l22 30 h-22 z" fill="#FFF8EC" stroke="#C7AE74" stroke-width="2" stroke-linejoin="round"/>' +
        '<path class="sail2" d="M-2.6 -28 l-20 22 h20 z" fill="#E36559" stroke="#FFF8EC" stroke-width="2" stroke-linejoin="round"/>' +
        '<path class="pennant" d="M3 -38 v-9 l15 4.6 z" fill="#F0C23C"/>' +
      '</g>' +
      '<path class="wave" d="M104 126 q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" ' +
        'stroke="#7FB0C6" stroke-width="3.4" stroke-linecap="round"/>';
  }

  var MARKS = { garden: markGarden, galaxy: markGalaxy, shelves: markShelves,
                voyage: markVoyage, coinjar: markJar };

  /* ------------------------------ التنسيقات ------------------------------- */
  function css(id, k) {
    var s = SKIN[k] || SKIN.garden;
    var base =
      '#' + id + '{direction:rtl;overflow:visible}' +
      '#' + id + ' .word{font-family:"Readex Pro","Vazirmatn","Noto Kufi Arabic",system-ui,sans-serif;' +
        'font-weight:800;font-size:52px;fill:' + s.ink + ';letter-spacing:1px;' +
        'opacity:0;animation:' + id + '-up .7s cubic-bezier(.22,1,.3,1) 1s both}' +
      '#' + id + ' .rule{stroke:' + s.line + ';stroke-width:2.6;stroke-linecap:round;' +
        'transform-origin:160px 250px;transform:scaleX(0);animation:' + id + '-rule .6s cubic-bezier(.22,1,.3,1) 1.25s both}' +
      '#' + id + ' .tag{font-family:"Vazirmatn",system-ui,sans-serif;font-weight:500;font-size:16px;' +
        'fill:' + s.soft + ';opacity:0;animation:' + id + '-up .6s ease 1.45s both}' +
      '@keyframes ' + id + '-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
      '@keyframes ' + id + '-rule{to{transform:scaleX(1)}}' +
      '@keyframes ' + id + '-pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}';

    if (k === 'galaxy') {
      base +=
        '#' + id + ' .orbit{fill:none;stroke:' + s.line + ';stroke-width:2.2;stroke-dasharray:6 7;' +
          'stroke-linecap:round;stroke-dashoffset:300;animation:' + id + '-draw 1.1s ease .1s both}' +
        '#' + id + ' .planet{transform-origin:160px 82px;animation:' + id + '-pop .7s cubic-bezier(.3,1.5,.5,1) .25s both}' +
        '#' + id + ' .band{stroke:#17465C;stroke-width:3.4;stroke-linecap:round;opacity:0;' +
          'animation:' + id + '-fade .5s ease .7s both}' +
        '#' + id + ' .shine{opacity:0;animation:' + id + '-fade .5s ease .6s both;animation-fill-mode:both}' +
        '#' + id + ' .ring ellipse{fill:none;stroke:#94BEBB;stroke-width:3.2;transform-origin:160px 82px;' +
          'transform:rotate(-18deg) scaleX(.2);opacity:0;animation:' + id + '-ring .8s cubic-bezier(.22,1,.3,1) .5s both}' +
        '#' + id + ' .star{opacity:0;animation:' + id + '-fade .4s ease .35s both}' +
        '@keyframes ' + id + '-draw{to{stroke-dashoffset:0}}' +
        '@keyframes ' + id + '-fade{to{opacity:1}}' +
        '@keyframes ' + id + '-ring{to{opacity:.95;transform:rotate(-18deg) scaleX(1)}}';
    } else if (k === 'shelves') {
      base +=
        '#' + id + ' .plank{transform-origin:160px 122px;transform:scaleX(0);' +
          'animation:' + id + '-plank .6s cubic-bezier(.22,1,.3,1) .1s both}' +
        '#' + id + ' .book{transform-origin:center 118px;opacity:0;' +
          'animation:' + id + '-book .55s cubic-bezier(.3,1.5,.5,1) var(--t) both}' +
        '@keyframes ' + id + '-plank{to{transform:scaleX(1)}}' +
        '@keyframes ' + id + '-book{from{opacity:0;transform:translateY(16px) scaleY(.5)}' +
          'to{opacity:1;transform:none}}';
    } else if (k === 'coinjar') {
      base +=
        '#' + id + ' .jar{opacity:0;animation:' + id + '-fadeup .6s cubic-bezier(.22,1,.3,1) .15s both}' +
        '#' + id + ' .lid{opacity:0;animation:' + id + '-fadeup .5s cubic-bezier(.3,1.4,.5,1) .4s both}' +
        '#' + id + ' .shine{opacity:0;animation:' + id + '-fade .5s ease .9s both}' +
        '#' + id + ' .jc{opacity:0;animation:' + id + '-pop .45s cubic-bezier(.3,1.5,.5,1) both}' +
        '#' + id + ' .jc0{animation-delay:.55s}#' + id + ' .jc1{animation-delay:.63s}' +
        '#' + id + ' .jc2{animation-delay:.71s}#' + id + ' .jc3{animation-delay:.79s}' +
        '#' + id + ' .jc4{animation-delay:.87s}' +
        '#' + id + ' .drop{animation:' + id + '-drop 1.1s cubic-bezier(.4,0,.6,1) 1s both}' +
        '@keyframes ' + id + '-fade{to{opacity:1}}' +
        '@keyframes ' + id + '-fadeup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
        '@keyframes ' + id + '-drop{0%{opacity:0;transform:translateY(-22px)}' +
          '30%{opacity:1}70%{opacity:1;transform:translateY(16px)}100%{opacity:0;transform:translateY(30px)}}';
    } else if (k === 'voyage') {
      base +=
        '#' + id + ' .wave{stroke-dasharray:132;stroke-dashoffset:132;' +
          'animation:' + id + '-draw .9s ease .1s both}' +
        '#' + id + ' .boat{animation:' + id + '-sail 1s cubic-bezier(.22,1,.3,1) .25s both,' +
          id + '-bob 3.2s ease-in-out 1.3s infinite}' +
        '#' + id + ' .sail1{transform-origin:3px -6px;animation:' + id + '-pop .55s cubic-bezier(.3,1.5,.5,1) .7s both}' +
        '#' + id + ' .sail2{transform-origin:-3px -6px;animation:' + id + '-pop .55s cubic-bezier(.3,1.5,.5,1) .82s both}' +
        '#' + id + ' .isle{opacity:0;animation:' + id + '-fadeup .6s ease .5s both}' +
        '@keyframes ' + id + '-draw{to{stroke-dashoffset:0}}' +
        '@keyframes ' + id + '-sail{from{transform:translate(104px,104px)}to{transform:translate(150px,104px)}}' +
        '@keyframes ' + id + '-bob{50%{transform:translate(150px,100px) rotate(-3deg)}}' +
        '@keyframes ' + id + '-fadeup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}';
    } else {
      base +=
        '#' + id + ' .trunk{fill:none;stroke:#9C7B4C;stroke-width:9;stroke-linecap:round;' +
          'stroke-dasharray:46;stroke-dashoffset:46;animation:' + id + '-grow .7s cubic-bezier(.22,1,.3,1) .15s both}' +
        '#' + id + ' .frond{transform-origin:160px 90px;opacity:0;' +
          'animation:' + id + '-pop .6s cubic-bezier(.3,1.5,.5,1) var(--t) both}' +
        '#' + id + ' .dates{transform-origin:160px 92px;opacity:0;' +
          'animation:' + id + '-drop .6s cubic-bezier(.3,1.6,.5,1) .95s both}' +
        '#' + id + ' .ground{fill:none;stroke:' + s.line + ';stroke-width:3.4;stroke-linecap:round;' +
          'transform-origin:160px 130px;transform:scaleX(0);animation:' + id + '-rule .6s ease .5s both}' +
        '@keyframes ' + id + '-grow{to{stroke-dashoffset:0}}' +
        '@keyframes ' + id + '-drop{from{opacity:0;transform:translateY(-14px) scale(.5)}to{opacity:1;transform:none}}';
    }
    return base;
  }

  /* opts: word (الكلمة)، tag (العنوان الصغير)، height
     العلامة مرسومة في مربّع صغير، فتُكبَّر داخل التركيبة الكاملة وتُقصّ وحدها */
  var MARK_BOX = '98 28 124 112';
  /* الحصّالة أضيق من بقيّة العلامات، فلها إطارها */
  var MARK_BOXES = { coinjar: '114 12 74 126' };

  function svg(opts) {
    opts = opts || {};
    var k = (global.Theme && global.Theme.id) || 'garden';
    if (!MARKS[k]) k = 'garden';
    var id = 'bl' + (++seq);
    var showWord = opts.word !== false;
    var showTag = opts.tag !== false && showWord;
    var mark = '<g class="mark">' + MARKS[k]() + '</g>';
    var box, body;

    if (!showWord) {
      box = MARK_BOXES[k] || MARK_BOX;
      body = mark;
    } else {
      box = '0 0 320 ' + (showTag ? 292 : 250);
      body = '<g transform="translate(160 96) scale(1.62) translate(-160 -85)">' + mark + '</g>' +
        '<text class="word" x="160" y="232" text-anchor="middle">' + (WORD[k] || '') + '</text>';
      if (showTag) {
        body += '<path class="rule" d="M110 250 H210"/>' +
          '<text class="tag" x="160" y="276" text-anchor="middle">' +
          ((global.Theme && global.Theme.title) || '') + '</text>';
      }
    }
    return '<svg id="' + id + '" class="logo-svg" viewBox="' + box + '" ' +
      'role="img" aria-label="' + (WORD[k] || '') + '"' +
      (opts.height ? ' height="' + opts.height + '"' : '') + '>' +
      '<style>' + css(id, k) + '</style>' + body + '</svg>';
  }

  /* شاشة الافتتاح: تظهر مرّة عند فتح الصفحة وتُغلق باللمس أو بعد ثانيتين ونصف */
  function splash(done) {
    var el = document.getElementById('splash');
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduced) { if (done) done(); return; }
    el.innerHTML = svg({ word: true, tag: true });
    el.classList.add('show');
    var closed = false;
    function finish() {
      if (closed) return;
      closed = true;
      el.classList.add('out');
      setTimeout(function () {
        el.classList.remove('show', 'out');
        el.innerHTML = '';
        if (done) done();
      }, 420);
    }
    setTimeout(finish, 2600);
    el.addEventListener('click', finish);
    document.addEventListener('keydown', finish, { once: true });
  }

  global.BustanLogo = { svg: svg, splash: splash, word: function () {
    return WORD[(global.Theme && global.Theme.id) || 'garden'] || '';
  } };
})(window);

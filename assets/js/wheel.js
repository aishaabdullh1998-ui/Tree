/* ==========================================================================
   عجلة الحظ - اختيار اسم طالب عشوائيًا بطابع البستان
   ========================================================================== */
(function (global) {
  'use strict';
  var Sound = global.Sound;

  /* ألوان القطاعات: سبعة ألوان لا يتجاور منها لونان متشابهان */
  var SEG = [
    { fill: '#657652', text: '#F6F2E6' },   /* PALM     */
    { fill: '#F4D892', text: '#4A4420' },   /* BUTTER   */
    { fill: '#E36559', text: '#FFF2EE' },   /* SANGRIA  */
    { fill: '#94BEBB', text: '#20413F' },   /* LAGOON   */
    { fill: '#E89C73', text: '#4C2B16' },   /* SUNSET   */
    { fill: '#23617E', text: '#E8F1F5' },   /* ODYSSEY  */
    { fill: '#C0B05B', text: '#403A16' },   /* MOSS     */
    { fill: '#F2B6A3', text: '#5A3024' }    /* GUAVA    */
  ];

  var CX = 200, CY = 200, R = 178, LABEL_R = 164, HUB = 46;
  var LABEL_X = CX + LABEL_R;   /* الطرف الخارجي للنص عند الحافة */
  var TURNS = 6, DUR = 5200;

  function f(n) { return Math.round(n * 100) / 100; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* نقطة على المحيط، الزاوية محسوبة من الأعلى باتجاه عقارب الساعة */
  function pt(deg, r) {
    var a = (deg - 90) * Math.PI / 180;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
  }

  function Wheel(opts) {
    this.get = opts.get;
    this.save = opts.save;
    this.beforeOpen = opts.beforeOpen || function () {};
    this.onClose = opts.onClose || function () {};
    this.openSettings = opts.openSettings || null;
    this.angle = 0;
    this.spinning = false;
    this.ov = null;
    this.raf = null;
  }

  Wheel.prototype.data = function () {
    var d = this.get();
    if (!Array.isArray(d.list)) d.list = [];
    if (!Array.isArray(d.picked)) d.picked = [];
    return d;
  };

  Wheel.prototype.remaining = function () {
    var d = this.data();
    if (!d.skipPicked) return d.list.slice();
    return d.list.filter(function (n) { return d.picked.indexOf(n) === -1; });
  };

  /* ------------------------------- رسم العجلة ----------------------------- */
  Wheel.prototype.wheelSvg = function () {
    var d = this.data(), list = d.list, n = list.length;
    if (!n) {
      return '<div class="wheel-empty">' +
        '<span class="wheel-empty-ico" aria-hidden="true">🎡</span>' +
        '<p>لا توجد أسماء في العجلة بعد.</p>' +
        '<p class="wheel-empty-hint">أضيفي أسماء طلابك من صفحة الإعدادات، اسمًا في كل سطر. ' +
        'تبقى الأسماء محفوظة في هذا الجهاز وحده.</p>' +
        '<button class="btn btn--primary" id="wheel-add-names" type="button">⚙️ أضيفي الأسماء</button>' +
      '</div>';
    }
    var a = 360 / n, i, parts = [], labels = [];
    var fs = n <= 12 ? 18 : (n <= 20 ? 16 : (n <= 34 ? 13 : (n <= 48 ? 11 : 9)));

    for (i = 0; i < n; i++) {
      var s0 = i * a, s1 = (i + 1) * a;
      var p0 = pt(s0, R), p1 = pt(s1, R);
      var big = a > 180 ? 1 : 0;
      var done = d.picked.indexOf(list[i]) !== -1;
      var tone = SEG[i % SEG.length];
      var fill = done ? '#E7DCCB' : tone.fill;
      var col = done ? '#A6AE97' : tone.text;

      parts.push('<path class="seg' + (done ? ' done' : '') + '" data-i="' + i + '" d="M' + f(CX) + ' ' + f(CY) +
        ' L' + f(p0.x) + ' ' + f(p0.y) + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + f(p1.x) + ' ' + f(p1.y) + ' Z" fill="' + fill + '"/>');

      /* الاسم ممتدًّا من الحافة نحو المركز، مقلوبًا في النصف الأيسر ليبقى مقروءًا */
      var c = s0 + a / 2;
      var rot = ((c - 90) % 360 + 360) % 360;
      var flip = rot > 90 && rot < 270;
      labels.push('<g transform="rotate(' + f(c - 90) + ' ' + CX + ' ' + CY + ')">' +
        '<text class="seg-label" data-i="' + i + '" transform="translate(' + LABEL_X + ' ' + CY + ')' +
        (flip ? ' rotate(180)' : '') + '" text-anchor="' + (flip ? 'end' : 'start') +
        '" dominant-baseline="middle" font-size="' + fs + '" fill="' + col + '">' +
        (done ? '✓ ' : '') + esc(list[i]) + '</text></g>');
    }

    return '<svg class="wheel-svg" viewBox="0 0 400 400" aria-hidden="true">' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + (R + 10) + '" fill="#D8C5AE"/>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + (R + 4) + '" fill="#F3E7DA"/>' +
      '<g class="wheel-rotor">' + parts.join('') + labels.join('') + '</g>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="#C3AE94" stroke-width="3"/>' +
      '<circle class="hub" cx="' + CX + '" cy="' + CY + '" r="' + HUB + '" fill="#FCF6EE" stroke="#C3AE94" stroke-width="4"/>' +
      '<text class="hub-text" x="' + CX + '" y="' + CY + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-size="19" font-weight="800" fill="#657652">أدِر</text>' +
      '<g class="wheel-pointer">' +
        '<path d="M200 48 l16 -26 h-32 Z" fill="#E36559"/>' +
        '<path d="M200 26 m-18 -4 a18 14 0 1 1 36 0 Z" fill="#C3AE94"/>' +
        '<circle cx="200" cy="18" r="7" fill="#EFCE4B" stroke="#C3AE94" stroke-width="2.5"/>' +
      '</g></svg>';
  };

  /* -------------------------------- النافذة ------------------------------- */
  Wheel.prototype.open = function () {
    var self = this;
    this.close();
    this.beforeOpen();
    var d = this.data();

    var ov = document.createElement('div');
    ov.className = 'overlay wheel-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'عجلة الحظ');
    ov.innerHTML =
      '<div class="sheet wheel-sheet">' +
        '<h2 style="justify-content:center">🎡 عجلة الحظ</h2>' +
        '<p class="wheel-result" id="wheel-result" role="status" aria-live="polite">' +
          (d.list.length ? 'اضغطي على العجلة لاختيار اسم' : '') + '</p>' +
        '<div class="wheel-stage">' + this.wheelSvg() + '</div>' +
        '<p class="wheel-count" id="wheel-count"></p>' +
        '<label class="switch wheel-skip"><input type="checkbox" id="wheel-skip"' + (d.skipPicked ? ' checked' : '') +
          '> عدم تكرار الاسم المختار</label>' +
        '<div class="sheet-actions" style="justify-content:center">' +
          '<button class="btn btn--primary" id="wheel-spin" type="button">🎡 أدِر العجلة</button>' +
          '<button class="btn" id="wheel-reset" type="button">↺ إعادة الجميع</button>' +
          '<button class="btn" id="wheel-close" type="button">إغلاق</button>' +
        '</div>' +
      '</div>';

    document.getElementById('modal-root').appendChild(ov);
    this.ov = ov;

    ov.addEventListener('mousedown', function (e) { if (e.target === ov) self.close(); });
    ov.querySelector('#wheel-close').addEventListener('click', function () { self.close(); });
    ov.querySelector('#wheel-spin').addEventListener('click', function () { self.spin(); });
    ov.querySelector('#wheel-reset').addEventListener('click', function () { self.resetPicked(); });
    this.bindStage();
    ov.querySelector('#wheel-skip').addEventListener('change', function (e) {
      self.data().skipPicked = e.target.checked;
      self.save();
      self.refresh();
    });

    this.escHandler = function (e) { if (e.key === 'Escape') self.close(); };
    document.addEventListener('keydown', this.escHandler);

    this.applyAngle();
    this.refresh();
    ov.querySelector('#wheel-spin').focus();
  };

  Wheel.prototype.close = function () {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    this.spinning = false;
    if (this.escHandler) { document.removeEventListener('keydown', this.escHandler); this.escHandler = null; }
    if (this.ov) { this.ov.remove(); this.ov = null; this.onClose(); }
  };

  Wheel.prototype.applyAngle = function () {
    if (!this.ov) return;
    var rotor = this.ov.querySelector('.wheel-rotor');
    if (rotor) rotor.setAttribute('transform', 'rotate(' + f(this.angle) + ' ' + CX + ' ' + CY + ')');
  };

  Wheel.prototype.refresh = function () {
    if (!this.ov) return;
    var d = this.data();
    var left = this.remaining().length;
    var cnt = this.ov.querySelector('#wheel-count');
    if (!d.list.length) {
      cnt.textContent = '';
      var r = this.ov.querySelector('#wheel-result');
      r.textContent = '';
      r.classList.remove('win');
      this.ov.querySelector('#wheel-spin').disabled = true;
      this.ov.querySelector('#wheel-reset').disabled = true;
      return;
    }
    this.ov.querySelector('#wheel-reset').disabled = false;
    if (d.skipPicked) {
      cnt.textContent = left ? 'بقي ' + left + ' من ' + d.list.length + ' اسمًا'
                             : 'اكتملت القائمة — اضغطي «إعادة الجميع» للبدء من جديد';
    } else {
      cnt.textContent = d.list.length + ' اسمًا في العجلة';
    }
    this.ov.querySelector('#wheel-spin').disabled = this.spinning || left === 0;
  };

  Wheel.prototype.bindStage = function () {
    var self = this, ov = this.ov;
    if (!ov) return;
    var hub = ov.querySelector('.hub'), hubText = ov.querySelector('.hub-text');
    if (hub) hub.addEventListener('click', function () { self.spin(); });
    if (hubText) hubText.addEventListener('click', function () { self.spin(); });
    var add = ov.querySelector('#wheel-add-names');
    if (add) add.addEventListener('click', function () {
      var open = self.openSettings;
      self.close();
      if (open) open();
    });
  };

  Wheel.prototype.redraw = function () {
    if (!this.ov) return;
    this.ov.querySelector('.wheel-stage').innerHTML = this.wheelSvg();
    this.bindStage();
    this.applyAngle();
    this.refresh();
  };

  Wheel.prototype.resetPicked = function () {
    if (this.spinning || !this.data().list.length) return;
    this.data().picked = [];
    this.save();
    this.redraw();
    this.ov.querySelector('#wheel-result').textContent = 'عادت كل الأسماء إلى العجلة';
    this.ov.querySelector('#wheel-result').classList.remove('win');
    Sound.sparkle();
  };

  /* ------------------------------- الإدارة -------------------------------- */
  Wheel.prototype.spin = function () {
    if (this.spinning || !this.ov) return;
    var d = this.data(), n = d.list.length;
    if (!n) return;

    var pool = [], i;
    for (i = 0; i < n; i++) {
      if (!d.skipPicked || d.picked.indexOf(d.list[i]) === -1) pool.push(i);
    }
    if (!pool.length) {
      this.ov.querySelector('#wheel-result').textContent = 'لم يبقَ اسم — اضغطي «إعادة الجميع»';
      return;
    }

    Sound.unlock();
    this.spinning = true;
    this.refresh();
    var res = this.ov.querySelector('#wheel-result');
    res.textContent = 'تدور…';
    res.classList.remove('win');
    var old = this.ov.querySelector('.seg.win');
    if (old) old.classList.remove('win');

    var target = pool[Math.floor(Math.random() * pool.length)];
    var a = 360 / n;
    var center = target * a + a / 2;
    var jitter = (Math.random() * 0.56 - 0.28) * a;
    var from = this.angle;
    var to = -center + jitter;
    while (to < from + 360 * TURNS) to += 360;

    var self = this, t0 = null, lastSeg = Math.floor(from / a), lastTick = 0;

    function frame(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / DUR);
      var e = 1 - Math.pow(1 - t, 4.2);
      self.angle = from + (to - from) * e;
      self.applyAngle();

      var seg = Math.floor(self.angle / a);
      if (seg !== lastSeg) {
        lastSeg = seg;
        if (now - lastTick > 42) { lastTick = now; Sound.tick(); }
      }

      if (t < 1) { self.raf = requestAnimationFrame(frame); }
      else { self.raf = null; self.land(target); }
    }
    this.raf = requestAnimationFrame(frame);
  };

  Wheel.prototype.land = function (index) {
    var d = this.data();
    var name = d.list[index];
    this.angle = ((this.angle % 360) + 360) % 360;
    this.applyAngle();
    this.spinning = false;

    if (d.picked.indexOf(name) === -1) d.picked.push(name);
    this.save();

    var res = this.ov.querySelector('#wheel-result');
    res.textContent = '🎉 ' + name;
    res.classList.add('win');

    var seg = this.ov.querySelector('.seg[data-i="' + index + '"]');
    if (seg) seg.classList.add('win');
    var lab = this.ov.querySelector('.seg-label[data-i="' + index + '"]');
    if (lab) lab.classList.add('win');

    this.refresh();
    Sound.fanfare();
    if (global.BustanRain) global.BustanRain(28);

    /* تلوين القطاعات المنتهية بعد لحظة، مع إبقاء الفائز بارزًا */
    var self = this;
    setTimeout(function () {
      if (!self.ov || self.spinning) return;
      var s = self.ov.querySelector('.seg[data-i="' + index + '"]');
      if (s) s.classList.remove('win');
      var l = self.ov.querySelector('.seg-label[data-i="' + index + '"]');
      if (l) l.classList.remove('win');
      self.redraw();
      var r = self.ov.querySelector('#wheel-result');
      r.textContent = '🎉 ' + name;
      r.classList.add('win');
    }, 4200);
  };

  global.BustanWheel = { create: function (o) { return new Wheel(o); } };
})(window);

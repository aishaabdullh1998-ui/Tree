/* ==========================================================================
   مؤقّت البستان - حلقة تتناقص وعليها رطبة تتحرّك مع الوقت
   ========================================================================== */
(function (global) {
  'use strict';
  var T = global.Trees, Sound = global.Sound;

  var PRESETS = [
    { s: 30,   label: '٣٠ ثانية' },
    { s: 60,   label: 'دقيقة' },
    { s: 120,  label: 'دقيقتان' },
    { s: 180,  label: '٣ دقائق' },
    { s: 300,  label: '٥ دقائق' },
    { s: 600,  label: '١٠ دقائق' }
  ];

  var MIN = 5, MAX = 3600;

  function clamp(n) { return Math.max(MIN, Math.min(MAX, Math.round(n) || MIN)); }

  function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function ringSvg(cls, r, headScale, ticks) {
    var c = 2 * Math.PI * r, box = r * 2 + 12, mid = box / 2, marks = '';
    if (ticks) {
      for (var i = 0; i < 12; i++) {
        var a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        var r1 = r - 10, r2 = r - (i % 3 === 0 ? 17 : 14);
        marks += '<line class="tr-tick" x1="' + (mid + r1 * Math.cos(a)).toFixed(2) + '" y1="' + (mid + r1 * Math.sin(a)).toFixed(2) +
          '" x2="' + (mid + r2 * Math.cos(a)).toFixed(2) + '" y2="' + (mid + r2 * Math.sin(a)).toFixed(2) +
          '" stroke-width="' + (i % 3 === 0 ? 3 : 2) + '"/>';
      }
    }
    return '<svg class="' + cls + '" viewBox="0 0 ' + box + ' ' + box + '" aria-hidden="true">' +
      marks +
      '<circle class="tr-track" cx="' + mid + '" cy="' + mid + '" r="' + r + '"/>' +
      '<circle class="tr-arc" cx="' + mid + '" cy="' + mid + '" r="' + r + '" ' +
        'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="0" ' +
        'transform="rotate(-90 ' + mid + ' ' + mid + ')"/>' +
      '<g class="tr-head" transform="translate(' + mid + ',' + (mid - r) + ') scale(' + headScale + ')">' +
        T.fruitShape('nakhla') + '</g></svg>';
  }

  function Timer(opts) {
    this.mount = opts.mount;
    this.get = opts.get;              /* يُعيد كائن الحالة المحفوظ */
    this.save = opts.save;            /* يحفظ التغييرات */
    this.beforeOpen = opts.beforeOpen || function () {};  /* يُغلق النوافذ الأخرى */
    this.endAt = 0;
    this.tickId = null;
    this.lastBeep = -1;
    this.big = null;
    this.render();
    this.refresh();
  }

  Timer.prototype.data = function () {
    var d = this.get();
    if (!d.duration) d.duration = 120;
    if (d.remaining == null) d.remaining = d.duration;
    return d;
  };

  /* ------------------------------ بناء الواجهة ---------------------------- */
  Timer.prototype.render = function () {
    this.mount.innerHTML =
      '<div class="timer-face">' +
        '<span class="timer-ring-wrap">' + ringSvg('timer-ring', 20, 0.62) + '</span>' +
        '<span class="timer-time" id="t-time">00:00</span>' +
      '</div>' +
      '<div class="timer-ctrl">' +
        '<button class="tbtn t-toggle" type="button" aria-label="تشغيل المؤقّت">▶</button>' +
        '<button class="tbtn t-reset" type="button" aria-label="إعادة ضبط المؤقّت">↺</button>' +
        '<button class="tbtn t-open" type="button" aria-label="تكبير المؤقّت">⤢</button>' +
      '</div>';

    var self = this;
    this.mount.querySelector('.t-toggle').addEventListener('click', function () { self.toggle(); });
    this.mount.querySelector('.t-reset').addEventListener('click', function () { self.reset(); });
    this.mount.querySelector('.t-open').addEventListener('click', function () { self.openBig(); });
  };

  /* -------------------------------- التشغيل ------------------------------- */
  Timer.prototype.isRunning = function () { return this.tickId !== null; };

  Timer.prototype.toggle = function () {
    Sound.unlock();
    if (this.isRunning()) this.pause(); else this.start();
  };

  Timer.prototype.start = function () {
    var d = this.data();
    if (d.remaining <= 0) d.remaining = d.duration;
    this.endAt = Date.now() + d.remaining * 1000;
    this.lastBeep = -1;
    if (this.tickId) clearInterval(this.tickId);
    var self = this;
    this.tickId = setInterval(function () { self.tick(); }, 120);
    this.mount.classList.remove('finished');
    if (this.big) this.big.classList.remove('finished');
    this.refresh();
    Sound.sparkle();
  };

  Timer.prototype.pause = function () {
    if (!this.isRunning()) return;
    var d = this.data();
    d.remaining = Math.max(0, (this.endAt - Date.now()) / 1000);
    clearInterval(this.tickId);
    this.tickId = null;
    this.save();
    this.refresh();
  };

  Timer.prototype.reset = function () {
    var d = this.data();
    if (this.tickId) { clearInterval(this.tickId); this.tickId = null; }
    d.remaining = d.duration;
    this.mount.classList.remove('finished');
    if (this.big) this.big.classList.remove('finished');
    this.save();
    this.refresh();
  };

  Timer.prototype.setDuration = function (sec) {
    var d = this.data();
    d.duration = clamp(sec);
    if (this.tickId) { clearInterval(this.tickId); this.tickId = null; }
    d.remaining = d.duration;
    this.mount.classList.remove('finished');
    if (this.big) this.big.classList.remove('finished');
    this.save();
    this.refresh();
  };

  Timer.prototype.tick = function () {
    var d = this.data();
    var left = (this.endAt - Date.now()) / 1000;

    if (left > 0) {
      var whole = Math.ceil(left);
      if (whole <= 3 && whole !== this.lastBeep) { this.lastBeep = whole; Sound.tickSoft(); }
      d.remaining = left;
      this.refresh();
      return;
    }

    clearInterval(this.tickId);
    this.tickId = null;
    d.remaining = 0;
    this.save();
    this.refresh();
    this.mount.classList.add('finished');
    if (this.big) this.big.classList.add('finished');
    Sound.timeUp();
    this.toast();
  };

  /* -------------------------------- التحديث ------------------------------- */
  Timer.prototype.refresh = function () {
    var d = this.data();
    var frac = d.duration > 0 ? Math.max(0, Math.min(1, d.remaining / d.duration)) : 0;
    var txt = fmt(d.remaining);

    this.paint(this.mount, frac, txt);
    if (this.big) this.paint(this.big, frac, txt);

    var warn = frac <= 0.10 ? 'danger' : (frac <= 0.25 ? 'warn' : '');
    this.mount.classList.remove('warn', 'danger');
    if (warn && d.remaining > 0) this.mount.classList.add(warn);
    if (this.big) {
      this.big.classList.remove('warn', 'danger');
      if (warn && d.remaining > 0) this.big.classList.add(warn);
    }

    var running = this.isRunning();
    var tog = this.mount.querySelector('.t-toggle');
    tog.textContent = running ? '⏸' : '▶';
    tog.setAttribute('aria-label', running ? 'إيقاف المؤقّت مؤقتًا' : 'تشغيل المؤقّت');
    this.mount.classList.toggle('running', running);
    if (this.big) {
      var bt = this.big.querySelector('.t-toggle');
      if (bt) { bt.textContent = running ? '⏸ إيقاف مؤقّت' : '▶ ابدأ'; }
      this.big.classList.toggle('running', running);
    }
  };

  Timer.prototype.paint = function (root, frac, txt) {
    var arc = root.querySelector('.tr-arc');
    var head = root.querySelector('.tr-head');
    var time = root.querySelector('.timer-time');
    if (time) time.textContent = txt;
    if (!arc) return;
    var len = parseFloat(arc.getAttribute('stroke-dasharray'));
    arc.setAttribute('stroke-dashoffset', (len * (1 - frac)).toFixed(2));
    if (head) {
      var r = parseFloat(arc.getAttribute('r'));
      var mid = parseFloat(arc.getAttribute('cx'));
      var ang = (-90 + 360 * frac) * Math.PI / 180;
      var sc = head.getAttribute('data-scale') || (root === this.mount ? 0.62 : 1.5);
      head.setAttribute('transform', 'translate(' + (mid + r * Math.cos(ang)).toFixed(2) + ',' +
        (mid + r * Math.sin(ang)).toFixed(2) + ') scale(' + sc + ')');
      head.style.opacity = frac > 0 ? '1' : '0';
    }
  };

  /* ------------------------------ رسالة الانتهاء -------------------------- */
  Timer.prototype.toast = function () {
    var old = document.querySelector('.time-toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'time-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span aria-hidden="true">⏳</span> انتهى الوقت!';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 3400);
    setTimeout(function () { el.remove(); }, 4000);
  };

  /* ------------------------------ المؤقّت الكبير --------------------------- */
  Timer.prototype.openBig = function () {
    var self = this, d = this.data();
    this.closeBig();
    this.beforeOpen();
    var chips = PRESETS.map(function (p) {
      return '<button class="chip' + (p.s === d.duration ? ' on' : '') + '" type="button" data-sec="' + p.s + '">' + p.label + '</button>';
    }).join('');

    var ov = document.createElement('div');
    ov.className = 'overlay timer-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'مؤقّت النشاط');
    ov.innerHTML =
      '<div class="sheet timer-big">' +
        '<h2 style="justify-content:center">⏳ مؤقّت النشاط</h2>' +
        '<div class="timer-face big">' +
          '<span class="timer-ring-wrap">' + ringSvg('timer-ring', 84, 1.5, true) + '</span>' +
          '<span class="timer-time">00:00</span>' +
        '</div>' +
        '<div class="chips">' + chips +
          '<label class="chip custom"><input type="number" min="1" max="60" step="1" id="t-custom" placeholder="؟" aria-label="دقائق مخصّصة"> دقيقة</label>' +
        '</div>' +
        '<div class="sheet-actions" style="justify-content:center">' +
          '<button class="btn btn--primary t-toggle" type="button">▶ ابدأ</button>' +
          '<button class="btn t-reset" type="button">↺ إعادة</button>' +
          '<button class="btn" data-close type="button">إغلاق</button>' +
        '</div>' +
      '</div>';

    document.getElementById('modal-root').appendChild(ov);
    this.big = ov;
    if (this.mount.classList.contains('finished')) ov.classList.add('finished');

    ov.addEventListener('mousedown', function (e) { if (e.target === ov) self.closeBig(); });
    ov.querySelector('[data-close]').addEventListener('click', function () { self.closeBig(); });
    ov.querySelector('.t-toggle').addEventListener('click', function () { self.toggle(); });
    ov.querySelector('.t-reset').addEventListener('click', function () { self.reset(); });
    Array.prototype.forEach.call(ov.querySelectorAll('.chip[data-sec]'), function (b) {
      b.addEventListener('click', function () {
        self.setDuration(+b.getAttribute('data-sec'));
        Array.prototype.forEach.call(ov.querySelectorAll('.chip[data-sec]'), function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var ci = ov.querySelector('#t-custom'); if (ci) ci.value = '';
      });
    });
    var custom = ov.querySelector('#t-custom');
    custom.addEventListener('change', function () {
      var m = parseFloat(custom.value);
      if (!m || m <= 0) return;
      self.setDuration(Math.min(60, m) * 60);
      Array.prototype.forEach.call(ov.querySelectorAll('.chip[data-sec]'), function (x) { x.classList.remove('on'); });
    });

    this.escHandler = function (e) { if (e.key === 'Escape') self.closeBig(); };
    document.addEventListener('keydown', this.escHandler);
    this.refresh();
    ov.querySelector('.t-toggle').focus();
  };

  Timer.prototype.closeBig = function () {
    if (!this.big) return;
    this.big.remove();
    this.big = null;
    if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
    this.refresh();
  };

  global.BustanTimer = { create: function (o) { return new Timer(o); }, PRESETS: PRESETS, fmt: fmt };
})(window);

/* ==========================================================================
   المجموعات السريعة - توزيع أسماء الطلاب على مجموعات بشكل عشوائي
   ========================================================================== */
(function (global) {
  'use strict';
  var Sound = global.Sound;

  /* ألوان الباليت لبطاقات المجموعات */
  var TONE = [
    { bg: '#657652', ink: '#F6F2E6', soft: 'rgba(246,242,230,.18)' },  /* PALM    */
    { bg: '#F4D892', ink: '#4A4420', soft: 'rgba(74,68,32,.10)'     },  /* BUTTER  */
    { bg: '#E36559', ink: '#FFF2EE', soft: 'rgba(255,242,238,.18)' },  /* SANGRIA */
    { bg: '#94BEBB', ink: '#20413F', soft: 'rgba(32,65,63,.10)'     },  /* LAGOON  */
    { bg: '#E89C73', ink: '#4C2B16', soft: 'rgba(76,43,22,.10)'     },  /* SUNSET  */
    { bg: '#23617E', ink: '#E8F1F5', soft: 'rgba(232,241,245,.18)' },  /* ODYSSEY */
    { bg: '#C0B05B', ink: '#403A16', soft: 'rgba(64,58,22,.10)'     },  /* MOSS    */
    { bg: '#F2B6A3', ink: '#5A3024', soft: 'rgba(90,48,36,.10)'     }   /* GUAVA   */
  ];

  var ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة',
             'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة'];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function groupName(i) { return 'المجموعة ' + (ORD[i] || (i + 1)); }

  /* خلط فيشر-ييتس */
  function shuffle(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* توزيع متساوٍ: الفائض يُضاف فردًا فردًا بدل ترك مجموعة ناقصة */
  function split(names, nGroups) {
    var a = shuffle(names), out = [], base = Math.floor(a.length / nGroups),
        rem = a.length % nGroups, k = 0, i, size;
    for (i = 0; i < nGroups; i++) {
      size = base + (i < rem ? 1 : 0);
      out.push(a.slice(k, k + size));
      k += size;
    }
    return out;
  }

  function groupsCount(total, mode, value) {
    if (mode === 'count') return Math.max(1, Math.min(total, value));
    /* mode === 'size': مجموعات بحجم value، والفائض يوزَّع عليها */
    return Math.max(1, Math.min(total, Math.floor(total / value) || 1));
  }

  function Groups(opts) {
    this.get = opts.get;
    this.save = opts.save;
    this.beforeOpen = opts.beforeOpen || function () {};
    this.openSettings = opts.openSettings || null;
    this.ov = null;
  }

  Groups.prototype.data = function () {
    var d = this.get();
    if (!d.quick) d.quick = { mode: 'size', size: 5, count: 4, last: null };
    if (!Array.isArray(d.list)) d.list = [];
    return d;
  };

  /* -------------------------------- النافذة ------------------------------- */
  Groups.prototype.open = function () {
    var self = this;
    this.close();
    this.beforeOpen();
    var d = this.data(), q = d.quick, n = d.list.length;

    var body = n
      ? '<div class="qg-controls">' +
          '<div class="qg-modes" role="radiogroup" aria-label="طريقة التقسيم">' +
            '<button class="chip' + (q.mode === 'size' ? ' on' : '') + '" type="button" data-mode="size" role="radio" aria-checked="' + (q.mode === 'size') + '">حسب عدد الأفراد</button>' +
            '<button class="chip' + (q.mode === 'count' ? ' on' : '') + '" type="button" data-mode="count" role="radio" aria-checked="' + (q.mode === 'count') + '">حسب عدد المجموعات</button>' +
          '</div>' +
          '<div class="qg-row" id="qg-size"' + (q.mode === 'size' ? '' : ' hidden') + '>' +
            '<span class="qg-label">كم طالبًا في كل مجموعة؟</span>' +
            '<div class="chips">' + [2, 3, 4, 5, 6, 7, 8].map(function (v) {
              return '<button class="chip num' + (v === q.size ? ' on' : '') + '" type="button" data-size="' + v + '">' + v + '</button>';
            }).join('') + '</div>' +
          '</div>' +
          '<div class="qg-row" id="qg-count"' + (q.mode === 'count' ? '' : ' hidden') + '>' +
            '<span class="qg-label">كم مجموعة تريدين؟</span>' +
            '<div class="chips">' + [2, 3, 4, 5, 6, 7, 8].map(function (v) {
              return '<button class="chip num' + (v === q.count ? ' on' : '') + '" type="button" data-count="' + v + '">' + v + '</button>';
            }).join('') + '</div>' +
          '</div>' +
          '<p class="qg-hint" id="qg-hint"></p>' +
        '</div>' +
        '<div class="qg-result" id="qg-result"></div>'
      : '<div class="wheel-empty">' +
          '<span class="wheel-empty-ico" aria-hidden="true">👥</span>' +
          '<p>لا توجد أسماء بعد.</p>' +
          '<p class="wheel-empty-hint">أضيفي أسماء طلابك من صفحة الإعدادات، اسمًا في كل سطر، ' +
          'ثم يوزّعهم الموقع على مجموعات بضغطة واحدة.</p>' +
          '<button class="btn btn--primary" id="qg-add-names" type="button">⚙️ أضيفي الأسماء</button>' +
        '</div>';

    var ov = document.createElement('div');
    ov.className = 'overlay qg-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'المجموعات السريعة');
    ov.innerHTML =
      '<div class="sheet qg-sheet">' +
        '<h2 style="justify-content:center">👥 المجموعات السريعة</h2>' +
        body +
        '<div class="sheet-actions" style="justify-content:center">' +
          (n ? '<button class="btn btn--primary" id="qg-go" type="button">🎲 وزّعي المجموعات</button>' +
               '<button class="btn" id="qg-copy" type="button" hidden>📋 نسخ</button>' : '') +
          '<button class="btn" id="qg-close" type="button">إغلاق</button>' +
        '</div>' +
      '</div>';

    document.getElementById('modal-root').appendChild(ov);
    this.ov = ov;

    ov.addEventListener('mousedown', function (e) { if (e.target === ov) self.close(); });
    ov.querySelector('#qg-close').addEventListener('click', function () { self.close(); });

    var add = ov.querySelector('#qg-add-names');
    if (add) add.addEventListener('click', function () {
      var open = self.openSettings;
      self.close();
      if (open) open();
    });

    if (n) {
      Array.prototype.forEach.call(ov.querySelectorAll('[data-mode]'), function (b) {
        b.addEventListener('click', function () {
          q.mode = b.getAttribute('data-mode');
          Array.prototype.forEach.call(ov.querySelectorAll('[data-mode]'), function (x) {
            var on = x.getAttribute('data-mode') === q.mode;
            x.classList.toggle('on', on);
            x.setAttribute('aria-checked', on);
          });
          ov.querySelector('#qg-size').hidden = q.mode !== 'size';
          ov.querySelector('#qg-count').hidden = q.mode !== 'count';
          self.save();
          self.hint();
        });
      });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-size]'), function (b) {
        b.addEventListener('click', function () {
          q.size = +b.getAttribute('data-size');
          Array.prototype.forEach.call(ov.querySelectorAll('[data-size]'), function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          self.save();
          self.hint();
        });
      });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-count]'), function (b) {
        b.addEventListener('click', function () {
          q.count = +b.getAttribute('data-count');
          Array.prototype.forEach.call(ov.querySelectorAll('[data-count]'), function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          self.save();
          self.hint();
        });
      });
      ov.querySelector('#qg-go').addEventListener('click', function () { self.make(); });
      ov.querySelector('#qg-copy').addEventListener('click', function (e) { self.copy(e.target); });
      this.hint();
      if (q.last && q.last.length) this.paint(q.last, true);
    }

    this.escHandler = function (e) { if (e.key === 'Escape') self.close(); };
    document.addEventListener('keydown', this.escHandler);
    (ov.querySelector('#qg-go') || ov.querySelector('#qg-close')).focus();
  };

  Groups.prototype.close = function () {
    if (this.escHandler) { document.removeEventListener('keydown', this.escHandler); this.escHandler = null; }
    if (this.ov) { this.ov.remove(); this.ov = null; }
  };

  /* يشرح مقدّمًا كيف ستُقسَّم الأسماء */
  Groups.prototype.hint = function () {
    if (!this.ov) return;
    var el = this.ov.querySelector('#qg-hint');
    if (!el) return;
    var d = this.data(), q = d.quick, n = d.list.length;
    var g = groupsCount(n, q.mode, q.mode === 'size' ? q.size : q.count);
    var base = Math.floor(n / g), rem = n % g;
    var txt = n + ' طالبًا على ' + g + (g === 1 ? ' مجموعة' : (g === 2 ? ' مجموعتين' : ' مجموعات')) + ': ';
    if (rem === 0) txt += 'كل مجموعة ' + base;
    else txt += rem + ' منها ' + (base + 1) + ' والباقي ' + base;
    el.textContent = txt;
  };

  Groups.prototype.make = function () {
    var d = this.data(), q = d.quick, n = d.list.length;
    if (!n) return;
    Sound.unlock();
    var g = groupsCount(n, q.mode, q.mode === 'size' ? q.size : q.count);
    q.last = split(d.list, g);
    this.save();
    this.paint(q.last, false);
    Sound.sparkle();
  };

  Groups.prototype.paint = function (groups, quiet) {
    if (!this.ov) return;
    var host = this.ov.querySelector('#qg-result');
    host.innerHTML = groups.map(function (members, i) {
      var t = TONE[i % TONE.length];
      return '<div class="qg-card"' + (quiet ? '' : ' style="animation-delay:' + (i * 55) + 'ms"') +
        ' data-i="' + i + '">' +
        '<div class="qg-head" style="background:' + t.bg + ';color:' + t.ink + '">' +
          '<span class="qg-name">' + esc(groupName(i)) + '</span>' +
          '<span class="qg-size" style="background:' + t.soft + '">' + members.length + '</span>' +
        '</div>' +
        '<ol class="qg-list">' + members.map(function (m) {
          return '<li>' + esc(m) + '</li>';
        }).join('') + '</ol>' +
      '</div>';
    }).join('');
    var go = this.ov.querySelector('#qg-go');
    if (go) go.textContent = '🔄 وزّعي من جديد';
    var copy = this.ov.querySelector('#qg-copy');
    if (copy) { copy.hidden = false; copy.textContent = '📋 نسخ'; }
  };

  Groups.prototype.asText = function () {
    var q = this.data().quick;
    if (!q.last) return '';
    return q.last.map(function (members, i) {
      return groupName(i) + ':\n' + members.map(function (m, k) {
        return '  ' + (k + 1) + '. ' + m;
      }).join('\n');
    }).join('\n\n');
  };

  Groups.prototype.copy = function (btn) {
    var text = this.asText();
    if (!text) return;
    var done = function () { if (btn) btn.textContent = '✓ تم النسخ'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  };

  global.BustanGroups = { create: function (o) { return new Groups(o); }, split: split, groupsCount: groupsCount };
})(window);

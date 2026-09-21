/* ==========================================================================
   بستان المجموعات - المنطق الرئيسي
   ========================================================================== */
(function () {
  'use strict';

  var T = window.Trees, Sound = window.Sound, Store = window.Store, Exporter = window.Exporter;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var state = Store.load();

  /* ------------------------------- أدوات عامة ---------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function svgNode(markup) {
    var doc = new DOMParser().parseFromString('<svg xmlns="' + SVGNS + '">' + markup + '</svg>', 'image/svg+xml');
    var first = doc.documentElement.firstChild;
    return first ? document.importNode(first, true) : null;
  }

  function persist() { Store.save(state); }


  function leaders() {
    var top = 0, i;
    for (i = 0; i < state.groups.length; i++) if (state.groups[i].count > top) top = state.groups[i].count;
    if (top === 0) return { top: 0, list: [] };
    return { top: top, list: state.groups.filter(function (g) { return g.count === top; }) };
  }

  /* ============================ شاشة الدخول ============================== */
  function initLogin() {
    var mark = $('#login-mark');
    mark.innerHTML = T.standalone('nakhla', 6);

    $('#login-hint').textContent = 'تُحفظ بيانات المسابقة في هذا الجهاز ولا تُرسل إلى أي مكان.';

    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      Sound.unlock();
      var u = $('#in-user').value.trim().toLowerCase();
      var p = $('#in-pin').value.trim();
      if (u === String(state.auth.user).toLowerCase() && p === String(state.auth.pin)) {
        state.loggedIn = true; persist();
        Sound.open();
        showBoard();
      } else {
        var card = $('.login-card');
        $('#login-msg').textContent = 'اسم المستخدم أو رمز الدخول غير صحيح';
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
        Sound.error();
        $('#in-pin').value = '';
        $('#in-pin').focus();
      }
    });
  }

  function showLogin() {
    $('#board').classList.add('hidden');
    $('#login').classList.remove('hidden');
    $('#login-msg').textContent = '';
    $('#in-user').value = '';
    $('#in-pin').value = '';
    setTimeout(function () { $('#in-user').focus(); }, 60);
  }

  /* ============================== بناء البطاقة =========================== */
  function cardMarkup(g) {
    var t = T.byId[g.treeId];
    return '<article class="card" data-gid="' + esc(g.id) + '" style="--tone:' + t.tone + '">' +
      '<div class="card-head">' +
        '<input class="gname" type="text" maxlength="30" value="' + esc(g.name) + '" aria-label="اسم المجموعة">' +
        '<span class="tree-tag">' + esc(t.name) + '</span>' +
      '</div>' +
      '<button class="tree-btn" type="button" aria-label="أضف ' + esc(t.fruit) + ' إلى ' + esc(g.name) + '">' +
        '<span class="tree-stage">' +
          '<svg viewBox="' + T.VIEWBOX + '" aria-hidden="true">' + T.defs() +
            '<g class="tree-scale" style="transform:scale(' + T.scaleOf(g.count) + ')">' +
              T.treeSvg(g.treeId, g.count, { texture: state.texture }) +
            '</g>' +
          '</svg>' +
        '</span>' +
        '<span class="tap-hint">اضغطي لإضافة ' + esc(t.fruit) + '</span>' +
      '</button>' +
      '<div class="card-foot">' +
        '<div class="score"><svg viewBox="-10 -11 20 22" aria-hidden="true">' + T.fruitShape(g.treeId) + '</svg>' +
        '<span class="num">' + g.count + '</span><span class="unit">' + esc(T.unitFor(g.treeId, g.count)) + '</span></div>' +
        '<button class="btn btn--sm undo" type="button" aria-label="تراجع عن آخر ثمرة في ' + esc(g.name) + '">↩︎ تراجع</button>' +
      '</div>' +
    '</article>';
  }

  function renderBoard() {
    $('#board-heading').textContent = state.title;
    document.title = state.title;
    $('#grid').innerHTML = state.groups.map(cardMarkup).join('');
    updateWinner();
  }

  function cardOf(gid) { return $('.card[data-gid="' + gid + '"]'); }
  function groupOf(gid) {
    for (var i = 0; i < state.groups.length; i++) if (state.groups[i].id === gid) return state.groups[i];
    return null;
  }

  /* --------------------------- إضافة ثمرة وتراجع -------------------------- */
  function refreshTree(card, g) {
    var body = $('.tree-body', card);
    body.setAttribute('data-stage', T.stageOf(g.count));
    body.setAttribute('data-fruit', g.count ? '1' : '0');
    $('.tree-scale', card).style.transform = 'scale(' + T.scaleOf(g.count) + ')';
    var num = $('.score .num', card);
    num.textContent = g.count;
    $('.score .unit', card).textContent = T.unitFor(g.treeId, g.count);
    num.classList.remove('bump');
    void num.offsetWidth;
    num.classList.add('bump');
  }

  function rebuildFruitLayer(card, g) {
    var layer = $('.fruit-layer', card);
    var size = T.fruitSize(g.count), html = '';
    for (var i = 0; i < g.count; i++) html += T.fruitMarkup(g.treeId, i, size);
    var holder = svgNode('<g>' + html + '</g>');
    layer.textContent = '';
    while (holder && holder.firstChild) layer.appendChild(holder.firstChild);
  }

  function addFruit(gid) {
    var g = groupOf(gid); if (!g) return;
    var card = cardOf(gid); if (!card) return;
    var prevSize = T.fruitSize(g.count);
    g.count += 1;
    var size = T.fruitSize(g.count);

    if (size !== prevSize) {
      rebuildFruitLayer(card, g);
    } else {
      var node = svgNode(T.fruitMarkup(g.treeId, g.count - 1, size));
      if (node) {
        node.setAttribute('class', 'fruit pop');
        $('.fruit-layer', card).appendChild(node);
        setTimeout(function () { node.setAttribute('class', 'fruit'); }, 560);
      }
    }
    refreshTree(card, g);

    var plus = document.createElement('span');
    plus.className = 'plusone';
    plus.textContent = '+1';
    $('.tree-stage', card).appendChild(plus);
    setTimeout(function () { plus.remove(); }, 900);

    Sound.pop(g.count);
    persist();
    updateWinner();
  }

  function undoFruit(gid) {
    var g = groupOf(gid); if (!g || g.count === 0) return;
    var card = cardOf(gid);
    var prevSize = T.fruitSize(g.count);
    g.count -= 1;
    if (T.fruitSize(g.count) !== prevSize) {
      rebuildFruitLayer(card, g);
    } else {
      var layer = $('.fruit-layer', card);
      var last = layer.lastChild;
      if (last) {
        last.setAttribute('class', 'fruit vanish');
        setTimeout(function () { if (last.parentNode) last.parentNode.removeChild(last); }, 300);
      }
    }
    refreshTree(card, g);
    Sound.undo();
    persist();
    updateWinner();
  }

  function updateWinner() {
    var w = leaders();
    $$('.card').forEach(function (c) {
      var g = groupOf(c.getAttribute('data-gid'));
      c.classList.toggle('leader', !!g && w.top > 0 && g.count === w.top);
    });
    var b = $('#banner');
    if (w.top === 0) {
      b.innerHTML = '<span class="crown" aria-hidden="true">🌱</span> البستان في انتظار أول ثمرة — اضغطي على أي شجرة!';
    } else if (w.list.length === 1) {
      var t = T.byId[w.list[0].treeId];
      b.innerHTML = '<span class="crown" aria-hidden="true">👑</span> المتصدّرة الآن: <strong>' +
        esc(w.list[0].name) + '</strong> بـ ' + esc(T.countLabel(w.list[0].treeId, w.top));
    } else {
      b.innerHTML = '<span class="crown" aria-hidden="true">🤝</span> تعادل في الصدارة بـ ' + w.top + ' — ' +
        w.list.map(function (g) { return '<strong>' + esc(g.name) + '</strong>'; }).join(' و ');
    }
  }

  /* ============================== نوافذ منبثقة ============================ */
  var lastFocus = null;

  function openSheet(html, onReady) {
    closeSheet();
    lastFocus = document.activeElement;
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="sheet">' + html + '</div>';
    $('#modal-root').appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeSheet(); });
    document.addEventListener('keydown', escClose);
    var focusable = $$('button, input, select, [tabindex]', ov);
    if (focusable.length) focusable[0].focus();
    if (onReady) onReady(ov);
    return ov;
  }

  function escClose(e) { if (e.key === 'Escape') closeSheet(); }

  function closeSheet() {
    var ov = $('#modal-root .overlay');
    if (ov) ov.remove();
    document.removeEventListener('keydown', escClose);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }

  /* ------------------------------- الاحتفال ------------------------------- */
  function fruitRain(treeId, count) {
    var rain = document.createElement('div');
    rain.className = 'rain';
    rain.setAttribute('aria-hidden', 'true');
    var shape = T.fruitShape(treeId);
    for (var i = 0; i < (count || 40); i++) {
      var s = document.createElement('span');
      var sz = 18 + Math.random() * 20;
      s.style.insetInlineStart = (Math.random() * 100) + '%';
      s.style.animationDuration = (2.2 + Math.random() * 2.2) + 's';
      s.style.animationDelay = (Math.random() * 1.6) + 's';
      s.innerHTML = '<svg width="' + sz + '" height="' + sz + '" viewBox="-10 -11 20 22">' + shape + '</svg>';
      rain.appendChild(s);
    }
    document.body.appendChild(rain);
    setTimeout(function () { rain.remove(); }, 6500);
  }

  function celebrate() {
    var w = leaders();
    if (w.top === 0) {
      openSheet('<h2>🌱 لم تبدأ المسابقة بعد</h2><p class="note">أضيفي ثمرة واحدة على الأقل لإحدى المجموعات ثم أعلني الفائزة.</p>' +
        '<div class="sheet-actions"><button class="btn" data-close type="button">حسنًا</button></div>');
      return;
    }
    var first = w.list[0], t = T.byId[first.treeId];
    var head = w.list.length === 1 ? '🏆 المجموعة الفائزة' : '🤝 تعادل في الصدارة';
    var extra = w.list.length > 1
      ? '<p class="win-tie">تشاركت في الصدارة: ' + w.list.map(function (g) { return esc(g.name); }).join(' و ') + '</p>'
      : '';
    openSheet(
      '<h2 style="justify-content:center">' + head + '</h2>' +
      '<div class="win-tree">' + T.standalone(first.treeId, first.count) + '</div>' +
      '<p class="win-name">' + esc(first.name) + '</p>' +
      '<p class="win-count">' + esc(T.countLabel(first.treeId, first.count)) + ' على ' + esc(t.name) + '</p>' +
      extra +
      '<div class="sheet-actions" style="justify-content:center">' +
        '<button class="btn btn--gold" id="cel-png" type="button">🖼️ حفظ صورة النتائج</button>' +
        '<button class="btn" data-close type="button">إغلاق</button>' +
      '</div>',
      function (ov) {
        $('#cel-png', ov).addEventListener('click', function () { Exporter.toPng(snapshot()); });
      }
    );
    fruitRain(first.treeId, 46);
    Sound.fanfare();
  }

  /* ------------------------------ إعادة المسابقة -------------------------- */
  function snapshot() {
    return {
      date: new Date().toISOString(),
      title: state.title,
      results: state.groups.map(function (g) { return { name: g.name, treeId: g.treeId, count: g.count }; })
    };
  }

  function confirmReset() {
    var total = state.groups.reduce(function (s, g) { return s + g.count; }, 0);
    openSheet(
      '<h2>🔄 إعادة المسابقة</h2>' +
      '<p class="note">سيعود عدّاد كل مجموعة إلى صفر وتبدأ الأشجار من جديد.' +
      (total > 0 ? ' تُحفظ النتيجة الحالية في السجل قبل المسح.' : '') + '</p>' +
      '<label class="switch"><input type="checkbox" id="keep-names" checked> الاحتفاظ بأسماء المجموعات</label>' +
      (total > 0 ? '<label class="switch"><input type="checkbox" id="archive" checked> حفظ النتيجة الحالية في السجل</label>' : '') +
      '<div class="sheet-actions">' +
        '<button class="btn" data-close type="button">إلغاء</button>' +
        '<button class="btn btn--danger" id="do-reset" type="button">نعم، ابدئي من جديد</button>' +
      '</div>',
      function (ov) {
        $('#do-reset', ov).addEventListener('click', function () {
          var arch = $('#archive', ov);
          if (arch && arch.checked && total > 0) state.history.unshift(snapshot());
          if (state.history.length > 60) state.history.length = 60;
          var keep = $('#keep-names', ov).checked;
          state.groups.forEach(function (g, i) {
            g.count = 0;
            if (!keep) g.name = 'المجموعة ' + (Store.ORD[i] || (i + 1));
          });
          persist();
          closeSheet();
          renderBoard();
          Sound.sparkle();
        });
      }
    );
  }

  /* --------------------------------- السجل -------------------------------- */
  function historySheet() {
    var cur = snapshot();
    var curTotal = cur.results.reduce(function (s, r) { return s + r.count; }, 0);
    var html = '<h2>📜 سجل المسابقات</h2><p class="note">النتيجة الحالية والنتائج المحفوظة سابقًا.</p>';

    html += '<div class="hist-item"><h3>النتيجة الحالية</h3><div class="meta">' + esc(Exporter.arabicDate(cur.date)) + '</div>' +
      histList(cur) +
      '<div class="sheet-actions" style="justify-content:flex-start;margin-top:4px">' +
      '<button class="btn btn--sm" data-png="now" type="button">🖼️ صورة</button>' +
      '<button class="btn btn--sm" data-csv="now" type="button">📄 جدول</button></div></div>';

    if (!state.history.length) {
      html += '<p class="empty">لا توجد مسابقات محفوظة بعد. تُحفظ النتيجة تلقائيًا عند الضغط على «إعادة المسابقة».</p>';
    } else {
      state.history.forEach(function (rec, i) {
        html += '<div class="hist-item"><h3>' + esc(rec.title || 'مسابقة') + '</h3>' +
          '<div class="meta">' + esc(Exporter.arabicDate(rec.date)) + '</div>' + histList(rec) +
          '<div class="sheet-actions" style="justify-content:flex-start;margin-top:4px">' +
          '<button class="btn btn--sm" data-png="' + i + '" type="button">🖼️ صورة</button>' +
          '<button class="btn btn--sm" data-csv="' + i + '" type="button">📄 جدول</button>' +
          '<button class="btn btn--sm btn--danger" data-del="' + i + '" type="button">حذف</button></div></div>';
      });
    }
    html += '<div class="sheet-actions"><button class="btn" data-close type="button">إغلاق</button></div>';

    openSheet(html, function (ov) {
      if (curTotal === 0) $$('[data-png="now"],[data-csv="now"]', ov).forEach(function (b) { b.disabled = true; b.style.opacity = '.5'; });
      $$('[data-png]', ov).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-png');
          Exporter.toPng(k === 'now' ? cur : state.history[+k]);
        });
      });
      $$('[data-csv]', ov).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-csv');
          Exporter.toCsv(k === 'now' ? cur : state.history[+k]);
        });
      });
      $$('[data-del]', ov).forEach(function (b) {
        b.addEventListener('click', function () {
          state.history.splice(+b.getAttribute('data-del'), 1);
          persist();
          historySheet();
        });
      });
    });
  }

  function histList(rec) {
    var sorted = rec.results.slice().sort(function (a, b) { return b.count - a.count; });
    var top = sorted.length ? sorted[0].count : 0;
    return '<ul class="hist-list">' + sorted.map(function (r) {
      var t = T.byId[r.treeId];
      var win = top > 0 && r.count === top;
      return '<li class="' + (win ? 'win' : '') + '"><span>' + (win ? '👑 ' : '') + esc(r.name) +
        ' <small style="color:#9BA886">' + esc(t ? t.name : '') + '</small></span><span>' + r.count + '</span></li>';
    }).join('') + '</ul>';
  }

  /* -------------------------------- الإعدادات ----------------------------- */
  function settingsSheet() {
    var treeOptions = function (sel) {
      return T.LIST.map(function (t) {
        return '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>' + t.emoji + ' ' + esc(t.name) + '</option>';
      }).join('');
    };
    var groupsHtml = state.groups.map(function (g, i) {
      return '<div class="group-row">' +
        '<input type="text" maxlength="30" data-gname="' + i + '" value="' + esc(g.name) + '" aria-label="اسم المجموعة ' + (i + 1) + '">' +
        '<select data-gtree="' + i + '" aria-label="شجرة المجموعة ' + (i + 1) + '">' + treeOptions(g.treeId) + '</select>' +
      '</div>';
    }).join('');

    openSheet(
      '<h2>⚙️ الإعدادات</h2><p class="note">كل التغييرات تُحفظ في هذا الجهاز.</p>' +
      '<fieldset class="block"><legend>المسابقة</legend>' +
        '<div class="row"><label for="set-title">عنوان اللوحة</label><input type="text" id="set-title" maxlength="40" value="' + esc(state.title) + '"></div>' +
      '</fieldset>' +
      '<fieldset class="block"><legend>المجموعات وأشجارها</legend>' + groupsHtml + '</fieldset>' +
      '<fieldset class="block"><legend>المظهر والصوت</legend>' +
        '<label class="switch"><input type="checkbox" id="set-sound"' + (state.sound ? ' checked' : '') + '> الأصوات اللطيفة</label>' +
        '<label class="switch"><input type="checkbox" id="set-texture"' + (state.texture ? ' checked' : '') + '> ملمس الطباعة على الأشجار</label>' +
      '</fieldset>' +
      '<fieldset class="block"><legend>بيانات الدخول</legend>' +
        '<div class="row"><label for="set-user">اسم المستخدم</label><input type="text" id="set-user" value="' + esc(state.auth.user) + '" spellcheck="false"></div>' +
        '<div class="row"><label for="set-pin">رمز الدخول</label><input type="text" id="set-pin" value="' + esc(state.auth.pin) + '" spellcheck="false"></div>' +
      '</fieldset>' +
      '<div class="sheet-actions">' +
        '<button class="btn" data-close type="button">إلغاء</button>' +
        '<button class="btn btn--primary" id="set-save" type="button">حفظ التغييرات</button>' +
      '</div>',
      function (ov) {
        $('#set-save', ov).addEventListener('click', function () {
          var title = $('#set-title', ov).value.trim();
          if (title) state.title = title;
          $$('[data-gname]', ov).forEach(function (inp) {
            var i = +inp.getAttribute('data-gname');
            var v = inp.value.trim();
            if (v) state.groups[i].name = v;
          });
          $$('[data-gtree]', ov).forEach(function (sel) {
            var i = +sel.getAttribute('data-gtree');
            if (T.byId[sel.value]) state.groups[i].treeId = sel.value;
          });
          state.sound = $('#set-sound', ov).checked;
          state.texture = $('#set-texture', ov).checked;
          var u = $('#set-user', ov).value.trim();
          var pin = $('#set-pin', ov).value.trim();
          if (u) state.auth.user = u;
          if (pin) state.auth.pin = pin;
          Sound.setEnabled(state.sound);
          document.body.classList.toggle('no-texture', !state.texture);
          persist();
          closeSheet();
          renderBoard();
          Sound.sparkle();
        });
      }
    );
  }

  /* ============================== ربط الأحداث ============================= */
  function bindBoard() {
    $('#grid').addEventListener('click', function (e) {
      var tree = e.target.closest('.tree-btn');
      if (tree) { addFruit(tree.closest('.card').getAttribute('data-gid')); return; }
      var undo = e.target.closest('.undo');
      if (undo) { undoFruit(undo.closest('.card').getAttribute('data-gid')); }
    });

    $('#grid').addEventListener('change', function (e) {
      if (!e.target.classList.contains('gname')) return;
      var card = e.target.closest('.card');
      var g = groupOf(card.getAttribute('data-gid'));
      var v = e.target.value.trim();
      if (!v) { e.target.value = g.name; return; }
      g.name = v;
      var t = T.byId[g.treeId];
      $('.tree-btn', card).setAttribute('aria-label', 'أضف ' + t.fruit + ' إلى ' + v);
      persist();
      updateWinner();
    });

    $('#btn-celebrate').addEventListener('click', celebrate);
    $('#btn-history').addEventListener('click', historySheet);
    $('#btn-settings').addEventListener('click', settingsSheet);
    $('#btn-reset').addEventListener('click', confirmReset);
    $('#btn-logout').addEventListener('click', function () {
      state.loggedIn = false; persist(); showLogin();
    });

    $('#modal-root').addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeSheet();
    });

    /* مفاتيح الأرقام ١-٦ لإضافة ثمرة بسرعة */
    document.addEventListener('keydown', function (e) {
      if ($('#board').classList.contains('hidden')) return;
      if ($('#modal-root .overlay')) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      var map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
                  '١': 0, '٢': 1, '٣': 2, '٤': 3, '٥': 4, '٦': 5 };
      if (map[e.key] != null && state.groups[map[e.key]]) {
        e.preventDefault();
        Sound.unlock();
        addFruit(state.groups[map[e.key]].id);
      }
    });
  }

  function showBoard() {
    $('#login').classList.add('hidden');
    $('#board').classList.remove('hidden');
    renderBoard();
  }

  /* ================================= الإقلاع ============================== */
  function init() {
    Sound.setEnabled(state.sound);
    document.body.classList.toggle('no-texture', !state.texture);
    initLogin();
    bindBoard();
    if (state.loggedIn) showBoard(); else showLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

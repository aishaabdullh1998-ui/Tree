/* ==========================================================================
   بستان المجموعات - المنطق الرئيسي
   ========================================================================== */
(function () {
  'use strict';

  var T = window.Trees, Sound = window.Sound, Store = window.Store, Exporter = window.Exporter;
  var timer = null, wheel = null, groups = null;
  var TH = window.Theme || {};
  /* كلمات الثيم: ثمرة/شجرة في البستان، نجمة/كوكب في المجرّة، كتاب/رفّ في الرفوف */
  var W = TH.words || { item: L('ثمرة'), itemAl: L('الثمرة'), holder: L('شجرة'), holderAl: L('الشجرة'), icon: '🌱',
    empty: L('البستان في انتظار أول ثمرة — اضغطي على أي شجرة!'),
    notStarted: L('أضيفي ثمرة واحدة على الأقل لإحدى المجموعات ثم أعلني الفائزة.') };
  var SVGNS = 'http://www.w3.org/2000/svg';
  /* لو سبق دخولٌ على هذا الجهاز، نفتح مخزن ذلك الحساب لا المخزن العام */
  var state = (function () {
    var who = Store.who && Store.who();
    if (who && Store.use) Store.use(who);
    return Store.load();
  })();

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

  function persist() {
    /* نعلّم التغيير أولًا ثم نحفظ، فيبقى أثره لو أُغلقت الصفحة قبل الرفع */
    if (window.Sync && window.Sync.on) window.Sync.touch();
    Store.save(state);
  }

  /* ----------------------------- حالة المزامنة --------------------------- */
  var SYNC_TEXT = {
    syncing: 'جارٍ الحفظ في حسابك…',
    saved:   'محفوظ في حسابك',
    offline: 'بلا إنترنت — سيُحفظ عند عودة الاتصال',
    error:   'تعذّر الحفظ في الحساب — النقاط محفوظة على الجهاز'
  };
  function paintSync(s) {
    var chip = $('#sync-chip');
    if (!chip) return;
    if (s === 'off' || !SYNC_TEXT[s]) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.dataset.state = s;
    $('#sync-text').textContent = L(SYNC_TEXT[s]);
  }

  /* يبدأ المزامنة بعد دخول صحيح، إن كانت هذه نسخة مربوطة بحساب */
  function startSync(user, pin) {
    if (!(window.Sync && window.Sync.on)) return;
    window.Sync.start(user, pin, state, {
      state: function () { return state; },
      status: paintSync,
      refresh: function () {
        Sound.setEnabled(state.sound);
        document.body.classList.toggle('no-texture', !state.texture);
        renderBoard();
      },
      conflict: conflictSheet
    });
  }

  /* اللوحة تغيّرت على جهازين معًا: القرار لها، ولا نمحو شيئًا دون إذنها */
  function conflictSheet(c) {
    var when = '';
    try {
      when = new Intl.DateTimeFormat(L.lang === 'en' ? 'en-GB' : 'ar',
        { dateStyle: 'short', timeStyle: 'short' }).format(new Date(c.when));
    } catch (e) {}
    openSheet(
      '<h2>' + Icon('load', 22) + ' ' + L('نسختان مختلفتان') + '</h2>' +
      '<p class="note">' + L('اللوحة تغيّرت على هذا الجهاز وعلى جهاز آخر معًا. أيّهما تعتمدين؟') + '</p>' +
      '<div class="sheet-actions" style="justify-content:flex-start">' +
        '<button class="btn btn--primary" id="cf-remote" type="button">' +
          L('نسخة الحساب') + ' · ' + c.remote + ' ' + L('نقطة') + (when ? ' · ' + when : '') + '</button>' +
        '<button class="btn" id="cf-local" type="button">' +
          L('نسخة هذا الجهاز') + ' · ' + c.local + ' ' + L('نقطة') + '</button>' +
      '</div>' +
      '<p class="note">' + L('ما لا تختارينه يُستبدل، فاختاري النسخة الأحدث عندك.') + '</p>',
      function (ov) {
        $('#cf-remote', ov).addEventListener('click', function () { c.useRemote(); closeSheet(); });
        $('#cf-local', ov).addEventListener('click', function () { c.useLocal(); closeSheet(); });
      }
    );
  }


  /* عدد المجموعات الذي اختارته المعلّمة: البقيّة تبقى محفوظة ولا تُعرض */
  function visibleCount() { return Math.max(2, Math.min(6, parseInt(state.visible, 10) || 6)); }
  function visibleGroups() { return state.groups.slice(0, visibleCount()); }

  function leaders() {
    var gs = visibleGroups(), top = 0, i;
    for (i = 0; i < gs.length; i++) if (gs[i].count > top) top = gs[i].count;
    if (top === 0) return { top: 0, list: [] };
    return { top: top, list: gs.filter(function (g) { return g.count === top; }) };
  }

  /* تنبيه صغير أسفل الشاشة، ومعه زرّ تراجع عند الحاجة */
  var toastTimer = null;
  function toast(msg, actionLabel, onAction) {
    var old = $('.toast'); if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + esc(msg) + '</span>';
    if (actionLabel) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = actionLabel;
      b.addEventListener('click', function () { el.remove(); if (onAction) onAction(); });
      el.appendChild(b);
    }
    document.body.appendChild(el);
    toastTimer = setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 500);
    }, 5200);
  }

  /* ============================ شاشة الدخول ============================== */
  function initLogin() {
    var mark = $('#login-mark');
    mark.innerHTML = window.BustanLogo
      ? window.BustanLogo.svg({ word: false, tag: false })
      : T.standalone(T.LIST[0].id, 6);

    /* لا نقول لها «لا تُرسل إلى أي مكان» وهي نسخة تحفظ نقاطها في حسابها.
       والنسخة غير المربوطة تقولها صراحةً: بيانات الدخول المباعة لا تفتحها،
       فلا تقف المعلّمة أمام «رمز غير صحيح» وهي تكتب رمزًا صحيحًا. */
    var linked = !!(window.Sync && window.Sync.on);
    $('#login-hint').textContent = linked
      ? L('نقاطك محفوظة في حسابك على أي جهاز، وأسماء الطالبات في هذا الجهاز وحده.')
      : L('تُحفظ بيانات المسابقة في هذا الجهاز ولا تُرسل إلى أي مكان.');
    var card = $('.login-card');
    var tagEl = $('#login-demo');
    if (!linked) {
      if (!tagEl) {
        tagEl = document.createElement('p');
        tagEl.id = 'login-demo';
        tagEl.className = 'login-demo';
        card.insertBefore(tagEl, $('#login-hint'));
      }
      tagEl.textContent = L('نسخة تجريبية · غير مربوطة بحساب');
    } else if (tagEl) {
      tagEl.remove();
    }

    /* الدخول يعمل بالضغط وبمفتاح Enter معًا، حتى داخل الصفحات المضمّنة
       التي يُمنع فيها إرسال النماذج */
    var busy = false;

    function refuse(msg) {
      var card = $('.login-card');
      $('#login-msg').textContent = msg;
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      Sound.error();
      $('#in-pin').value = '';
      $('#in-pin').focus();
    }

    function waiting(on) {
      var go = $('#login-go');
      go.disabled = on;
      go.textContent = on ? L('جارٍ التحقّق…') : L('دخول');
      if (on) $('#login-msg').textContent = '';
    }

    /* دخول ناجح: ننقل اللوحة إلى مخزن هذا الحساب وحده */
    function enter(u, p, pulled) {
      Store.use(u);
      state = Store.load();
      if (pulled && window.Sync && window.Sync.applyData) {
        window.Sync.applyData(state, pulled.data);
        state.sync = { rev: pulled.rev, at: pulled.updated_at, dirty: false };
      }
      state.auth = { user: u, pin: p };
      state.loggedIn = true;
      Store.save(state);
      Store.remember(u);
      Sound.setEnabled(state.sound);
      document.body.classList.toggle('no-texture', !state.texture);
      Sound.open();
      showBoard();
      startSync(u, p);
    }

    /* بلا إنترنت: تُفتح آخر نسخة محفوظة لهذا الحساب على هذا الجهاز وحده */
    function enterOffline(u, p) {
      Store.use(u);
      var s = Store.load();
      if (s.auth && s.auth.user && s.auth.pin &&
          String(s.auth.user).toLowerCase() === u && String(s.auth.pin) === p) {
        state = s;
        state.loggedIn = true;
        Store.save(state);
        Store.remember(u);
        Sound.setEnabled(state.sound);
        document.body.classList.toggle('no-texture', !state.texture);
        Sound.open();
        showBoard();
        startSync(u, p);
        toast(L('بلا إنترنت — فُتحت آخر نسخة محفوظة على هذا الجهاز.'));
      } else {
        Store.use(null);
        refuse(L('تعذّر الاتصال، ولم يسبق الدخول بهذا الحساب على هذا الجهاز.'));
      }
    }

    function attempt(e) {
      if (e) e.preventDefault();
      if (busy) return;
      Sound.unlock();
      var u = $('#in-user').value.trim().toLowerCase();
      var p = $('#in-pin').value.trim();

      /* نسخة غير مربوطة بحساب: التحقّق محلّي كما كان */
      if (!(window.Sync && window.Sync.on)) {
        busy = true;
        setTimeout(function () { busy = false; }, 150);
        if (u === String(state.auth.user).toLowerCase() && p === String(state.auth.pin)) {
          state.loggedIn = true; persist();
          Sound.open();
          showBoard();
        } else {
          refuse(L('اسم المستخدم أو رمز الدخول غير صحيح'));
        }
        return;
      }

      if (!u || !p) { refuse(L('اكتبي اسم المستخدم ورمز الدخول')); return; }
      busy = true;
      waiting(true);
      window.Sync.auth(u, p, function (err, res) {
        busy = false;
        waiting(false);
        if (!err) { enter(u, p, res); return; }
        if (err === 'offline') { enterOffline(u, p); return; }
        refuse(err === 'locked'
          ? L('أُقفل الحساب بعد محاولات كثيرة. انتظري ربع ساعة ثم جرّبي مرّة أخرى.')
          : L('اسم المستخدم أو رمز الدخول غير صحيح'));
      });
    }

    $('#login-form').addEventListener('submit', attempt);
    $('#login-go').addEventListener('click', attempt);
    $$('#login-form input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(e); });
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
        '<input class="gname" type="text" maxlength="30" value="' + esc(g.name) + '" aria-label="' + L('اسم المجموعة') + '">' +
        '<span class="tree-tag">' + esc(t.name) + '</span>' +
      '</div>' +
      '<button class="tree-btn" type="button" aria-label="' + L('أضف') + ' ' + esc(t.fruit) + ' ' + L('إلى') + ' ' + esc(g.name) + '">' +
        '<span class="tree-stage">' +
          '<svg viewBox="' + T.VIEWBOX + '" aria-hidden="true">' + T.defs() +
            '<g class="tree-scale" style="transform:scale(' + T.scaleOf(g.count) + ')">' +
              T.treeSvg(g.treeId, g.count, { texture: state.texture }) +
            '</g>' +
          '</svg>' +
        '</span>' +
        '<span class="tap-hint">' + L('اضغطي لإضافة') + ' ' + esc(t.fruit) + '</span>' +
      '</button>' +
      '<div class="card-foot">' +
        '<div class="score"><svg viewBox="' + (T.CHIP_VIEWBOX || '-10 -11 20 22') + '" aria-hidden="true">' + T.fruitShape(g.treeId) + '</svg>' +
        '<span class="num">' + g.count + '</span><span class="unit">' + esc(T.unitFor(g.treeId, g.count)) + '</span></div>' +
        '<button class="btn btn--sm undo" type="button" aria-label="' + L('تراجع عن آخر') + ' ' + esc(W.item) + ' ' + L('في') + ' ' + esc(g.name) + '">↩︎ ' + L('تراجع') + '</button>' +
      '</div>' +
    '</article>';
  }

  function renderBoard() {
    $('#board-heading').textContent = state.title;
    document.title = state.title;
    var grid = $('#grid');
    grid.setAttribute('data-n', visibleCount());
    grid.innerHTML = visibleGroups().map(cardMarkup).join('');
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
    var size = T.fruitSize(g.count), html = '', i;
    if (T.layerMarkup) {
      html = T.layerMarkup(g.treeId, g.count);
    } else {
      for (i = 0; i < g.count; i++) html += T.fruitMarkup(g.treeId, i, size);
    }
    var holder = svgNode('<g>' + html + '</g>');
    layer.textContent = '';
    while (holder && holder.firstChild) layer.appendChild(holder.firstChild);
  }

  function addFruit(gid, silent) {
    var g = groupOf(gid); if (!g) return;
    var card = cardOf(gid); if (!card) return;
    var prevSize = T.fruitSize(g.count);
    g.count += 1;
    var size = T.fruitSize(g.count);

    if (T.layerMarkup) {
      rebuildFruitLayer(card, g);
      var fresh = $$('.fruit-layer .fruit', card).pop();
      if (fresh) {
        fresh.setAttribute('class', 'fruit pop');
        setTimeout(function () { fresh.setAttribute('class', 'fruit'); }, 560);
      }
    } else if (size !== prevSize) {
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

    if (!silent) Sound.pop(g.count);
    persist();
    updateWinner();
  }

  function undoFruit(gid) {
    var g = groupOf(gid); if (!g || g.count === 0) return;
    var card = cardOf(gid);
    var prevSize = T.fruitSize(g.count);
    g.count -= 1;
    if (T.layerMarkup || T.fruitSize(g.count) !== prevSize) {
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
      b.innerHTML = '<span class="crown" aria-hidden="true">' + esc(W.icon) + '</span> ' + esc(W.empty);
    } else if (w.list.length === 1) {
      var t = T.byId[w.list[0].treeId];
      b.innerHTML = '<span class="crown" aria-hidden="true">👑</span> ' + L('المتصدّرة الآن') + ': <strong>' +
        esc(w.list[0].name) + '</strong> ' + L('بـ') + ' ' + esc(T.countLabel(w.list[0].treeId, w.top));
    } else {
      b.innerHTML = '<span class="crown" aria-hidden="true">🤝</span> ' + L('تعادل في الصدارة بـ') + ' ' + w.top + ' — ' +
        w.list.map(function (g) { return '<strong>' + esc(g.name) + '</strong>'; }).join(' ' + L('و') + ' ');
    }
  }

  /* ============================== نوافذ منبثقة ============================ */
  var lastFocus = null;

  function openSheet(html, onReady) {
    closeSheet();
    if (timer) timer.closeBig();
    if (wheel) wheel.close();
    if (groups) groups.close();
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
    var ov = $('#modal-root .overlay:not(.timer-overlay):not(.wheel-overlay):not(.qg-overlay)');
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

  window.BustanRain = function (count) {
    var w = leaders();
    var id = w.list.length ? w.list[0].treeId : state.groups[0].treeId;
    fruitRain(id, count || 32);
  };

  function celebrate() {
    var w = leaders();
    if (w.top === 0) {
      openSheet('<h2>' + esc(W.icon) + ' ' + L('لم تبدأ المسابقة بعد') + '</h2><p class="note">' + esc(W.notStarted) + '</p>' +
        '<div class="sheet-actions"><button class="btn" data-close type="button">' + L('حسنًا') + '</button></div>');
      return;
    }
    var first = w.list[0], t = T.byId[first.treeId];
    var head = w.list.length === 1 ? '🏆 ' + L('المجموعة الفائزة') : '🤝 ' + L('تعادل في الصدارة');
    var extra = w.list.length > 1
      ? '<p class="win-tie">' + L('تشاركت في الصدارة') + ': ' + w.list.map(function (g) { return esc(g.name); }).join(' ' + L('و') + ' ') + '</p>'
      : '';
    openSheet(
      '<h2 style="justify-content:center">' + head + '</h2>' +
      '<div class="win-tree">' + T.standalone(first.treeId, first.count) + '</div>' +
      '<p class="win-name">' + esc(first.name) + '</p>' +
      '<p class="win-count">' + esc(T.countLabel(first.treeId, first.count)) + ' ' + L('على') + ' ' + esc(t.name) + '</p>' +
      extra +
      '<div class="sheet-actions" style="justify-content:center">' +
        '<button class="btn btn--gold" id="cel-png" type="button">🖼️ ' + L('حفظ صورة النتائج') + '</button>' +
        '<button class="btn" data-close type="button">' + L('إغلاق') + '</button>' +
      '</div>',
      function (ov) {
        $('#cel-png', ov).addEventListener('click', function () { Exporter.toPng(snapshot()); });
      }
    );
    fruitRain(first.treeId, 46);
    Sound.fanfare();
  }

  /* --------------------------- نقطة لكل المجموعات ------------------------- */
  function addAll() {
    var gs = visibleGroups();
    Sound.unlock();
    gs.forEach(function (g, i) {
      setTimeout(function () { addFruit(g.id, true); }, i * 80);
    });
    Sound.sparkle();
    toast(L('أُضيفت نقطة لكل المجموعات'), L('تراجع'), function () {
      gs.forEach(function (g) { undoFruit(g.id); });
    });
  }

  /* ---------------------------- وضع العرض الكامل -------------------------- */
  function setPresent(on) {
    var r = document.documentElement;
    r.classList.toggle('present', on);
    var ex = $('#present-exit'); if (ex) ex.hidden = !on;
    try {
      if (on && r.requestFullscreen) r.requestFullscreen();
      else if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}
  }
  function presentOn() { return document.documentElement.classList.contains('present'); }

  /* --------------------------- نسخة احتياطية واستعادة --------------------- */
  function backupName() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (TH.id || 'bustan') + '-backup-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.json';
  }

  function doBackup() {
    var copy = JSON.parse(JSON.stringify(state));
    copy.loggedIn = false;
    delete copy.sync;
    copy.theme = TH.id || 'garden';
    copy.savedAt = new Date().toISOString();
    var blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = backupName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function restoreFrom(text, ov) {
    var data;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    var msg = $('#bk-msg', ov);
    if (!data || typeof data !== 'object' || !Array.isArray(data.groups) || !data.groups.length) {
      msg.textContent = L('هذا الملف ليس نسخة احتياطية صالحة لهذه اللوحة.');
      msg.className = 'login-msg show';
      return;
    }
    var other = data.theme && TH.id && data.theme !== TH.id;
    var total = data.groups.reduce(function (a, g) { return a + (parseInt(g.count, 10) || 0); }, 0);
    msg.innerHTML = '';
    msg.className = 'note';
    msg.textContent = L('الملف يحمل') + ' ' + data.groups.length + ' ' + L('مجموعات، ومجموع نقاطها') + ' ' + total + '.' +
      (other ? ' ' + L('تنبيه: النسخة من لوحة أخرى، وستُستبدل أسماء') + ' ' + W.holderAl + ' ' + L('بما يناسب هذه اللوحة.') : '');
    var go = $('#bk-apply', ov);
    go.hidden = false;
    go.onclick = function () {
      data.loggedIn = true;
      /* المستعاد يصير هو الأحدث، فيُرفع للحساب بعد إعادة التحميل */
      data.sync = { rev: (state.sync && state.sync.rev) || 0, at: null, dirty: true };
      try { localStorage.setItem(Store.key(), JSON.stringify(data)); } catch (e) {}
      location.reload();
    };
  }

  function backupSheet() {
    openSheet(
      '<h2>' + Icon('save', 22) + ' ' + L('نسخة احتياطية') + '</h2>' +
      '<p class="note">' + (window.Sync && window.Sync.on
        ? L('النقاط محفوظة في حسابك وتتبعك على أي جهاز. أسماء الطالبات تبقى في هذا المتصفّح وحده، والنسخة الاحتياطية تحفظها كذلك.')
        : L('النقاط والأسماء محفوظة في هذا المتصفّح وحده. احفظي نسخة بين حين وآخر،') + ' ' +
          L('فتعود اللوحة كما هي على أي جهاز.')) + '</p>' +
      '<div class="sheet-actions" style="justify-content:flex-start">' +
        '<button class="btn btn--primary" id="bk-save" type="button">' + Icon('save', 17) + ' ' + L('حفظ نسخة الآن') + '</button>' +
        '<button class="btn" id="bk-pick" type="button">' + Icon('load', 17) + ' ' + L('استعادة من ملف') + '</button>' +
      '</div>' +
      '<input type="file" id="bk-file" accept=".json,application/json" hidden>' +
      '<p id="bk-msg" class="note"></p>' +
      '<div class="sheet-actions">' +
        '<button class="btn" data-close type="button">' + L('إغلاق') + '</button>' +
        '<button class="btn btn--danger" id="bk-apply" type="button" hidden>' + L('استبدال بيانات اللوحة الآن') + '</button>' +
      '</div>',
      function (ov) {
        $('#bk-save', ov).addEventListener('click', function () {
          doBackup();
          $('#bk-msg', ov).textContent = L('حُفظ الملف في مجلّد التنزيلات. احتفظي به في مكان تجدينه.');
        });
        $('#bk-pick', ov).addEventListener('click', function () { $('#bk-file', ov).click(); });
        $('#bk-file', ov).addEventListener('change', function () {
          var f = this.files && this.files[0];
          if (!f) return;
          var fr = new FileReader();
          fr.onload = function () { restoreFrom(String(fr.result), ov); };
          fr.readAsText(f);
        });
      }
    );
  }

  /* ------------------------------ إعادة المسابقة -------------------------- */
  function snapshot() {
    return {
      date: new Date().toISOString(),
      title: state.title,
      results: visibleGroups().map(function (g) { return { name: g.name, treeId: g.treeId, count: g.count }; })
    };
  }

  function confirmReset() {
    var total = visibleGroups().reduce(function (s, g) { return s + g.count; }, 0);
    openSheet(
      '<h2>🔄 ' + L('إعادة المسابقة') + '</h2>' +
      '<p class="note">' + L('سيعود عدّاد كل مجموعة إلى صفر وتبدأ الأشجار من جديد.') +
      (total > 0 ? ' ' + L('تُحفظ النتيجة الحالية في السجل قبل المسح.') : '') + '</p>' +
      '<label class="switch"><input type="checkbox" id="keep-names" checked> ' + L('الاحتفاظ بأسماء المجموعات') + '</label>' +
      (total > 0 ? '<label class="switch"><input type="checkbox" id="archive" checked> ' + L('حفظ النتيجة الحالية في السجل') + '</label>' : '') +
      '<div class="sheet-actions">' +
        '<button class="btn" data-close type="button">' + L('إلغاء') + '</button>' +
        '<button class="btn btn--danger" id="do-reset" type="button">' + L('نعم، ابدئي من جديد') + '</button>' +
      '</div>',
      function (ov) {
        $('#do-reset', ov).addEventListener('click', function () {
          var arch = $('#archive', ov);
          if (arch && arch.checked && total > 0) state.history.unshift(snapshot());
          if (state.history.length > 60) state.history.length = 60;
          var keep = $('#keep-names', ov).checked;
          state.groups.forEach(function (g, i) {
            g.count = 0;
            if (!keep) g.name = L('المجموعة') + ' ' + (Store.ORD[i] || (i + 1));
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
    var html = '<h2>📜 ' + L('سجل المسابقات') + '</h2><p class="note">' + L('النتيجة الحالية والنتائج المحفوظة سابقًا.') + '</p>';

    html += '<div class="hist-item"><h3>' + L('النتيجة الحالية') + '</h3><div class="meta">' + esc(Exporter.arabicDate(cur.date)) + '</div>' +
      histList(cur) +
      '<div class="sheet-actions" style="justify-content:flex-start;margin-top:4px">' +
      '<button class="btn btn--sm" data-png="now" type="button">🖼️ ' + L('صورة') + '</button>' +
      '<button class="btn btn--sm" data-csv="now" type="button">📄 ' + L('جدول') + '</button></div></div>';

    if (!state.history.length) {
      html += '<p class="empty">' + L('لا توجد مسابقات محفوظة بعد. تُحفظ النتيجة تلقائيًا عند الضغط على «إعادة المسابقة».') + '</p>';
    } else {
      state.history.forEach(function (rec, i) {
        html += '<div class="hist-item"><h3>' + esc(rec.title || L('مسابقة')) + '</h3>' +
          '<div class="meta">' + esc(Exporter.arabicDate(rec.date)) + '</div>' + histList(rec) +
          '<div class="sheet-actions" style="justify-content:flex-start;margin-top:4px">' +
          '<button class="btn btn--sm" data-png="' + i + '" type="button">🖼️ ' + L('صورة') + '</button>' +
          '<button class="btn btn--sm" data-csv="' + i + '" type="button">📄 ' + L('جدول') + '</button>' +
          '<button class="btn btn--sm btn--danger" data-del="' + i + '" type="button">' + L('حذف') + '</button></div></div>';
      });
    }
    html += '<div class="sheet-actions"><button class="btn" data-close type="button">' + L('إغلاق') + '</button></div>';

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
        '<input type="text" maxlength="30" data-gname="' + i + '" value="' + esc(g.name) + '" aria-label="' + L('اسم المجموعة') + ' ' + (i + 1) + '">' +
        '<select data-gtree="' + i + '" aria-label="' + esc(W.holder) + ' ' + L('المجموعة') + ' ' + (i + 1) + '">' + treeOptions(g.treeId) + '</select>' +
      '</div>';
    }).join('');

    openSheet(
      '<h2>⚙️ ' + L('الإعدادات') + '</h2><p class="note">' + (Store.linked
        ? L('عنوان اللوحة والمجموعات تُحفظ في حسابك، وأسماء الطالبات في هذا الجهاز وحده.')
        : L('كل التغييرات تُحفظ في هذا الجهاز.')) + '</p>' +
      '<fieldset class="block"><legend>' + L('المسابقة') + '</legend>' +
        '<div class="row"><label for="set-title">' + L('عنوان اللوحة') + '</label><input type="text" id="set-title" maxlength="40" value="' + esc(state.title) + '"></div>' +
      '</fieldset>' +
      '<fieldset class="block"><legend>' + L('عدد المجموعات') + '</legend>' +
        '<p class="note" style="margin:0 0 8px">' + L('تبقى بيانات المجموعات المخفيّة محفوظة، وتعود متى زدتِ العدد.') + '</p>' +
        '<div class="seg" id="set-count">' +
          [4, 5, 6].map(function (n) {
            return '<button type="button" data-n="' + n + '" aria-pressed="' +
              (visibleCount() === n ? 'true' : 'false') + '">' + n + '</button>';
          }).join('') +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="block"><legend>' + L('المجموعات و') + esc(W.holderAl) + '</legend>' + groupsHtml + '</fieldset>' +
      '<fieldset class="block"><legend>' + L('أسماء عجلة الحظ') + '</legend>' +
        '<p class="note" style="margin:0 0 8px">' + L('اسم في كل سطر. تُستخدم في عجلة الحظ وفي المجموعات السريعة.') + '</p>' +
        '<textarea id="set-names" class="names-box" rows="7" aria-label="' + L('أسماء الطلاب') + '" ' +
          'placeholder="' + L('أحمد') + '&#10;' + L('مريم') + '&#10;' + L('سالم') + '">' + esc(state.wheel.list.join('\n')) + '</textarea>' +
        (Store.STUDENTS.length
          ? '<button class="btn btn--sm" id="set-names-restore" type="button">↺ ' + L('استعادة القائمة الأصلية') + '</button>'
          : '') +
      '</fieldset>' +
      '<fieldset class="block"><legend>' + L('المظهر والصوت') + '</legend>' +
        '<label class="switch"><input type="checkbox" id="set-sound"' + (state.sound ? ' checked' : '') + '> ' + L('الأصوات اللطيفة') + '</label>' +
        '<label class="switch"><input type="checkbox" id="set-texture"' + (state.texture ? ' checked' : '') + '> ' + L('ملمس الورق الخفيف في الخلفية') + '</label>' +
      '</fieldset>' +
      /* في النسخة المربوطة بحساب، الاسم والرمز في الحساب لا في الجهاز،
         فلا نعرض خانتين يظنّ المستخدم أنهما تغيّرانه. */
      (Store.linked
        ? '<fieldset class="block"><legend>' + L('حسابك') + '</legend>' +
            '<p class="note">' + L('أنتِ داخلة باسم') + ' <b>' + esc(state.auth.user) + '</b>. ' +
            L('نقاطك محفوظة في هذا الحساب وتفتح على أي جهاز. ولتغيير الرمز راسلي من باعتك اللوحة.') +
            '</p></fieldset>'
        : '<fieldset class="block"><legend>' + L('بيانات الدخول') + '</legend>' +
            '<div class="row"><label for="set-user">' + L('اسم المستخدم') + '</label><input type="text" id="set-user" value="' + esc(state.auth.user) + '" spellcheck="false"></div>' +
            '<div class="row"><label for="set-pin">' + L('رمز الدخول') + '</label><input type="text" id="set-pin" value="' + esc(state.auth.pin) + '" spellcheck="false"></div>' +
          '</fieldset>') +
      '<div class="sheet-actions">' +
        '<button class="btn" data-close type="button">' + L('إلغاء') + '</button>' +
        '<button class="btn btn--primary" id="set-save" type="button">' + L('حفظ التغييرات') + '</button>' +
      '</div>',
      function (ov) {
        var pickCount = visibleCount();
        $$('#set-count button', ov).forEach(function (b) {
          b.addEventListener('click', function () {
            pickCount = +b.getAttribute('data-n');
            $$('#set-count button', ov).forEach(function (x) {
              x.setAttribute('aria-pressed', +x.getAttribute('data-n') === pickCount ? 'true' : 'false');
            });
          });
        });
        var restore = $('#set-names-restore', ov);
        if (restore) restore.addEventListener('click', function () {
          $('#set-names', ov).value = Store.STUDENTS.join('\n');
        });
        $('#set-save', ov).addEventListener('click', function () {
          var title = $('#set-title', ov).value.trim();
          if (title) state.title = title;
          state.visible = pickCount;
          $$('[data-gname]', ov).forEach(function (inp) {
            var i = +inp.getAttribute('data-gname');
            var v = inp.value.trim();
            if (v) state.groups[i].name = v;
          });
          $$('[data-gtree]', ov).forEach(function (sel) {
            var i = +sel.getAttribute('data-gtree');
            if (T.byId[sel.value]) state.groups[i].treeId = sel.value;
          });
          var names = $('#set-names', ov).value.split('\n')
            .map(function (x) { return x.trim(); })
            .filter(Boolean).slice(0, 120);
          var changed = state.wheel.list.join('\n') !== names.join('\n');
          state.wheel.list = names;
          state.wheel.picked = state.wheel.picked.filter(function (x) { return names.indexOf(x) !== -1; });
          if (changed && state.wheel.quick) state.wheel.quick.last = null;
          state.sound = $('#set-sound', ov).checked;
          state.texture = $('#set-texture', ov).checked;
          if (!Store.linked) {
            var u = $('#set-user', ov).value.trim();
            var pin = $('#set-pin', ov).value.trim();
            if (u) state.auth.user = u;
            if (pin) state.auth.pin = pin;
          }
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
  function toggleMenu(open) {
    var m = $('#more-menu'), b = $('#btn-more');
    if (!m || !b) return;
    m.hidden = !open;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* كل زرّ في القائمة يغلقها قبل أن يفتح نافذته */
  function on(sel, fn) {
    var el = $(sel); if (!el) return;
    el.addEventListener('click', function () { toggleMenu(false); fn(); });
  }

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
      $('.tree-btn', card).setAttribute('aria-label', L('أضف') + ' ' + t.fruit + ' ' + L('إلى') + ' ' + v);
      persist();
      updateWinner();
    });

    on('#btn-celebrate', celebrate);
    on('#btn-wheel', function () { if (wheel) wheel.open(); });
    on('#btn-groups', function () { if (groups) groups.open(); });
    on('#btn-all', addAll);
    on('#btn-present', function () { setPresent(!presentOn()); });
    on('#btn-history', historySheet);
    on('#btn-backup', backupSheet);
    on('#btn-settings', settingsSheet);
    on('#btn-reset', confirmReset);
    on('#btn-logout', function () {
      if (window.Sync && window.Sync.on) { window.Sync.flush(); window.Sync.stop(); }
      paintSync('off');
      state.loggedIn = false;
      Store.save(state);
      if (Store.linked) {
        /* الرابط واحد يفتحه الجميع: بعد الخروج لا يبقى أثر حساب */
        Store.forget();
        Store.use(null);
        state = Store.load();
      }
      showLogin();
    });
    $('#present-exit').addEventListener('click', function () { setPresent(false); });

    /* قائمة «المزيد» */
    $('#btn-more').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu($('#more-menu').hidden);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu-wrap')) toggleMenu(false);
    });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && presentOn()) {
        document.documentElement.classList.remove('present');
        $('#present-exit').hidden = true;
      }
    });

    $('#modal-root').addEventListener('click', function (e) {
      if (e.target.closest('.timer-overlay') || e.target.closest('.wheel-overlay') || e.target.closest('.qg-overlay')) return;
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
      if (e.key === 'Escape' && presentOn()) { e.preventDefault(); setPresent(false); return; }
      if (map[e.key] != null && map[e.key] < visibleCount() && state.groups[map[e.key]]) {
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
    if (!timer) {
      timer = window.BustanTimer.create({
        mount: $('#timer'),
        get: function () { return state.timer; },
        save: persist,
        beforeOpen: closeSheet
      });
    }
    if (!wheel) {
      wheel = window.BustanWheel.create({
        get: function () { return state.wheel; },
        save: persist,
        beforeOpen: function () { closeSheet(); if (timer) timer.closeBig(); if (groups) groups.close(); },
        openSettings: settingsSheet
      });
    }
    if (!groups) {
      groups = window.BustanGroups.create({
        get: function () { return state.wheel; },
        save: persist,
        beforeOpen: function () { closeSheet(); if (timer) timer.closeBig(); if (wheel) wheel.close(); },
        openSettings: settingsSheet
      });
    }
  }

  /* ================================= الإقلاع ============================== */
  /* أيقونات الشريط والقائمة */
  function paintIcons() {
    var I = window.Icon || function () { return ''; };
    [['#btn-celebrate', 'cup'], ['#btn-wheel', 'wheel'], ['#btn-groups', 'users'], ['#btn-all', 'plus'],
     ['#btn-present', 'full'], ['#btn-more', 'more'], ['#btn-history', 'list'], ['#btn-backup', 'save'],
     ['#btn-settings', 'gear'], ['#btn-reset', 'reset'], ['#btn-logout', 'exit']
    ].forEach(function (m) {
      var el = $(m[0]);
      if (el && !$('.ic', el)) el.insertAdjacentHTML('afterbegin', I(m[1], 17));
    });
    var ex = $('#present-exit');
    if (ex && !$('.ic', ex)) {
      ex.innerHTML = I('small', 15) + ' ' + L('خروج من وضع العرض');
    }
  }

  function applyTheme() {
    var r = document.documentElement;
    r.setAttribute('data-theme', TH.id || 'garden');
    r.setAttribute('dir', TH.dir || 'rtl');
    r.setAttribute('lang', TH.lang || 'ar');
    if (window.L && window.L.translateStatic) window.L.translateStatic(document.body);
    if (TH.title) {
      var lt = $('#login-title'); if (lt) lt.textContent = TH.title;
    }
    if (TH.tagline) {
      var sub = $('.login-card .sub'); if (sub) sub.textContent = TH.tagline;
    }
    /* الإطار صار ملاصقًا للرسم، فنعوّض الحجم بنسبة محفوظة في متغيّر واحد */
    if (window.BustanLogo && window.BustanLogo.markScale) {
      r.style.setProperty('--mark-k', String(window.BustanLogo.markScale(TH.id || 'garden')));
    }
    var ic = $('#board-title span[aria-hidden]');
    if (ic && window.BustanLogo) ic.innerHTML = window.BustanLogo.svg({ word: false, tag: false });
    else if (ic && TH.icon) ic.textContent = TH.icon;
    if (TH.boardHint) {
      var fn = $('.foot-note'); if (fn) fn.textContent = TH.boardHint;
    }
  }

  function init() {
    applyTheme();
    paintIcons();
    /* يثبّت أي ترقية جرت أثناء التحميل، مثل تغيير الرمز الافتراضي */
    persist();
    Sound.setEnabled(state.sound);
    document.body.classList.toggle('no-texture', !state.texture);
    initLogin();
    bindBoard();
    if (state.loggedIn && state.auth && state.auth.user) {
      showBoard();
      startSync(state.auth.user, state.auth.pin);
    } else showLogin();
    if (window.BustanLogo) window.BustanLogo.splash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

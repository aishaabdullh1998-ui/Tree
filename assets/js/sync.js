/* مزامنة اللوحة مع حساب المعلّمة.
   تعمل فقط إن حُقن window.BUSTAN_SYNC وقت البناء (النسخة المباعة).
   بدونه تبقى اللوحة كما هي: كل شيء في متصفّح الجهاز، بلا أي اتصال.

   ما يُرفع: عنوان اللوحة، المجموعات ونقاطها، عدد البطاقات الظاهرة،
             السجلّ، مدّة المؤقّت، الصوت والملمس.
   ما لا يُرفع أبدًا: أسماء الطالبات في عجلة الحظ، ولا من سُحب منهنّ.
                     تبقى في الجهاز وحده. */
(function (global) {
  'use strict';

  var CFG = global.BUSTAN_SYNC;
  if (!CFG || !CFG.url || !CFG.key) { global.Sync = { on: false }; return; }

  /* عنوان المشروع قد يُنسخ بأشكال: العنوان وحده، أو ومعه /rest/v1،
     أو ومعه /rest/v1/rpc. نقبلها كلّها ونردّها إلى الأصل. */
  var URL_BASE = String(CFG.url)
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1(\/rpc)?$/i, '')
    .replace(/\/+$/, '') + '/rest/v1/rpc/';

  /* Supabase يسلّم نوعين من المفاتيح:
       - القديم (anon) رمزُ JWT يبدأ بـ eyJ، ويُرسل في الترويستين.
       - الجديد (publishable) نصٌّ قصير يبدأ بـ sb_، وليس JWT. فإن أُرسل
         في Authorization حاول الخادم قراءته رمزًا موقَّعًا ففشل وردّ ٤٠١.
     فنرسل apikey دائمًا، و Authorization لمن يصلح له وحده. */
  function headers() {
    var h = { 'apikey': CFG.key, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(String(CFG.key))) h.Authorization = 'Bearer ' + CFG.key;
    return h;
  }
  var BOARD = (global.Theme && global.Theme.id) || 'garden';
  var PUSH_DELAY = 2500;      /* هدوء بعد آخر ضغطة قبل الرفع */
  var RETRY = [4000, 10000, 30000, 60000];

  var cred = null;            /* { user, pin } بعد دخول صحيح */
  var timer = null, tries = 0, inflight = false;
  var getState = null, listener = null;
  var status = 'off';

  function setStatus(s) {
    if (s === status) return;
    status = s;
    if (listener) { try { listener(s); } catch (e) {} }
  }

  function call(fn, body, done) {
    var ctl = global.AbortController ? new global.AbortController() : null;
    var kill = ctl && global.setTimeout(function () { ctl.abort(); }, 12000);
    global.fetch(URL_BASE + fn, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (kill) global.clearTimeout(kill);
      return r.json().then(function (j) { done(null, j, r.status); },
                           function () { done(new Error('bad json')); });
    }).catch(function (e) {
      if (kill) global.clearTimeout(kill);
      done(e);
    });
  }

  /* ----------------------- ما يُرفع وما يُستبقى ------------------------- */

  function pick(s) {
    return {
      title: s.title,
      sound: s.sound !== false,
      texture: s.texture !== false,
      visible: s.visible,
      duration: (s.timer && s.timer.duration) || 120,
      groups: (s.groups || []).map(function (g) {
        return { id: g.id, name: g.name, treeId: g.treeId, count: g.count };
      }),
      history: (s.history || []).slice(0, 60)
    };
  }

  /* يدمج ما جاء من السيرفر في الحالة المحلّية، دون المساس بالأسماء */
  function apply(s, d) {
    if (!d || typeof d !== 'object') return s;
    if (typeof d.title === 'string' && d.title) s.title = d.title;
    if (typeof d.sound === 'boolean') s.sound = d.sound;
    if (typeof d.texture === 'boolean') s.texture = d.texture;
    var v = parseInt(d.visible, 10);
    if (v >= 2 && v <= 6) s.visible = v;
    var dur = parseInt(d.duration, 10);
    if (dur >= 5 && dur <= 3600) {
      s.timer = s.timer || {};
      s.timer.duration = dur;
      if (!(s.timer.remaining >= 0 && s.timer.remaining <= dur)) s.timer.remaining = dur;
    }
    if (Array.isArray(d.groups) && d.groups.length) {
      s.groups = d.groups.map(function (g, i) {
        var cur = (s.groups && s.groups[i]) || {};
        return {
          id: g.id || cur.id || ('g' + (i + 1)),
          name: typeof g.name === 'string' && g.name.trim() ? g.name : cur.name,
          treeId: (global.Trees.byId[g.treeId] ? g.treeId : cur.treeId) || global.Trees.LIST[i % 6].id,
          count: Math.max(0, parseInt(g.count, 10) || 0)
        };
      });
    }
    if (Array.isArray(d.history)) s.history = d.history.slice(0, 60);
    return s;
  }

  function totalOf(d) {
    return ((d && d.groups) || []).reduce(function (a, g) {
      return a + (parseInt(g.count, 10) || 0);
    }, 0);
  }

  /* --------------------------------- الرفع ------------------------------- */

  function flush() {
    if (!cred || inflight || !getState) return;
    var s = getState();
    if (!s || !s.sync || !s.sync.dirty) return;
    inflight = true;
    setStatus('syncing');
    call('board_push', {
      p_board: BOARD, p_user: cred.user, p_pin: cred.pin,
      p_data: pick(s), p_rev: (s.sync && s.sync.rev) || 0
    }, function (err, j) {
      inflight = false;
      var cur = getState();
      if (err || !j || j.ok !== true) {
        if (j && j.err === 'stale') {   /* جهاز آخر سبقنا: نسحب ثم نرفع */
          pull(function () { mark(); schedule(); });
          return;
        }
        tries++;
        setStatus(err ? 'offline' : 'error');
        if (tries <= RETRY.length) {
          global.setTimeout(flush, RETRY[tries - 1]);
        }
        return;
      }
      tries = 0;
      cur.sync = { rev: j.rev, at: j.updated_at, dirty: false };
      global.Store.save(cur);
      setStatus('saved');
    });
  }

  function schedule() {
    if (!cred) return;
    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(function () { timer = null; flush(); }, PUSH_DELAY);
  }

  function mark() {
    var s = getState && getState();
    if (!s) return;
    s.sync = s.sync || { rev: 0, at: null, dirty: false };
    s.sync.dirty = true;
    /* لا نقول «محفوظ» وفي اليد تغييرٌ لم يُرفع بعد */
    if (cred && status === 'saved') setStatus('syncing');
  }

  /* --------------------------------- السحب ------------------------------- */

  function pull(done) {
    if (!cred) { done && done(new Error('no cred')); return; }
    setStatus('syncing');
    call('board_pull', { p_board: BOARD, p_user: cred.user, p_pin: cred.pin },
      function (err, j) {
        if (err) { setStatus('offline'); done && done(err); return; }
        if (!j || j.ok !== true) { setStatus('error'); done && done(new Error((j && j.err) || 'fail')); return; }
        var s = getState();
        s.sync = s.sync || { rev: 0, at: null, dirty: false };
        apply(s, j.data);
        s.sync = { rev: j.rev, at: j.updated_at, dirty: false };
        global.Store.save(s);
        setStatus('saved');
        done && done(null, j);
      });
  }

  /* يُستدعى بعد دخول صحيح. يقرّر: نعتمد السيرفر، أم نرفع ما عندنا،
     أم نسأل المعلّمة حين يتعارض الجهازان. */
  function start(user, pin, state, hooks) {
    cred = { user: String(user), pin: String(pin) };
    getState = hooks.state;
    listener = hooks.status || null;
    state.sync = state.sync || { rev: 0, at: null, dirty: false };
    setStatus('syncing');

    call('board_pull', { p_board: BOARD, p_user: cred.user, p_pin: cred.pin },
      function (err, j) {
        if (err) { setStatus('offline'); global.setTimeout(function () { start2(); }, RETRY[0]); return; }
        if (!j || j.ok !== true) {
          /* حساب غير معروف على السيرفر: اللوحة تعمل محلّيًا كما هي */
          cred = null;
          setStatus('off');
          return;
        }
        var s = getState();
        var local = s.sync || { rev: 0, dirty: false };

        if (j.rev === 0) {                       /* أول مرّة: نرفع ما عندنا */
          s.sync = { rev: 0, at: null, dirty: true };
          flush();
          return;
        }
        if (j.rev === local.rev) {               /* متوافقان */
          if (local.dirty) { flush(); } else { setStatus('saved'); }
          return;
        }
        /* السيرفر تقدّم علينا */
        if (!local.dirty) {
          apply(s, j.data);
          s.sync = { rev: j.rev, at: j.updated_at, dirty: false };
          global.Store.save(s);
          setStatus('saved');
          if (hooks.refresh) hooks.refresh();
          return;
        }
        /* الجهازان تغيّرا: القرار لها */
        if (hooks.conflict) {
          hooks.conflict({
            remote: totalOf(j.data), local: totalOf(pick(s)), when: j.updated_at,
            useRemote: function () {
              var st = getState();
              apply(st, j.data);
              st.sync = { rev: j.rev, at: j.updated_at, dirty: false };
              global.Store.save(st);
              setStatus('saved');
              if (hooks.refresh) hooks.refresh();
            },
            useLocal: function () {
              var st = getState();
              st.sync = { rev: j.rev, at: j.updated_at, dirty: true };
              flush();
            }
          });
        } else { flush(); }
      });

    function start2() { if (cred) pull(); }
  }

  function stop() {
    cred = null; getState = null;
    if (timer) { global.clearTimeout(timer); timer = null; }
    setStatus('off');
  }

  /* رفع أخير عند إغلاق الصفحة أو تصغيرها */
  function bindExit() {
    function go() {
      if (!cred || !getState) return;
      var s = getState();
      if (!s.sync || !s.sync.dirty) return;
      if (timer) { global.clearTimeout(timer); timer = null; }
      var body = JSON.stringify({
        p_board: BOARD, p_user: cred.user, p_pin: cred.pin,
        p_data: pick(s), p_rev: s.sync.rev || 0
      });
      /* sendBeacon لا يحمل ترويسات، فنستعمل fetch بوضع keepalive */
      try {
        global.fetch(URL_BASE + 'board_push', {
          method: 'POST', keepalive: true,
          headers: headers(),
          body: body
        });
      } catch (e) {}
    }
    global.addEventListener('pagehide', go);
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.visibilityState === 'hidden') go();
    });
    global.addEventListener('online', function () { if (cred) { tries = 0; flush(); } });
  }
  bindExit();

  /* تحقّق من الحساب قبل الدخول: السيرفر هو من يقرّر، لا رمزٌ في الملف.
     يُرجع خطأ 'offline' إن تعذّر الاتصال، فتُجرّب اللوحة آخر نسخة محلّية. */
  function authenticate(user, pin, cb) {
    call('board_pull', { p_board: BOARD, p_user: String(user), p_pin: String(pin) },
      function (err, j) {
        if (err) { cb('offline'); return; }
        if (!j || j.ok !== true) { cb((j && j.err) || 'auth'); return; }
        cb(null, j);
      });
  }

  global.Sync = {
    on: true,
    board: BOARD,
    auth: authenticate,
    applyData: apply,
    start: start,
    stop: stop,
    pull: pull,
    touch: function () { mark(); schedule(); },
    flush: function () { if (timer) { global.clearTimeout(timer); timer = null; } flush(); },
    status: function () { return status; }
  };
})(window);

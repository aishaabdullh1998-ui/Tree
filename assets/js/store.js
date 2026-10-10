/* تخزين البيانات محليًا في المتصفح - تبقى محفوظة بعد إغلاق الصفحة */
(function (global) {
  'use strict';
  var KEY = 'bustan.groups.v1';
  /* يُرفع هذا الرقم عند تغيير الرمز الافتراضي، لتحديث الأجهزة التي تحمل الرمز القديم */
  var DEFAULTS_VERSION = 2;
  var DEFAULT_PIN = '19961998';
  var OLD_PINS = ['2030'];

  var ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];

  /* أسماء الطلاب في عجلة الحظ.
     القائمة فارغة في هذه النسخة حفاظًا على خصوصية الطلاب؛ تُضاف الأسماء من
     صفحة الإعدادات وتُحفظ في متصفّح الجهاز وحده. يمكن لنسخة خاصة تزويدها
     مسبقًا عبر window.BUSTAN_NAMES قبل تحميل هذا الملف. */
  var STUDENTS = (global.BUSTAN_NAMES && global.BUSTAN_NAMES.length)
    ? global.BUSTAN_NAMES.map(String)
    : [];

  function defaults() {
    return {
      v: 1,
      defaultsVersion: DEFAULTS_VERSION,
      title: 'بستان المجموعات',
      auth: { user: 'aisha', pin: DEFAULT_PIN },
      loggedIn: false,
      sound: true,
      texture: true,
      timer: { duration: 120, remaining: 120 },
      wheel: { list: STUDENTS.slice(), picked: [], skipPicked: true,
               quick: { mode: 'size', size: 5, count: 4, last: null } },
      groups: global.Trees.LIST.map(function (t, i) {
        return { id: 'g' + (i + 1), name: 'المجموعة ' + (ORD[i] || (i + 1)), treeId: t.id, count: 0 };
      }),
      history: []
    };
  }

  function load() {
    var d = defaults();
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return d;
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return d;
      /* دمج آمن مع القيم الافتراضية */
      d.title = typeof s.title === 'string' ? s.title : d.title;
      if (s.auth && s.auth.user && s.auth.pin) d.auth = { user: String(s.auth.user), pin: String(s.auth.pin) };
      /* ترقية الرمز الافتراضي القديم، دون المساس برمز اختاره المستخدم بنفسه */
      var saved = parseInt(s.defaultsVersion, 10) || 1;
      if (saved < DEFAULTS_VERSION && OLD_PINS.indexOf(d.auth.pin) !== -1) {
        d.auth.pin = DEFAULT_PIN;
      }
      d.defaultsVersion = DEFAULTS_VERSION;
      d.loggedIn = !!s.loggedIn;
      d.sound = s.sound !== false;
      d.texture = s.texture !== false;
      if (Array.isArray(s.groups) && s.groups.length) {
        d.groups = s.groups.map(function (g, i) {
          return {
            id: g.id || 'g' + (i + 1),
            name: typeof g.name === 'string' && g.name.trim() ? g.name : 'المجموعة ' + (ORD[i] || (i + 1)),
            treeId: global.Trees.byId[g.treeId] ? g.treeId : global.Trees.LIST[i % 6].id,
            count: Math.max(0, parseInt(g.count, 10) || 0)
          };
        });
      }
      if (s.timer && typeof s.timer === 'object') {
        var dur = Math.max(5, Math.min(3600, parseInt(s.timer.duration, 10) || 120));
        var rem = parseFloat(s.timer.remaining);
        if (!isFinite(rem) || rem < 0 || rem > dur) rem = dur;
        d.timer = { duration: dur, remaining: rem };
      }
      if (s.wheel && typeof s.wheel === 'object') {
        var list = Array.isArray(s.wheel.list)
          ? s.wheel.list.map(function (x) { return String(x).trim(); }).filter(Boolean).slice(0, 120)
          : d.wheel.list;
        var picked = Array.isArray(s.wheel.picked)
          ? s.wheel.picked.map(String).filter(function (x) { return list.indexOf(x) !== -1; })
          : [];
        var q = d.wheel.quick, sq = s.wheel.quick;
        if (sq && typeof sq === 'object') {
          var last = null;
          if (Array.isArray(sq.last)) {
            last = sq.last
              .filter(Array.isArray)
              .map(function (g) { return g.map(String).filter(function (x) { return list.indexOf(x) !== -1; }); })
              .filter(function (g) { return g.length; });
            if (!last.length) last = null;
          }
          q = {
            mode: sq.mode === 'count' ? 'count' : 'size',
            size: Math.max(2, Math.min(12, parseInt(sq.size, 10) || 5)),
            count: Math.max(2, Math.min(12, parseInt(sq.count, 10) || 4)),
            last: last
          };
        }
        d.wheel = { list: list, picked: picked, skipPicked: s.wheel.skipPicked !== false, quick: q };
      }
      if (Array.isArray(s.history)) d.history = s.history.slice(0, 60);
      return d;
    } catch (e) { return d; }
  }

  function save(state) {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function wipe() { try { global.localStorage.removeItem(KEY); } catch (e) {} }

  global.Store = { load: load, save: save, wipe: wipe, defaults: defaults, ORD: ORD, KEY: KEY, STUDENTS: STUDENTS };
})(window);

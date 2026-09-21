/* تخزين البيانات محليًا في المتصفح - تبقى محفوظة بعد إغلاق الصفحة */
(function (global) {
  'use strict';
  var KEY = 'bustan.groups.v1';

  var ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];

  function defaults() {
    return {
      v: 1,
      title: 'بستان المجموعات',
      auth: { user: 'aisha', pin: '2030' },
      loggedIn: false,
      sound: true,
      texture: true,
      timer: { duration: 120, remaining: 120 },
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
      if (Array.isArray(s.history)) d.history = s.history.slice(0, 60);
      return d;
    } catch (e) { return d; }
  }

  function save(state) {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function wipe() { try { global.localStorage.removeItem(KEY); } catch (e) {} }

  global.Store = { load: load, save: save, wipe: wipe, defaults: defaults, ORD: ORD, KEY: KEY };
})(window);

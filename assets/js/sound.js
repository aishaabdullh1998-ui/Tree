/* أصوات لطيفة مُولّدة داخل المتصفح - بلا أي ملفات خارجية */
(function (global) {
  'use strict';
  var ctx = null, enabled = true;

  function ac() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.16 : vol, c.currentTime + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.03);
  }

  function glide(f1, f2, start, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(f1, c.currentTime + start);
    o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.18 : vol, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.03);
  }

  var Sound = {
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },
    unlock: function () { ac(); },
    /* نقرة لطيفة عند إضافة ثمرة */
    pop: function (step) {
      if (!enabled) return;
      var base = 620 + ((step || 0) % 7) * 46;
      glide(base, base * 1.7, 0, 0.16, 'triangle', 0.15);
      tone(base * 2.4, 0.05, 0.10, 'sine', 0.06);
    },
    /* صوت هابط عند التراجع */
    undo: function () {
      if (!enabled) return;
      glide(520, 250, 0, 0.20, 'sine', 0.12);
    },
    /* نغمة عند تسجيل الدخول */
    open: function () {
      if (!enabled) return;
      [523.25, 659.25, 783.99].forEach(function (f, i) { tone(f, i * 0.07, 0.22, 'sine', 0.11); });
    },
    error: function () {
      if (!enabled) return;
      glide(300, 170, 0, 0.22, 'sawtooth', 0.09);
    },
    /* احتفال الفائز */
    fanfare: function () {
      if (!enabled) return;
      var notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
      notes.forEach(function (f, i) {
        tone(f, i * 0.115, 0.30, 'triangle', 0.13);
        tone(f / 2, i * 0.115, 0.30, 'sine', 0.07);
      });
      tone(1567.98, 0.86, 0.9, 'sine', 0.10);
    },
    sparkle: function () {
      if (!enabled) return;
      for (var i = 0; i < 5; i++) tone(900 + Math.random() * 900, i * 0.045, 0.14, 'sine', 0.05);
    }
  };
  global.Sound = Sound;
})(window);

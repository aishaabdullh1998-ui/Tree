/* تصدير النتائج: شهادة صورة PNG أو ملف جدول CSV */
(function (global) {
  'use strict';
  var T = global.Trees;

  /* داخل إطار مضمّن (مثل صفحة المعاينة) يُمنع التنزيل المباشر،
     فنعرض النتيجة لتُحفظ بالضغط المطوّل أو بالزر الأيمن. */
  var EMBEDDED = (function () {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  function saveAs(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
    return url;
  }

  function closePeek() {
    var el = document.querySelector('.peek');
    if (el) el.remove();
  }

  function peek(inner) {
    closePeek();
    var ov = document.createElement('div');
    ov.className = 'overlay peek';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="sheet">' + inner +
      '<div class="sheet-actions" style="justify-content:center">' +
      '<button class="btn" type="button" data-peek-close>إغلاق</button></div></div>';
    document.getElementById('modal-root').appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closePeek(); });
    ov.querySelector('[data-peek-close]').addEventListener('click', closePeek);
    return ov;
  }

  /* على الصفحة المنشورة يمرّ الحفظ عبر منصّة العرض، وإلا يُنزَّل مباشرة */
  function platformSave() {
    if (!window.claude || typeof window.claude.use !== 'function') return Promise.resolve(null);
    try {
      return Promise.resolve(window.claude.use('downloads')).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function download(blob, filename) {
    platformSave().then(function (ns) {
      if (ns && typeof ns.save === 'function') {
        return ns.save({ filename: filename, data: blob }).then(null, function (err) {
          if (err && err.code === 'declined') return;
          fallbackSave(blob, filename);
        });
      }
      fallbackSave(blob, filename);
    });
  }

  function fallbackSave(blob, filename) {
    var url = saveAs(blob, filename);
    if (!EMBEDDED) return;
    if (/\.png$/.test(filename)) {
      peek('<h2 style="justify-content:center">🖼️ صورة النتائج</h2>' +
        '<p class="note" style="text-align:center">اضغطي مطوّلًا على الصورة لحفظها، أو بالزر الأيمن ثم «حفظ الصورة».</p>' +
        '<img class="peek-img" src="' + url + '" alt="صورة نتائج المسابقة">');
    } else {
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result).replace(/^\ufeff/, '');
        var ov = peek('<h2 style="justify-content:center">📄 جدول النتائج</h2>' +
          '<p class="note" style="text-align:center">انسخي النص والصقيه في أي جدول بيانات.</p>' +
          '<textarea class="peek-text" readonly rows="9"></textarea>' +
          '<div style="text-align:center"><button class="btn btn--sm" type="button" data-copy>📋 نسخ</button></div>');
        var ta = ov.querySelector('.peek-text');
        ta.value = text;
        ov.querySelector('[data-copy]').addEventListener('click', function (e) {
          ta.select();
          try { document.execCommand('copy'); } catch (err) {}
          e.target.textContent = '✓ تم النسخ';
        });
      };
      reader.readAsText(blob);
    }
  }

  function stamp(dateStr) {
    var d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function arabicDate(dateStr) {
    var d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    try {
      return new Intl.DateTimeFormat('ar', { dateStyle: 'full' }).format(d);
    } catch (e) { return stamp(dateStr); }
  }

  /* --------------------------------- CSV --------------------------------- */
  function toCsv(record) {
    var rows = [['الترتيب', 'المجموعة', 'الشجرة', 'الثمرة', 'العدد']];
    var sorted = record.results.slice().sort(function (a, b) { return b.count - a.count; });
    sorted.forEach(function (r, i) {
      var t = T.byId[r.treeId];
      rows.push([String(i + 1), r.name, t ? t.name : r.treeId, t ? t.fruit : '', String(r.count)]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
      'نتائج-' + stamp(record.date) + '.csv');
  }

  /* --------------------------------- PNG --------------------------------- */
  function svgToImage(svgText) {
    return new Promise(function (resolve) {
      var img = new Image();
      var blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function toPng(record) {
    var sorted = record.results.slice().sort(function (a, b) { return b.count - a.count; });
    var top = sorted.length ? sorted[0].count : 0;
    var cols = Math.min(3, Math.max(1, Math.ceil(sorted.length / 2)));
    var rowsN = Math.ceil(sorted.length / cols);

    var pad = 70, cellW = 340, cellH = 400;
    var W = pad * 2 + cellW * cols;
    var H = 250 + rowsN * cellH + 90;

    return Promise.all(sorted.map(function (r) {
      return svgToImage(T.standalone(r.treeId, r.count, { texture: false }));
    })).then(function (imgs) {
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      /* الخلفية */
      ctx.fillStyle = '#FAF4D8'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#C6AA82'; ctx.lineWidth = 8;
      roundRect(ctx, 22, 22, W - 44, H - 44, 40); ctx.stroke();
      ctx.strokeStyle = '#E7B23C'; ctx.lineWidth = 3;
      roundRect(ctx, 40, 40, W - 80, H - 80, 28); ctx.stroke();

      /* العنوان */
      var fam = '"Baloo Bhaijaan 2","Tajawal","Noto Kufi Arabic",sans-serif';
      ctx.fillStyle = '#3B4A2A';
      ctx.font = '800 54px ' + fam;
      ctx.fillText(record.title || 'بستان المجموعات', W / 2, 128);
      ctx.fillStyle = '#74855D';
      ctx.font = '700 26px ' + fam;
      ctx.fillText(arabicDate(record.date), W / 2, 172);

      /* الفائزة */
      if (top > 0) {
        var winners = sorted.filter(function (r) { return r.count === top; });
        ctx.fillStyle = '#C9902A';
        ctx.font = '800 32px ' + fam;
        var label = winners.length > 1
          ? 'تعادل في الصدارة: ' + winners.map(function (w) { return w.name; }).join(' و ')
          : 'المجموعة الفائزة: ' + winners[0].name;
        ctx.fillText(label, W / 2, 218);
      }

      /* البطاقات */
      sorted.forEach(function (r, i) {
        var c = cols - 1 - (i % cols), rw = Math.floor(i / cols);
        var x = pad + c * cellW, y = 250 + rw * cellH;
        var isWin = r.count === top && top > 0;
        ctx.fillStyle = isWin ? '#FFFDF2' : '#FFFBEC';
        ctx.strokeStyle = isWin ? '#E7B23C' : '#DDCCA6';
        ctx.lineWidth = isWin ? 6 : 3;
        roundRect(ctx, x + 12, y + 8, cellW - 24, cellH - 26, 30);
        ctx.fill(); ctx.stroke();

        if (imgs[i]) ctx.drawImage(imgs[i], x + cellW / 2 - 110, y + 24, 220, 250);

        ctx.fillStyle = '#3B4A2A';
        ctx.font = '800 30px ' + fam;
        ctx.fillText(r.name, x + cellW / 2, y + 312);

        var t = T.byId[r.treeId];
        ctx.fillStyle = isWin ? '#C9902A' : '#74855D';
        ctx.font = '800 34px ' + fam;
        ctx.fillText(r.count + ' ' + (t ? T.unitFor(r.treeId, r.count) : ''), x + cellW / 2, y + 356);

        if (isWin) { ctx.font = '40px ' + fam; ctx.fillText('👑', x + cellW / 2, y + 14); }
      });

      ctx.fillStyle = '#9BA886';
      ctx.font = '600 22px ' + fam;
      ctx.fillText('بستان المجموعات · أشجار عُمان المثمرة', W / 2, H - 56);

      return new Promise(function (resolve) {
        cv.toBlob(function (b) {
          if (b) download(b, 'bustan-results-' + stamp(record.date) + '.png');
          resolve(!!b);
        }, 'image/png');
      });
    });
  }

  global.Exporter = { toCsv: toCsv, toPng: toPng, arabicDate: arabicDate, stamp: stamp };
})(window);

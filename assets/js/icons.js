/* ==========================================================================
   أيقونات خطّية ترسمها الصفحة بنفسها - شكل واحد في كل جهاز، بلا إيموجي
   ========================================================================== */
(function (global) {
  'use strict';

  var P = {
    cup:    '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5A2.5 2.5 0 0 0 7 10.5M17 6h2.5A2.5 2.5 0 0 1 17 10.5"/><path d="M12 14v4M8.5 20h7"/>',
    wheel:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/>',
    users:  '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6A4.6 4.6 0 0 1 21 19"/>',
    time:   '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.6M9.5 3h5"/>',
    list:   '<path d="M5 5h14M5 10h14M5 15h9M5 20h9"/>',
    gear:   '<circle cx="12" cy="12" r="3.4"/><path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 14H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/>',
    reset:  '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
    exit:   '<path d="M14 4H6v16h8"/><path d="M11 12h10M17.5 8.5 21 12l-3.5 3.5"/>',
    more:   '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    full:   '<path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5"/>',
    small:  '<path d="M4 9h5V4M20 9h-5V4M20 15h-5v5M4 15h5v5"/>',
    save:   '<path d="M12 3v11M8 10.5l4 4 4-4M4 17v3h16v-3"/>',
    load:   '<path d="M12 14V3M8 6.5 12 2.5l4 4M4 17v3h16v-3"/>',
    plus:   '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
    image:  '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 16.5 9 12l4 3.5 2.5-2 4.5 4"/>',
    table:  '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M9.5 9.5v10"/>',
    trash:  '<path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5 7.5 20h9l1-13.5"/>',
    check:  '<path d="M5 12.5 10 17.5 19 7"/>',
    close:  '<path d="M6 6l12 12M18 6 6 18"/>'
  };

  /* name = اسم الأيقونة، size = الحجم بالبكسل */
  function icon(name, size) {
    var d = P[name];
    if (!d) return '';
    var s = size || 18;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true" ' +
      'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      d + '</svg>';
  }

  global.Icon = icon;
  global.Icon.paths = P;
})(window);

/* يختار محرّك الرسم حسب الثيم: أشجار البستان أو كواكب المجرّة أو رفوف الإنجاز */
(function (global) {
  'use strict';
  var sets = global.ItemSets || {};
  var want = (global.Theme && global.Theme.items) || 'trees';
  global.Trees = sets[want] || sets.trees || sets.planets;
})(window);

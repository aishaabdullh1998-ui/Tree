/* ==========================================================================
   الثيمات - كل ثيم نسخة مستقلّة تمامًا: مفتاح تخزين خاص، عنوان، وبيانات دخول
   بياناتُ ثيمٍ لا تمسّ بيانات ثيمٍ آخر ولو فُتحا على المتصفّح نفسه.
   ========================================================================== */
(function (global) {
  'use strict';

  var THEMES = {
    /* ثيم المعلّمة عائشة - بستان الأشجار العمانية المثمرة */
    garden: {
      id: 'garden',
      key: 'bustan.groups.v1',
      title: 'بستان المجموعات',
      tagline: 'لوحة تحفيز الطلاب بأشجار عُمان المثمرة',
      icon: '🌿',
      favicon: '🌴',
      footer: 'بستان المجموعات · أشجار عُمان المثمرة',
      boardHint: 'اضغطي على الشجرة لإضافة ثمرة · أو استعملي مفاتيح الأرقام من ١ إلى ٦',
      auth: { user: 'aisha', pin: '19961998' },
      items: 'trees',
      exportColors: {
        bg: '#F3E7DA', frame: '#D8C5AE', inner: '#C0B05B',
        ink: '#35402E', soft: '#7E8A72', gold: '#A2923F',
        card: '#FCF6EE', cardWin: '#FFFCF4', line: '#DFCDB4'
      }
    },

    /* ثيم معلّمة الرياضيات - مجرّة الأرقام */
    galaxy: {
      id: 'galaxy',
      key: 'majarrat.groups.v1',
      title: 'مجرّة الأرقام',
      tagline: 'لوحة تحفيز الطلاب بكواكب تجمع نجومها',
      icon: '🪐',
      favicon: '🪐',
      footer: 'مجرّة الأرقام · كواكب المجموعة الشمسية',
      boardHint: 'اضغطي على الكوكب لإضافة نجمة · أو استعملي مفاتيح الأرقام من ١ إلى ٦',
      auth: { user: 'Nama', pin: '94443673' },
      items: 'planets',
      exportColors: {
        bg: '#E9F0F2', frame: '#B9CBD3', inner: '#94BEBB',
        ink: '#1E3A48', soft: '#6D8795', gold: '#B8912F',
        card: '#F9FCFD', cardWin: '#FFFDF5', line: '#CFE0E5'
      }
    }
  };

  var want = global.BUSTAN_THEME_ID;
  var id = (want && THEMES[want]) ? want : 'garden';

  global.Theme = THEMES[id];
  global.Theme.registry = THEMES;
})(window);

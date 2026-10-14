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
      lang: 'ar', dir: 'rtl',
      key: 'bustan.groups.v1',
      title: 'بستان المجموعات',
      tagline: 'لوحة تحفيز الطلاب بأشجار عُمان المثمرة',
      icon: '🌿',
      favicon: '🌴',
      footer: 'بستان المجموعات · أشجار عُمان المثمرة',
      boardHint: 'اضغطي على الشجرة لإضافة ثمرة · أو استعملي مفاتيح الأرقام من ١ إلى ٦',
      words: {
        item: 'ثمرة', itemAl: 'الثمرة', holder: 'شجرة', holderAl: 'الشجرة', icon: '🌱',
        empty: 'البستان في انتظار أول ثمرة — اضغطي على أي شجرة!',
        notStarted: 'أضيفي ثمرة واحدة على الأقل لإحدى المجموعات ثم أعلني الفائزة.'
      },
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
      lang: 'ar', dir: 'rtl',
      key: 'majarrat.groups.v1',
      title: 'مجرّة الأرقام',
      tagline: 'لوحة تحفيز الطلاب بكواكب تجمع نجومها',
      icon: '🪐',
      favicon: '🪐',
      footer: 'مجرّة الأرقام · كواكب المجموعة الشمسية',
      boardHint: 'اضغطي على الكوكب لإضافة نجمة · أو استعملي مفاتيح الأرقام من ١ إلى ٦',
      words: {
        item: 'نجمة', itemAl: 'النجمة', holder: 'كوكب', holderAl: 'الكوكب', icon: '✨',
        empty: 'المجرّة في انتظار أول نجمة — اضغطي على أي كوكب!',
        notStarted: 'أضيفي نجمة واحدة على الأقل لإحدى المجموعات ثم أعلني الفائزة.'
      },
      auth: { user: 'Nama', pin: '94443673' },
      items: 'planets',
      exportColors: {
        bg: '#E9F0F2', frame: '#B9CBD3', inner: '#94BEBB',
        ink: '#1E3A48', soft: '#6D8795', gold: '#B8912F',
        card: '#F9FCFD', cardWin: '#FFFDF5', line: '#CFE0E5'
      }
    },
    /* ثيم الكتالوج - رفوف الإنجاز (بيانات دخول مؤقّتة تُغيَّر لكل مشترية) */
    shelves: {
      id: 'shelves',
      lang: 'ar', dir: 'rtl',
      key: 'rufuf.groups.v1',
      title: 'رفوف الإنجاز',
      tagline: 'لوحة تحفيز الطلاب برفوف تمتلئ مع كل إجابة',
      icon: '📚',
      favicon: '📚',
      footer: 'رفوف الإنجاز · كل إجابة كتاب جديد على الرفّ',
      boardHint: 'اضغطي على الرفّ لإضافة كتاب · أو استعملي مفاتيح الأرقام من ١ إلى ٦',
      words: {
        item: 'كتاب', itemAl: 'الكتاب', holder: 'رفّ', holderAl: 'الرفّ', icon: '📖',
        empty: 'الرفوف في انتظار أول كتاب — اضغطي على أي رفّ!',
        notStarted: 'أضيفي كتابًا واحدًا على الأقل لإحدى المجموعات ثم أعلني الفائزة.'
      },
      auth: { user: 'shelves', pin: '1111' },
      items: 'shelves',
      exportColors: {
        bg: '#FBF1E2', frame: '#E0C49B', inner: '#C08F4E',
        ink: '#4A3A22', soft: '#8A6E4B', gold: '#C9A227',
        card: '#FFFAF1', cardWin: '#FFFDF4', line: '#E6D3B5'
      }
    },

    /* معلّمات اللغة الإنجليزية (١) - سفينة تمضي نحو جزيرة الكنز */
    voyage: {
      id: 'voyage',
      lang: 'en', dir: 'ltr',
      key: 'voyage.groups.v1',
      title: 'Treasure Voyage',
      tagline: 'A class board where every answer sails your team closer to treasure',
      icon: '🧭',
      favicon: '⚓',
      footer: 'Treasure Voyage · every answer is one step closer',
      boardHint: 'Tap a ship to add a coin · or press number keys 1 to 6',
      auth: { user: 'voyage', pin: '1111' },
      items: 'voyage',
      words: {
        item: 'coin', itemAl: 'Coin', holder: 'ship', holderAl: 'Ships', icon: '⛵',
        empty: 'The sea is calm — tap any ship to set sail!',
        notStarted: 'Give at least one coin to a team, then announce the winner.'
      },
      exportColors: {
        bg: '#EFE3C8', frame: '#D9C49A', inner: '#9CC6D8',
        ink: '#2A3F4D', soft: '#7A8B96', gold: '#C9954E',
        card: '#FBF6EA', cardWin: '#FFFDF3', line: '#DFCDAE'
      }
    },

    /* معلّمات اللغة الإنجليزية (٢) - حصّالة شفافة تمتلئ نقودًا */
    coinjar: {
      id: 'coinjar',
      lang: 'en', dir: 'ltr',
      key: 'coinjar.groups.v1',
      title: 'Coin Jar',
      tagline: 'A class board where every correct answer drops a coin in the jar',
      icon: '🪙',
      favicon: '🫙',
      footer: 'Coin Jar · the team that saves the most, wins',
      boardHint: 'Tap a jar to drop a coin · or press number keys 1 to 6',
      auth: { user: 'coinjar', pin: '1111' },
      items: 'jars',
      words: {
        item: 'coin', itemAl: 'Coin', holder: 'jar', holderAl: 'Jars', icon: '🫙',
        empty: 'The jars are empty — tap any jar to drop the first coin!',
        notStarted: 'Give at least one coin to a team, then announce the winner.'
      },
      exportColors: {
        bg: '#EAF0F3', frame: '#C4D4DC', inner: '#9CC6D8',
        ink: '#2A3F4D', soft: '#7A8B96', gold: '#C9A227',
        card: '#FBFDFE', cardWin: '#FFFCF0', line: '#D5E1E7'
      }
    }
  };

  var want = global.BUSTAN_THEME_ID;
  var id = (want && THEMES[want]) ? want : 'garden';

  global.Theme = THEMES[id];
  global.Theme.registry = THEMES;

  /* نسخة المشترية: سطر واحد في أعلى الملف يحمل اسمها ورمزها، فيُغيَّر
     بمحرّر نصوص بلا دخول إلى الشيفرة */
  var a = global.BUSTAN_AUTH;
  if (a && a.user && a.pin) {
    global.Theme.auth = { user: String(a.user), pin: String(a.pin) };
  }
})(window);

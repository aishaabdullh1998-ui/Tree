/* ==========================================================================
   طبقة اللغة - النصّ العربي نفسه هو المفتاح
   في اللوحات العربية L() تُعيد النصّ كما هو، فلا يتغيّر فيها حرف واحد.
   وفي اللوحة الإنجليزية تُقرأ الترجمة من الجدول، وما لا ترجمة له يظهر عربيًّا
   فيَبين فورًا.
   ========================================================================== */
(function (global) {
  'use strict';

  var EN = {
    '؟': '?',
    'أحمد': 'Ava', 'مريم': 'Lily', 'سالم': 'Omar',
    'أدِر': 'Spin', 'أدِر العجلة': 'Spin the wheel',
    'أسماء الطلاب': 'Student names', 'أسماء عجلة الحظ': 'Wheel names',
    'أضف': 'Add',
    'أضيفي أسماء طلابك من صفحة الإعدادات، اسمًا في كل سطر.': 'Add your students from Settings, one name per line.',
    'أضيفي أسماء طلابك من صفحة الإعدادات، اسمًا في كل سطر،': 'Add your students from Settings, one name per line,',
    'أضيفي الأسماء': 'Add names',
    'أضيفي ثمرة واحدة على الأقل لإحدى المجموعات ثم أعلني الفائزة.': 'Give at least one point to a team, then announce the winner.',
    'أُضيفت نقطة لكل المجموعات': 'A point was added to every team',
    'إعادة': 'Reset', 'إعادة الجميع': 'Reset all', 'إعادة المسابقة': 'Reset board',
    'إعادة ضبط المؤقّت': 'Reset timer',
    'إغلاق': 'Close', 'إلغاء': 'Cancel', 'إلى': 'to',
    'إيقاف المؤقّت مؤقتًا': 'Pause timer', 'إيقاف مؤقّت': 'Pause', 'ابدأ': 'Start',
    'استبدال بيانات اللوحة الآن': 'Replace board data now',
    'استعادة القائمة الأصلية': 'Restore original list',
    'استعادة من ملف': 'Restore from file',
    'اسم المجموعة': 'Team name', 'اسم المستخدم': 'Username',
    'اسم المستخدم أو رمز الدخول غير صحيح': 'Wrong username or passcode',
    'اسم في كل سطر. تُستخدم في عجلة الحظ وفي المجموعات السريعة.': 'One name per line. Used by the wheel and by Quick groups.',
    'اسمًا': 'names', 'اسمًا في العجلة': 'names on the wheel',
    'اضغطي على العجلة لاختيار اسم': 'Tap the wheel to pick a name',
    'اضغطي لإضافة': 'Tap to add',
    'اضغطي مطوّلًا على الصورة لحفظها، أو بالزر الأيمن ثم «حفظ الصورة».': 'Press and hold the image to save it, or right-click and choose Save image.',
    'اكتملت القائمة — اضغطي «إعادة الجميع» للبدء من جديد': 'Everyone has been picked — tap Reset all to start again',
    'الأصوات اللطيفة': 'Sound effects',
    'الإعدادات': 'Settings',
    'الاحتفاظ بأسماء المجموعات': 'Keep team names',
    'البستان في انتظار أول ثمرة — اضغطي على أي شجرة!': 'The garden is waiting for its first fruit — tap any tree!',
    'الأولى': '1', 'الثانية': '2', 'الثالثة': '3', 'الرابعة': '4', 'الخامسة': '5',
    'السادسة': '6', 'السابعة': '7', 'الثامنة': '8', 'التاسعة': '9', 'العاشرة': '10',
    'الحادية عشرة': '11', 'الثانية عشرة': '12',
    'الترتيب': 'Rank', 'العدد': 'Count',
    'الثمرة': 'Fruit', 'الشجرة': 'Tree', 'ثمرة': 'fruit', 'شجرة': 'tree',
    'المتصدّرة الآن': 'Leading now',
    'المجموعات السريعة': 'Quick groups',
    'المجموعات و': 'Teams and',
    'المجموعة': 'Team', 'المجموعة الفائزة': 'Winning team',
    'المسابقة': 'Board', 'مسابقة': 'Board',
    'المظهر والصوت': 'Look and sound',
    'الملف يحمل': 'The file holds',
    'النتيجة الحالية': 'Current result',
    'النتيجة الحالية والنتائج المحفوظة سابقًا.': 'The current result, and the ones saved before it.',
    'النقاط والأسماء محفوظة في هذا المتصفّح وحده. احفظي نسخة بين حين وآخر،': 'Points and names live in this browser only. Save a copy now and then,',
    'انتهى الوقت!': 'Time is up!',
    'انسخي النص والصقيه في أي جدول بيانات.': 'Copy the text and paste it into any spreadsheet.',
    'بستان المجموعات': 'Class Board',
    'بـ': 'with', 'بقي': 'Left:',
    'بما يناسب هذه اللوحة.': 'to match this board.',
    'بيانات الدخول': 'Sign-in details',
    'تبقى الأسماء محفوظة في هذا الجهاز وحده.': 'Names stay on this device only.',
    'تبقى بيانات المجموعات المخفيّة محفوظة، وتعود متى زدتِ العدد.': 'Hidden teams keep their data and come back when you raise the number.',
    'تدور': 'Spinning',
    'تراجع': 'Undo', 'تراجع عن آخر': 'Undo last',
    'تشاركت في الصدارة': 'Tied at the top:',
    'تشغيل المؤقّت': 'Start timer',
    'تعادل في الصدارة': 'Tie at the top', 'تعادل في الصدارة بـ': 'Tie at the top with',
    'تكبير المؤقّت': 'Enlarge timer',
    'تم النسخ': 'Copied',
    'تنبيه: النسخة من لوحة أخرى، وستُستبدل أسماء': 'Note: this copy comes from another board, so the',
    'تُحفظ النتيجة الحالية في السجل قبل المسح.': ' The current result is saved to the log first.',
    'تُحفظ بيانات المسابقة في هذا الجهاز ولا تُرسل إلى أي مكان.': 'Your board is saved on this device and never sent anywhere.',
    'ثم يوزّعهم الموقع على مجموعات بضغطة واحدة.': 'then the board splits them into groups with one tap.',
    'جدول': 'Table', 'جدول النتائج': 'Results table',
    'حذف': 'Delete',
    'حسب عدد الأفراد': 'By team size', 'حسب عدد المجموعات': 'By number of teams',
    'حسنًا': 'OK',
    'حفظ التغييرات': 'Save changes',
    'حفظ النتيجة الحالية في السجل': 'Save the current result to the log',
    'حفظ صورة النتائج': 'Save results image',
    'حفظ نسخة الآن': 'Save a copy now',
    'حُفظ الملف في مجلّد التنزيلات. احتفظي به في مكان تجدينه.': 'Saved to your Downloads folder. Keep it somewhere you will find it.',
    'خروج من وضع العرض': 'Exit presentation mode',
    'دقائق مخصّصة': 'Custom minutes',
    'دقيقة': 'min', 'دقيقة واحدة': '1 min', 'دقيقتان': '2 min',
    '٣٠ ثانية': '30 sec', '٣ دقائق': '3 min', '٥ دقائق': '5 min', '١٠ دقائق': '10 min',
    '٣٠ث': '30s', '١د': '1m', '٣د': '3m',
    'رمز الدخول': 'Passcode',
    'سجل المسابقات': 'Board log',
    'سيعود عدّاد كل مجموعة إلى صفر وتبدأ الأشجار من جديد.': 'Every team goes back to zero and the board starts fresh.',
    'صورة': 'Image', 'صورة النتائج': 'Results image', 'صورة نتائج المسابقة': 'Board results image',
    'طالبًا على': 'students in', 'طريقة التقسيم': 'Split method',
    'عادت كل الأسماء إلى العجلة': 'All names are back on the wheel',
    'عجلة الحظ': 'Lucky wheel',
    'عدد المجموعات': 'Number of teams',
    'عدم تكرار الاسم المختار': 'Do not pick the same name twice',
    'على': 'on', 'في': 'in', 'من': 'of', 'و': 'and',
    'عنوان اللوحة': 'Board title',
    'فتعود اللوحة كما هي على أي جهاز.': 'so the board comes back just as it was, on any device.',
    'كل التغييرات تُحفظ في هذا الجهاز.': 'Everything here is saved on this device.',
    'كل مجموعة': 'each group has',
    'كم طالبًا في كل مجموعة؟': 'How many students per group?',
    'كم مجموعة تريدين؟': 'How many groups?',
    'لا توجد أسماء بعد.': 'No names yet.',
    'لا توجد أسماء في العجلة بعد.': 'No names on the wheel yet.',
    'لا توجد مسابقات محفوظة بعد. تُحفظ النتيجة تلقائيًا عند الضغط على «إعادة المسابقة».': 'Nothing saved yet. A result is stored automatically when you tap Reset board.',
    'لم تبدأ المسابقة بعد': 'The board has not started yet',
    'لم يبقَ اسم — اضغطي «إعادة الجميع»': 'No names left — tap Reset all',
    'مؤقّت النشاط': 'Activity timer',
    'مجموعات': 'groups', 'مجموعة': 'group', 'مجموعتين': 'groups',
    'مجموعات، ومجموع نقاطها': 'teams, with a total of',
    'ملمس الورق الخفيف في الخلفية': 'Soft paper texture in the background',
    'منها': 'of them have', 'والباقي': 'and the rest',
    'نتائج': 'results',
    'نسخ': 'Copy', 'نسخة احتياطية': 'Backup',
    'نعم، ابدئي من جديد': 'Yes, start fresh',
    'هذا الملف ليس نسخة احتياطية صالحة لهذه اللوحة.': 'This file is not a valid backup for this board.',
    'وزّعي المجموعات': 'Make the groups', 'وزّعي من جديد': 'Shuffle again',

    /* نصوص الصفحة الثابتة */
    'دخول': 'Sign in',
    'إعلان الفائزة': 'Announce winner',
    'مجموعات سريعة': 'Quick groups',
    'نقطة للجميع': 'Point for all',
    'وضع العرض': 'Presentation mode',
    'المزيد': 'More',
    'السجل والتصدير': 'Log & export',
    'خروج': 'Sign out'
  };

  var lang = (global.Theme && global.Theme.lang) || 'ar';
  var TABLE = lang === 'en' ? EN : null;

  function L(s) {
    if (!TABLE) return s;
    var v = TABLE[s];
    return v == null ? s : v;
  }

  /* يترجم نصوص الصفحة الثابتة وسماتها بعد التحميل */
  function translateStatic(root) {
    if (!TABLE) return;
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var t = node.nodeValue.trim();
      if (!t || !TABLE[t]) return;
      node.nodeValue = node.nodeValue.replace(t, TABLE[t]);
    });
    ['aria-label', 'placeholder', 'title'].forEach(function (attr) {
      var list = (root || document).querySelectorAll('[' + attr + ']');
      Array.prototype.forEach.call(list, function (el) {
        var v = el.getAttribute(attr);
        if (TABLE[v]) el.setAttribute(attr, TABLE[v]);
      });
    });
  }

  global.L = L;
  global.L.lang = lang;
  global.L.table = TABLE;
  global.L.translateStatic = translateStatic;
})(window);

/* يبني صفحات الموقع: صفحة لكل ثيم، ورابطها واحد يفتحه كل المشتريات.
   التحقّق من الحساب على السيرفر، فلا أسماء دخول مخبوءة في الملف، ولا
   أسماء طالبات — مهما كانت البيئة.
   ربط الحساب يأتي من BUSTAN_SYNC_FILE، ويُمرَّر من بيئة البناء وحدها
   (سرٌّ في GitHub Actions)، فلا يدخل المستودع. */
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');

const TARGETS = [
  { theme: 'garden', out: 'index.html'  },
  { theme: 'galaxy', out: 'galaxy.html' },
  { theme: 'shelves', out: 'shelves.html' },
  { theme: 'voyage',  out: 'voyage.html'  },
  { theme: 'coinjar', out: 'coinjar.html' }
];

TARGETS.forEach(function (t) {
  execFileSync(process.execPath, [path.join(__dirname, 'build-single.js')], {
    env: Object.assign({}, process.env, {
      BUSTAN_THEME: t.theme,
      BUSTAN_OUT: path.join(root, t.out),
      BUSTAN_NAMES_FILE: '',
      BUSTAN_USER: '',
      BUSTAN_PIN: ''
    }),
    stdio: 'inherit'
  });
});

/* يبني صفحات الموقع العامّة: صفحة لكل ثيم.
   هذه الصفحات تُرفع إلى المستودع العام، فنقطع عنها قسرًا كل ما هو خاص:
   لا أسماء طالبات، ولا عنوان خادم، ولا مفتاح حساب — مهما كانت البيئة. */
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
      BUSTAN_SYNC_FILE: '',
      BUSTAN_USER: '',
      BUSTAN_PIN: ''
    }),
    stdio: 'inherit'
  });
});

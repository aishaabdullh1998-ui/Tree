/* يبني صفحة كل ثيم: index.html للبستان، galaxy.html للمجرّة، shelves.html للرفوف */
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');

const TARGETS = [
  { theme: 'garden', out: 'index.html'  },
  { theme: 'galaxy', out: 'galaxy.html' },
  { theme: 'shelves', out: 'shelves.html' }
];

TARGETS.forEach(function (t) {
  execFileSync(process.execPath, [path.join(__dirname, 'build-single.js')], {
    env: Object.assign({}, process.env, {
      BUSTAN_THEME: t.theme,
      BUSTAN_OUT: path.join(root, t.out)
    }),
    stdio: 'inherit'
  });
});

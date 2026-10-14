/* يبني نسخة مشترية واحدة: لوحة + بيانات دخولها + ربطها بحسابها.
 *
 *   node tools/build-copy.js <الثيم> <اسم المستخدم> <الرقم السري> [المخرَج]
 *
 * مثال:
 *   BUSTAN_SYNC_FILE=~/bustan/sync.json \
 *   node tools/build-copy.js garden bustan07 441903
 *
 * بلا BUSTAN_SYNC_FILE تُبنى نسخة محلّية بلا مزامنة، وهذا متعمَّد:
 * لا يدخل عنوان الخادم ولا مفتاحه إلى أي ملف إلا بطلب صريح.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');

const THEMES = {
  garden:  'بُستان',
  galaxy:  'مجرّة',
  shelves: 'مكتبة',
  voyage:  'Treasure-Voyage',
  coinjar: 'Coin-Jar'
};

const [theme, user, pin, out] = process.argv.slice(2);
if (!theme || !user || !pin) {
  console.error('الاستعمال: node tools/build-copy.js <الثيم> <اسم المستخدم> <الرقم السري> [المخرَج]');
  console.error('الثيمات: ' + Object.keys(THEMES).join(' / '));
  process.exit(1);
}
if (!THEMES[theme]) { console.error('ثيم غير معروف: ' + theme); process.exit(1); }

const dest = out
  ? path.resolve(out)
  : path.join(root, 'نسخ', THEMES[theme] + '-' + user + '.html');

execFileSync(process.execPath, [path.join(__dirname, 'build-single.js')], {
  env: Object.assign({}, process.env, {
    BUSTAN_THEME: theme,
    BUSTAN_USER: user,
    BUSTAN_PIN: pin,
    BUSTAN_OUT: dest
  }),
  stdio: 'inherit'
});
console.log('نسخة ' + user + ' جاهزة: ' + path.relative(root, dest));

/* يبني صفحة الموقع في ملف واحد مكتفٍ بذاته (index.html) من dev.html والوحدات */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const html = read('dev.html');
const css = read('assets/css/styles.css');

/* الخطوط تُضمَّن داخل الصفحة نفسها، فتعمل بلا إنترنت كما تعمل اللوحة */
const FONT_FILES = [
  ['Readex Pro', 'readex-ar', '300 700'], ['Readex Pro', 'readex-la', '300 700'],
  ['Vazirmatn',  'vazir-ar',  '100 900'], ['Vazirmatn',  'vazir-la',  '100 900']
];
const faceCss = read('assets/css/fonts.css');
const fontCss = FONT_FILES.map(function (f) {
  const name = f[1];
  const b64 = fs.readFileSync(path.join(root, 'assets/fonts/' + name + '.woff2')).toString('base64');
  const range = new RegExp("url\\('\\.\\./fonts/" + name + "\\.woff2'\\) format\\('woff2'\\);\\s*unicode-range:\\s*([^;]+);")
    .exec(faceCss)[1];
  return "@font-face{font-family:'" + f[0] + "';font-style:normal;font-weight:" + f[2] +
    ";font-display:swap;src:url(data:font/woff2;base64," + b64 + ") format('woff2');unicode-range:" + range + "}";
}).join('\n');
/* نسخة خاصة بأسماء مُحمّلة مسبقًا: BUSTAN_NAMES_FILE=<ملف JSON فيه مصفوفة أسماء>.
   الملف يبقى خارج المستودع، فلا تُنشر الأسماء مع الكود. */
/* اختيار الثيم: BUSTAN_THEME=<id>. كل ثيم يحمل مفتاح تخزين خاصًّا به. */
const themeId = process.env.BUSTAN_THEME || 'garden';
const themeSrc = read('assets/js/theme.js');
const block = new RegExp("\\b" + themeId + ":\\s*\\{[\\s\\S]*?\\n    \\}").exec(themeSrc);
if (!block) throw new Error('unknown theme: ' + themeId);
const pageTitle = /title:\s*'([^']+)'/.exec(block[0])[1];
const engine = (/items:\s*'([a-z]+)'/.exec(block[0]) || [, 'trees'])[1];
const lang = (/lang:\s*'([a-z]+)'/.exec(block[0]) || [, 'ar'])[1];
const dir = (/dir:\s*'([a-z]+)'/.exec(block[0]) || [, 'rtl'])[1];
const themeScript = '<script>window.BUSTAN_THEME_ID = ' + JSON.stringify(themeId) + ';</script>\n';
/* بيانات الدخول في أعلى الملف، في سطر واضح تُغيّره صاحبة النسخة بنفسها */
const authUser = process.env.BUSTAN_USER || (/user:\s*'([^']*)'/.exec(block[0]) || [, 'aisha'])[1];
const authPin = process.env.BUSTAN_PIN || (/pin:\s*'([^']*)'/.exec(block[0]) || [, '1111'])[1];
/* نسخة مربوطة بحساب: تغيير الرمز هنا يفكّ ارتباطها بالحساب، فنقولها صراحة */
const linked = !!process.env.BUSTAN_SYNC_FILE;
const authBlock = [
  '<!-- ====================================================================',
  '     بيانات الدخول لهذه النسخة',
  linked
    ? '     هذه النسخة مربوطة بحسابك، ونقاطك محفوظة فيه على أي جهاز.\n' +
      '     لا تغيّري الاسم ولا الرمز هنا: يتغيّران في الحساب لا في الملف،\n' +
      '     ولو غيّرتِهما توقّف الحفظ في الحساب. للتغيير راسلي من باعتك اللوحة.'
    : '     غيّري الاسم والرمز بين علامتي التنصيص، ثم احفظي الملف.',
  '     ==================================================================== -->',
  '<script>',
  'window.BUSTAN_AUTH = { user: "' + authUser + '", pin: "' + authPin + '" };',
  '</script>',
  ''
].join('\n');
console.log('theme:', themeId, '-', pageTitle, '| engine:', engine, '| lang:', lang, dir);

/* ربط النسخة بحساب على السيرفر: BUSTAN_SYNC_FILE=<ملف JSON فيه {url, key}>.
   الملف خارج المستودع، فلا عنوان السيرفر ولا مفتاحه يُنشران مع الكود.
   بدونه لا تُضمَّن وحدة المزامنة أصلًا، وتبقى اللوحة محلّية بالكامل. */
let syncScript = '';
const syncFile = process.env.BUSTAN_SYNC_FILE;
if (syncFile) {
  const cfg = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  if (!cfg || !cfg.url || !cfg.key) throw new Error('BUSTAN_SYNC_FILE must hold {url, key}');
  syncScript = '<script>window.BUSTAN_SYNC = ' + JSON.stringify({ url: cfg.url, key: cfg.key }) + ';</script>\n';
  console.log('sync: on');
}

const scripts = ['theme', 'i18n', 'icons', 'logo', engine, 'items', 'sound', 'store']
  .concat(syncFile ? ['sync'] : [])
  .concat(['exporter', 'timer', 'wheel', 'groups', 'app'])
  .map(n => read('assets/js/' + n + '.js'));

let namesScript = '';
const namesFile = process.env.BUSTAN_NAMES_FILE;
if (namesFile) {
  const names = JSON.parse(fs.readFileSync(namesFile, 'utf8'));
  if (!Array.isArray(names)) throw new Error('BUSTAN_NAMES_FILE must hold a JSON array');
  namesScript = '<script>window.BUSTAN_NAMES = ' + JSON.stringify(names) + ';</script>\n';
  console.log('preloaded names:', names.length);
}

/* جسم الصفحة فقط: المنصّات المستضيفة تضيف الهيكل الخارجي بنفسها */
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script src="assets\/js\/[^"]+"><\/script>\s*/g, '')
  .trim();

const out = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${pageTitle}</title>
${authBlock}
<style>
${fontCss}

/* اتجاه الصفحة حتى بلا وسم html */
:root { direction: ${dir}; }
html, body { height: 100%; }
#login { min-height: 100%; }

${css}
</style>

${body}

<script>
document.documentElement.setAttribute('dir', ${JSON.stringify(dir)});
document.documentElement.setAttribute('lang', ${JSON.stringify(lang)});
</script>
${themeScript}${namesScript}${syncScript}${scripts.map(s => '<script>\n' + s + '\n</script>').join('\n')}
`;

/* المخرَج الافتراضي هو صفحة الموقع نفسها؛ BUSTAN_OUT يوجّهه إلى مكان آخر */
const outPath = process.env.BUSTAN_OUT
  ? path.resolve(process.env.BUSTAN_OUT)
  : path.join(root, 'index.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log(path.relative(root, outPath) || outPath, (Buffer.byteLength(out) / 1024).toFixed(1) + ' KB');

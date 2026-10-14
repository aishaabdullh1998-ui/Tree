/* يبني صفحة الموقع في ملف واحد مكتفٍ بذاته (index.html) من dev.html والوحدات */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const html = read('dev.html');
const css = read('assets/css/styles.css');
/* نسخة خاصة بأسماء مُحمّلة مسبقًا: BUSTAN_NAMES_FILE=<ملف JSON فيه مصفوفة أسماء>.
   الملف يبقى خارج المستودع، فلا تُنشر الأسماء مع الكود. */
/* اختيار الثيم: BUSTAN_THEME=<id>. كل ثيم يحمل مفتاح تخزين خاصًّا به. */
const themeId = process.env.BUSTAN_THEME || 'garden';
const themeSrc = read('assets/js/theme.js');
const block = new RegExp("\\b" + themeId + ":\\s*\\{[\\s\\S]*?\\n    \\}").exec(themeSrc);
if (!block) throw new Error('unknown theme: ' + themeId);
const pageTitle = /title:\s*'([^']+)'/.exec(block[0])[1];
const engine = /items:\s*'planets'/.test(block[0]) ? 'planets' : 'trees';
const themeScript = '<script>window.BUSTAN_THEME_ID = ' + JSON.stringify(themeId) + ';</script>\n';
console.log('theme:', themeId, '-', pageTitle, '| engine:', engine);

const scripts = ['theme', engine, 'items', 'sound', 'store', 'exporter', 'timer', 'wheel', 'groups', 'app']
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

const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;700;800&family=Tajawal:wght@500;700;800&display=swap';

const out = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${pageTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
/* اتجاه الصفحة من اليمين لليسار حتى بلا وسم html */
:root { direction: rtl; }
html, body { height: 100%; }
#login { min-height: 100%; }

${css}
</style>

${body}

<script>
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');
</script>
${themeScript}${namesScript}${scripts.map(s => '<script>\n' + s + '\n</script>').join('\n')}
`;

/* المخرَج الافتراضي هو صفحة الموقع نفسها؛ BUSTAN_OUT يوجّهه إلى مكان آخر */
const outPath = process.env.BUSTAN_OUT
  ? path.resolve(process.env.BUSTAN_OUT)
  : path.join(root, 'index.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log(path.relative(root, outPath) || outPath, (Buffer.byteLength(out) / 1024).toFixed(1) + ' KB');

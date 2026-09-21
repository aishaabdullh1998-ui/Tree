/* يبني نسخة الملف الواحد من الموقع (لرفعها على أي مستضيف أو كصفحة منشورة) */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const html = read('index.html');
const css = read('assets/css/styles.css');
const scripts = ['trees', 'sound', 'store', 'exporter', 'timer', 'app']
  .map(n => read('assets/js/' + n + '.js'));

/* جسم الصفحة فقط: المنصّات المستضيفة تضيف الهيكل الخارجي بنفسها */
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script src="assets\/js\/[^"]+"><\/script>\s*/g, '')
  .trim();

const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;700;800&family=Tajawal:wght@500;700;800&display=swap';

const out = `<meta charset="utf-8">
<title>بستان المجموعات</title>
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
${scripts.map(s => '<script>\n' + s + '\n</script>').join('\n')}
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/bustan.html'), out);
console.log('dist/bustan.html', (Buffer.byteLength(out) / 1024).toFixed(1) + ' KB');

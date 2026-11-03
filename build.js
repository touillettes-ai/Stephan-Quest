// Assemble index.html + js/*.js en UN SEUL fichier : dist/bonne-retraite.html
// Usage : node build.js
const fs = require('fs'), path = require('path');
const files = ['util', 'music', 'draw', 'engine', 'content', 'main'];
const scripts = files.map(f => '<script>\n' + fs.readFileSync(path.join(__dirname, 'js', f + '.js'), 'utf8') + '\n</script>').join('\n');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace(
  /<!--SCRIPTS-->|(?:<script src="js\/[a-z]+\.js"><\/script>\s*)+/, () => scripts);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'bonne-retraite.html'), html);
console.log('OK -> dist/bonne-retraite.html (' + Math.round(html.length / 1024) + ' Ko)');

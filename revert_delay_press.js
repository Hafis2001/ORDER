const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'screens'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'navigation'),
  path.join(__dirname, 'App.js')
];

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remove delayPressIn={0} from TouchableOpacity
  content = content.replace(/delayPressIn=\{0\}\s*/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Removed delayPressIn={0} from:', filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    processFile(dir);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

dirs.forEach(walkDir);
console.log('Done reverting delayPressIn={0}.');

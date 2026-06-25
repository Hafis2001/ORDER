const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'screens'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'navigation')
];

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix TouchableOpacity
  // Match <TouchableOpacity without delayPressIn
  content = content.replace(/<TouchableOpacity(?![^>]*delayPressIn)([^>]*)>/g, '<TouchableOpacity delayPressIn={0} activeOpacity={0.7}$1>');
  
  // Make sure we didn't add multiple activeOpacity if it already existed
  content = content.replace(/activeOpacity=\{[^}]+\}([^>]*?)activeOpacity=\{[^}]+\}/g, 'activeOpacity={0.7}$1');

  // Fix FlatList to make lists render faster
  content = content.replace(/<FlatList(?![^>]*windowSize)([^>]*)>/g, '<FlatList initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true}$1>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Optimized:', filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
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
console.log('Done optimizing touch and scroll performance.');

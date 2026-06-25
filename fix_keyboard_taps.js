const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'screens'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'App.js')
];

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add keyboardShouldPersistTaps="handled" to ScrollView and FlatList if not present
  content = content.replace(/<ScrollView(?![^>]*keyboardShouldPersistTaps)([^>]*)>/g, '<ScrollView keyboardShouldPersistTaps="handled"$1>');
  content = content.replace(/<FlatList(?![^>]*keyboardShouldPersistTaps)([^>]*)>/g, '<FlatList keyboardShouldPersistTaps="handled"$1>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed touches on:', filePath);
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
console.log('Done injecting keyboardShouldPersistTaps.');

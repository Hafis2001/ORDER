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

  // Find lucide-react-native imports
  const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react-native['"]/);
  let iconNames = [];
  if (importMatch) {
    iconNames = importMatch[1].split(',').map(s => s.trim().replace(/ as .*/, '')).filter(Boolean);
  }

  // Also include MaterialIcons from @expo/vector-icons
  const materialMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]@expo\/vector-icons['"]/);
  if (materialMatch) {
    iconNames = iconNames.concat(materialMatch[1].split(',').map(s => s.trim().replace(/ as .*/, '')).filter(Boolean));
  }
  
  // For each icon found in imports, add pointerEvents="none" if not already there
  iconNames.forEach(icon => {
    // Regex to match <IconName ... > that doesn't have pointerEvents
    // Ensure we match the exact component name, e.g. <Search ... >
    const regex = new RegExp(`<${icon}(\\s+)(?![^>]*pointerEvents)([^>]*)>`, 'g');
    content = content.replace(regex, `<${icon} pointerEvents="none"$1$2>`);
  });

  // Also catch <Animated.View style={iconStyle}> in App.js
  content = content.replace(/<Animated\.View style={iconStyle}>/g, '<Animated.View style={iconStyle} pointerEvents="none">');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed touches for icons in:', filePath);
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
console.log('Done injecting pointerEvents="none" into icons.');

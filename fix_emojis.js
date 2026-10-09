const fs = require('fs');

function fixEmojis(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // Corrupted "camera" or "image" emoji: dY"
    if (content.includes('dY"')) {
        content = content.replace(/dY"/g, '📷');
        changed = true;
    }
    
    // Corrupted "arrow left" +? Batal
    if (content.includes('+?')) {
        content = content.replace(/\+\?/g, '←');
        changed = true;
    }

    // Corrupted info icon ,?
    if (content.includes(',?')) {
        content = content.replace(/,\?/g, 'ℹ️');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(fixEmojis);

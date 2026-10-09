const fs = require('fs');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
  });
  return results;
}
const files = walk('./src');
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        // Any character >= 128 (non-ASCII) that is not a standard Indonesian/English letter.
        // Wait, standard Indonesian is all ASCII.
        // So let's look for characters > 127 that are NOT standard valid emojis in UTF-8.
        // Wait, since we are reading as UTF-8, mojibake characters will show up as U+00C0 to U+00FF 
        // if they were read as Windows-1252 and saved as UTF-8!
        // So we just look for U+0080 to U+00FF.
        if (lines[i].match(/[\x80-\xFF]/)) {
            console.log(file + ':' + (i+1) + ': ' + lines[i].trim());
        }
    }
}
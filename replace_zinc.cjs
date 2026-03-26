const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/zinc-/g, 'slate-');

fs.writeFileSync('src/App.tsx', content);
console.log('Zinc replaced with slate');

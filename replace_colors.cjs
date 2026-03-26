const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/emerald-400/g, 'amber-400');
content = content.replace(/emerald-500/g, 'amber-500');
content = content.replace(/cyan-400/g, 'blue-400');
content = content.replace(/cyan-500/g, 'blue-500');

fs.writeFileSync('src/App.tsx', content);
console.log('Colors replaced');

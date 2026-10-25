const fs = require('node:fs');
const path = require('node:path');
const out = path.join('.vercel', 'output');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'static'), { recursive: true });
fs.cpSync('dist', path.join(out, 'static'), { recursive: true });
fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({ version: 3 }));
console.log('Built public static Teadough website.');

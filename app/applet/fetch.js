import fs from 'fs';
async function run() {
  const res = await fetch('https://genlayer.com/');
  const html = await res.text();
  fs.writeFileSync('genlayer.html', html);
  console.log('saved');
}
run();

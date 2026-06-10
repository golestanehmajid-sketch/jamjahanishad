import { fetch } from 'undici';
async function run() {
  const response = await fetch("https://www.varzesh3.com/rss/all", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });
  const xml = await response.text();
  console.log("length:", xml.length);
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  let matches = 0;
  while ((match = itemRegex.exec(xml)) !== null) {
      matches++;
  }
  console.log("matches:", matches);
}
run();

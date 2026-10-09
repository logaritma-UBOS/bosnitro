const urls = [
  'https://ubos-pilot.vercel.app/',
  'https://ubos-pilot.vercel.app/login',
  'https://ubos-pilot.vercel.app/kasir',
  'https://ubos-pilot.vercel.app/marketing',
  'https://ubos-pilot.vercel.app/promo'
];

async function checkUrls() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.error(`${url}: Error ${e.message}`);
    }
  }
}
checkUrls();
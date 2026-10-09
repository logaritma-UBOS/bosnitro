
const url = 'https://www.instagram.com/p/C_b-1WNy-Yj/';
fetch('https://api.microlink.io/?url=' + encodeURIComponent(url)).then(r=>r.json()).then(data=>{
  console.log(data);
}).catch(console.error);


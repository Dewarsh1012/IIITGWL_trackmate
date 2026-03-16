const fs = require('fs');
const https = require('https');

const urls = {
  'auth.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzFmZmRjOTY1MDQwZjRkNDE4MTZlYmEzODhlYTc3YzM0EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'resident_report.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzc4NjUyMzM5MjlhZDRmYTdiODdkMjUzYjhjOGVjNGY0EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'authority_analytics.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2JlMGUwNDMyNzQ0NDQ2YWU5OTFiMGQ3OGZlYmVjMzA0EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'resident_dashboard.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2ExOTViYTQ0M2VlNjQyY2JiNmIzOWQ1NDZhN2Q0Yjk4EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'tourist_dashboard.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzc0YTNiZGJhMDZlMzQyNzI5OTY3Mzg5YzJmMTgyMDYxEgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'authority_dashboard.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NiNjEzMzU3OGVkMTQwMzQ5YjdlMGU0MjRhOTUzZTA1EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'tourist_profile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzVhZmM5ZjYzNWMxMTQ4MmQ4YWNmNjAwNDMxYmQ5MmE4EgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'business_dashboard.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2IzZjZjMTllNGE5ODRkYTRiMWJlMWJjZmU0ZTkzMmFkEgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242',
  'authority_efir.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Y2ZjFlY2M4Mjg4ZTRiYWZhZTJhMDVhMmRjZDFhZDJlEgsSBxCD3YDu9x0YAZIBIwoKcHJvamVjdF9pZBIVQhMzOTQxNDY2OTc2NTMxNDQwNjEz&filename=&opi=96797242'
};

if (!fs.existsSync('./stitch_html')) fs.mkdirSync('./stitch_html');

for (const [file, url] of Object.entries(urls)) {
  const dest = `./stitch_html/${file}`;
  https.get(url, (res) => {
    let raw = '';
    res.on('data', (d) => { raw += d; });
    res.on('end', () => { 
        fs.writeFileSync(dest, raw); 
        console.log(`Downloaded ${file}`);
    });
  }).on('error', (e) => {
    console.error(e);
  });
}

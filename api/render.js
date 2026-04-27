import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Get the path and parse the slug
  // req.url might look like /demo/4-season-roofing or /demo/4-season-roofing?foo=bar
  const pathname = req.url.split('?')[0].replace(/\/+$/, '');
  const segments = pathname.split('/').filter(Boolean);
  const slug = segments[segments.length - 1] || '';

  // Calculate business name
  let businessName = '';
  if (slug) {
    businessName = slug
      .split('-')
      .map(word => {
        if (word.length <= 2 && isNaN(word)) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  // Fallback to avoid ' Demo' if somehow no slug is present
  const displayTitle = businessName ? `${businessName} Demo` : 'Your Personalised Demo | Sea Change AI';

  try {
    // Read the built HTML file which is copied here during build
    const htmlPath = path.join(__dirname, '_document.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Replace the raw title directly
    html = html.replace('<title>{{business name}} Demo</title>', `<title>${displayTitle}</title>`);

    // Add social/OG tags for iMessage, WhatsApp etc. if they don't exist
    if (!html.includes('property="og:title"')) {
      const ogTags = `
    <title>${displayTitle}</title>
    <meta property="og:title" content="${displayTitle}" />
    <meta property="og:description" content="See how Sophie answers your calls — your AI receptionist, personalised to your business." />
      `;
      // Replace title with title + OG tags
      html = html.replace(/<title>.*?<\/title>/, ogTags);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate'); // Ensure it checks the latest
    res.status(200).send(html);
  } catch (err) {
    // If anything fails during reading HTML, just send 500
    console.error('Error rendering HTML:', err);
    res.status(500).send('Internal Server Error: Unable to load application.');
  }
}

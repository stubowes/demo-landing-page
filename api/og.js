import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'demo.seachangeai.co';
  const baseUrl = `${protocol}://${host}`;

  // Extract slug, ignoring query strings
  const urlPath = req.url.split('?')[0];
  const slug = urlPath.replace(/^\/+|\/+$/g, '').split('/').pop() || '';

  // Derive business name from slug
  let businessName = '';
  if (slug) {
    businessName = slug
      .split('-')
      .map(w => w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Load the built HTML template
  let html = '';
  try {
    // On Vercel, the dist folder is included via vercel.json configurations
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    try {
        // Fallback for different structural configurations
        const indexPathAlt = path.join(process.cwd(), 'index.html');
        html = fs.readFileSync(indexPathAlt, 'utf8');
    } catch (fallbackErr) {
        return res.status(500).send('Error: Could not locate index.html');
    }
  }

  // Define dynamic properties
  const title = businessName ? `Demo for ${businessName} | Sea Change AI` : 'Your Personalised Demo | Sea Change AI';
  const ogTitle = businessName ? `Demo for ${businessName}` : 'Your Personalised Demo';
  const description = 'See your receptionist answer a call';
  const canonicalUrl = `${baseUrl}/${slug}`;

  // Replace default tags
  html = html.replace('<title>Your Personalised Demo | Sea Change AI</title>', `<title>${title}</title>`);
  html = html.replace('content="Your Personalised Demo | Sea Change AI"', `content="${ogTitle}"`);
  // The default image and type are suitable, but we ensure canonical URL is exact.
  html = html.replace('content="https://demo-landing-page-pink.vercel.app/"', `content="${canonicalUrl}"`);

  // Return the modified HTML
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

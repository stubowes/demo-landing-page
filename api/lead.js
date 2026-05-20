export default async function handler(req, res) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : '';
  if (!slug) {
    res.status(400).json({ error: 'slug required' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase env not configured' });
    return;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/leads?slug=eq.${encodeURIComponent(slug)}&select=website&limit=1`;
    const resp = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      res.status(resp.status).json({ error: 'lookup failed' });
      return;
    }
    const rows = await resp.json();
    const website = Array.isArray(rows) && rows[0] && typeof rows[0].website === 'string' ? rows[0].website : '';
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).json({ website });
  } catch (err) {
    console.error('lead lookup error:', err);
    res.status(500).json({ error: 'internal' });
  }
}

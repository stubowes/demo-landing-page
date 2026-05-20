export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase env not configured' });
    return;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=email&limit=1`;
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
    const eligible = !Array.isArray(rows) || rows.length === 0;
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ eligible });
  } catch (err) {
    console.error('eligibility lookup error:', err);
    res.status(500).json({ error: 'internal' });
  }
}

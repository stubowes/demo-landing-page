import { createHash } from 'node:crypto';

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

  const emailHash = createHash('sha256').update(email).digest('hex').slice(0, 8);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('eligibility: supabase env not configured', { emailHash });
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
      console.warn('eligibility: upstream non-ok', { emailHash, status: resp.status });
      res.status(resp.status).json({ error: 'lookup failed' });
      return;
    }
    const rows = await resp.json();
    const rowCount = Array.isArray(rows) ? rows.length : 'non-array';
    const eligible = !Array.isArray(rows) || rows.length === 0;
    console.log('eligibility: decided', { emailHash, status: resp.status, rows: rowCount, eligible });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ eligible });
  } catch (err) {
    console.error('eligibility lookup error:', { emailHash, err: String(err) });
    res.status(500).json({ error: 'internal' });
  }
}

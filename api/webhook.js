export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookUrl = 'https://seachangeai.app.n8n.cloud/webhook/demo-cta';

  try {
    // Forward the payload to n8n server-to-server to avoid browser CORS issues
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    // Attempt to parse response if any, otherwise return success
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      // Ignored, might not be JSON
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Webhook proxy error:', err);
    res.status(500).json({ error: 'Failed to forward webhook' });
  }
}

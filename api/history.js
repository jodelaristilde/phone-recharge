import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get history data (up to ~400 days)
    const history = await kv.get('phone-recharge-history') || [];

    // Sort newest first by the reset timestamp (ISO, unambiguous).
    // The date strings are a mix of M/D/YYYY and D/M/YYYY, so don't sort on them.
    const toTime = (entry) => new Date(entry.timestamp || 0).getTime() || 0;

    const recentHistory = history
      .sort((a, b) => toTime(b) - toTime(a))
      .slice(0, 400);

    return res.json({ history: recentHistory });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

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
    // Get history data (last 15 days)
    const history = await kv.get('phone-recharge-history') || [];

    // Sort by date descending and limit to 15 days
    const last15Days = history
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.date.split('/');
        const [bMonth, bDay, bYear] = b.date.split('/');
        return new Date(`${bYear}-${bMonth}-${bDay}`) - new Date(`${aYear}-${aMonth}-${aDay}`);
      })
      .slice(0, 15);

    return res.json({ history: last15Days });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

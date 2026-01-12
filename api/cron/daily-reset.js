import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Running daily reset cron job...');

    // Get current data
    const currentData = await kv.get('phone-recharge-data');

    if (currentData && currentData.requests && currentData.requests.length > 0) {
      // Calculate total sold for the day
      const totalSold = currentData.requests.reduce((sum, req) => sum + (req.amount || 0), 0);

      // Get existing history
      const history = await kv.get('phone-recharge-history') || [];

      // Add today's data to history
      const historyEntry = {
        date: currentData.date || new Date().toLocaleDateString(),
        totalSold: totalSold,
        totalRequests: currentData.requests.length,
        timestamp: new Date().toISOString()
      };

      history.push(historyEntry);

      // Keep only last 30 days of history (in case we want to extend later)
      const last30Days = history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);

      // Save updated history
      await kv.set('phone-recharge-history', last30Days);

      console.log('History saved:', historyEntry);
    }

    // Reset current data
    const today = new Date().toLocaleDateString();
    await kv.set('phone-recharge-data', {
      requests: [],
      date: today
    });

    console.log('Daily reset completed successfully');

    return res.json({
      success: true,
      message: 'Daily reset completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during daily reset:', error);
    return res.status(500).json({ error: 'Failed to complete daily reset' });
  }
}

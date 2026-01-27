import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if it's 3 AM in Eastern Time
    const now = new Date();
    const easternTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const easternHour = easternTime.getHours();

    if (easternHour !== 3 && easternHour !== 4) {
      console.log(`Skipping reset - current Eastern hour is ${easternHour}, not 3 or 4 AM`);
      return res.json({
        success: true,
        message: 'Skipped - not 3 or 4 AM Eastern Time',
        easternHour: easternHour,
        timestamp: now.toISOString()
      });
    }

    console.log('Running daily reset cron job at 3 AM Eastern...');

    // Get current data
    const currentData = await kv.get('phone-recharge-data');

    // Check if we've already reset today (safety check to prevent duplicate resets)
    const todayEastern = easternTime.toLocaleDateString('en-GB');
    if (currentData && currentData.date === todayEastern && currentData.requests.length === 0) {
      console.log('Already reset today - skipping');
      return res.json({
        success: true,
        message: 'Already reset today',
        date: todayEastern,
        timestamp: now.toISOString()
      });
    }

    if (currentData && currentData.requests && currentData.requests.length > 0) {
      // Calculate total sold for the day
      const totalSold = currentData.requests.reduce((sum, req) => sum + (req.amount || 0), 0);

      // Get existing history
      const history = await kv.get('phone-recharge-history') || [];

      // Store individual requests for detailed history
      const sanitizedRequests = currentData.requests.map(req => ({
        id: req.id,
        phoneNumber: req.phoneNumber,
        amount: req.amount,
        timestamp: req.timestamp,
        completed: req.completed
      }));

      // Create history entry with aggregated data and individual requests
      const historyEntry = {
        date: currentData.date || new Date().toLocaleDateString('en-GB'),
        totalSold: totalSold,
        totalRequests: currentData.requests.length,
        timestamp: new Date().toISOString(),
        requests: sanitizedRequests
      };

      history.push(historyEntry);

      // Keep only last 15 days of history
      const last15Days = history
        .sort((a, b) => {
          // Robustly parse D/M/YYYY
          const [aDay, aMonth, aYear] = a.date.split('/').map(Number);
          const [bDay, bMonth, bYear] = b.date.split('/').map(Number);
          return new Date(bYear, bMonth - 1, bDay) - new Date(aYear, aMonth - 1, aDay);
        })
        .slice(0, 15);

      // Save updated history
      await kv.set('phone-recharge-history', last15Days);

      console.log('History saved:', historyEntry);
    }

    // Reset current data
    await kv.set('phone-recharge-data', {
      requests: [],
      date: todayEastern
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

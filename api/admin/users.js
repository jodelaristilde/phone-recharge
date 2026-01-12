import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all users
      const users = await kv.get('phone-recharge-users') || [];

      // Return users without passwords
      const safeUsers = users.map(user => ({
        username: user.username,
        createdAt: user.createdAt
      }));

      return res.json({ users: safeUsers });
    }

    if (req.method === 'DELETE') {
      // Delete a user
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      // Get existing users
      const users = await kv.get('phone-recharge-users') || [];

      // Filter out the user to delete
      const updatedUsers = users.filter(user => user.username !== username);

      if (users.length === updatedUsers.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Save updated users list
      await kv.set('phone-recharge-users', updatedUsers);

      console.log('User deleted successfully:', username);
      return res.json({ success: true, message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error managing users:', error);
    return res.status(500).json({ error: 'Failed to manage users' });
  }
}

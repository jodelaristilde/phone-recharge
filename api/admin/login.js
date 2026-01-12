import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username });

    // First, check environment variable admin credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username === adminUsername && password === adminPassword) {
      console.log('Login successful (env admin)');
      return res.json({ success: true });
    }

    // Then, check registered users in KV
    const users = await kv.get('phone-recharge-users') || [];
    const user = users.find(u => u.username === username);

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        console.log('Login successful (registered user)');
        return res.json({ success: true });
      }
    }

    console.log('Login failed: Invalid credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return res.status(500).json({ error: 'Failed to verify credentials' });
  }
}

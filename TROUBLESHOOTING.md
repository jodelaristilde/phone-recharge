# Troubleshooting Guide

## "API endpoint not found" when creating user account

If you're getting "API endpoint not found" when trying to create a user account, follow these steps:

### Solution 1: Redeploy to Vercel

The registration endpoint was added after your initial deployment. You need to redeploy:

1. **Push the latest code to GitHub:**
   ```bash
   git add .
   git commit -m "Add user registration and management features"
   git push
   ```

2. **Redeploy on Vercel:**
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Deployments" tab
   - Either wait for auto-deploy OR click the three dots on the latest deployment and select "Redeploy"

3. **Verify the deployment:**
   - Once deployed, check: `https://your-project.vercel.app/api/admin/register`
   - You should see: `{"error":"Method not allowed"}` (this means the endpoint exists)

### Solution 2: Check Vercel Function Logs

If the problem persists:

1. Go to Vercel dashboard → Your project
2. Click "Deployments" → Latest deployment
3. Click "Functions" tab
4. Look for `/api/admin/register` in the list
5. If it's not there, the file wasn't deployed correctly

### Solution 3: Manual Test via Vercel CLI

Install and test locally with Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

This will start a local server at `http://localhost:3000` that mimics Vercel's environment.

Try creating an account at: `http://localhost:3000/admin`

### Solution 4: Check File Structure

Ensure your files are in the correct location:

```
api/
├── admin/
│   ├── login.js      ✓ Should exist
│   ├── register.js   ✓ Should exist
│   └── users.js      ✓ Should exist
├── cron/
│   └── daily-reset.js
├── health.js
├── history.js
└── requests.js
```

### Solution 5: Check Vercel Build Logs

1. Go to Vercel dashboard → Your project
2. Click "Deployments" → Latest deployment
3. Click "Building" to see build logs
4. Look for any errors related to `/api/admin/register.js`

## Common Issues

### Issue: "Username already exists" error
**Solution:** The username is already taken. Try a different username.

### Issue: "Username must be at least 3 characters"
**Solution:** Use a username with 3 or more characters.

### Issue: "Password must be at least 6 characters"
**Solution:** Use a password with 6 or more characters.

### Issue: Cannot delete users from Users modal
**Solution:** Make sure you've redeployed with the latest code that includes `/api/admin/users.js`.

### Issue: History or Users button doesn't work
**Solution:** Check browser console (F12) for errors. Make sure you're logged in and have redeployed the latest code.

## Testing Registration Locally

To test the registration endpoint locally before deploying:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open your browser to: `http://localhost:5173/admin`

3. Click "Create Account" and try registering

4. Check the terminal for any error messages

## Need More Help?

1. **Check Vercel Function Logs:**
   - Dashboard → Project → Deployments → Functions
   - Look for error messages

2. **Check Browser Console:**
   - Press F12
   - Go to Console tab
   - Look for error messages in red

3. **Verify Environment Variables:**
   - Dashboard → Project → Settings → Environment Variables
   - Make sure `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and `CRON_SECRET` are set

4. **Check Upstash Redis:**
   - Go to Upstash dashboard
   - Click on your database
   - Make sure it's connected to your Vercel project

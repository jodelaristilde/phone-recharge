# Vercel Deployment Guide

This guide will help you deploy your Phone Recharge app to Vercel.

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push Your Code to Git

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel will auto-detect it as a Vite project

## Step 3: Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. Go to your project settings
2. Click "Environment Variables"
3. Add the following:

```
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

**IMPORTANT:** Change these from the default values for security!

## Step 4: Set Up Vercel KV Storage

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "KV" (Key-Value storage)
4. Choose a name for your database (e.g., "phone-recharge-db")
5. Click "Create"
6. Vercel will automatically add the KV environment variables to your project

The following variables will be added automatically:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

## Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be live at `your-project.vercel.app`

## Step 6: Test Your Deployment

Visit these endpoints to verify everything works:

- `https://your-project.vercel.app` - Main app
- `https://your-project.vercel.app/api/health` - Health check
- Try logging in with your admin credentials
- Try creating a recharge request

## Local Development

To test the serverless functions locally:

```bash
npm install -g vercel
vercel dev
```

This will start a local server with serverless functions at `http://localhost:3000`

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are listed in `package.json`
- Make sure `npm run build` works locally

### API Errors
- Verify environment variables are set correctly
- Check Vercel KV is properly connected
- Look at function logs in Vercel dashboard under "Deployments" → "Functions"

### Admin Login Not Working
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables
- Check browser console for CORS errors

## Architecture Changes

### What Changed from Local Development

**Before (Local):**
- Single `server.cjs` Express server
- Data stored in `data.json` and `admin.json` files
- Both frontend and backend run together

**After (Vercel):**
- Frontend: Static Vite build served by Vercel CDN
- Backend: Serverless functions in `/api` directory
- Data: Stored in Vercel KV (Redis)
- Admin credentials: Stored in environment variables

### File Structure

```
phone-recharge/
├── api/                    # Serverless API functions
│   ├── requests.js        # GET/POST /api/requests
│   ├── health.js          # GET /api/health
│   └── admin/
│       └── login.js       # POST /api/admin/login
├── src/                   # React frontend
├── dist/                  # Built frontend (generated)
├── vercel.json           # Vercel configuration
└── .env.example          # Environment variable template
```

## Security Notes

1. **Never commit** `.env` files with real credentials
2. Use strong passwords for `ADMIN_PASSWORD`
3. Admin credentials are stored as environment variables (not in KV or files)
4. Consider adding rate limiting for production use
5. HTTPS is automatically enabled by Vercel

## Costs

- Vercel free tier includes:
  - 100GB bandwidth per month
  - Unlimited static sites
  - Serverless function execution
  - 256MB KV storage (plenty for this app)

This app should easily fit within free tier limits for personal/small business use.

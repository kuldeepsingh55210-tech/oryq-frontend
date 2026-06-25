# ORYQ Frontend Deployment Guide (Vercel)

This guide provides instructions to deploy the Next.js frontend of ORYQ to [Vercel](https://vercel.com).

## Prerequisites

1. A Vercel account.
2. The URL of your deployed Railway backend (e.g. `https://backend-production-xxx.up.railway.app`).

## Deployment Steps

1. **Push Code to GitHub**:
   Ensure your codebase (both backend and frontend) is pushed to a repository on GitHub.

2. **Import Project to Vercel**:
   - Log in to Vercel and click **Add New** > **Project**.
   - Import your GitHub repository.
   - If your project is a monorepo, set the **Root Directory** of this deployment to `frontend`. Vercel will automatically configure Next.js build settings.

3. **Configure Environment Variables**:
   In the Vercel dashboard during the import process (or under Project Settings > **Environment Variables**), add the following environment variable:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: The public URL of your deployed Railway backend (e.g. `https://backend-production-xxx.up.railway.app`). Be sure not to include a trailing slash.

4. **Deploy**:
   - Click **Deploy**. Vercel will build the Next.js app and assign a public preview/production URL (e.g. `https://oryq-frontend-xxx.vercel.app`).
   - Copy your Vercel deployment URL.

5. **Update CORS in Backend (Procfile / Env)**:
   Go to your Railway dashboard and update the `ALLOWED_ORIGINS` environment variable to include your new Vercel production URL:
   `http://localhost:3000,https://oryq-frontend-xxx.vercel.app`
   This allows your frontend to securely query the backend without CORS blocks.

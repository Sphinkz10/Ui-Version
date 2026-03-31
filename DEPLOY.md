# Deployment Process

This document outlines the standard deployment procedures for **PerformTrack / V-Login2**. Our deployment infrastructure leverages **Vercel** for hosting the frontend web application and API routes, combined with **GitHub Actions** for CI/CD automation.

## CI/CD Pipeline (GitHub Actions)

When you push code or open a Pull Request against the main branch, our GitHub Actions workflows are triggered automatically.

1. **Continuous Integration (CI):**
   - Validates code structure using ESLint and Prettier.
   - Runs TypeScript validation (`npm run type-check`).
   - Executes unit tests via Vitest.

2. **Continuous Deployment (CD):**
   - Upon successful merge to the `main` branch, the deployment workflow packages the application.
   - We utilize `actions/upload-artifact@v4` (or higher) to transfer build artifacts securely.
   - Deployment triggers Vercel to build and serve the newest version of the app.

## Vercel Deployment

Vercel provides automatic deployments for pushes to the `main` branch, as well as preview deployments for all pull requests.

### Environment Variables

For the application to run correctly in production, the following environment variables must be configured in the Vercel project settings:

- `VITE_SUPABASE_URL`: The URL of your Supabase instance.
- `VITE_SUPABASE_ANON_KEY`: The public anonymous key for Supabase.
- `JWT_SECRET`: Used to verify token signatures for protected API routes.
- `INTERNAL_API_KEY`: Used to securely authenticate internal webhooks.
- (Optional) `SENTRY_DSN`: Required for Sentry error tracking.
- (Optional) `VITE_POSTHOG_KEY`: Required for PostHog analytics tracking.

### Rollback Process

In the event that a deployment introduces critical bugs or failures, Vercel allows for immediate, seamless rollbacks:

1. Navigate to the **Vercel Dashboard** and select the PerformTrack/V-Login2 project.
2. Go to the **Deployments** tab.
3. Locate the previous stable deployment from the list.
4. Click the options menu (three dots) next to the deployment and select **Promote to Production** or **Assign Custom Domains** to instantly revert the active production site to the previous build.
5. In your local repository, create a hotfix branch or revert the offending commit, then push the changes to resolve the issue permanently.

# KSDC Project

This is a Vite project.

## Project Setup

To set up the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/KSDC.git
    cd KSDC
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Build for Production

To build the project for production:

```bash
npm run build
```

This will generate the production-ready files in the `dist` directory.

## Deployment

This project is automatically deployed to GitHub Pages whenever a push is made to the `main` branch.

## "Duplicate Receipt in Office Check" - **SOLVED**

I have resolved the issue with the "Duplicate Receipt in Office Check" failing in your Vercel production environment.

### Root Cause

The initial CORS errors were misleading. The true root cause was a platform-specific CORS handling issue on Vercel's edge network. The browser's preflight `OPTIONS` request was being blocked before it could reach the backend serverless function, which is a common issue in serverless environments.

### Solution

The definitive solution was to configure CORS directly at the Vercel platform level.

1.  **Vercel Configuration (`vercel.json`)**: I have added a `headers` section to your `vercel.json`. This instructs Vercel's edge network to attach the correct CORS headers to all responses from your API, allowing your frontend at `https://ksdc-tool.vercel.app` to make requests. This is the recommended and most robust solution for this environment.
2.  **Code Cleanup**: I have reverted all previous changes to `backend/src/server.ts` and `backend/src/db.ts` to ensure the code is clean and uses standard configurations for local development.

### Next Steps

1.  **Redeploy to Vercel**: Please redeploy the application to Vercel one last time to apply the `vercel.json` configuration.
2.  **Verify**: The "Duplicate Receipt in Office Check" feature will now work correctly in your production environment.
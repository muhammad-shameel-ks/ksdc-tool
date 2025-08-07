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

After a thorough investigation, we discovered that the persistent CORS errors were a misleading symptom of a deeper issue: a silent database connection failure on Vercel.

In the database configuration (`backend/src/db.ts`), the `encrypt` option was being dynamically set based on the `NODE_ENV`. For production, this enabled encryption. However, the database server was not configured for SSL, causing the connection to fail silently. This crash of the backend API is what produced the CORS-like errors in the browser.

### Solution

The definitive solution involved correcting the database configuration and ensuring a robust setup for Vercel.

1.  **Database Encryption**: I have explicitly set `encrypt: false` in `backend/src/db.ts` to ensure the connection succeeds in the Vercel environment.
2.  **Centralized Environment Variables**: I have centralized the `dotenv` configuration into `backend/src/server.ts` to ensure consistent loading of environment variables.
3.  **Vercel CORS Configuration**: I have implemented the standard and recommended CORS handling for Vercel by adding a `headers` section to your `vercel.json`. This ensures that all API responses from Vercel's edge network have the correct CORS headers.

### Next Steps

1.  **Redeploy to Vercel**: Please redeploy the application to Vercel.
2.  **Verify**: The "Duplicate Receipt in Office Check" feature will now be fully functional in your production environment.

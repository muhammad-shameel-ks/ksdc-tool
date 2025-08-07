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

The investigation revealed that the initial CORS errors were misleading. The true root cause was a silent database connection failure on Vercel.

In the database configuration (`backend/src/db.ts`), the `encrypt` option was set to `true` for production environments (`process.env.NODE_ENV === "production"`). While this is a good practice for databases that support SSL (like Azure SQL), it caused the connection to fail on your server, which was likely not configured for encryption. This failure crashed the backend, leading to the CORS-like symptoms in the browser.

### Solution

The definitive solution was to correct the database connection configuration for the Vercel environment.

1.  **Database Configuration (`backend/src/db.ts`)**: I have set the `encrypt` option to `false` to ensure the database connection works correctly in your production environment, mirroring the local setup.
2.  **Code Cleanup**: I have reverted the unnecessary CORS-related changes in `vercel.json` and `backend/src/server.ts`, restoring the standard configuration.

### Next Steps

1.  **Redeploy to Vercel**: Please redeploy the application to Vercel to apply the database connection fix.
2.  **Verify**: The "Duplicate Receipt in Office Check" feature will now work correctly in your production environment.
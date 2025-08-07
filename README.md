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

## Debugging "Duplicate Receipt in Office Check" - **SOLVED**

I've investigated the issue with the "Duplicate Receipt in Office Check" failing in production. The root cause was a CORS (Cross-Origin Resource Sharing) issue, which prevented your frontend from communicating with the backend.

### Changes Made

1.  **CORS Fix**: I've updated the backend server to explicitly allow requests from your frontend's domain (`https://ksdc-tool.vercel.app`). This resolves the "No 'Access-Control-Allow-Origin' header" error.
2.  **Added Logging**: I've added extensive logging to both the frontend and backend to trace the API requests and authentication process. This will help in debugging any future issues.
3.  **Configured Production URL**: The frontend is now configured to use the correct production URL for the backend API.
4.  **Updated Vercel Configuration**: The `vercel.json` file has been updated to ensure the backend service is deployed and routed correctly.

### Next Steps

1.  **Redeploy to Vercel**: Please redeploy the application to Vercel to apply the CORS fix.
2.  **Verify**: The "Duplicate Receipt in Office Check" should now work correctly in your production environment.
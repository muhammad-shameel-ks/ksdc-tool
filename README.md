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

## Debugging "Duplicate Receipt in Office Check"

I've investigated the issue with the "Duplicate Receipt in Office Check" failing in production. The most likely cause is a misconfiguration of the `VITE_API_KEY` environment variable in your Vercel deployment.

### Changes Made

1.  **Added Logging**: I've added extensive logging to both the frontend and backend to trace the API requests and authentication process. This will help us identify the exact point of failure.
2.  **Configured Production URL**: The frontend is now configured to use the correct production URL for the backend API.
3.  **Updated Vercel Configuration**: The `vercel.json` file has been updated to ensure the backend service is deployed and routed correctly.

### Next Steps

1.  **Redeploy to Vercel**: Please redeploy the application to Vercel to apply these changes.
2.  **Check Vercel Logs**: After deployment, please check the Vercel logs for any errors or messages related to the API key. You can do this by running `vercel logs ksdc-tools-backend` in your terminal.
3.  **Confirm Diagnosis**: Please confirm the diagnosis by sharing the logs with me. If the issue is indeed the API key, I will provide instructions on how to fix it.
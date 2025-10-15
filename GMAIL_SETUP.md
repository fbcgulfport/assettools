# Gmail API Setup Guide

This project uses the Gmail API (instead of SMTP) to send emails. Follow these steps to set up Gmail API credentials.

## Prerequisites

- A Google account with Gmail
- Access to Google Cloud Console

## Step 1: Create OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth2 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required fields (App name, User support email, Developer contact)
     - Add your email to "Test users" (on the OAuth consent screen page)
     - Save and continue

5. Create the OAuth client:
   - Application type: Choose **"Desktop app"** (recommended) or "Web application"
   - If you chose "Web application", add `http://localhost:3001` to "Authorized redirect URIs"
   - Click "Create"

6. Download the credentials:
   - Click the download button (⬇️) next to your newly created OAuth client
   - Save the file as `gmail-credentials.json` in the root of this project

## Step 2: Run the Setup Script

Run the setup script to authorize the application and generate your tokens:

```bash
bun run setup:gmail
```

This script will:
1. Read your `gmail-credentials.json` file
2. Open a browser window for you to authorize the application
3. Generate access and refresh tokens
4. Automatically update your `.env` file with the credentials
5. Save tokens to `.gmail-token.json` for future use

## Step 3: Configure Sender Information

Make sure your `.env` file has the following variables set:

```env
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Asset Management System
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

**Important:** The `FROM_EMAIL` should be the Gmail address you used to authenticate.

## Step 4: Test the Setup

Start the application:

```bash
bun start
```

If everything is configured correctly, you should see:
```
✓ Web UI running at http://localhost:3000
✓ Polling service started
```

## Troubleshooting

### "Access blocked: This app's request is invalid"

This usually means you haven't configured the OAuth consent screen properly. Make sure to:
- Add your email to the "Test users" list
- Use the same Google account for testing that you added as a test user

### "Token has been expired or revoked"

Run the setup script again:
```bash
bun run setup:gmail
```

### "Error: Gmail API credentials are required"

Make sure your `.env` file has all the required Gmail API variables. The setup script should have added these automatically.

## Security Notes

- **Never commit** `gmail-credentials.json` or `.gmail-token.json` to version control
- These files are already in `.gitignore`
- The refresh token allows the app to get new access tokens automatically
- Keep your credentials secure and rotate them if compromised

## Refreshing Tokens

The Gmail API automatically refreshes access tokens using the refresh token. You don't need to manually refresh them. If you need to re-authorize for any reason, simply run:

```bash
bun run setup:gmail
```

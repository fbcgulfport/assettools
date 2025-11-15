# Asset Tools

Automated monitoring and email notification system for AssetBots API. Tracks new checkouts, reservations, and repairs, sending confirmation emails to users and admins.

## Features

- **Next.js Web App**: Modern React-based admin dashboard with authentication
- **Google OAuth**: Secure sign-in using better-auth
- **Automatic Polling**: Background cron job checks AssetBots API at configurable intervals
- **Smart Email Notifications**:
  - Checkouts: Sends confirmation to user + admin(s)
  - Reservations: Sends confirmation to user + admin(s)
  - Repairs: Sends notification to admin(s) only
  - Check-ins: Notifies admins when assets are returned
- **Late Detection**: Items >1 hour old when detected trigger admin-only notifications
- **Email History UI**: Web interface showing all sent emails with resend functionality
- **Asset Browser**: Paginated asset viewing with filtering by category, location, or person
- **Manual Email Sending**: Send confirmation emails for any asset from the UI
- **Multiple Admin Support**: Configure multiple admin email addresses
- **Persistent Tracking**: SQLite database tracks processed items to prevent duplicate emails

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- AssetBots API key
- Google Cloud OAuth credentials (for both auth and Gmail API)

## Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up Gmail API**:
   ```bash
   bun run setup:gmail
   ```

   Follow the prompts to authorize the Gmail API. See [GMAIL_SETUP.md](GMAIL_SETUP.md) for details.

3. **Configure environment variables**:

   Copy `.env.example` to `.env` and update:

   ```env
   ASSETBOTS_API_KEY=your_api_key
   ASSETBOTS_API_URL=https://api.assetbots.com/v1

   CHECK_MINUTES=1

   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REDIRECT_URI=http://localhost:3001
   GMAIL_REFRESH_TOKEN=auto_generated
   GMAIL_ACCESS_TOKEN=auto_generated
   GMAIL_TOKEN_EXPIRY=auto_generated

   FROM_EMAIL=your_email@domain.com
   FROM_NAME=Asset Management

   ADMIN_EMAILS=admin@domain.com

   PORT=3000
   WEB_URL=http://localhost:3000
   NEXT_PUBLIC_WEB_URL=http://localhost:3000
   BETTER_AUTH_SECRET=generate_random_secret
   ```

4. **Set up the database**:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

## Usage

### Development

Run both the Next.js dev server and the background polling cron job:

```bash
# Terminal 1 - Next.js app
bun dev

# Terminal 2 - Background polling
bun cron
```

Access the app at `http://localhost:3000`

### Production

```bash
bun run build
bun start  # In one terminal
bun cron   # In another terminal
```

### Web Interface

1. Navigate to `http://localhost:3000`
2. Sign in with Google (uses the same OAuth credentials as Gmail API)
3. Access the admin dashboard with three tabs:
   - **Email History**: View all sent emails with statistics
   - **All Assets**: Browse paginated asset list with manual email buttons
   - **Filter Assets**: Filter by category, location, or person

## How It Works

### Architecture

- **Next.js App** (`src/app`): React-based admin interface with API routes
- **Background Cron** (`src/cron.ts`): Separate process for automated polling
- **Services** (`src/services`): Email service (Gmail API) and polling logic
- **Database** (`src/db`): Drizzle ORM with SQLite

### Polling Process

1. Every `CHECK_MINUTES`, the cron job queries AssetBots API for all assets
2. Checks each asset for:
   - New checkouts (person-assigned only)
   - New repairs
   - Check-ins (previously checked out assets now returned)
3. For each new item:
   - Checks if already processed (prevents duplicates)
   - Determines if >1 hour old (triggers late notification)
   - Sends appropriate emails via Gmail API
   - Records in email history

### Email Logic

**Checkouts:**
- If ≤1 hour old: Send confirmation to user + admins
- If >1 hour old: Send late notification to admins only (marked for manual send)
- Location-only checkouts (no person): No emails sent

**Repairs:**
- Always send notification to admins only

**Check-ins:**
- Detected when asset no longer has active checkout
- Sends admin notification with checkout duration

### Database Schema

SQLite database (`assettools.db`) stores:
- `user`, `session`, `account`, `verification`: Better-auth tables
- `processed_items`: Tracks processed items to prevent duplicates
- `email_history`: Complete audit trail with resend capability
- `active_checkouts`: Tracks active checkouts for check-in detection

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Login page (Google OAuth)
│   ├── admin/
│   │   ├── page.tsx       # Admin dashboard
│   │   └── components/    # Dashboard tabs
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Tailwind v4
│   └── api/               # API route handlers
│       ├── auth/          # Better-auth handler
│       ├── emails/        # Email history
│       ├── assets/        # Asset listings & filtering
│       ├── send-email/    # Manual email sending
│       ├── resend/        # Resend failed emails
│       └── poll/          # Manual poll trigger
├── api/
│   └── assetbots.ts       # AssetBots API client
├── db/
│   ├── index.ts           # Drizzle connection
│   └── schema.ts          # Database schema
├── emails/                # React Email templates
│   ├── CheckoutConfirmation.tsx
│   ├── RepairNotification.tsx
│   ├── CheckInNotification.tsx
│   ├── LateNotification.tsx
│   └── BaseLayout.tsx
├── lib/
│   ├── auth.ts            # Better-auth server config
│   ├── auth-client.ts     # Better-auth React hooks
│   └── clients.ts         # Service singletons
├── services/
│   ├── email.ts           # Gmail API email service
│   └── poller.ts          # Polling logic
└── cron.ts                # Background polling worker
```

## Scripts

- `bun dev` - Start Next.js dev server
- `bun build` - Build for production
- `bun start` - Start production Next.js server
- `bun cron` - Run background polling service
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Apply migrations
- `bun run setup:gmail` - Setup Gmail API OAuth
- `bun run lint` - Lint and format code
- `bun run typecheck` - TypeScript type checking

## Email Templates

React Email templates are in `src/emails/`. Customize these files to match your organization's branding.

Preview templates during development:
```bash
bun run email
```

## Troubleshooting

### Emails not sending

- Run `bun run setup:gmail` to refresh Gmail API tokens
- Check `.env` has valid Gmail credentials
- View error messages in Email History tab

### Duplicate emails

- Database tracks processed items by ID
- Deleting `assettools.db` will reprocess all items

### Not detecting new items

- Verify `ASSETBOTS_API_KEY` is correct
- Check cron job terminal for API errors
- Ensure cron process is running

### Authentication issues

- Verify Google OAuth credentials match between better-auth and Gmail API
- Check `BETTER_AUTH_SECRET` is set
- Ensure `WEB_URL` and `NEXT_PUBLIC_WEB_URL` are correct

## License

MIT

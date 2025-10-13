# Asset Tools

Automated monitoring and email notification system for AssetBots API. Tracks new checkouts, reservations, and repairs, sending confirmation emails to users and admins.

## Features

- **Automatic Polling**: Checks AssetBots API at configurable intervals for new activity
- **Smart Email Notifications**:
  - Checkouts: Sends confirmation to user + admin(s)
  - Reservations: Sends confirmation to user + admin(s)
  - Repairs: Sends notification to admin(s) only
- **Late Detection**: If an item is >2 hours old when first detected, only admin is notified with a prompt to manually send user email
- **Email History UI**: Web interface showing all sent emails with resend functionality
- **Multiple Admin Support**: Configure multiple admin email addresses
- **Rate Limiting**: Built-in API rate limiting to respect AssetBots API limits
- **Persistent Tracking**: SQLite database tracks processed items to prevent duplicate emails

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- AssetBots API key
- SMTP server credentials (Gmail, SendGrid, etc.)

## Setup

1. **Clone/Download the project**

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Set up the database**:
   ```bash
   bun run db:push
   ```

   This uses Drizzle Kit to create the SQLite database and tables.

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your values:

   ```env
   # AssetBots API Configuration
   ASSETBOTS_API_KEY=your_api_key_here
   ASSETBOTS_API_URL=https://api.assetbots.com/v1

   # Polling Configuration
   CHECK_MINUTES=1

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password

   # Sender email address
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=Asset Management System

   # Admin emails (comma-separated for multiple admins)
   ADMIN_EMAILS=admin1@example.com,admin2@example.com

   # Server Configuration
   PORT=3000
   ```

5. **Customize email templates** (optional):

   Edit `src/emails/templates.tsx` to customize the email templates for your organization.

## Usage

### Start the application:

```bash
bun start
```

Or for development with auto-reload:

```bash
bun dev
```

### Access the Web UI:

Open your browser to `http://localhost:3000` (or your configured PORT).

The UI displays:
- Statistics (total emails, sent, failed, late notifications)
- Email history table with filters
- Resend button for failed emails or late notifications

## How It Works

### Polling Process

1. Every `CHECK_MINUTES`, the app queries the AssetBots API for assets with recent changes
2. Checks each asset for new checkouts, reservations, or repairs
3. For each new item:
   - Checks if it's already been processed (to avoid duplicates)
   - Calculates if it's more than 2 hours old
   - Sends appropriate emails
   - Marks item as processed in the database

### Email Logic

**Checkouts & Reservations:**
- If ≤2 hours old: Send confirmation to user (if email available) + all admins
- If >2 hours old: Send late notification to admins only with prompt to manually send

**Repairs:**
- Always send notification to admins only (no user emails)

### Database

SQLite database (`assettools.db`) stores:
- `processed_items`: Tracks which items have been processed to prevent duplicates
- `email_history`: Complete audit trail of all emails sent (for UI and resending)

## Email Templates

The app uses React Email for templates. To customize:

1. Edit files in `src/emails/templates.tsx`
2. Available templates:
   - `CheckoutConfirmationEmail`
   - `ReservationConfirmationEmail`
   - `RepairNotificationEmail`
   - `LateNotificationEmail`

React Email provides great components and styling options. See [React Email docs](https://react.email).

## Rate Limiting

The AssetBots API client includes automatic rate limiting:
- Minimum 1 second between requests
- Configurable via `CHECK_MINUTES` to balance freshness vs. API usage

For high-volume environments, consider increasing `CHECK_MINUTES` to reduce API calls.

## Development

### Project Structure

```
assettools/
├── index.ts                  # Main entry point
├── drizzle.config.ts         # Drizzle Kit configuration
├── src/
│   ├── api/
│   │   └── assetbots.ts     # AssetBots API client
│   ├── db/
│   │   ├── index.ts         # Database connection
│   │   └── schema.ts        # Drizzle ORM schema
│   ├── emails/
│   │   └── templates.tsx    # React Email templates
│   ├── services/
│   │   ├── email.ts         # Email service with nodemailer
│   │   └── poller.ts        # Polling service
│   └── web/
│       └── server.tsx       # Web UI server
├── .env.example             # Environment template
└── package.json
```

### Database Management

The project uses Drizzle ORM with `bun:sqlite` for the database.

**Push schema changes to database:**
```bash
bun run db:push
```

**If you modify the schema** (`src/db/schema.ts`), run `bun run db:push` to apply changes.

**Reset database** (deletes all data):
```bash
rm assettools.db
bun run db:push
```

### Adding New Features

**New Email Type:**
1. Add template to `src/emails/templates.tsx`
2. Add method to `EmailService` in `src/services/email.ts`
3. Add processing logic to `AssetPoller` in `src/services/poller.ts`

**Custom API Endpoints:**
1. Add methods to `AssetBotsClient` in `src/api/assetbots.ts`
2. Update TypeScript interfaces for new data types

## Troubleshooting

### Emails not sending

- Check SMTP credentials in `.env`
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- Check the web UI for error messages in email history

### Duplicate emails

- The database tracks processed items by ID
- If you reset the database, it will reprocess all items
- Delete `assettools.db` only if you want to start fresh

### API rate limiting errors

- Increase `CHECK_MINUTES` in `.env`
- The client has built-in rate limiting, but AssetBots may have stricter limits

### Not detecting new items

- Verify `ASSETBOTS_API_KEY` is correct
- Check console logs for API errors
- The API only scans up to 5000 assets per poll (adjustable in `src/api/assetbots.ts`)

## License

MIT

## Support

For issues or questions, please file an issue in the repository.

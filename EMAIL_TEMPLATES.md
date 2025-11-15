# Email Templates

This document explains where and how to customize the email templates.

## Template Location

All email templates are located in: `src/emails/`

Each template is a separate React component using React Email.

## Current Templates

### 1. CheckoutConfirmation.tsx

Sent when a checkout is made (≤1 hour old).

**Recipients:** User (if email available) + All admins

**Props:**
- `assetName`: Name of the asset
- `personName`: Person who checked out the asset
- `personEmail`: Email of the person (if available)
- `checkoutDate`: When the checkout occurred
- `dueDate`: When the asset is due back (if set)
- `category`: Asset category
- `returnTo`: Where to return the asset (optional)

### 2. RepairNotification.tsx

Sent when an asset needs repair.

**Recipients:** Admins only

**Props:**
- `assetName`: Name of the asset
- `status`: Current repair status
- `description`: Repair description
- `dueDate`: When repair should be completed
- `repairDate`: When repair was reported

### 3. CheckInNotification.tsx

Sent when an asset is checked back in.

**Recipients:** Admins only

**Props:**
- `assetName`: Name of the asset
- `personName`: Person who had the asset
- `checkoutDate`: When it was checked out
- `checkInDate`: When it was checked in
- `daysOut`: Number of days the asset was out
- `category`: Asset category

### 4. LateNotification.tsx

Sent when an item is >1 hour old when first detected.

**Recipients:** Admins only

**Props:**
- `itemType`: Type of item (checkout, reservation, repair)
- `assetName`: Name of the asset
- `personName`: Person involved (if applicable)
- `personEmail`: Person's email (if available)
- `date`: When the item was created
- `hoursLate`: How many hours late this notification is
- `category`: Asset category
- `returnTo`: Where to return (if applicable)

### 5. ReservationConfirmation.tsx

Sent when a reservation is made.

**Recipients:** User (if email available) + All admins

**Props:**
- `assetName`: Name of the asset
- `personName`: Person who reserved the asset
- `personEmail`: Email of the person (if available)
- `startDate`: Reservation start date
- `endDate`: Reservation end date
- `notes`: Additional notes (optional)

### 6. BaseLayout.tsx

Shared layout component used by all email templates for consistent branding.

**Features:**
- Responsive design
- Organization branding (customize colors, logo)
- Footer with contact information

## Customization

### Styling

Each template uses inline styles (required for email clients) via React Email components.

Common customizations:
- Colors: Update hex values in style props
- Fonts: Change font families in inline styles
- Logo: Add your organization's logo URL in BaseLayout
- Footer text: Update contact information in BaseLayout

### Preview Templates

To preview templates during development:

```bash
bun run email
```

This starts the React Email preview server at `http://localhost:3000`.

### Testing Templates

When you make changes:
1. Preview in the React Email dev server
2. Send a test email via the admin UI
3. Check rendering in multiple email clients (Gmail, Outlook, etc.)

## Email Service

Templates are rendered using `@react-email/render` in `src/services/email.ts`.

The EmailService handles:
- Gmail API authentication
- Template rendering to HTML
- Sending via Gmail API
- Logging to database

## Adding New Templates

1. Create a new `.tsx` file in `src/emails/`
2. Import and use BaseLayout for consistency
3. Define TypeScript props interface
4. Add a method to EmailService in `src/services/email.ts`
5. Call the method from the appropriate place in `src/services/poller.ts`

Example structure:

```tsx
import { BaseLayout } from "./BaseLayout"

export type MyTemplateProps = {
  prop1: string
  prop2: string
}

export default function MyTemplate({ prop1, prop2 }: MyTemplateProps) {
  return (
    <BaseLayout previewText="Preview text here">
      {/* Your email content */}
    </BaseLayout>
  )
}
```

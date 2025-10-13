# Email Templates

This document explains where and how to customize the email templates.

## Template Location

All email templates are located in: `src/emails/templates.tsx`

## Current Templates (Stubbed)

The following templates are currently stubbed with basic styling. You should customize these for your organization:

### 1. CheckoutConfirmationEmail

Sent when a checkout is made (≤2 hours old).

**Recipients:** User (if email available) + All admins

**Props:**
- `assetName`: Name of the asset
- `personName`: Name of person checking out
- `personEmail`: Email of person (optional)
- `checkoutDate`: Date of checkout
- `dueDate`: Due date (optional)
- `notes`: Any notes (optional)

### 2. ReservationConfirmationEmail

Sent when a reservation is made (≤2 hours old).

**Recipients:** User (if email available) + All admins

**Props:**
- `assetName`: Name of the asset
- `personName`: Name of person reserving
- `personEmail`: Email of person (optional)
- `startDate`: Reservation start date
- `endDate`: Reservation end date
- `notes`: Any notes (optional)

### 3. RepairNotificationEmail

Sent when a repair is created.

**Recipients:** All admins only

**Props:**
- `assetName`: Name of the asset
- `status`: Repair status (optional)
- `description`: Repair description (optional)
- `dueDate`: Due date (optional)
- `repairDate`: Repair date (optional)

### 4. LateNotificationEmail

Sent when a checkout or reservation is detected >2 hours after creation.

**Recipients:** All admins only

**Props:**
- `itemType`: 'checkout' or 'reservation'
- `assetName`: Name of the asset
- `personName`: Name of person
- `personEmail`: Email of person (optional)
- `date`: Date of the checkout/reservation
- `hoursLate`: Number of hours late

## Customization Guide

### Using React Email Components

React Email provides many useful components. Import what you need:

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Section,
  Button,
  Img,
  Hr,
  Heading,
  Row,
  Column,
} from '@react-email/components';
```

### Example: Adding a Logo

```tsx
export const CheckoutConfirmationEmail: React.FC<CheckoutEmailProps> = ({
  assetName,
  personName,
  checkoutDate,
}) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <Container>
        <Img
          src="https://yourdomain.com/logo.png"
          alt="Company Logo"
          width="200"
        />
        <Heading>Checkout Confirmation</Heading>
        <Text>Hi {personName},</Text>
        <Text>You've successfully checked out <strong>{assetName}</strong>.</Text>
        <Text><strong>Checkout Date:</strong> {checkoutDate}</Text>
        <Hr />
        <Text style={{ fontSize: '12px', color: '#666' }}>
          This is an automated message from Asset Management System.
        </Text>
      </Container>
    </Body>
  </Html>
);
```

### Example: Adding Action Buttons

```tsx
<Button
  href="https://yourdomain.com/assets/view"
  style={{
    background: '#007bff',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '4px',
    textDecoration: 'none',
  }}
>
  View Asset Details
</Button>
```

### Example: Styled Table

```tsx
<Section>
  <Row>
    <Column style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
      <Text style={{ margin: 0, fontWeight: 'bold' }}>Asset:</Text>
    </Column>
    <Column style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
      <Text style={{ margin: 0 }}>{assetName}</Text>
    </Column>
  </Row>
  <Row>
    <Column style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
      <Text style={{ margin: 0, fontWeight: 'bold' }}>Checked Out To:</Text>
    </Column>
    <Column style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
      <Text style={{ margin: 0 }}>{personName}</Text>
    </Column>
  </Row>
</Section>
```

## Testing Templates

To preview your templates:

1. Install React Email CLI:
   ```bash
   bun add -d @react-email/cli
   ```

2. Add a script to package.json:
   ```json
   "scripts": {
     "email:dev": "email dev"
   }
   ```

3. Run the preview server:
   ```bash
   bun run email:dev
   ```

4. Visit `http://localhost:3000` to preview your templates

## Best Practices

1. **Keep it simple**: Email clients have limited CSS support
2. **Use inline styles**: React Email handles this automatically
3. **Test across clients**: Gmail, Outlook, Apple Mail all render differently
4. **Mobile responsive**: Use tables and max-width for mobile support
5. **Plain text alternative**: Consider adding a plain text version for accessibility

## Resources

- [React Email Documentation](https://react.email/docs)
- [React Email Components](https://react.email/docs/components)
- [Email Client CSS Support](https://www.caniemail.com/)

## After Customization

After editing templates, simply restart the application:

```bash
bun start
```

The new templates will be used immediately for all new emails.

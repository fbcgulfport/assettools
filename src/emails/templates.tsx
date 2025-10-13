import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Section,
} from '@react-email/components';

// Stub templates - user will replace these with their own

export interface CheckoutEmailProps {
  assetName: string;
  personName: string;
  personEmail?: string;
  checkoutDate: string;
  dueDate?: string;
  notes?: string;
}

export const CheckoutConfirmationEmail: React.FC<CheckoutEmailProps> = ({
  assetName,
  personName,
  checkoutDate,
  dueDate,
  notes,
}) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <Container>
        <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>Checkout Confirmation</Text>
        <Section>
          <Text><strong>Asset:</strong> {assetName}</Text>
          <Text><strong>Checked out to:</strong> {personName}</Text>
          <Text><strong>Checkout Date:</strong> {checkoutDate}</Text>
          {dueDate && <Text><strong>Due Date:</strong> {dueDate}</Text>}
          {notes && <Text><strong>Notes:</strong> {notes}</Text>}
        </Section>
      </Container>
    </Body>
  </Html>
);

export interface ReservationEmailProps {
  assetName: string;
  personName: string;
  personEmail?: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export const ReservationConfirmationEmail: React.FC<ReservationEmailProps> = ({
  assetName,
  personName,
  startDate,
  endDate,
  notes,
}) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <Container>
        <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>Reservation Confirmation</Text>
        <Section>
          <Text><strong>Asset:</strong> {assetName}</Text>
          <Text><strong>Reserved for:</strong> {personName}</Text>
          <Text><strong>Start Date:</strong> {startDate}</Text>
          <Text><strong>End Date:</strong> {endDate}</Text>
          {notes && <Text><strong>Notes:</strong> {notes}</Text>}
        </Section>
      </Container>
    </Body>
  </Html>
);

export interface RepairEmailProps {
  assetName: string;
  status?: string;
  description?: string;
  dueDate?: string;
  repairDate?: string;
}

export const RepairNotificationEmail: React.FC<RepairEmailProps> = ({
  assetName,
  status,
  description,
  dueDate,
  repairDate,
}) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <Container>
        <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>Repair Notification</Text>
        <Section>
          <Text><strong>Asset:</strong> {assetName}</Text>
          {status && <Text><strong>Status:</strong> {status}</Text>}
          {description && <Text><strong>Description:</strong> {description}</Text>}
          {dueDate && <Text><strong>Due Date:</strong> {dueDate}</Text>}
          {repairDate && <Text><strong>Repair Date:</strong> {repairDate}</Text>}
        </Section>
      </Container>
    </Body>
  </Html>
);

export interface LateNotificationEmailProps {
  itemType: 'checkout' | 'reservation';
  assetName: string;
  personName: string;
  personEmail?: string;
  date: string;
  hoursLate: number;
}

export const LateNotificationEmail: React.FC<LateNotificationEmailProps> = ({
  itemType,
  assetName,
  personName,
  personEmail,
  date,
  hoursLate,
}) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <Container>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
          Late {itemType === 'checkout' ? 'Checkout' : 'Reservation'} Detected
        </Text>
        <Section>
          <Text style={{ color: '#d32f2f' }}>
            This {itemType} was created {hoursLate} hours ago and was just detected.
          </Text>
          <Text><strong>Asset:</strong> {assetName}</Text>
          <Text><strong>{itemType === 'checkout' ? 'Checked out to' : 'Reserved for'}:</strong> {personName}</Text>
          {personEmail && <Text><strong>Email:</strong> {personEmail}</Text>}
          <Text><strong>Date:</strong> {date}</Text>
          <Text style={{ marginTop: '20px', fontStyle: 'italic' }}>
            User confirmation email was NOT sent. Please review and manually send if needed.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

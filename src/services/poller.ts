import { AssetBotsClient, Asset } from '../api/assetbots';
import { EmailService } from './email';
import { db, processedItems, NewProcessedItem } from '../db';
import { eq, and } from 'drizzle-orm';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export class AssetPoller {
  private client: AssetBotsClient;
  private emailService: EmailService;
  private lastCheckTime: Date;
  private isRunning = false;

  constructor(client: AssetBotsClient, emailService: EmailService) {
    this.client = client;
    this.emailService = emailService;
    // Start checking from 5 minutes ago to ensure we catch recent items
    this.lastCheckTime = new Date(Date.now() - 5 * 60 * 1000);
  }

  private async isProcessed(itemType: string, itemId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(processedItems)
      .where(
        and(
          eq(processedItems.itemType, itemType),
          eq(processedItems.itemId, itemId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  private async markProcessed(item: NewProcessedItem): Promise<void> {
    await db.insert(processedItems).values(item);
  }

  private async processCheckout(asset: Asset): Promise<void> {
    if (!asset.checkout) return;

    const checkout = asset.checkout;
    const checkoutId = checkout.id;

    // Check if already processed
    if (await this.isProcessed('checkout', checkoutId)) {
      return;
    }

    const createdDate = checkout.createdDate ? new Date(checkout.createdDate) : new Date();
    const hoursSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    const isLate = hoursSinceCreation > 2;

    console.log(`Processing checkout: ${checkoutId} for asset ${asset.name}`);

    const personName = checkout.person
      ? `${checkout.person.firstName || ''} ${checkout.person.lastName || ''}`.trim() || checkout.person.name || 'Unknown'
      : 'Unknown';

    if (isLate) {
      // Send late notification to admins only
      await this.emailService.sendLateNotification({
        itemType: 'checkout',
        assetName: asset.name,
        personName,
        personEmail: checkout.person?.email,
        date: checkout.date,
        hoursLate: Math.round(hoursSinceCreation),
        itemId: checkoutId,
        itemData: {
          assetName: asset.name,
          personName,
          personEmail: checkout.person?.email,
          checkoutDate: checkout.date,
          dueDate: checkout.dueDate,
          notes: checkout.notes,
        },
      });
    } else {
      // Send normal confirmation
      await this.emailService.sendCheckoutConfirmation({
        assetName: asset.name,
        personName,
        personEmail: checkout.person?.email,
        checkoutDate: checkout.date,
        dueDate: checkout.dueDate,
        notes: checkout.notes,
        itemId: checkoutId,
        checkoutData: {
          assetName: asset.name,
          personName,
          personEmail: checkout.person?.email,
          checkoutDate: checkout.date,
          dueDate: checkout.dueDate,
          notes: checkout.notes,
        },
      });
    }

    // Mark as processed
    await this.markProcessed({
      itemType: 'checkout',
      itemId: checkoutId,
      assetId: asset.id,
      createdAt: createdDate,
      processedAt: new Date(),
    });
  }

  private async processReservation(asset: Asset): Promise<void> {
    if (!asset.reservation) return;

    const reservation = asset.reservation;
    const reservationId = reservation.id;

    // Check if already processed
    if (await this.isProcessed('reservation', reservationId)) {
      return;
    }

    const createdDate = reservation.createdDate ? new Date(reservation.createdDate) : new Date();
    const hoursSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    const isLate = hoursSinceCreation > 2;

    console.log(`Processing reservation: ${reservationId} for asset ${asset.name}`);

    const personName = reservation.person
      ? `${reservation.person.firstName || ''} ${reservation.person.lastName || ''}`.trim() || reservation.person.name || 'Unknown'
      : 'Unknown';

    if (isLate) {
      // Send late notification to admins only
      await this.emailService.sendLateNotification({
        itemType: 'reservation',
        assetName: asset.name,
        personName,
        personEmail: reservation.person?.email,
        date: reservation.startDate,
        hoursLate: Math.round(hoursSinceCreation),
        itemId: reservationId,
        itemData: {
          assetName: asset.name,
          personName,
          personEmail: reservation.person?.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          notes: reservation.notes,
        },
      });
    } else {
      // Send normal confirmation
      await this.emailService.sendReservationConfirmation({
        assetName: asset.name,
        personName,
        personEmail: reservation.person?.email,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        notes: reservation.notes,
        itemId: reservationId,
        reservationData: {
          assetName: asset.name,
          personName,
          personEmail: reservation.person?.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          notes: reservation.notes,
        },
      });
    }

    // Mark as processed
    await this.markProcessed({
      itemType: 'reservation',
      itemId: reservationId,
      assetId: asset.id,
      createdAt: createdDate,
      processedAt: new Date(),
    });
  }

  private async processRepair(asset: Asset): Promise<void> {
    if (!asset.repair) return;

    const repair = asset.repair;
    const repairId = repair.id;

    // Check if already processed
    if (await this.isProcessed('repair', repairId)) {
      return;
    }

    const createdDate = repair.createdDate ? new Date(repair.createdDate) : new Date();

    console.log(`Processing repair: ${repairId} for asset ${asset.name}`);

    // Repairs always go to admins only, no late logic
    await this.emailService.sendRepairNotification({
      assetName: asset.name,
      status: repair.status,
      description: repair.description,
      dueDate: repair.dueDate,
      repairDate: repair.repairDate,
      itemId: repairId,
      repairData: {
        assetName: asset.name,
        status: repair.status,
        description: repair.description,
        dueDate: repair.dueDate,
        repairDate: repair.repairDate,
      },
    });

    // Mark as processed
    await this.markProcessed({
      itemType: 'repair',
      itemId: repairId,
      assetId: asset.id,
      createdAt: createdDate,
      processedAt: new Date(),
    });
  }

  async poll(): Promise<void> {
    if (this.isRunning) {
      console.log('Poll already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      console.log(`Polling for changes since ${this.lastCheckTime.toISOString()}`);

      const assets = await this.client.getRecentAssets(this.lastCheckTime);

      console.log(`Found ${assets.length} assets with recent changes`);

      for (const asset of assets) {
        try {
          // Process checkout if exists
          if (asset.checkout) {
            await this.processCheckout(asset);
          }

          // Process reservation if exists
          if (asset.reservation) {
            await this.processReservation(asset);
          }

          // Process repair if exists
          if (asset.repair) {
            await this.processRepair(asset);
          }
        } catch (error) {
          console.error(`Error processing asset ${asset.id}:`, error);
          // Continue processing other assets
        }
      }

      // Update last check time
      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('Error during poll:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(intervalMinutes: number): void {
    console.log(`Starting poller with ${intervalMinutes} minute interval`);

    // Run immediately
    this.poll();

    // Then run on interval
    setInterval(() => {
      this.poll();
    }, intervalMinutes * 60 * 1000);
  }
}

/**
 * ClientFlow Zapier Triggers
 *
 * All webhook-based triggers
 */

const bookingCreated = require('./booking_created');

// Helper to create trigger definitions
const createTrigger = (key, eventType, noun, label, description, sample) => ({
  key,
  noun,
  display: {
    label,
    description,
    important: eventType.includes('created') || eventType.includes('received'),
  },
  operation: {
    type: 'hook',
    performSubscribe: async (z, bundle) => {
      const response = await z.request({
        url: `${bundle.authData.baseUrl}/api/webhooks`,
        method: 'POST',
        body: {
          url: bundle.targetUrl,
          events: [eventType],
          active: true,
        },
      });
      return response.json;
    },
    performUnsubscribe: async (z, bundle) => {
      const webhookId = bundle.subscribeData.id;
      await z.request({
        url: `${bundle.authData.baseUrl}/api/webhooks/${webhookId}`,
        method: 'DELETE',
      });
      return {};
    },
    perform: async (z, bundle) => {
      return [bundle.cleanedRequest];
    },
    inputFields: [],
    sample,
  },
});

module.exports = {
  // Booking triggers
  bookingCreated,
  bookingConfirmed: createTrigger(
    'booking_confirmed',
    'booking.confirmed',
    'Booking',
    'Booking Confirmed',
    'Triggers when a booking is confirmed.',
    {
      id: 'bkg_123abc',
      status: 'confirmed',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      scheduledAt: '2024-12-25T10:00:00Z',
    }
  ),
  bookingCancelled: createTrigger(
    'booking_cancelled',
    'booking.cancelled',
    'Booking',
    'Booking Cancelled',
    'Triggers when a booking is cancelled.',
    {
      id: 'bkg_123abc',
      status: 'cancelled',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      cancelledAt: '2024-12-20T15:30:00Z',
    }
  ),
  bookingRescheduled: createTrigger(
    'booking_rescheduled',
    'booking.rescheduled',
    'Booking',
    'Booking Rescheduled',
    'Triggers when a booking is rescheduled.',
    {
      id: 'bkg_123abc',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      previousDate: '2024-12-25T10:00:00Z',
      newDate: '2024-12-26T14:00:00Z',
    }
  ),
  bookingCompleted: createTrigger(
    'booking_completed',
    'booking.completed',
    'Booking',
    'Booking Completed',
    'Triggers when a booking is marked as completed.',
    {
      id: 'bkg_123abc',
      status: 'completed',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      completedAt: '2024-12-25T12:00:00Z',
    }
  ),

  // Contact triggers
  contactCreated: createTrigger(
    'contact_created',
    'contact.created',
    'Contact',
    'New Contact',
    'Triggers when a new contact is created.',
    {
      id: 'cnt_456def',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      createdAt: '2024-12-20T15:30:00Z',
    }
  ),
  contactUpdated: createTrigger(
    'contact_updated',
    'contact.updated',
    'Contact',
    'Updated Contact',
    'Triggers when a contact is updated.',
    {
      id: 'cnt_456def',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      updatedAt: '2024-12-20T15:30:00Z',
    }
  ),

  // Payment triggers
  paymentReceived: createTrigger(
    'payment_received',
    'payment.received',
    'Payment',
    'Payment Received',
    'Triggers when a payment is successfully received.',
    {
      id: 'pmt_789ghi',
      amount: 25000,
      currency: 'usd',
      contactName: 'John Doe',
      bookingId: 'bkg_123abc',
      receivedAt: '2024-12-20T15:30:00Z',
    }
  ),
  paymentFailed: createTrigger(
    'payment_failed',
    'payment.failed',
    'Payment',
    'Payment Failed',
    'Triggers when a payment attempt fails.',
    {
      id: 'pmt_789ghi',
      amount: 25000,
      currency: 'usd',
      contactName: 'John Doe',
      failureReason: 'insufficient_funds',
      failedAt: '2024-12-20T15:30:00Z',
    }
  ),

  // Invoice triggers
  invoiceSent: createTrigger(
    'invoice_sent',
    'invoice.sent',
    'Invoice',
    'Invoice Sent',
    'Triggers when an invoice is sent to a client.',
    {
      id: 'inv_101jkl',
      number: 'INV-001',
      contactName: 'John Doe',
      total: 25000,
      sentAt: '2024-12-20T15:30:00Z',
    }
  ),
  invoicePaid: createTrigger(
    'invoice_paid',
    'invoice.paid',
    'Invoice',
    'Invoice Paid',
    'Triggers when an invoice is fully paid.',
    {
      id: 'inv_101jkl',
      number: 'INV-001',
      contactName: 'John Doe',
      total: 25000,
      paidAt: '2024-12-20T15:30:00Z',
    }
  ),
  invoiceOverdue: createTrigger(
    'invoice_overdue',
    'invoice.overdue',
    'Invoice',
    'Invoice Overdue',
    'Triggers when an invoice becomes overdue.',
    {
      id: 'inv_101jkl',
      number: 'INV-001',
      contactName: 'John Doe',
      total: 25000,
      dueDate: '2024-12-15T00:00:00Z',
      overdueAt: '2024-12-20T15:30:00Z',
    }
  ),
};

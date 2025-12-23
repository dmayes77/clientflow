/**
 * Booking Created Trigger
 *
 * Fires when a new booking is created
 */

const perform = async (z, bundle) => {
  // Zapier will automatically parse the webhook payload
  // Return the booking data
  return [bundle.cleanedRequest];
};

const performList = async (z, bundle) => {
  // Fallback polling for initial testing
  // Get recent bookings
  const response = await z.request({
    url: `${bundle.authData.baseUrl}/api/bookings`,
    params: {
      limit: 10,
      sort: '-createdAt',
    },
  });

  return response.json.bookings || [];
};

const performSubscribe = async (z, bundle) => {
  // Subscribe to webhook
  const response = await z.request({
    url: `${bundle.authData.baseUrl}/api/webhooks`,
    method: 'POST',
    body: {
      url: bundle.targetUrl,
      events: ['booking.created'],
      active: true,
    },
  });

  return response.json;
};

const performUnsubscribe = async (z, bundle) => {
  // Unsubscribe from webhook
  const webhookId = bundle.subscribeData.id;

  await z.request({
    url: `${bundle.authData.baseUrl}/api/webhooks/${webhookId}`,
    method: 'DELETE',
  });

  return {};
};

module.exports = {
  key: 'booking_created',
  noun: 'Booking',
  display: {
    label: 'New Booking',
    description: 'Triggers when a new booking is created.',
    important: true,
  },

  operation: {
    type: 'hook',

    // Webhook subscription
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,

    // Main webhook handler
    perform: perform,

    // Fallback polling (for testing)
    performList: performList,

    // Input fields (none needed for webhook)
    inputFields: [],

    // Sample data
    sample: {
      id: 'bkg_123abc',
      status: 'pending',
      contactId: 'cnt_456def',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      serviceId: 'svc_789ghi',
      serviceName: 'Photography Session',
      scheduledAt: '2024-12-25T10:00:00Z',
      duration: 120,
      totalPrice: 25000,
      notes: 'Outdoor location preferred',
      createdAt: '2024-12-20T15:30:00Z',
    },

    // Output fields (what users can map in Zapier)
    outputFields: [
      { key: 'id', label: 'Booking ID', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'contactId', label: 'Contact ID', type: 'string' },
      { key: 'contactName', label: 'Contact Name', type: 'string' },
      { key: 'contactEmail', label: 'Contact Email', type: 'string' },
      { key: 'serviceId', label: 'Service ID', type: 'string' },
      { key: 'serviceName', label: 'Service Name', type: 'string' },
      { key: 'scheduledAt', label: 'Scheduled Date/Time', type: 'datetime' },
      { key: 'duration', label: 'Duration (minutes)', type: 'integer' },
      { key: 'totalPrice', label: 'Total Price (cents)', type: 'integer' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],
  },
};

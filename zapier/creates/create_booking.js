/**
 * Create Booking Action
 *
 * Creates a new booking in ClientFlow
 */

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.baseUrl}/api/bookings`,
    method: 'POST',
    body: {
      contactId: bundle.inputData.contactId,
      serviceId: bundle.inputData.serviceId,
      scheduledAt: bundle.inputData.scheduledAt,
      duration: bundle.inputData.duration,
      notes: bundle.inputData.notes,
      status: bundle.inputData.status || 'pending',
    },
  });

  return response.json;
};

module.exports = {
  key: 'create_booking',
  noun: 'Booking',
  display: {
    label: 'Create Booking',
    description: 'Creates a new booking in ClientFlow.',
    important: true,
  },

  operation: {
    perform: perform,

    // Input fields
    inputFields: [
      {
        key: 'contactId',
        label: 'Contact',
        type: 'string',
        required: true,
        dynamic: 'find_contact.id.name',
        helpText: 'The contact (client) for this booking.',
      },
      {
        key: 'serviceId',
        label: 'Service',
        type: 'string',
        required: true,
        helpText: 'The service to be booked.',
      },
      {
        key: 'scheduledAt',
        label: 'Scheduled Date/Time',
        type: 'datetime',
        required: true,
        helpText: 'When the service is scheduled.',
      },
      {
        key: 'duration',
        label: 'Duration (minutes)',
        type: 'integer',
        required: false,
        helpText: 'Duration in minutes (optional, uses service default if not provided).',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        required: false,
        helpText: 'Additional notes for the booking.',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        default: 'pending',
        choices: ['pending', 'confirmed', 'completed', 'cancelled'],
        helpText: 'Booking status (defaults to pending).',
      },
    ],

    // Sample data
    sample: {
      id: 'bkg_123abc',
      status: 'pending',
      contactId: 'cnt_456def',
      contactName: 'John Doe',
      serviceId: 'svc_789ghi',
      serviceName: 'Photography Session',
      scheduledAt: '2024-12-25T10:00:00Z',
      duration: 120,
      totalPrice: 25000,
      notes: 'Outdoor location preferred',
      createdAt: '2024-12-20T15:30:00Z',
    },

    // Output fields
    outputFields: [
      { key: 'id', label: 'Booking ID' },
      { key: 'status', label: 'Status' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'contactName', label: 'Contact Name' },
      { key: 'serviceId', label: 'Service ID' },
      { key: 'serviceName', label: 'Service Name' },
      { key: 'scheduledAt', label: 'Scheduled Date/Time', type: 'datetime' },
      { key: 'duration', label: 'Duration (minutes)', type: 'integer' },
      { key: 'totalPrice', label: 'Total Price (cents)', type: 'integer' },
      { key: 'notes', label: 'Notes' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],
  },
};

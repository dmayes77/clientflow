/**
 * ClientFlow Zapier Actions (Creates)
 *
 * All create/update operations
 */

const createBooking = require('./create_booking');

// Helper to create action definitions
const createAction = (key, noun, label, description, endpoint, method, inputFields, sample) => ({
  key,
  noun,
  display: {
    label,
    description,
    important: true,
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: `${bundle.authData.baseUrl}${endpoint}`,
        method,
        body: bundle.inputData,
      });
      return response.json;
    },
    inputFields,
    sample,
  },
});

module.exports = {
  createBooking,

  createContact: createAction(
    'create_contact',
    'Contact',
    'Create Contact',
    'Creates a new contact in ClientFlow.',
    '/api/contacts',
    'POST',
    [
      { key: 'name', label: 'Name', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'string', required: false },
      { key: 'phone', label: 'Phone', type: 'string', required: false },
      { key: 'address', label: 'Address', type: 'text', required: false },
      { key: 'notes', label: 'Notes', type: 'text', required: false },
    ],
    {
      id: 'cnt_456def',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      createdAt: '2024-12-20T15:30:00Z',
    }
  ),

  createInvoice: createAction(
    'create_invoice',
    'Invoice',
    'Create Invoice',
    'Creates a new invoice in ClientFlow.',
    '/api/invoices',
    'POST',
    [
      { key: 'contactId', label: 'Contact', type: 'string', required: true, dynamic: 'find_contact.id.name' },
      { key: 'dueDate', label: 'Due Date', type: 'datetime', required: false },
      { key: 'notes', label: 'Notes', type: 'text', required: false },
      { key: 'items', label: 'Line Items (JSON)', type: 'text', required: true, helpText: 'JSON array of line items: [{"description": "Item", "quantity": 1, "unitPrice": 10000}]' },
    ],
    {
      id: 'inv_101jkl',
      number: 'INV-001',
      contactId: 'cnt_456def',
      contactName: 'John Doe',
      total: 25000,
      status: 'draft',
      createdAt: '2024-12-20T15:30:00Z',
    }
  ),

  updateBookingStatus: createAction(
    'update_booking_status',
    'Booking',
    'Update Booking Status',
    'Updates the status of an existing booking.',
    '/api/bookings/{{bundle.inputData.bookingId}}',
    'PATCH',
    [
      { key: 'bookingId', label: 'Booking ID', type: 'string', required: true, dynamic: 'find_booking.id.id' },
      {
        key: 'status',
        label: 'New Status',
        type: 'string',
        required: true,
        choices: ['pending', 'confirmed', 'completed', 'cancelled'],
      },
    ],
    {
      id: 'bkg_123abc',
      status: 'confirmed',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      updatedAt: '2024-12-20T15:30:00Z',
    }
  ),
};

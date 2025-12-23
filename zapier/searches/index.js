/**
 * ClientFlow Zapier Searches
 *
 * Find existing records
 */

// Helper to create search definitions
const createSearch = (key, noun, label, description, endpoint, searchField, sample) => ({
  key,
  noun,
  display: {
    label,
    description,
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: `${bundle.authData.baseUrl}${endpoint}`,
        params: {
          [searchField]: bundle.inputData[searchField],
          limit: 1,
        },
      });

      const results = response.json;
      if (Array.isArray(results)) {
        return results;
      }
      if (results.contacts) return results.contacts;
      if (results.bookings) return results.bookings;
      if (results.invoices) return results.invoices;
      return [results];
    },
    inputFields: [
      {
        key: searchField,
        label: searchField.charAt(0).toUpperCase() + searchField.slice(1),
        type: 'string',
        required: true,
      },
    ],
    sample,
  },
});

module.exports = {
  findContact: createSearch(
    'find_contact',
    'Contact',
    'Find Contact',
    'Finds a contact by email or name.',
    '/api/contacts',
    'email',
    {
      id: 'cnt_456def',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      createdAt: '2024-12-20T15:30:00Z',
    }
  ),

  findBooking: createSearch(
    'find_booking',
    'Booking',
    'Find Booking',
    'Finds a booking by ID.',
    '/api/bookings',
    'id',
    {
      id: 'bkg_123abc',
      status: 'pending',
      contactName: 'John Doe',
      serviceName: 'Photography Session',
      scheduledAt: '2024-12-25T10:00:00Z',
    }
  ),

  findInvoice: createSearch(
    'find_invoice',
    'Invoice',
    'Find Invoice',
    'Finds an invoice by number or ID.',
    '/api/invoices',
    'number',
    {
      id: 'inv_101jkl',
      number: 'INV-001',
      contactName: 'John Doe',
      total: 25000,
      status: 'sent',
    }
  ),
};

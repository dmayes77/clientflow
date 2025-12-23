/**
 * ClientFlow Zapier Integration
 *
 * Connects ClientFlow to 5000+ apps via Zapier
 *
 * Features:
 * - 13 webhook triggers (bookings, contacts, payments, invoices)
 * - REST API actions (create/update bookings, contacts, invoices)
 * - Search operations (find contacts, bookings, invoices)
 * - API key authentication
 */

const authentication = require('./authentication');
const triggers = require('./triggers');
const creates = require('./creates');
const searches = require('./searches');

module.exports = {
  version: require('../package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // Authentication
  authentication: authentication,

  // Before requests - add auth header
  beforeRequest: [
    (request, z, bundle) => {
      if (bundle.authData.apiKey) {
        request.headers['X-API-Key'] = bundle.authData.apiKey;
      }
      return request;
    }
  ],

  // After response - handle errors
  afterResponse: [
    (response, z, bundle) => {
      if (response.status === 401) {
        throw new z.errors.RefreshAuthError('Invalid API key');
      }
      if (response.status === 403) {
        throw new z.errors.Error('Access forbidden - check API key permissions', 'ForbiddenError', 403);
      }
      if (response.status >= 400) {
        throw new z.errors.Error(`API Error: ${response.status}`, 'APIError', response.status);
      }
      return response;
    }
  ],

  // Triggers (webhook events)
  triggers: {
    [triggers.bookingCreated.key]: triggers.bookingCreated,
    [triggers.bookingConfirmed.key]: triggers.bookingConfirmed,
    [triggers.bookingCancelled.key]: triggers.bookingCancelled,
    [triggers.bookingRescheduled.key]: triggers.bookingRescheduled,
    [triggers.bookingCompleted.key]: triggers.bookingCompleted,
    [triggers.contactCreated.key]: triggers.contactCreated,
    [triggers.contactUpdated.key]: triggers.contactUpdated,
    [triggers.paymentReceived.key]: triggers.paymentReceived,
    [triggers.paymentFailed.key]: triggers.paymentFailed,
    [triggers.invoiceSent.key]: triggers.invoiceSent,
    [triggers.invoicePaid.key]: triggers.invoicePaid,
    [triggers.invoiceOverdue.key]: triggers.invoiceOverdue,
  },

  // Creates (actions that create/update data)
  creates: {
    [creates.createBooking.key]: creates.createBooking,
    [creates.createContact.key]: creates.createContact,
    [creates.createInvoice.key]: creates.createInvoice,
    [creates.updateBookingStatus.key]: creates.updateBookingStatus,
  },

  // Searches (find existing data)
  searches: {
    [searches.findContact.key]: searches.findContact,
    [searches.findBooking.key]: searches.findBooking,
    [searches.findInvoice.key]: searches.findInvoice,
  },

  // Resource definitions (shared sample data)
  resources: {},
};

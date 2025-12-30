/**
 * Payment Allocation Utilities
 *
 * Handles proportional allocation of deposits and payments across
 * multiple bookings linked to a single invoice.
 */

/**
 * Calculate proportional payment allocation for bookings on an invoice
 *
 * @param {Object} invoice - Invoice with total amount
 * @param {Array} bookings - Array of bookings with totalPrice
 * @param {number} paymentAmount - Amount being paid (in cents)
 * @returns {Array} Array of { bookingId, allocatedAmount, proportion }
 *
 * @example
 * // Invoice total: $300, Booking A: $100, Booking B: $200, Payment: $90
 * // Result: Booking A gets $30 (33%), Booking B gets $60 (67%)
 */
export function calculateProportionalAllocation(invoice, bookings, paymentAmount) {
  if (!bookings || bookings.length === 0) return [];

  const invoiceTotal = invoice.total || 0;

  // Handle edge case of zero total
  if (invoiceTotal === 0) {
    return bookings.map(b => ({
      bookingId: b.id,
      allocatedAmount: 0,
      proportion: 0,
    }));
  }

  let remaining = paymentAmount;
  const allocations = [];

  // Sort by totalPrice descending to allocate larger amounts first (reduces rounding errors)
  const sortedBookings = [...bookings].sort((a, b) => b.totalPrice - a.totalPrice);

  sortedBookings.forEach((booking, index) => {
    const proportion = booking.totalPrice / invoiceTotal;

    // Last booking gets remaining to avoid rounding errors
    const allocatedAmount = index === sortedBookings.length - 1
      ? remaining
      : Math.round(paymentAmount * proportion);

    remaining -= allocatedAmount;

    allocations.push({
      bookingId: booking.id,
      allocatedAmount,
      proportion,
    });
  });

  return allocations;
}

/**
 * Calculate booking payment status based on amounts paid
 *
 * @param {Object} booking - Booking with totalPrice, depositAllocated, bookingAmountPaid
 * @returns {string} 'paid' | 'deposit_paid' | 'unpaid'
 */
export function calculateBookingPaymentStatus(booking) {
  const { totalPrice, depositAllocated = 0, bookingAmountPaid = 0 } = booking;

  // Fully paid
  if (bookingAmountPaid >= totalPrice) {
    return 'paid';
  }

  // Has some payment (deposit or partial)
  if (depositAllocated > 0 || bookingAmountPaid > 0) {
    return 'deposit_paid';
  }

  return 'unpaid';
}

/**
 * Calculate the balance due for a booking
 *
 * @param {Object} booking - Booking with totalPrice and bookingAmountPaid
 * @returns {number} Balance due in cents
 */
export function calculateBookingBalanceDue(booking) {
  const { totalPrice, bookingAmountPaid = 0 } = booking;
  return Math.max(0, totalPrice - bookingAmountPaid);
}

/**
 * Apply deposit allocation to bookings and return update data
 *
 * @param {Object} invoice - Invoice with total and depositAmount
 * @param {Array} bookings - Array of bookings to allocate to
 * @returns {Array} Array of { bookingId, updateData } for prisma updates
 */
export function allocateDepositToBookings(invoice, bookings) {
  const depositAmount = invoice.depositAmount || 0;

  if (depositAmount === 0 || !bookings || bookings.length === 0) {
    return [];
  }

  const allocations = calculateProportionalAllocation(invoice, bookings, depositAmount);

  return allocations.map(allocation => {
    const booking = bookings.find(b => b.id === allocation.bookingId);
    const newAmountPaid = (booking.bookingAmountPaid || 0) + allocation.allocatedAmount;
    const balanceDue = booking.totalPrice - newAmountPaid;

    return {
      bookingId: allocation.bookingId,
      updateData: {
        depositAllocated: allocation.allocatedAmount,
        bookingAmountPaid: newAmountPaid,
        bookingBalanceDue: balanceDue,
        paymentStatus: calculateBookingPaymentStatus({
          ...booking,
          depositAllocated: allocation.allocatedAmount,
          bookingAmountPaid: newAmountPaid,
        }),
      },
    };
  });
}

/**
 * Apply a balance payment to a specific booking
 *
 * @param {Object} booking - Booking to apply payment to
 * @param {number} paymentAmount - Amount being paid (in cents)
 * @returns {Object} Update data for the booking
 */
export function applyBalancePaymentToBooking(booking, paymentAmount) {
  const currentAmountPaid = booking.bookingAmountPaid || 0;
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const balanceDue = Math.max(0, booking.totalPrice - newAmountPaid);

  return {
    bookingAmountPaid: newAmountPaid,
    bookingBalanceDue: balanceDue,
    paymentStatus: newAmountPaid >= booking.totalPrice ? 'paid' : 'deposit_paid',
  };
}

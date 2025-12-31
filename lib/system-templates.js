/**
 * System Email Templates
 *
 * These templates are automatically created for each tenant and used by cron jobs
 * and automated processes. Tenants can customize them but cannot delete them.
 */

export const SYSTEM_TEMPLATES = {
  // ============================================================================
  // PAYMENT REMINDERS (3 urgency levels)
  // ============================================================================

  payment_reminder_gentle: {
    name: "Payment Reminder - Gentle",
    category: "payment",
    subject: "Friendly Reminder: Invoice {{invoice.number}} Due",
    body: `
      <h2>Hi {{contact.firstName}},</h2>
      <p>Just a friendly reminder that invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong> is now due.</p>
      <p>We know things get busy! If you've already sent payment, please disregard this reminder.</p>
      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Invoice</a>
      </div>
      <p>If you have any questions about this invoice, please don't hesitate to reach out.</p>
      <p>Best regards,<br>{{business.name}}</p>
    `,
    description: "Sent when invoice is 1-7 days overdue (gentle reminder)",
  },

  payment_reminder_urgent: {
    name: "Payment Reminder - Urgent",
    category: "payment",
    subject: "Urgent: Invoice {{invoice.number}} Past Due",
    body: `
      <h2>Hi {{contact.firstName}},</h2>
      <p>This is an urgent reminder that invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong> is now past due.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Amount Due:</strong> {{invoice.balanceDue}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Original Due Date:</strong> {{invoice.dueDate}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Invoice Number:</strong> {{invoice.number}}</p>
      </div>

      <p>Please submit payment as soon as possible to avoid any service interruptions.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
      </div>

      <p>If you're experiencing difficulty with payment, please contact us to discuss options.</p>
      <p>{{business.name}}<br>{{business.phone}}<br>{{business.email}}</p>
    `,
    description: "Sent when invoice is 8-14 days overdue (urgent reminder)",
  },

  payment_reminder_final: {
    name: "Payment Reminder - Final Notice",
    category: "payment",
    subject: "Final Notice: Invoice {{invoice.number}} - Action Required",
    body: `
      <div style="background-color: #7f1d1d; color: white; padding: 16px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">FINAL NOTICE</h2>
      </div>

      <p>Dear {{contact.name}},</p>

      <p>This is a final notice regarding invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong>, which is significantly past due.</p>

      <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Amount Due:</strong> {{invoice.balanceDue}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Original Due Date:</strong> {{invoice.dueDate}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Invoice Number:</strong> {{invoice.number}}</p>
      </div>

      <p><strong>Immediate payment is required.</strong> If payment is not received within 48 hours, we may need to suspend services or take additional collection measures.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Pay Immediately</a>
      </div>

      <p>If you have already sent payment or need to discuss payment arrangements, please contact us immediately at {{business.phone}}.</p>

      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when invoice is 15+ days overdue (final notice)",
  },

  // ============================================================================
  // BOOKING CONFIRMATIONS
  // ============================================================================

  booking_scheduled: {
    name: "Booking Scheduled - Confirm Your Appointment",
    category: "booking",
    subject: "Please Confirm: {{booking.service}} on {{booking.date}}",
    body: `
      <h2>Your Booking is Scheduled!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Thank you for your deposit! Your booking has been scheduled. Please confirm your appointment:</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>⏱️ Duration:</strong> {{booking.duration}}</p>
        <p style="margin: 8px 0 0 0;"><strong>💰 Total:</strong> {{booking.price}}</p>
        <p style="margin: 8px 0 0 0;"><strong>✓ Deposit Paid:</strong> {{booking.depositPaid}}</p>
        <p style="margin: 8px 0 0 0;"><strong>💳 Balance Due:</strong> {{booking.balanceDue}}</p>
      </div>

      <p><strong>Please confirm your attendance:</strong></p>

      <div style="margin: 32px 0; text-align: center;">
        <a class="not-prose" href="{{booking.confirmUrl}}" style="background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 12px;">✓ Confirm Booking</a>
      </div>

      <p style="margin-top: 24px;">Need to make changes?</p>
      <div style="margin: 16px 0;">
        <a class="not-prose" href="{{booking.rescheduleUrl}}" style="color: #3b82f6; text-decoration: none; margin-right: 24px; font-weight: 500;">📅 Reschedule</a>
        <a class="not-prose" href="{{booking.cancelUrl}}" style="color: #ef4444; text-decoration: none; font-weight: 500;">❌ Cancel</a>
      </div>

      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin-top: 24px;">
        <p style="margin: 0;"><strong>Location:</strong></p>
        <p style="margin: 4px 0 0 0;">{{business.name}}<br>{{business.address}}<br>{{business.phone}}</p>
      </div>
    `,
    description: "Sent when deposit is paid - asks contact to confirm, reschedule, or cancel",
  },

  booking_confirmed: {
    name: "Booking Confirmation",
    category: "booking",
    subject: "Booking Confirmed - {{booking.service}} on {{booking.date}}",
    body: `
      <h2 style="color: #22c55e;">✓ Your Booking is Confirmed!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Great news! Your booking has been confirmed. Here are the details:</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>⏱️ Duration:</strong> {{booking.duration}}</p>
        <p style="margin: 8px 0 0 0;"><strong>💰 Price:</strong> {{booking.price}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🔖 Confirmation #:</strong> {{booking.confirmationNumber}}</p>
      </div>

      <p>We look forward to seeing you!</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{booking.rescheduleUrl}}" style="color: #3b82f6; text-decoration: none; margin-right: 24px; font-weight: 500;">📅 Reschedule</a>
        <a class="not-prose" href="{{booking.cancelUrl}}" style="color: #ef4444; text-decoration: none; font-weight: 500;">❌ Cancel</a>
      </div>

      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin-top: 24px;">
        <p style="margin: 0;"><strong>Location:</strong></p>
        <p style="margin: 4px 0 0 0;">{{business.name}}<br>{{business.address}}<br>{{business.phone}}</p>
      </div>
    `,
    description: "Sent when a booking is confirmed",
  },

  booking_reminder: {
    name: "Booking Reminder",
    category: "booking",
    subject: "Reminder: {{booking.service}} Tomorrow at {{booking.time}}",
    body: `
      <h2>Reminder: Your Appointment is Tomorrow</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>This is a friendly reminder about your upcoming appointment:</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>📍 Location:</strong> {{business.address}}</p>
      </div>

      <p>Please arrive 5-10 minutes early. If you need to reschedule or cancel, please let us know as soon as possible.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{booking.rescheduleUrl}}" style="color: #3b82f6; text-decoration: none; margin-right: 24px;">Reschedule</a>
        <a class="not-prose" href="{{booking.cancelUrl}}" style="color: #ef4444; text-decoration: none;">Cancel</a>
      </div>

      <p>See you soon!</p>
      <p>{{business.name}}<br>{{business.phone}}</p>
    `,
    description: "Sent 24 hours before a booking",
  },

  // ============================================================================
  // PAYMENT CONFIRMATIONS
  // ============================================================================

  booking_cancelled: {
    name: "Booking Cancellation Confirmation",
    category: "booking",
    subject: "Booking Cancelled - {{booking.service}}",
    body: `
      <h2>Booking Cancelled</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Your booking has been cancelled as requested.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Service:</strong> {{booking.service}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Original Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Original Time:</strong> {{booking.time}}</p>
      </div>

      <p>If you have any questions about refunds or would like to reschedule, please contact us.</p>

      <p>{{business.name}}<br>{{business.phone}}<br>{{business.email}}</p>
    `,
    description: "Sent when a booking is cancelled",
  },

  // ============================================================================
  // LEAD/CLIENT MANAGEMENT
  // ============================================================================

  lead_welcome: {
    name: "Welcome New Lead",
    category: "lead",
    subject: "Thanks for Reaching Out! - {{business.name}}",
    body: `
      <h2>Thanks for Getting in Touch!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Thank you for your interest in {{business.name}}! We're excited to connect with you.</p>

      <p>We'd love to learn more about what you're looking for. Feel free to:</p>

      <ul>
        <li><strong>Book a consultation:</strong> <a href="{{business.bookingUrl}}">Schedule Now</a></li>
        <li><strong>Reply to this email</strong> with any questions</li>
        <li><strong>Call us:</strong> {{business.phone}}</li>
      </ul>

      <p>We look forward to working with you!</p>
      <p>Best regards,<br>{{business.name}}</p>
    `,
    description: "Sent when a new lead is created",
  },

  client_welcome: {
    name: "Welcome New Client",
    category: "client",
    subject: "Welcome to {{business.name}}! 🎉",
    body: `
      <h2>Welcome to the Family!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>We're thrilled to have you as a client! Thank you for choosing {{business.name}}.</p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>Your first booking is confirmed!</strong></p>
        <p style="margin: 12px 0 0 0;">We're excited to work with you.</p>
      </div>

      <p>Here's what you can do next:</p>
      <ul>
        <li><strong>View your booking details</strong> in your confirmation email</li>
        <li><strong>Save our contact info:</strong> {{business.phone}}</li>
        <li><strong>Follow us:</strong> Stay updated on news and special offers</li>
      </ul>

      <p>If you have any questions before your appointment, don't hesitate to reach out.</p>

      <p>See you soon!</p>
      <p>The {{business.name}} Team</p>
    `,
    description: "Sent when a lead converts to a paying client",
  },

  // ============================================================================
  // INVOICE NOTIFICATIONS
  // ============================================================================

  invoice_sent: {
    name: "Invoice Sent",
    category: "invoice",
    subject: "Invoice {{invoice.number}} from {{business.name}}",
    body: `
      <h2>Invoice from {{business.name}}</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>You have a new invoice ready for payment.</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Invoice #{{invoice.number}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>Amount Due:</strong> {{invoice.amount}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Due Date:</strong> {{invoice.dueDate}}</p>
      </div>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View & Pay Invoice</a>
      </div>

      <p>If you have any questions about this invoice, please don't hesitate to reach out.</p>
      <p>Thank you for your business!</p>
      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when an invoice is marked as sent",
  },

  // ============================================================================
  // PAYMENT CONFIRMATIONS
  // ============================================================================

  payment_received: {
    name: "Payment Confirmation",
    category: "payment",
    subject: "Payment Received - Thank You!",
    body: `
      <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">✓ Payment Received</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Thank you! We've successfully received your payment.</p>

      <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>💰 Amount Paid:</strong> {{payment.amount}}</p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Payment Date:</strong> {{payment.date}}</p>
        <p style="margin: 12px 0 0 0;"><strong>💳 Payment Method:</strong> {{payment.method}}</p>
        <p style="margin: 12px 0 0 0;"><strong>🔖 Confirmation #:</strong> {{payment.confirmationNumber}}</p>
      </div>

      <p>A receipt has been sent to your email. You can also view your receipt online:</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{payment.receiptUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📄 View Receipt</a>
      </div>

      <p>Thank you for your business!</p>
      <p>{{business.name}}</p>
    `,
    description: "Sent when a payment is successfully processed",
  },

  deposit_paid: {
    name: "Deposit Payment Confirmation",
    category: "payment",
    subject: "Deposit Received - Invoice {{invoice.number}}",
    body: `
      <div style="background-color: #eab308; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">✓ Deposit Received</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Thank you! We've received your deposit payment.</p>

      <div style="background-color: #fefce8; border: 2px solid #eab308; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Invoice #{{invoice.number}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>💰 Deposit Paid:</strong> {{payment.amount}}</p>
        <p style="margin: 12px 0 0 0;"><strong>💳 Remaining Balance:</strong> {{invoice.balanceDue}}</p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Payment Date:</strong> {{payment.date}}</p>
      </div>

      <p>Your remaining balance of <strong>{{invoice.balanceDue}}</strong> will be due as agreed.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
      </div>

      <p>If you have any questions, please don't hesitate to reach out.</p>
      <p>Thank you for your business!</p>
      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when a deposit payment is received on an invoice",
  },

  // ============================================================================
  // REFUND NOTIFICATIONS
  // ============================================================================

  invoice_refunded: {
    name: "Refund Confirmation",
    category: "payment",
    subject: "Refund Processed - {{business.name}}",
    body: `
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">Refund Processed</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>We've processed a refund for your recent payment.</p>

      <div style="background-color: #f0f9ff; border: 2px solid #3b82f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>Invoice:</strong> #{{invoice.number}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Refund Amount:</strong> {{payment.amount}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Date:</strong> {{payment.date}}</p>
      </div>

      <p>The refund should appear in your account within 5-10 business days, depending on your bank.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when a refund is processed",
  },

  // ============================================================================
  // PAYMENT FAILURE NOTIFICATIONS
  // ============================================================================

  payment_failed: {
    name: "Payment Failed",
    category: "payment",
    subject: "Payment Failed - Action Required",
    body: `
      <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">Payment Failed</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Unfortunately, we were unable to process your payment.</p>

      <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Amount:</strong> {{payment.amount}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Date:</strong> {{payment.date}}</p>
      </div>

      <p>This could be due to:</p>
      <ul>
        <li>Insufficient funds</li>
        <li>Expired card</li>
        <li>Incorrect card details</li>
        <li>Bank declined the transaction</li>
      </ul>

      <p>Please update your payment method or try again:</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Try Again</a>
      </div>

      <p>If you continue to experience issues, please contact us.</p>
      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when a payment fails",
  },

  // ============================================================================
  // BOOKING LIFECYCLE
  // ============================================================================

  booking_created: {
    name: "Booking Request Received",
    category: "booking",
    subject: "Booking Request Received - {{business.name}}",
    body: `
      <h2>We've Received Your Booking Request!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Thank you for your interest! We've received your booking request and will review it shortly.</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Requested Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Requested Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>💰 Total:</strong> {{booking.price}}</p>
      </div>

      <p><strong>What happens next?</strong></p>
      <ul>
        <li>We'll review your request and confirm availability</li>
        <li>You'll receive a payment link to secure your booking</li>
        <li>Once payment is received, your booking will be confirmed</li>
      </ul>

      <p>We'll be in touch soon!</p>
      <p>{{business.name}}<br>{{business.phone}}</p>
    `,
    description: "Sent when a new booking request is created",
  },

  booking_completed: {
    name: "Thank You - Booking Completed",
    category: "booking",
    subject: "Thank You! - {{business.name}}",
    body: `
      <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">Thank You!</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Thank you for choosing {{business.name}}! We hope you had a wonderful experience.</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
      </div>

      <p>We'd love to hear about your experience! Your feedback helps us improve and helps others discover our services.</p>

      <p>We look forward to seeing you again soon!</p>

      <p>Best regards,<br>{{business.name}}<br>{{business.phone}}</p>
    `,
    description: "Sent when a booking is marked as completed",
  },

  booking_no_show: {
    name: "Missed Appointment",
    category: "booking",
    subject: "We Missed You - {{business.name}}",
    body: `
      <h2>We Missed You!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>We noticed you weren't able to make it to your appointment today.</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
      </div>

      <p>We understand that things come up! If you'd like to reschedule, we'd love to see you.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{business.bookingUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Again</a>
      </div>

      <p>If you have any questions or need to discuss anything, please don't hesitate to reach out.</p>
      <p>{{business.name}}<br>{{business.phone}}<br>{{business.email}}</p>
    `,
    description: "Sent when a contact doesn't show up for their booking",
  },

  // ============================================================================
  // INVOICE STATUS NOTIFICATIONS
  // ============================================================================

  invoice_overdue: {
    name: "Invoice Overdue Notice",
    category: "invoice",
    subject: "Invoice {{invoice.number}} is Now Overdue",
    body: `
      <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">Invoice Overdue</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Your invoice has passed its due date and is now overdue.</p>

      <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Invoice #{{invoice.number}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>Amount Due:</strong> {{invoice.amount}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Original Due Date:</strong> {{invoice.dueDate}}</p>
      </div>

      <p>Please submit payment as soon as possible to avoid any additional fees or service interruptions.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Pay Now</a>
      </div>

      <p>If you've already sent payment, please disregard this notice. If you're experiencing difficulty with payment, please contact us to discuss options.</p>
      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when an invoice becomes overdue",
  },
};

/**
 * Get all system template keys
 */
export function getSystemTemplateKeys() {
  return Object.keys(SYSTEM_TEMPLATES);
}

/**
 * Get a system template by key
 */
export function getSystemTemplate(key) {
  return SYSTEM_TEMPLATES[key];
}

/**
 * Seed system templates for a tenant
 * This should be called when a new tenant is created
 */
export async function seedSystemTemplates(prisma, tenantId) {
  const templates = [];

  for (const [key, template] of Object.entries(SYSTEM_TEMPLATES)) {
    // Check if template already exists
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        systemKey: key,
      },
    });

    if (!existing) {
      templates.push(
        prisma.emailTemplate.create({
          data: {
            tenantId,
            systemKey: key,
            isSystem: true,
            name: template.name,
            subject: template.subject,
            body: template.body,
            description: template.description,
            category: template.category,
          },
        })
      );
    }
  }

  if (templates.length > 0) {
    await prisma.$transaction(templates);
  }

  return templates.length;
}

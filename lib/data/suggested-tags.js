/**
 * Suggested default tags for different types
 * These can be imported during onboarding or used as examples
 */

export const SUGGESTED_TAGS = {
  // Contact Tags
  contact: [
    {
      name: "VIP Client",
      type: "contact",
      color: "purple",
      description: "High-value clients requiring priority attention"
    },
    {
      name: "Lead",
      type: "contact",
      color: "yellow",
      description: "Potential clients being nurtured"
    },
    {
      name: "Active Client",
      type: "contact",
      color: "green",
      description: "Currently engaged clients with ongoing projects"
    },
    {
      name: "Past Client",
      type: "contact",
      color: "gray",
      description: "Previous clients for re-engagement campaigns"
    },
    {
      name: "Referral Partner",
      type: "contact",
      color: "blue",
      description: "Contacts who refer new business"
    },
    {
      name: "Needs Follow-Up",
      type: "contact",
      color: "orange",
      description: "Contacts requiring outreach or check-in"
    },
    {
      name: "Cold Contact",
      type: "contact",
      color: "cyan",
      description: "Initial contacts not yet engaged"
    },
    {
      name: "Auto-Saved Lead",
      type: "contact",
      color: "blue",
      description: "Lead auto-saved from booking page before completing checkout"
    },
    {
      name: "Do Not Contact",
      type: "contact",
      color: "red",
      description: "Contacts who have opted out or should not be contacted"
    }
  ],

  // Invoice Tags
  invoice: [
    {
      name: "Paid",
      type: "invoice",
      color: "green",
      description: "Invoices that have been paid in full"
    },
    {
      name: "Overdue",
      type: "invoice",
      color: "red",
      description: "Invoices past their due date"
    },
    {
      name: "Payment Plan",
      type: "invoice",
      color: "blue",
      description: "Invoices on installment payment plans"
    },
    {
      name: "Disputed",
      type: "invoice",
      color: "orange",
      description: "Invoices with client disputes or questions"
    },
    {
      name: "Recurring",
      type: "invoice",
      color: "purple",
      description: "Monthly or periodic recurring invoices"
    },
    {
      name: "Deposit",
      type: "invoice",
      color: "cyan",
      description: "Initial deposit or retainer invoices"
    },
    {
      name: "Final Payment",
      type: "invoice",
      color: "teal",
      description: "Last invoice for completed projects"
    },
    {
      name: "Waived",
      type: "invoice",
      color: "gray",
      description: "Invoices that were forgiven or written off"
    }
  ],

  // Booking Tags
  booking: [
    {
      name: "Confirmed",
      type: "booking",
      color: "green",
      description: "Bookings that are confirmed and scheduled"
    },
    {
      name: "Pending Confirmation",
      type: "booking",
      color: "yellow",
      description: "Bookings awaiting client confirmation"
    },
    {
      name: "Completed",
      type: "booking",
      color: "blue",
      description: "Finished appointments or services"
    },
    {
      name: "Cancelled",
      type: "booking",
      color: "red",
      description: "Cancelled appointments"
    },
    {
      name: "No-Show",
      type: "booking",
      color: "orange",
      description: "Client did not attend scheduled appointment"
    },
    {
      name: "Rescheduled",
      type: "booking",
      color: "purple",
      description: "Appointments that were moved to a new time"
    },
    {
      name: "First Visit",
      type: "booking",
      color: "cyan",
      description: "Initial appointments with new clients"
    },
    {
      name: "Follow-Up",
      type: "booking",
      color: "teal",
      description: "Repeat appointments or check-ins"
    },
    {
      name: "VIP Booking",
      type: "booking",
      color: "violet",
      description: "High-priority client appointments"
    }
  ],

  // General Tags (cross-functional)
  general: [
    {
      name: "Urgent",
      type: "general",
      color: "red",
      description: "Items requiring immediate attention"
    },
    {
      name: "Review Required",
      type: "general",
      color: "yellow",
      description: "Items needing review or approval"
    },
    {
      name: "On Hold",
      type: "general",
      color: "gray",
      description: "Items paused or waiting for external input"
    },
    {
      name: "High Priority",
      type: "general",
      color: "orange",
      description: "Important items to address soon"
    },
    {
      name: "Archive",
      type: "general",
      color: "gray",
      description: "Items to keep for records but no longer active"
    },
    {
      name: "Special Request",
      type: "general",
      color: "purple",
      description: "Custom requests or non-standard items"
    }
  ]
};

/**
 * Get all suggested tags as a flat array
 */
export function getAllSuggestedTags() {
  return Object.values(SUGGESTED_TAGS).flat();
}

/**
 * Get suggested tags by type
 */
export function getSuggestedTagsByType(type) {
  return SUGGESTED_TAGS[type] || [];
}

/**
 * Get color suggestions by tag type
 */
export const TAG_COLOR_RECOMMENDATIONS = {
  contact: {
    vip: "purple",
    lead: "yellow",
    active: "green",
    inactive: "gray",
    new: "cyan",
    priority: "orange",
    warning: "red"
  },
  invoice: {
    paid: "green",
    pending: "yellow",
    overdue: "red",
    recurring: "purple",
    deposit: "cyan",
    partial: "orange"
  },
  booking: {
    confirmed: "green",
    pending: "yellow",
    cancelled: "red",
    completed: "blue",
    rescheduled: "purple",
    firstVisit: "cyan",
    vip: "violet"
  },
  general: {
    urgent: "red",
    important: "orange",
    info: "blue",
    success: "green",
    warning: "yellow",
    neutral: "gray"
  }
};

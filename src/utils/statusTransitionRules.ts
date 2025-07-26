// Status transition rules to maintain data integrity
export type Status = 'Draft' | 'Submitted' | 'Returned' | 'Sent to Bank' | 'Complete' | 'Rejected' | 'Need More Info' | 'Paid';

export interface StatusTransitionRule {
  from: Status;
  to: Status[];
  adminOnly?: boolean;
  requiresDocuments?: boolean;
  requiresComment?: boolean;
}

// Define allowed status transitions to prevent data inconsistencies
export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  // Draft can go to Submitted (by user/admin)
  {
    from: 'Draft',
    to: ['Submitted'],
    requiresDocuments: true
  },
  
  // Submitted can go to multiple states (admin only)
  {
    from: 'Submitted',
    to: ['Returned', 'Sent to Bank', 'Rejected', 'Need More Info'],
    adminOnly: true,
    requiresComment: true
  },
  
  // Returned can go back to Submitted (by user/admin)
  {
    from: 'Returned',
    to: ['Submitted'],
    requiresDocuments: true
  },
  
  // Need More Info can go to Submitted
  {
    from: 'Need More Info',
    to: ['Submitted'],
    requiresDocuments: true
  },
  
  // Sent to Bank can go to Complete (admin only)
  {
    from: 'Sent to Bank',
    to: ['Complete', 'Returned', 'Need More Info'],
    adminOnly: true,
    requiresComment: true
  },
  
  // Complete can only go to Paid (admin only) - prevents reverting to Rejected
  {
    from: 'Complete',
    to: ['Paid'],
    adminOnly: true,
    requiresComment: true
  },
  
  // Paid is final - no transitions allowed
  {
    from: 'Paid',
    to: [],
    adminOnly: true
  },
  
  // Rejected is final - no transitions allowed
  {
    from: 'Rejected',
    to: [],
    adminOnly: true
  }
];

export interface StatusTransitionValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateStatusTransition(
  currentStatus: Status,
  newStatus: Status,
  isAdmin: boolean,
  isUserOwner: boolean,
  hasRequiredDocuments: boolean,
  comment?: string
): StatusTransitionValidation {
  // Find the rule for this transition
  const rule = STATUS_TRANSITION_RULES.find(r => r.from === currentStatus);
  
  if (!rule) {
    return {
      isValid: false,
      error: `No transition rules defined for status: ${currentStatus}`
    };
  }
  
  // Check if the target status is allowed
  if (!rule.to.includes(newStatus)) {
    return {
      isValid: false,
      error: `Cannot change status from ${currentStatus} to ${newStatus}. This transition is not allowed to maintain data integrity.`
    };
  }
  
  // Check admin requirement
  if (rule.adminOnly && !isAdmin) {
    return {
      isValid: false,
      error: `Only administrators can change status from ${currentStatus} to ${newStatus}`
    };
  }
  
  // Check document requirement
  if (rule.requiresDocuments && !hasRequiredDocuments) {
    return {
      isValid: false,
      error: `All mandatory documents must be uploaded before changing status to ${newStatus}`
    };
  }
  
  // Check comment requirement
  if (rule.requiresComment && (!comment || comment.trim().length === 0)) {
    return {
      isValid: false,
      error: `A comment is required when changing status from ${currentStatus} to ${newStatus}`
    };
  }
  
  // Special validations for final states
  const warnings: string[] = [];
  
  if (newStatus === 'Complete' || newStatus === 'Paid') {
    warnings.push('This status change cannot be reversed once applied.');
  }
  
  if (newStatus === 'Rejected') {
    warnings.push('Rejected applications cannot be reopened. Consider using "Need More Info" if the application can still be processed.');
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Get available statuses based on current status and user permissions
export function getAvailableStatusTransitions(
  currentStatus: Status,
  isAdmin: boolean,
  hasRequiredDocuments: boolean
): Status[] {
  const rule = STATUS_TRANSITION_RULES.find(r => r.from === currentStatus);
  
  if (!rule) {
    return [];
  }
  
  return rule.to.filter(status => {
    // Filter out admin-only transitions for non-admins
    if (rule.adminOnly && !isAdmin) {
      return false;
    }
    
    // Filter out transitions that require documents when documents aren't ready
    if (rule.requiresDocuments && !hasRequiredDocuments) {
      return false;
    }
    
    return true;
  });
}

// Check if a status is final (no further transitions allowed)
export function isFinalStatus(status: Status): boolean {
  const rule = STATUS_TRANSITION_RULES.find(r => r.from === status);
  return rule ? rule.to.length === 0 : false;
}

// Get status color for UI display
export function getStatusDisplayInfo(status: Status) {
  const statusInfo = {
    'Draft': { color: 'bg-gray-100 text-gray-800', description: 'Application in progress' },
    'Submitted': { color: 'bg-blue-100 text-blue-800', description: 'Awaiting admin review' },
    'Returned': { color: 'bg-yellow-100 text-yellow-800', description: 'Requires user attention' },
    'Sent to Bank': { color: 'bg-purple-100 text-purple-800', description: 'Processing with bank' },
    'Complete': { color: 'bg-green-100 text-green-800', description: 'Application completed' },
    'Rejected': { color: 'bg-red-100 text-red-800', description: 'Application declined' },
    'Need More Info': { color: 'bg-orange-100 text-orange-800', description: 'Additional information required' },
    'Paid': { color: 'bg-emerald-100 text-emerald-800', description: 'Payment received' }
  };
  
  return statusInfo[status] || { color: 'bg-gray-100 text-gray-800', description: 'Unknown status' };
}
import { ApplicationStatus } from '@/types/application';

export interface ApplicationStatusTransition {
  from: ApplicationStatus;
  to: ApplicationStatus[];
  requiresAdmin: boolean;
  requiresComment?: boolean;
  requiresDocuments?: boolean;
}

export const APPLICATION_STATUS_TRANSITIONS: ApplicationStatusTransition[] = [
  {
    from: 'draft',
    to: ['submitted'],
    requiresAdmin: false,
    requiresDocuments: true,
  },
  {
    from: 'draft',
    to: ['rejected'],
    requiresAdmin: false,
    requiresDocuments: false,
  },
  {
    from: 'submitted',
    to: ['returned', 'paid', 'rejected'],
    requiresAdmin: true,
  },
  {
    from: 'returned',
    to: ['submitted'],
    requiresAdmin: false,
  },
  {
    from: 'paid',
    to: [],
    requiresAdmin: true,
  },
  {
    from: 'rejected',
    to: [],
    requiresAdmin: true,
  },
];

export const getAvailableApplicationTransitions = (
  currentStatus: ApplicationStatus,
  isAdmin: boolean,
  isUserOwner: boolean,
  hasRequiredDocuments: boolean = false
): ApplicationStatus[] => {
  const transitions = APPLICATION_STATUS_TRANSITIONS.filter(t => t.from === currentStatus);
  
  if (transitions.length === 0) return [];
  
  const availableStatuses: ApplicationStatus[] = [];
  
  for (const transition of transitions) {
    // Check admin requirement
    if (transition.requiresAdmin && !isAdmin) {
      continue;
    }
    
    // Check ownership
    if (!isAdmin && !isUserOwner) {
      continue;
    }
    
    // Check documents requirement
    if (transition.requiresDocuments && !hasRequiredDocuments) {
      continue;
    }
    
    // Add all valid target statuses from this transition
    availableStatuses.push(...transition.to);
  }
  
  return [...new Set(availableStatuses)]; // Remove duplicates
};

export const validateApplicationStatusTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
  isAdmin: boolean,
  isUserOwner: boolean,
  hasRequiredDocuments: boolean = false,
  comment?: string
): { isValid: boolean; error?: string } => {
  // Find all transitions from the source status
  const transitions = APPLICATION_STATUS_TRANSITIONS.filter(t => t.from === from);
  
  if (transitions.length === 0) {
    return { isValid: false, error: 'Invalid current status' };
  }
  
  // Find the specific transition that includes the target status
  const matchingTransition = transitions.find(t => t.to.includes(to));
  
  if (!matchingTransition) {
    return { isValid: false, error: `Cannot transition from ${from} to ${to}` };
  }
  
  if (matchingTransition.requiresAdmin && !isAdmin) {
    return { isValid: false, error: 'Admin access required for this transition' };
  }
  
  if (!isAdmin && !isUserOwner) {
    return { isValid: false, error: 'You can only modify your own applications' };
  }
  
  if (matchingTransition.requiresDocuments && !hasRequiredDocuments) {
    return { isValid: false, error: 'All mandatory documents must be uploaded' };
  }
  
  if (matchingTransition.requiresComment && (!comment || comment.trim().length === 0)) {
    return { isValid: false, error: 'Comment is required for this status change' };
  }
  
  return { isValid: true };
};

export const getApplicationStatusColor = (status: ApplicationStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'returned': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    // Legacy statuses
    case 'under_review': return 'bg-purple-100 text-purple-800';
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'completed': return 'bg-teal-100 text-teal-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getApplicationStatusDescription = (status: ApplicationStatus): string => {
  switch (status) {
    case 'draft': return 'Application is being prepared';
    case 'submitted': return 'Application submitted for review';
    case 'returned': return 'Application returned for corrections';
    case 'paid': return 'Application completed and paid';
    case 'rejected': return 'Application rejected';
    // Legacy statuses
    case 'under_review': return 'Application under review (legacy)';
    case 'approved': return 'Application approved (legacy)';
    case 'completed': return 'Application completed (legacy)';
    default: return 'Unknown status';
  }
};

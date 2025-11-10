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
  const transition = APPLICATION_STATUS_TRANSITIONS.find(t => t.from === currentStatus);
  
  if (!transition) return [];
  
  if (transition.requiresAdmin && !isAdmin) {
    return [];
  }
  
  if (!isAdmin && !isUserOwner) {
    return [];
  }
  
  if (transition.requiresDocuments && !hasRequiredDocuments) {
    return [];
  }
  
  return transition.to;
};

export const validateApplicationStatusTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
  isAdmin: boolean,
  isUserOwner: boolean,
  hasRequiredDocuments: boolean = false,
  comment?: string
): { isValid: boolean; error?: string } => {
  const transition = APPLICATION_STATUS_TRANSITIONS.find(t => t.from === from);
  
  if (!transition) {
    return { isValid: false, error: 'Invalid current status' };
  }
  
  if (!transition.to.includes(to)) {
    return { isValid: false, error: `Cannot transition from ${from} to ${to}` };
  }
  
  if (transition.requiresAdmin && !isAdmin) {
    return { isValid: false, error: 'Admin access required for this transition' };
  }
  
  if (!isAdmin && !isUserOwner) {
    return { isValid: false, error: 'You can only modify your own applications' };
  }
  
  if (transition.requiresDocuments && !hasRequiredDocuments) {
    return { isValid: false, error: 'All mandatory documents must be uploaded' };
  }
  
  if (transition.requiresComment && (!comment || comment.trim().length === 0)) {
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

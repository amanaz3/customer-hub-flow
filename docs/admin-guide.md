
# Admin User Guide

## Overview
As an administrator, you have full access to the Customer Management System including user management, customer oversight, and system administration features.

## Getting Started

### First Login
1. Navigate to the login page
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### Admin Dashboard
The dashboard provides:
- **System Overview**: Total customers, users, and recent activity
- **Quick Actions**: Create customers, manage users, view reports
- **Recent Activity**: Latest customer status changes and system events

## Core Features

### Customer Management

#### Viewing All Customers
- Access **Customers** from the sidebar
- View all customers across all users
- Filter by status, license type, or assigned user
- Search by name, email, or company

#### Customer Status Management
You can change any customer's status:
1. Open customer details
2. Click **Change Status** button
3. Select new status from dropdown
4. Add optional comment explaining the change
5. Confirm the change

**Available Status Transitions:**
- Draft → Submitted, Rejected
- Submitted → Returned, Sent to Bank, Need More Info, Rejected
- Returned → Submitted, Rejected
- Sent to Bank → Complete, Returned, Need More Info
- Need More Info → Submitted, Rejected
- Complete → (Final status)
- Rejected → (Final status)

#### Document Management
- View all uploaded documents
- Download customer files
- Track document completion status
- Verify mandatory document requirements

### User Management

#### Viewing Users
- Navigate to **User Management** in sidebar
- View all registered users
- See user roles, registration dates, and activity

#### Managing User Roles
1. Click on a user in the user management table
2. Use the role dropdown to change between 'admin' and 'user'
3. Changes take effect immediately

#### User Account Actions
- **Reset Password**: Generate temporary passwords for users
- **Delete Account**: Remove users from the system (use with caution)

### System Administration

#### Security Overview
- Access **Security** from sidebar
- Monitor system security metrics
- View user access patterns
- Review audit logs

#### Settings Management
- Configure system-wide settings
- Manage notification preferences
- Update system parameters

## Workflow Examples

### Processing a New Customer Application
1. Customer appears in "Draft" status
2. Review all submitted information
3. Check document completeness
4. Change status to "Submitted" when ready
5. Process through workflow: Submitted → Sent to Bank → Complete
6. Add comments at each stage for transparency

### Handling Incomplete Applications
1. Identify missing information or documents
2. Change status to "Need More Info"
3. Add detailed comment explaining requirements
4. Customer will be notified of the changes needed
5. Once updated, move back to "Submitted"

### Managing Document Issues
1. Review uploaded documents in customer detail
2. If documents are insufficient, use "Returned" status
3. Specify exactly what needs to be corrected
4. Track resubmissions and verify improvements

## Best Practices

### Status Management
- Always add meaningful comments when changing status
- Use "Need More Info" for specific requirements
- Use "Returned" for document or form issues
- Reserve "Rejected" for applications that cannot proceed

### Communication
- Provide clear, specific feedback in status comments
- Use professional language in all communications
- Document important decisions in the status history

### Security
- Regularly review user access and roles
- Monitor the security dashboard for anomalies
- Keep user accounts up to date

## Quick Reference

### Keyboard Shortcuts
- `Ctrl + /` - Search customers
- `Ctrl + N` - New customer (if permitted)
- `Esc` - Close modals/dialogs

### Status Color Coding
- 🔵 **Draft** - New applications
- 🟡 **Submitted** - Ready for review
- 🔴 **Returned** - Needs corrections
- 🟢 **Sent to Bank** - In processing
- ✅ **Complete** - Finished
- ❌ **Rejected** - Declined
- 🟠 **Need More Info** - Awaiting details
- 💰 **Paid** - Payment received

## Support
For technical issues or questions about admin features, contact the system administrator or refer to the full developer documentation.

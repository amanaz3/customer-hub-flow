# CRM & Workflow System: Admin User Guide

## Overview

Welcome to the CRM & Workflow System. As an Administrator, you have complete access to all features, enabling you to manage the entire client lifecycle, oversee team performance, and configure the system to meet your firm's specific needs. This guide details your administrative capabilities, from managing incoming applications to automating workflows and analyzing performance.

---

## 1. Getting Started: Login & Access

Secure access to the platform is the first step. The system uses Supabase authentication to ensure your data is protected.

### Logging In
1. Navigate to your firm's unique login URL
2. Enter your registered email and password
3. Click the "Login" button

### Password Reset
If you've forgotten your password:
1. Contact an Administrator who can send a password reset link to your email
2. Follow the link to set a new password

### User Signup
User accounts are managed on an invite-only basis to maintain security. New users must be invited by an Administrator via the **User Management** page.

---

## 2. Dashboard: Your Command Center

The Dashboard provides a high-level, real-time snapshot of your firm's performance and daily activity, target tracking, and application forecasting.

### Key Performance Indicator (KPI) Cards
These cards at the top of the page give you an immediate understanding of core business metrics:
- **Total Applications:** The total number of applications currently in your pipeline
- **Active Clients:** The number of clients with ongoing projects or engagements
- **Completed Deals:** A count of all finalized engagements
- **Conversion Rate / Revenue:** Key metrics showing the percentage of applications that become clients and total revenue generated

### Charts and Widgets
Visualize your performance with dynamic charts:
- **Applications by Month:** Track the volume of new applications over time to identify trends
- **Conversion Trends:** See how your conversion rate changes month-to-month
- **Target Progress:** Monitor individual and team progress toward monthly targets

### Recent Activities
This feed shows the latest system events, helping you stay up-to-date with:
- New application submissions
- Key follow-ups made by the team
- Recently completed deals
- Status changes and updates

### Quick Actions
Perform common tasks directly from the Dashboard:
- **Add New Application:** Quickly create a new application record
- **View Analytics:** Access detailed performance reports
- **Manage Team:** Quick access to user management

---

## 3. Managing the Pipeline: The Applications Page

This page is the central hub for managing all incoming leads and prospective clients, from initial contact to closing the deal. Applications are displayed in a **Table** view with powerful filtering and search capabilities.

### Application Fields
Each application record contains the following key information:
- **Applicant Name:** The primary contact person
- **Company Name:** The name of the prospective client's organization
- **Contact Info:** Email and phone number
- **Lead Source:** Where the lead came from (Website, Referral, Social Media, Other)
- **Status:** The current position of the application in your sales pipeline
- **License Type:** Type of license required (Mainland, Freezone, Offshore)
- **Assigned User:** The team member responsible for this application
- **Amount:** Deal value
- **Notes:** A text area for logging interactions, next steps, and other relevant details

### Managing Application Stages

You can seamlessly move applications through your pipeline by updating their status. Always add a comment to document why the status was changed.

**Available Statuses:**
- 🔵 **Draft** - A new application that has not yet been actioned
- 🟡 **Submitted** - Case submitted to Manager for review
- 🔴 **Returned** - Returned for more information or corrections
- 🟣 **Ready for Bank** - Application is prepared and ready for bank submission
- 🟢 **Sent to Bank** - Application has been submitted to the bank
- 🟠 **Need More Info** - Additional information required from client
- ✅ **Complete** - The application has been successfully completed
- 💰 **Paid** - Payment has been received
- ❌ **Rejected** - The application will not be moving forward

**Status Transition Rules:**
- Draft → Submitted, Rejected
- Submitted → Returned, Ready for Bank, Sent to Bank, Need More Info, Rejected
- Returned → Submitted, Rejected
- Ready for Bank → Sent to Bank, Need More Info
- Sent to Bank → Complete, Returned, Need More Info
- Need More Info → Submitted, Rejected
- Complete → Paid
- Paid and Rejected are final statuses

**To change an application's status:**
1. Open the application record you wish to update
2. Click the "Change Status" button
3. Select the new status from the dropdown menu
4. Add a relevant entry in the **Comment** field to provide context for the change
5. Click "Confirm" to save the change

### Document Management
Each application includes a comprehensive document checklist:
- View required documents based on license type
- Upload documents directly to the application
- Track document completion status
- Mark documents as uploaded/verified
- Download documents for review

### Key Actions
- **Add / Edit / Delete Application:** Create new records, update existing information, or remove irrelevant entries
- **Assign User:** Assign or re-assign an application to a specific team member
- **Filter & Search:** Use powerful filtering options to view applications by Status, Lead Source, Assigned User, License Type, or Date Range
- **Bulk Actions:** Select multiple applications for bulk reassignment or status updates
- **Export Data:** Export filtered application data for reporting

---

## 4. Customer (Company) Management

The Customers page manages company records - the organizations you work with. Each customer can have multiple applications (deals) associated with them.

### Customer List View
The main view is a comprehensive list of all customers (companies), which can be filtered by:
- Status
- License Type
- Assigned User
- Lead Source
- Date Range

### Customer Fields
Each customer record includes:
- **Company Name:** The official name of the client's company
- **Contact Person:** The primary point of contact (name, email, mobile)
- **License Type:** The type of license they're applying for
- **Lead Source:** How they found your firm
- **Jurisdiction:** Where they want to establish their business
- **Preferred Banks:** Their banking preferences (up to 3 banks or "any suitable bank")
- **Annual Turnover:** Expected annual revenue
- **Customer Notes:** Important information about the client
- **Product/Service:** The specific service they're interested in
- **Status:** Current status of their primary application
- **Amount:** Deal value
- **Assigned User:** The team member managing this customer

### Key Actions
- **Add / Edit / Delete Customer:** Manage customer (company) records
- **View Customer Details:** Access complete customer history, documents, comments, and status changes
- **Create New Application:** Start a new deal for an existing customer
- **Document Upload:** Manage all customer documentation
- **Status History:** View complete audit trail of all status changes
- **Add Comments:** Log interactions and notes

---

## 5. Completed Applications

This page provides a clear, searchable record of all finalized applications. It is essential for financial tracking, performance review, and historical reference.

### Viewing Completed Applications
- Filter by date range, user, or payment status
- See all applications with "Complete" or "Paid" status
- Track completion dates and payment dates
- View associated revenue

### Managing Completion Dates
Administrators can adjust the completion date of an application:
1. Navigate to the application detail page
2. Click "Edit Application"
3. Update the completion timestamp
4. Save changes

### Key Metrics
- Total completed applications
- Total revenue from completed deals
- Average deal size
- Completion rate by user
- Time to completion

---

## 6. Team & User Management

As an Administrator, you control who has access to the system and what they can see or do.

### Team List
The User Management page displays all internal users with the following details:
- Name
- Email
- Role
- Active/Inactive status
- Date created
- Last activity

### User Roles & Permissions

The system includes three distinct roles to ensure proper data security and access control:

**Admin**
- Full, unrestricted access to the entire system
- Can manage all users, applications, and customers
- Can view and modify all data regardless of assignment
- Can access security settings and audit logs
- Can manage system configuration and integrations

**Manager**
- Can view all applications and customers
- Can manage their own assigned applications
- Can view team performance data
- Limited system configuration access

**User**
- Can only view and manage applications and customers assigned to them
- Cannot access other users' data
- Cannot modify system settings
- Read-only access to team dashboards

### Key Actions
- **Invite New User:** Add a new team member by creating their account. They will receive a temporary password
- **Assign Applications/Customers:** Distribute workload by assigning records to different team members
- **Adjust Permissions:** Change a user's role at any time
- **Reset Password:** Generate a temporary password for a user who is locked out
- **Deactivate/Delete User:** Remove a user's access to the system (use with caution - this action cannot be undone)

### Security Features
- Mandatory password changes on first login
- Temporary password expiration
- Secure password reset process
- Activity audit logging
- Session management

---

## 7. CRM Integration

The system includes powerful CRM integration capabilities to connect with external systems and synchronize data.

### CRM Dashboard
Access the CRM Integration page to:
- View connected CRM systems
- Monitor sync status and history
- Manage API keys and webhooks
- Configure field mappings
- View sync logs and error reports

### Connecting a CRM
1. Navigate to CRM Integration
2. Click "Connect New CRM"
3. Select CRM type (custom or standard integration)
4. Enter API endpoint and authentication details
5. Configure field mappings between your system and the CRM
6. Set sync preferences (frequency, entities to sync)
7. Test the connection
8. Activate the integration

### Managing Syncs
- View sync history with detailed logs
- Manually trigger syncs for specific entity types
- Monitor success/failure rates
- Review and resolve sync errors
- Track when data was last synchronized

### API Key Management
- Create and manage API keys for external access
- Set permissions for each key
- Monitor key usage
- Set expiration dates
- Deactivate or delete keys as needed

---

## 8. Project & Task Management

The system includes internal project and task tracking capabilities for team collaboration.

### Projects
- Create projects to organize work
- Assign project owners
- Track project status (Planning, In Progress, On Hold, Completed, Cancelled)
- Set start and end dates
- Add project descriptions and notes

### Tasks
- Create tasks within projects or standalone
- Assign tasks to team members
- Set due dates and priorities
- Track task types (Bug, Feature, Enhancement, Task, System Issue, Prototype, Alpha, Beta, MVP, Release, Deployment)
- Mark tasks as complete
- Add comments and updates to tasks

### Task Collaboration
- Add comments to tasks for team communication
- Tag team members in comments
- Track task history and changes
- Receive notifications on task updates

---

## 9. Reports & Analytics

Gain deep insights into your business performance with comprehensive analytics.

### Dashboard Analytics
- Real-time KPI tracking
- Monthly performance trends
- Conversion funnel analysis
- Revenue forecasting
- Team leaderboards

### Target Management
Set and track monthly targets for:
- Number of applications
- Completed applications
- Revenue targets
- Conversion rates

Monitor progress with:
- Individual target tracking
- Team aggregate performance
- Monthly comparisons
- Forecast projections

### Performance Reports
- Applications by stage/status
- Completed applications by month
- Revenue by user/team
- Conversion rates
- Average deal size
- Time to completion
- Lead source effectiveness

### Exporting Data
- Export customer and application data to CSV
- Generate custom date-range reports
- Download filtered datasets
- Create presentation-ready charts

---

## 10. System Configuration: The Settings Page

Customize the platform to fit your company's needs.

### Notification Settings
- Configure email notifications for status changes
- Set notification preferences by event type
- Manage which roles receive which notifications
- Enable/disable email notifications globally

### Product & Service Management
- Create and manage product offerings
- Define service categories
- Set up service bundles
- Configure pricing and recurring billing options
- Manage ARR (Annual Recurring Revenue) tracking

### Bank Management
- Add and manage banking partners
- Set processing times for each bank
- Mark banks as active/inactive
- Track bank preferences by application

### Document Templates
- Configure required documents by license type
- Set mandatory vs. optional documents
- Organize documents by category
- Define document checklists

---

## 11. Security & Audit

### Security Audit Log
- View all security-related events
- Track user logins and authentication attempts
- Monitor permission changes
- Review data access patterns
- Investigate security incidents

### Compliance Features
- Row-level security on all data
- Role-based access control
- Encrypted sensitive data
- Audit trails for all changes
- Secure file storage with access controls

### Best Practices
- Regularly review security audit logs
- Monitor failed login attempts
- Keep user permissions up to date
- Remove access for departed employees promptly
- Use strong passwords and enforce password changes

---

## 12. Best Practices

### Pipeline Management
- **Keep Statuses Updated:** Ensure application statuses accurately reflect the current reality
- **Use Comments Extensively:** Document every interaction, decision, and next step in the comments. This creates a transparent and complete history for each record
- **Follow Status Workflows:** Respect the status transition rules to maintain data integrity
- **Track Completion Dates:** Accurately record when applications are completed for proper reporting

### Team Management
- **Principle of Least Privilege:** Assign roles based on what a user truly needs. Avoid giving Admin access unless absolutely necessary
- **Regularly Review Access:** Periodically check the user list to ensure roles are appropriate and to deactivate accounts for former employees
- **Clear Assignments:** Ensure every application and customer has a clear owner
- **Use Bulk Actions:** Save time by using bulk reassignment features when restructuring teams

### Data Quality
- **Complete Customer Information:** Ensure all required fields are populated
- **Verify Documents:** Check that all mandatory documents are uploaded and complete
- **Regular Data Cleanup:** Archive or remove duplicate/test records
- **Consistent Naming:** Use consistent naming conventions for companies and contacts

### Performance Tracking
- **Set Realistic Targets:** Work with your team to set achievable monthly targets
- **Review Analytics Weekly:** Use the dashboard to identify trends and issues early
- **Track Conversion Rates:** Monitor which lead sources convert best
- **Analyze Bottlenecks:** Identify which statuses applications get stuck in

---

## 13. Keyboard Shortcuts

- `Ctrl + /` or `Cmd + /` - Search customers/applications
- `Ctrl + N` or `Cmd + N` - New customer/application (context-dependent)
- `Esc` - Close modals/dialogs
- `Ctrl + S` or `Cmd + S` - Save changes (where applicable)

---

## 14. Status Color Coding Reference

| Status | Color | Meaning |
|--------|-------|---------|
| 🔵 Draft | Blue | New application not yet submitted |
| 🟡 Submitted | Yellow | Submitted for manager review |
| 🔴 Returned | Red | Needs corrections or more info |
| 🟣 Ready for Bank | Purple | Prepared for bank submission |
| 🟢 Sent to Bank | Green | Submitted to banking partner |
| 🟠 Need More Info | Orange | Awaiting additional details |
| ✅ Complete | Check | Successfully completed |
| 💰 Paid | Dark Green | Payment received |
| ❌ Rejected | Red X | Application declined |

---

## 15. Common Workflows

### Workflow 1: Processing a New Application
1. New application appears in "Draft" status
2. Review all submitted information and documents
3. Check document completeness using the checklist
4. If information is missing → "Need More Info"
5. If complete → "Submitted" (add comment)
6. Manager reviews → "Ready for Bank"
7. Submit to banking partner → "Sent to Bank"
8. Upon approval → "Complete"
9. After payment → "Paid"

### Workflow 2: Handling Incomplete Applications
1. Identify missing information or documents
2. Change status to "Need More Info" or "Returned"
3. Add detailed comment explaining requirements
4. System sends notification to assigned user
5. Client provides additional information
6. Update documents/information
7. Move back to "Submitted" for review

### Workflow 3: Managing Team Reassignments
1. Navigate to Applications page
2. Use filters to identify applications to reassign
3. Select multiple applications using checkboxes
4. Click "Bulk Actions" → "Reassign"
5. Select new user from dropdown
6. Add comment explaining reassignment reason
7. Confirm bulk action

### Workflow 4: Monthly Target Review
1. Navigate to Dashboard at start of month
2. Review previous month's performance
3. Go to Target Management
4. Set new targets for each team member
5. Communicate targets to team
6. Monitor progress throughout month
7. Adjust strategies based on mid-month performance

---

## 16. Troubleshooting

### Can't See Certain Applications
- **Issue:** You can only see your assigned applications
- **Solution:** You may have "User" role. Contact admin for permission change or to view specific applications

### Status Change Not Allowed
- **Issue:** The system won't let you change to a certain status
- **Solution:** Status transitions follow business rules. Check the allowed transitions in Section 3

### Document Upload Fails
- **Issue:** Document won't upload
- **Solution:** Check file size (max 10MB) and format. Ensure stable internet connection

### Sync Errors in CRM Integration
- **Issue:** CRM sync failing
- **Solution:** Check API credentials, review sync logs for specific errors, verify field mappings

### Can't Find a Customer
- **Issue:** Search not returning results
- **Solution:** Try broader search terms, check filters, verify spelling, ensure you have permission to view

---

## 17. Support & Further Resources

For technical issues, questions about advanced features, or to request new integrations:

- **System Administrator:** Contact your designated system administrator
- **Technical Documentation:** Refer to `/docs/database-schema.md` for database structure
- **User Guide:** See `/docs/user-guide.md` for standard user documentation
- **Security Documentation:** Review security policies and procedures in system settings

---

## Appendix: API Integration for Advanced Users

### Available API Endpoints
The system exposes secure API endpoints for:
- CRM data synchronization
- Partner integrations
- Custom reporting
- Webhook integrations

### API Key Management
1. Generate API keys from CRM Integration page
2. Set appropriate permissions per key
3. Use keys in Authorization header: `Authorization: Bearer <api_key>`
4. Monitor key usage in API Key Manager
5. Rotate keys regularly for security

### Webhook Configuration
Set up webhooks to receive real-time notifications:
- Application status changes
- New customer creation
- Payment receipts
- Document uploads

Webhooks deliver JSON payloads to your specified endpoint with event details.

---

**Document Version:** 2.0  
**Last Updated:** November 2025  
**System:** CRM & Workflow Management Platform

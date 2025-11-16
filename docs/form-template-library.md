# Form Template Library & Version History

The Service Form Configuration system includes two powerful features for managing form configurations:

## 1. Form Template Library

Save and reuse form configurations as named templates across different services or products.

### Features

- **Save as Template**: Save any configuration as a reusable template
- **Template Naming**: Use descriptive names like "Basic Onboarding v1" or "Full KYC Pack"
- **Template Descriptions**: Add detailed descriptions to help identify template purposes
- **Product-Based**: Templates are linked to specific products/services
- **Load Anytime**: Quickly load saved templates into any service configuration

### How to Use

#### Saving a Template

1. Configure your form fields and documents as needed
2. Click **"Save as Template"** button
3. Enter a descriptive name (e.g., "Company Formation - Standard Package v1")
4. Add an optional description explaining the template's use case
5. Click **"Save Template"**

**Template Naming Best Practices:**
- Use the service/product name as prefix
- Include version number (v1, v2, etc.)
- Be descriptive: "Bookkeeping Onboarding - Basic" vs "Form 1"
- Example: "VAT Registration - Full KYC Pack v2.0"

#### Loading a Template

1. Click **"Load Template"** button
2. Browse available templates
3. Click on a template to load it
4. The current configuration will be replaced with the template
5. Make any necessary adjustments
6. Save the configuration

**Note**: Loading a template will replace your current unsaved configuration. Make sure to save any important changes first.

### Database Structure

Templates are stored in the `form_templates` table with:
- Template name and description
- Associated product/service ID
- Full form configuration (JSON)
- Creator information
- Creation and update timestamps
- Active/inactive status

## 2. Version History

Automatic versioning system that tracks every change to form configurations.

### Features

- **Automatic Versioning**: Every save creates a new version entry
- **Version Numbers**: Sequential numbering per product (v1, v2, v3...)
- **Change Tracking**: Records who made changes and when
- **Change Notes**: Optional notes describing what changed
- **Version Restoration**: Restore any previous version instantly
- **Complete Audit Trail**: Full history of configuration changes

### How to Use

#### Viewing Version History

1. Select a product/service
2. Click **"Version History"** button
3. View all previous versions with:
   - Version number
   - Date and time of change
   - User who made the change
   - Change notes (if provided)

#### Adding Version Notes

Before saving:
1. Scroll to the **Version Notes** section (appears when a product is selected)
2. Enter a description of your changes (optional but recommended)
3. Examples:
   - "Added conditional email/phone fields"
   - "Updated document requirements for new license type"
   - "Reorganized sections for better flow"
4. Click **"Save Configuration"**

The version note will be saved with the new version automatically.

#### Restoring Previous Versions

1. Open **Version History**
2. Find the version you want to restore
3. Click **"Restore"** button on that version
4. The configuration is loaded (but not saved yet)
5. Review the restored configuration
6. Click **"Save Configuration"** to apply the restored version

### Database Structure

Versions are stored in the `form_configuration_versions` table with:
- Product/service ID
- Sequential version number
- Complete configuration snapshot (JSON)
- User who made the change
- Optional change notes
- Timestamp

### Version Numbering

Version numbers are automatically assigned per product:
- First save for a product: Version 1
- Second save: Version 2
- And so on...

Each product has its own independent version sequence.

## Combined Workflow

### Example: Creating a Reusable Template

1. **Configure**: Set up a form configuration for "Company Formation"
2. **Add Notes**: "Initial setup with basic fields and KYC documents"
3. **Save**: Creates Version 1
4. **Save as Template**: "Company Formation - Basic v1.0"
5. **Refine**: Make improvements to the configuration
6. **Add Notes**: "Added conditional business type fields"
7. **Save**: Creates Version 2
8. **Save as Template**: "Company Formation - Enhanced v2.0"

### Example: Using Templates Across Services

1. **Load Template**: Load "Company Formation - Basic v1.0"
2. **Customize**: Adjust for specific service variant
3. **Add Notes**: "Customized for Freezone setup"
4. **Save**: Creates Version 1 for this new service
5. **Track Changes**: All future changes are versioned

## Benefits

### For Administrators
- **Standardization**: Ensure consistent forms across services
- **Quality Control**: Review changes before they go live
- **Quick Setup**: Deploy new services faster using templates
- **Error Recovery**: Roll back problematic changes instantly

### For Teams
- **Collaboration**: See who made what changes and why
- **Knowledge Transfer**: New team members can review evolution of forms
- **Documentation**: Change notes provide context for decisions
- **Experimentation**: Try changes knowing you can restore previous versions

### For Compliance
- **Audit Trail**: Complete history of all configuration changes
- **Accountability**: Track who made each change
- **Versioning**: Clear version numbers for documentation
- **Restoration**: Prove ability to restore to specific points in time

## Best Practices

### Template Management
1. Use clear, descriptive names
2. Version your templates (v1.0, v2.0)
3. Keep templates updated and archived when obsolete
4. Document template purpose in description

### Version Control
1. Always add meaningful change notes
2. Test thoroughly before saving new versions
3. Review version history before making major changes
4. Keep team informed about significant updates

### Workflow
1. **Before**: Check version history to see recent changes
2. **During**: Document what you're changing in notes
3. **After**: Verify the new version works as expected
4. **Regular**: Create templates for stable, tested configurations

## Troubleshooting

### Template Not Loading
- Ensure you have permissions to access templates
- Check that the template is marked as active
- Verify the template isn't corrupted

### Version Not Saving
- Confirm you're logged in
- Check database connection
- Ensure you have admin permissions

### Can't See Version History
- Verify a product is selected
- Check that versions exist for that product
- Ensure database access permissions

### Lost Changes
- Check version history - your changes might be saved
- Use "Restore" to recover previous versions
- Always add change notes to find versions easier

## Security

- **Access Control**: Only admins can save templates and configurations
- **Audit Logging**: All changes are tracked with user information
- **Data Integrity**: Versions are immutable once created
- **Permissions**: RLS policies protect template and version data

## Future Enhancements

Planned features:
- Template sharing between products
- Version comparison (diff view)
- Bulk template operations
- Template categories and tagging
- Export/import templates between systems
- Version branching and merging

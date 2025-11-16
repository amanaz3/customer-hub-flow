# Form Configuration Import/Export

This feature allows you to import and export service form configurations as JSON files, making it easy to:
- Backup and restore form configurations
- Share configurations between different environments
- Bulk configure multiple services
- Version control your form structures

## Features

### 1. Export Configuration
Export the current form configuration to a JSON file:
- Click "Export JSON" button in the Service Form Configuration page
- The file will be downloaded with the format: `{service-name}-config-{timestamp}.json`
- The JSON includes all sections, fields, stages, and document requirements

### 2. Import Configuration
Import a previously exported or manually created JSON configuration:
- Click "Import JSON" button
- Select a valid JSON file
- The system will validate the structure before importing
- Any validation errors or warnings will be displayed

### 3. Download Sample Template
Get a sample JSON template to understand the structure:
- Click "Download Sample" button
- Review the sample to understand the expected format
- Use it as a starting point for creating custom configurations

## JSON Structure

### Top Level
```json
{
  "sections": [...],
  "requiredDocuments": {
    "categories": [...]
  }
}
```

### Section Structure
```json
{
  "id": "section-1",
  "sectionTitle": "Basic Information",
  "fields": [...]
}
```

### Field Structure
```json
{
  "id": "field-1",
  "fieldType": "text|email|tel|number|textarea|select|date|checkbox|radio",
  "label": "Field Label",
  "placeholder": "Optional placeholder text",
  "required": true,
  "requiredAtStage": ["draft", "submitted", "review", "approval", "completed"],
  "conditionalGroup": "optional-group-id",
  "options": ["Option 1", "Option 2"],
  "helperText": "Optional helper text"
}
```

### Field Types
- `text`: Single-line text input
- `email`: Email address input with validation
- `tel`: Phone number input
- `number`: Numeric input
- `textarea`: Multi-line text input
- `select`: Dropdown selection
- `date`: Date picker
- `checkbox`: Single checkbox
- `radio`: Radio button group

### Stage-Based Requirements
Fields can be required at specific stages:
- `draft`: Required when creating initial draft
- `submitted`: Required when submitting to admin
- `review`: Required during review process
- `approval`: Required for approval
- `completed`: Required before marking as complete

**Example:**
```json
{
  "id": "email-field",
  "fieldType": "email",
  "label": "Email Address",
  "required": true,
  "requiredAtStage": ["draft", "submitted"]
}
```

### Conditional Groups
Use conditional groups when "at least one field" from a group must be filled:

```json
{
  "id": "email-field",
  "label": "Email",
  "conditionalGroup": "contact-info",
  "requiredAtStage": ["submitted"]
},
{
  "id": "phone-field",
  "label": "Phone",
  "conditionalGroup": "contact-info",
  "requiredAtStage": ["submitted"]
}
```
In this example, either email OR phone must be filled at the "submitted" stage.

### Document Category Structure
```json
{
  "id": "category-1",
  "name": "Identity Documents",
  "description": "Required identification documents",
  "documents": [...]
}
```

### Document Structure
```json
{
  "id": "doc-1",
  "name": "Passport Copy",
  "description": "Clear copy of passport bio page",
  "isMandatory": true,
  "acceptedFileTypes": [".pdf", ".jpg", ".png"]
}
```

### Accepted File Types
Common file types for documents:
- `.pdf` - PDF documents
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.doc`, `.docx` - Word documents
- `.xls`, `.xlsx` - Excel spreadsheets
- `.txt` - Text files

## Validation

The import process validates:

### Required Checks (Errors)
- Valid JSON structure
- All required fields present
- Valid field types
- Unique IDs for sections, fields, categories, and documents
- Select/Radio fields have options
- Documents have at least one accepted file type

### Optional Checks (Warnings)
- Empty sections
- Uncommon file types
- Missing helper text for complex fields

## Best Practices

1. **Use Descriptive IDs**: Use meaningful IDs like `basic-info-section` instead of `section-1`
2. **Add Helper Text**: Provide clear instructions for fields
3. **Stage Planning**: Carefully plan which fields are required at each stage
4. **Backup Regularly**: Export configurations before making major changes
5. **Test Imports**: Always test imported configurations with sample data
6. **Version Control**: Keep JSON files in version control for tracking changes
7. **Document Custom Logic**: Add comments in a separate doc file for complex validation rules

## Common Issues

### Import Fails
- Ensure JSON is properly formatted (use a JSON validator)
- Check for duplicate IDs
- Verify all required fields are present

### Validation Warnings
- Review warnings but they won't prevent import
- Address warnings for better user experience

### Stage Requirements Not Working
- Ensure stage names are exactly: `draft`, `submitted`, `review`, `approval`, `completed`
- Check that `requiredAtStage` is an array

## Example: Complete Configuration

```json
{
  "sections": [
    {
      "id": "basic-info",
      "sectionTitle": "Basic Information",
      "fields": [
        {
          "id": "full-name",
          "fieldType": "text",
          "label": "Full Name",
          "placeholder": "Enter your full legal name",
          "required": true,
          "requiredAtStage": ["draft", "submitted"],
          "helperText": "Name as it appears on official documents"
        },
        {
          "id": "email",
          "fieldType": "email",
          "label": "Email Address",
          "placeholder": "your.email@example.com",
          "required": true,
          "requiredAtStage": ["draft"],
          "conditionalGroup": "contact"
        },
        {
          "id": "phone",
          "fieldType": "tel",
          "label": "Phone Number",
          "placeholder": "+971 XX XXX XXXX",
          "required": false,
          "requiredAtStage": ["submitted"],
          "conditionalGroup": "contact"
        }
      ]
    },
    {
      "id": "business-details",
      "sectionTitle": "Business Details",
      "fields": [
        {
          "id": "business-type",
          "fieldType": "select",
          "label": "Business Type",
          "required": true,
          "requiredAtStage": ["submitted", "review"],
          "options": ["Mainland", "Freezone", "Offshore"]
        }
      ]
    }
  ],
  "requiredDocuments": {
    "categories": [
      {
        "id": "identity",
        "name": "Identity Documents",
        "description": "Required personal identification",
        "documents": [
          {
            "id": "passport",
            "name": "Passport Copy",
            "description": "Clear copy of passport bio page",
            "isMandatory": true,
            "acceptedFileTypes": [".pdf", ".jpg", ".png"]
          },
          {
            "id": "emirates-id",
            "name": "Emirates ID",
            "description": "Both sides of Emirates ID",
            "isMandatory": true,
            "acceptedFileTypes": [".pdf", ".jpg", ".png"]
          }
        ]
      }
    ]
  }
}
```

## Support

For questions or issues with form configuration import/export:
1. Check this documentation
2. Download and review the sample template
3. Verify your JSON structure matches the examples
4. Check validation errors and warnings carefully

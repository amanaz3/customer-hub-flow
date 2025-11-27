# Service Configuration JSON Templates

This directory contains pre-configured JSON templates for various service types. These templates can be imported directly into the Service Form Configuration page.

## Available Templates

### home-finance-config.json
Complete configuration for Home Finance service including:
- Applicant Profile (UAE Residency Status)
- Employment & Income Details (Employment Type, Salary Range, Business Turnover)
- Property Details (Property Value, Location)
- Payment Information (Amount)
- Additional Information (Notes)
- Validation Fields (Estimated Completion Time)

## Usage

1. Go to Service Form Configuration page (`/service-form-configuration`)
2. Select the product/service you want to configure
3. Click "Load Template Library"
4. Select a template from the list
5. Click "Load Template" to import the configuration
6. Customize as needed and save

## Adding New Templates

To add a new service configuration template:
1. Create a new JSON file in this directory
2. Follow the standard structure with `validationFields` and `sections` arrays
3. Add appropriate field definitions with validation rules
4. The file will automatically appear in the template library

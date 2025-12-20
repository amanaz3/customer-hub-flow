# Tax Filing Module Backup

**Created:** 2025-12-20

This is a backup of the Tax Filing module including:

## Components
- `EnhancedTaxWorkflow.tsx` - Main tax workflow orchestrator
- `TaxWorkflowStepper.tsx` - Horizontal stepper UI
- `TaxModeSelector.tsx` - Accountant/AI mode selector
- `AIWorkflowExecutor.tsx` - AI workflow execution component
- `TaxFilingAssistant.tsx` - Inline AI chat assistant
- `VectorDBStatus.tsx` - Vector DB status indicator
- `VectorDBSettings.tsx` - Vector DB configuration

## Steps
- `VerifyBookkeepingStep.tsx`
- `ClassifyIncomeStep.tsx`
- `ComputeTaxStep.tsx`
- `ReviewFilingStep.tsx`
- `SubmitFilingStep.tsx`

## Pages
- `TaxFiling.tsx` - Main page

## Hooks
- `useTaxFiling.ts` - Tax filing data hook

## Edge Functions
- `tax-filing-assistant/index.ts` - AI assistant endpoint
- `tax-langchain-orchestrator/index.ts` - LangChain orchestrator

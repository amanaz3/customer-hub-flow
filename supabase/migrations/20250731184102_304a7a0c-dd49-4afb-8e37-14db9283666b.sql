-- Update the document category enum to include new shareholder document categories
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'passport_docs';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'emirates_id_docs';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'bank_statement_docs';
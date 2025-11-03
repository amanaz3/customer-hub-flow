-- Rename Corporate Tax Filing to FTA services - Corporate Tax Filing
UPDATE products 
SET name = 'FTA services - Corporate Tax Filing'
WHERE name = 'Corporate Tax Filing';
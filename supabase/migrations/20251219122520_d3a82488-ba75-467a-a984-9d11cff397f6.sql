-- Add remaining UAE Free Zones (25+ additional)

INSERT INTO webflow_jurisdictions (jurisdiction_code, jurisdiction_name, jurisdiction_type, emirate, legal_forms, base_price, processing_days, is_active, notes)
VALUES 
  -- Dubai Free Zones
  ('DXB-DSO', 'Dubai Silicon Oasis', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 14000, 5, true, 'Tech and innovation hub'),
  ('DXB-DIC', 'Dubai Internet City', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 25000, 7, true, 'IT and tech companies'),
  ('DXB-DMC', 'Dubai Media City', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 22000, 7, true, 'Media and advertising'),
  ('DXB-DKP', 'Dubai Knowledge Park', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 18000, 5, true, 'Education and training'),
  ('DXB-DHCC', 'Dubai Healthcare City', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 35000, 10, true, 'Healthcare services'),
  ('DXB-DSC', 'Dubai Sports City', 'freezone', 'Dubai', '["llc"]'::jsonb, 15000, 5, true, 'Sports related businesses'),
  ('DXB-DWC', 'Dubai World Central', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 16000, 5, true, 'Aviation and logistics'),
  ('DXB-MEYDAN', 'Meydan Free Zone', 'freezone', 'Dubai', '["llc"]'::jsonb, 11000, 3, true, 'Cost-effective, quick setup'),
  ('DXB-SHAMS', 'Shams Free Zone', 'freezone', 'Dubai', '["llc"]'::jsonb, 10000, 2, true, 'Media and creative industries'),
  ('DXB-DWTC', 'Dubai World Trade Centre FZ', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 20000, 5, true, 'Events and exhibitions'),
  ('DXB-DDP', 'Dubai Design District (d3)', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 22000, 7, true, 'Design and fashion'),
  ('DXB-DPMC', 'Dubai Production City', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 14000, 5, true, 'Manufacturing and publishing'),
  ('DXB-DSOA', 'Dubai Science Park', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 18000, 5, true, 'Life sciences and pharma'),
  ('DXB-DCCA', 'Dubai Car & Automotive Zone', 'freezone', 'Dubai', '["llc"]'::jsonb, 15000, 5, true, 'Automotive industry'),
  ('DXB-DIAC', 'Dubai International Academic City', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 16000, 5, true, 'Academic institutions'),
  ('DXB-TECOM', 'TECOM Free Zone', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 18000, 5, true, 'Technology and media'),
  ('DXB-DGCX', 'Dubai Gold & Diamond Park', 'freezone', 'Dubai', '["llc"]'::jsonb, 20000, 7, true, 'Jewelry and precious metals'),
  ('DXB-TEXTILE', 'Dubai Textile City', 'freezone', 'Dubai', '["llc"]'::jsonb, 12000, 5, true, 'Textile and fashion'),
  ('DXB-KIKLABB', 'Kiklabb Free Zone', 'freezone', 'Dubai', '["llc"]'::jsonb, 9000, 2, true, 'E-commerce and digital'),
  
  -- Abu Dhabi Free Zones
  ('AUH-KIZAD', 'Khalifa Industrial Zone (KIZAD)', 'freezone', 'Abu Dhabi', '["llc", "branch"]'::jsonb, 25000, 10, true, 'Industrial manufacturing'),
  ('AUH-MASDAR', 'Masdar City Free Zone', 'freezone', 'Abu Dhabi', '["llc", "branch"]'::jsonb, 22000, 7, true, 'Clean tech and sustainability'),
  ('AUH-TWOFOUR54', 'twofour54', 'freezone', 'Abu Dhabi', '["llc", "branch"]'::jsonb, 20000, 7, true, 'Media and entertainment'),
  ('AUH-ZONESCORP', 'ZonesCorp', 'freezone', 'Abu Dhabi', '["llc"]'::jsonb, 15000, 5, true, 'Industrial and logistics'),
  ('AUH-ADPC', 'Abu Dhabi Ports Company FZ', 'freezone', 'Abu Dhabi', '["llc", "branch"]'::jsonb, 18000, 7, true, 'Maritime and logistics'),
  
  -- Sharjah Free Zones
  ('SHJ-SHAMS', 'Sharjah Media City (SHAMS)', 'freezone', 'Sharjah', '["llc"]'::jsonb, 8000, 2, true, 'Freelancers and SMEs'),
  ('SHJ-HFZA', 'Hamriyah Free Zone', 'freezone', 'Sharjah', '["llc", "branch"]'::jsonb, 15000, 5, true, 'Heavy industries'),
  ('SHJ-SHPC', 'Sharjah Publishing City', 'freezone', 'Sharjah', '["llc"]'::jsonb, 9000, 3, true, 'Publishing and printing'),
  ('SHJ-SRT', 'Sharjah Research Technology Park', 'freezone', 'Sharjah', '["llc"]'::jsonb, 12000, 5, true, 'R&D and tech'),
  
  -- Fujairah Free Zones
  ('FUJ-ML', 'Fujairah Mainland', 'mainland', 'Fujairah', '["llc", "sole_establishment"]'::jsonb, 9000, 5, true, 'Eastern UAE access'),
  ('FUJ-FFZ', 'Fujairah Free Zone', 'freezone', 'Fujairah', '["llc"]'::jsonb, 10000, 3, true, 'Trading and logistics'),
  ('FUJ-FOIZ', 'Fujairah Oil Industry Zone', 'freezone', 'Fujairah', '["llc", "branch"]'::jsonb, 25000, 10, true, 'Oil and energy sector'),
  ('FUJ-CC', 'Creative City Fujairah', 'freezone', 'Fujairah', '["llc"]'::jsonb, 8000, 2, true, 'Media freelancers'),
  
  -- Umm Al Quwain Free Zones
  ('UAQ-ML', 'Umm Al Quwain Mainland', 'mainland', 'Umm Al Quwain', '["llc", "sole_establishment"]'::jsonb, 7000, 5, true, 'Most affordable mainland'),
  ('UAQ-FTZ', 'UAQ Free Trade Zone', 'freezone', 'Umm Al Quwain', '["llc"]'::jsonb, 8000, 3, true, 'Budget-friendly free zone'),
  
  -- RAK Additional Free Zones  
  ('RAK-MFZ', 'RAK Maritime City', 'freezone', 'Ras Al Khaimah', '["llc", "branch"]'::jsonb, 15000, 5, true, 'Maritime and shipping'),
  ('RAK-MEDIA', 'RAK Media Free Zone', 'freezone', 'Ras Al Khaimah', '["llc"]'::jsonb, 9000, 2, true, 'Media and creative')
  
ON CONFLICT (jurisdiction_code) DO NOTHING;
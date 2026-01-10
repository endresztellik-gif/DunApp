-- ============================================================================
-- MIGRATION 020: ADD UNIQUE CONSTRAINT FOR GROUNDWATER DATA
-- ============================================================================
-- PURPOSE: Enable proper upsert in fetch-groundwater-vizugy Edge Function
-- DEPLOYMENT: Run this in Supabase Dashboard → SQL Editor
-- DATE: 2026-01-09
-- ============================================================================

-- Step 1: Check if constraint already exists (safety check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_well_timestamp'
      AND conrelid = 'groundwater_data'::regclass
  ) THEN
    RAISE NOTICE '⚠️  UNIQUE constraint already exists, skipping...';
  ELSE
    -- Step 2: Add UNIQUE constraint
    ALTER TABLE groundwater_data
    ADD CONSTRAINT unique_well_timestamp UNIQUE (well_id, timestamp);

    -- Step 3: Add comment
    COMMENT ON CONSTRAINT unique_well_timestamp ON groundwater_data IS
    'Ensures unique (well_id, timestamp) pairs for proper upsert operations. Added in Migration 020.';

    RAISE NOTICE '✅ UNIQUE constraint "unique_well_timestamp" created successfully!';
    RAISE NOTICE '   Table: groundwater_data';
    RAISE NOTICE '   Columns: (well_id, timestamp)';
    RAISE NOTICE '   Purpose: Prevent duplicates + enable upsert';
  END IF;
END $$;

-- Step 4: Verify the constraint was created
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'unique_well_timestamp';

-- Expected output:
-- constraint_name      | table_name        | definition
-- ---------------------|-------------------|---------------------------------
-- unique_well_timestamp| groundwater_data  | UNIQUE (well_id, timestamp)

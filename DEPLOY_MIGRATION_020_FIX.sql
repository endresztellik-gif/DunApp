-- ============================================================================
-- MIGRATION 020 FIX: Remove Duplicates + Add UNIQUE Constraint
-- ============================================================================
-- PURPOSE: Clean existing duplicates before adding UNIQUE constraint
-- DEPLOYMENT: Run this in Supabase Dashboard → SQL Editor
-- DATE: 2026-01-09
-- ============================================================================

-- Step 1: Identify and count duplicates (for logging)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT well_id, timestamp, COUNT(*) as cnt
    FROM groundwater_data
    GROUP BY well_id, timestamp
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE '🔍 Found % duplicate (well_id, timestamp) pairs', duplicate_count;
END $$;

-- Step 2: Delete duplicates, keeping only the NEWEST record (by created_at)
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY well_id, timestamp
      ORDER BY created_at DESC, id DESC  -- Keep newest created_at
    ) AS rn
  FROM groundwater_data
)
DELETE FROM groundwater_data
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1  -- Delete older duplicates
);

-- Step 3: Verify no duplicates remain
DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT well_id, timestamp, COUNT(*) as cnt
    FROM groundwater_data
    GROUP BY well_id, timestamp
    HAVING COUNT(*) > 1
  ) duplicates;

  IF remaining_duplicates > 0 THEN
    RAISE EXCEPTION '❌ Still have % duplicates after cleanup!', remaining_duplicates;
  ELSE
    RAISE NOTICE '✅ All duplicates removed successfully';
  END IF;
END $$;

-- Step 4: Add UNIQUE constraint (now it will succeed)
ALTER TABLE groundwater_data
ADD CONSTRAINT unique_well_timestamp UNIQUE (well_id, timestamp);

-- Step 5: Add comment
COMMENT ON CONSTRAINT unique_well_timestamp ON groundwater_data IS
'Ensures unique (well_id, timestamp) pairs for proper upsert operations. Added in Migration 020.';

-- Step 6: Verify constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_well_timestamp'
      AND conrelid = 'groundwater_data'::regclass
  ) THEN
    RAISE NOTICE '✅ UNIQUE constraint "unique_well_timestamp" created successfully!';
    RAISE NOTICE '   Table: groundwater_data';
    RAISE NOTICE '   Columns: (well_id, timestamp)';
  ELSE
    RAISE EXCEPTION '❌ Failed to create UNIQUE constraint';
  END IF;
END $$;

-- Step 7: Show summary statistics
SELECT
  'groundwater_data' AS table_name,
  COUNT(*) AS total_records,
  COUNT(DISTINCT well_id) AS unique_wells,
  MIN(timestamp) AS earliest_data,
  MAX(timestamp) AS latest_data
FROM groundwater_data;

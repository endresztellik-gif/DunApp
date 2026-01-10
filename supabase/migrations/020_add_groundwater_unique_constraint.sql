-- ============================================================================
-- ADD UNIQUE CONSTRAINT FOR GROUNDWATER DATA
-- ============================================================================
-- Ensures that (well_id, timestamp) pairs are unique to prevent duplicates
-- and enable proper upsert functionality in the fetch-groundwater Edge Function.
--
-- Migration created: 2026-01-09
-- Issue: Edge Function uses upsert with onConflict, but no UNIQUE constraint exists
-- ============================================================================

-- Step 1: Remove existing duplicates (keep newest by created_at)
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY well_id, timestamp
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM groundwater_data
)
DELETE FROM groundwater_data
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add UNIQUE constraint to prevent duplicate (well_id, timestamp) records
ALTER TABLE groundwater_data
ADD CONSTRAINT unique_well_timestamp UNIQUE (well_id, timestamp);

-- Add comment
COMMENT ON CONSTRAINT unique_well_timestamp ON groundwater_data IS
'Ensures unique (well_id, timestamp) pairs for proper upsert operations. Added in Migration 020.';

-- Verify constraint was created
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_well_timestamp'
      AND conrelid = 'groundwater_data'::regclass
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✅ UNIQUE constraint "unique_well_timestamp" created successfully';
    RAISE NOTICE '   Table: groundwater_data';
    RAISE NOTICE '   Columns: (well_id, timestamp)';
    RAISE NOTICE '   Purpose: Prevent duplicates + enable upsert in fetch-groundwater';
  ELSE
    RAISE EXCEPTION '❌ Failed to create UNIQUE constraint';
  END IF;
END $$;

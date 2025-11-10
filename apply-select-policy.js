/**
 * Apply SELECT policy for push_subscriptions table
 *
 * This script adds the missing SELECT policy that allows anon users
 * to read push_subscriptions, which is required for upsert operations.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySelectPolicy() {
  console.log('🔧 Applying SELECT policy for push_subscriptions...\n');

  const sql = `
    -- Check if policy already exists
    DO $$
    BEGIN
      -- Drop policy if it exists (idempotent)
      IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'push_subscriptions'
        AND policyname = 'Allow anon to select push subscriptions'
      ) THEN
        DROP POLICY "Allow anon to select push subscriptions" ON push_subscriptions;
        RAISE NOTICE 'Dropped existing policy';
      END IF;

      -- Create the policy
      EXECUTE 'CREATE POLICY "Allow anon to select push subscriptions"
        ON push_subscriptions
        FOR SELECT
        TO anon, authenticated
        USING (true)';

      RAISE NOTICE 'Created SELECT policy successfully';
    END $$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct SQL execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log('✅ SELECT policy applied successfully!\n');
      console.log('Policy details:');
      console.log('  - Table: push_subscriptions');
      console.log('  - Name: "Allow anon to select push subscriptions"');
      console.log('  - Roles: anon, authenticated');
      console.log('  - Operation: SELECT');
      console.log('\n📝 Now anon users can use upsert() on push_subscriptions');
    } else {
      console.log('✅ Policy applied:', data);
    }
  } catch (err) {
    console.error('❌ Failed to apply policy:', err.message);
    console.log('\n💡 Manual SQL (run in Supabase SQL Editor):');
    console.log(sql);
    process.exit(1);
  }
}

applySelectPolicy();

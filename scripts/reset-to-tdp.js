// scripts/reset-to-tdp.js — isolate to Tampa Downtown Partnership only
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KEEP_SOURCE = 'Tampa Downtown Partnership';

// Short titles that are clearly navigation/junk
const JUNK_TITLES = /^(dine|drink|food|events?|news|shop|restaurants?|things to do|tours?|activities|hotels?|parking|map|home|about|contact|filter|more|all|connect|give|join|go|visit|see|do|read|learn|explore|find|get|buy|book|reserve|login|sign|logout|print)$/i;

async function run() {
  console.log('Step 1: Hiding all non-TDP items...');
  const { error: e1 } = await supabase
    .from('trusted_items')
    .update({ status: 'hidden' })
    .neq('source_name', KEEP_SOURCE);
  if (e1) { console.error('Error hiding non-TDP:', e1.message); } 
  else { console.log('  ✅ Non-TDP items hidden.'); }

  console.log('Step 2: Re-hiding junk TDP items...');
  const { data: tdpItems } = await supabase
    .from('trusted_items')
    .select('id, title, url')
    .eq('source_name', KEEP_SOURCE);

  let junkCount = 0;
  for (const item of tdpItems || []) {
    const isJunkTitle = !item.title || item.title.length < 5 || JUNK_TITLES.test(item.title.trim());
    const isJunkUrl = /\/(page\/\d+|feed|wp-json|wp-admin)\/?/.test(item.url || '');
    if (isJunkTitle || isJunkUrl) {
      await supabase.from('trusted_items').update({ status: 'hidden' }).eq('id', item.id);
      junkCount++;
      console.log(`  🗑️  Hidden junk: "${item.title}"`);
    }
  }
  console.log(`  ✅ ${junkCount} junk TDP items hidden.`);

  console.log('Step 3: Approving all remaining TDP items...');
  const { error: e3, count } = await supabase
    .from('trusted_items')
    .update({ status: 'approved' })
    .eq('source_name', KEEP_SOURCE)
    .neq('status', 'hidden');
  if (e3) { console.error('Error approving:', e3.message); }
  else { console.log(`  ✅ TDP items approved.`); }

  const { count: total } = await supabase
    .from('trusted_items')
    .select('id', { count: 'exact', head: true })
    .eq('source_name', KEEP_SOURCE)
    .eq('status', 'approved');
  console.log(`\n✅ Done! ${total} clean TDP items approved and ready to search.`);
}

run();

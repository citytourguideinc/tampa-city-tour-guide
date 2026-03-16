
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking Supabase tables...');
  
  const { count: sourcesCount, error: err1 } = await supabase
    .from('trusted_sources')
    .select('*', { count: 'exact', head: true });
    
  if (err1) console.error('Error fetching trusted_sources:', err1.message);
  else console.log('trusted_sources row count:', sourcesCount);

  const { count: resourcesCount, error: err2 } = await supabase
    .from('Tampa Resources')
    .select('*', { count: 'exact', head: true });
    
  if (err2) console.error('Error fetching Tampa Resources:', err2.message);
  else console.log('Tampa Resources row count:', resourcesCount);

  const { count: itemsCount, error: err3 } = await supabase
    .from('trusted_items')
    .select('*', { count: 'exact', head: true });
    
  if (err3) console.error('Error fetching trusted_items:', err3.message);
  else console.log('trusted_items row count:', itemsCount);
}

check();

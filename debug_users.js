import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function debug() {
  // Check the users table
  console.log("=== All rows in 'users' table ===");
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  console.log("Users:", JSON.stringify(users, null, 2));
  console.log("Error:", usersErr);
  
  // Check what columns the users table has
  console.log("\n=== Users table structure (first row) ===");
  if (users && users.length > 0) {
    console.log("Columns:", Object.keys(users[0]));
  }
}

debug();

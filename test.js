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

async function test() {
  console.log("Checking subjects...");
  const { data: subjects, error: err1 } = await supabase.from('subjects').select('*');
  console.log("Subjects:", subjects?.length, "Error:", err1);

  console.log("Checking questions...");
  const { data: questions, error: err2 } = await supabase.from('questions').select('*');
  console.log("Questions count:", questions?.length, "Error:", err2);
  
  console.log("Attempting insert with bad user_id...");
  const { data: insertRes, error: err3 } = await supabase.from('questions').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    title: 'Test Title',
    level: 'High School',
    description: 'Test description',
  }).select();
  console.log("Insert Result:", insertRes, "Error:", err3);
}

test();

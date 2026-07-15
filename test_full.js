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
  console.log("Signing up a test user...");
  // Using a more realistic email to bypass simple filters
  const testEmail = `tester${Date.now()}@gmail.com`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Password123!',
    options: {
      data: {
        role: 'student',
        full_name: 'Test Student',
      }
    }
  });

  if (authErr) {
    console.error("Auth Error:", authErr);
    return;
  }
  
  const userId = authData.user?.id;
  if (!userId) {
     console.error("No user ID returned. Maybe email confirmation is required?");
     return;
  }
  console.log("Created user:", userId);

  console.log("Attempting insert with valid user_id...");
  const { data: insertRes, error: err3 } = await supabase.from('questions').insert({
    user_id: userId,
    title: 'Test Title Valid',
    subject_id: 1,
    level: 'High School',
    description: 'Test description valid',
  }).select();
  console.log("Insert Result:", insertRes, "Error:", err3);
}

test();

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
  const testEmail = 'testuser_' + Date.now() + '@example.com';
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
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
  console.log("Created user:", authData.user.id);

  console.log("Attempting insert with valid user_id...");
  const { data: insertRes, error: err3 } = await supabase.from('questions').insert({
    user_id: authData.user.id,
    title: 'Test Title Valid',
    subject_id: 1,
    level: 'High School',
    description: 'Test description valid',
  }).select();
  console.log("Insert Result:", insertRes, "Error:", err3);
}

test();

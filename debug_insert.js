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
  // Step 1: Check current session (simulating browser - no session expected here)
  console.log("=== Step 1: Check session ===");
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("Session:", sessionData.session ? "EXISTS" : "NONE");

  // Step 2: Try insert WITHOUT auth (this is what happens when RLS blocks)
  console.log("\n=== Step 2: Insert without auth ===");
  const { data: d1, error: e1 } = await supabase.from('questions').insert({
    user_id: 'aec3cc15-7dd6-43d4-b091-735ec14ed294',
    title: 'Debug Test No Auth',
    subject: 'Mathematics',
    level: 'High School',
    description: 'Testing without auth',
    deadline: null,
    payment: null
  }).select();
  console.log("Data:", d1);
  console.log("Error:", e1);

  // Step 3: Check what columns exist
  console.log("\n=== Step 3: Read existing questions ===");
  const { data: existing, error: readErr } = await supabase.from('questions').select('*').limit(3);
  console.log("Existing questions:", existing);
  console.log("Read error:", readErr);

  // Step 4: Check subjects table
  console.log("\n=== Step 4: Read subjects ===");
  const { data: subs, error: subErr } = await supabase.from('subjects').select('*');
  console.log("Subjects:", subs);
  console.log("Subjects error:", subErr);

  // Step 5: Try to sign in with a real user and then insert
  // We need actual credentials - let's use a test
  console.log("\n=== Step 5: Sign in and insert ===");
  const testEmail = 'muawiase@gmail.com'; // user's actual email
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'test_placeholder_will_fail',
  });
  console.log("Sign in result:", signInErr ? signInErr.message : "SUCCESS");
  
  if (signInData?.session) {
    console.log("User ID:", signInData.user.id);
    const { data: d2, error: e2 } = await supabase.from('questions').insert({
      user_id: signInData.user.id,
      title: 'Debug Test With Auth',
      subject: 'Mathematics',
      level: 'High School',
      description: 'Testing with real auth',
      deadline: null,
      payment: null
    }).select();
    console.log("Insert data:", d2);
    console.log("Insert error:", e2);
  }
}

debug();

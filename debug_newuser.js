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
  // The FK constraint references "users" table. This is likely auth.users.
  // The test user aec3cc15-... was created via supabase.auth.signUp in test_new_schema.js
  // and exists in auth.users. But if the REAL user signed up and confirmed their email,
  // they should also be in auth.users.
  
  // Let's check: what UUID does the REAL user have?
  // We can try signing up a new user and immediately inserting
  
  const testEmail = `debug_test_${Date.now()}@gmail.com`;
  console.log("=== Step 1: Sign up new user ===");
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'DebugTest123!',
    options: {
      data: { role: 'student', full_name: 'Debug Tester' }
    }
  });
  
  if (signUpErr) {
    console.log("Signup error:", signUpErr);
    return;
  }
  
  const newUserId = signUpData.user?.id;
  console.log("New user ID:", newUserId);
  console.log("Email confirmed:", signUpData.user?.email_confirmed_at ? "YES" : "NO");
  console.log("Session:", signUpData.session ? "EXISTS" : "NONE");
  
  // Now try to insert a question with this new user
  console.log("\n=== Step 2: Insert with NEW unconfirmed user (NO session) ===");
  const { data: d1, error: e1 } = await supabase.from('questions').insert({
    user_id: newUserId,
    title: 'New User Test (no session)',
    subject: 'Mathematics',
    level: 'High School',
    description: 'Testing with unconfirmed user',
    deadline: null,
    payment: null
  }).select();
  console.log("Data:", d1);
  console.log("Error:", e1);
  
  // If we got a session (auto-confirm enabled), try with the session
  if (signUpData.session) {
    console.log("\n=== Step 3: Insert with session (auto-confirmed) ===");
    const { data: d2, error: e2 } = await supabase.from('questions').insert({
      user_id: newUserId,
      title: 'New User Test (with session)',
      subject: 'Mathematics',
      level: 'High School',
      description: 'Testing with confirmed user',
      deadline: null,
      payment: null
    }).select();
    console.log("Data:", d2);
    console.log("Error:", e2);
  }
}

debug();

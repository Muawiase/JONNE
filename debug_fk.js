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
  // Try signing in with common test passwords to test insert with real auth
  const passwords = ['Password123!', 'password123', '123456', 'Test1234!'];
  
  // First, let's try to find the user's email by checking auth
  console.log("=== Checking if we can get user info ===");
  
  // Let's simulate exactly what the browser does: 
  // 1. Auth with real session
  // 2. Insert question
  
  // Test with the test user that was created in test_new_schema.js
  for (const pw of passwords) {
    console.log(`\nTrying password: ${pw.substring(0,3)}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'tester1752587267363@gmail.com', // won't work, email may not be confirmed
      password: pw,
    });
    if (!error) {
      console.log("SUCCESS! User:", data.user.id);
      break;
    }
    console.log("Failed:", error.message);
  }
  
  // The REAL test: check if there's a foreign key constraint on user_id
  // By trying to insert with a non-existent UUID
  console.log("\n=== Test insert with RANDOM UUID (no FK match) ===");
  const randomUUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const { data: d1, error: e1 } = await supabase.from('questions').insert({
    user_id: randomUUID,
    title: 'FK Test',
    subject: 'Mathematics',
    level: 'High School',
    description: 'Testing FK constraint',
    deadline: null,
    payment: null
  }).select();
  console.log("Data:", d1);
  console.log("Error:", e1);
  
  // Test with empty string subject
  console.log("\n=== Test insert with EMPTY subject ===");
  const { data: d2, error: e2 } = await supabase.from('questions').insert({
    user_id: 'aec3cc15-7dd6-43d4-b091-735ec14ed294',
    title: 'Empty Subject Test',
    subject: '',
    level: 'High School',
    description: 'Testing empty subject',
    deadline: null,
    payment: null
  }).select();
  console.log("Data:", d2);
  console.log("Error:", e2);
  
  // Test with empty string level
  console.log("\n=== Test insert with EMPTY level ===");
  const { data: d3, error: e3 } = await supabase.from('questions').insert({
    user_id: 'aec3cc15-7dd6-43d4-b091-735ec14ed294',
    title: 'Empty Level Test',
    subject: 'Mathematics',
    level: '',
    description: 'Testing empty level',
    deadline: null,
    payment: null
  }).select();
  console.log("Data:", d3);
  console.log("Error:", e3);
}

debug();

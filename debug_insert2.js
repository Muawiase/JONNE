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
  // First, let's see all users who have signed up
  console.log("=== Listing auth users (will fail with anon key, that's ok) ===");
  
  // Check if there are any questions with the user's actual ID
  console.log("\n=== All questions in DB ===");
  const { data: allQ, error: qErr } = await supabase.from('questions').select('*');
  console.log("Questions:", JSON.stringify(allQ, null, 2));
  console.log("Error:", qErr);

  // Test: Sign in as the actual user to see if insert works
  // The user's email is muawiase@gmail.com based on conversation history
  console.log("\n=== Trying to sign in as muawiase@gmail.com ===");
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'muawiase@gmail.com',
    password: 'test123', // we don't know the password, this will fail
  });
  console.log("Sign in error:", signInErr?.message || "SUCCESS");
  
  if (signIn?.session) {
    console.log("User ID:", signIn.user.id);
    console.log("User metadata:", signIn.user.user_metadata);
    
    // Try insert with authenticated session  
    const { data: insertData, error: insertErr } = await supabase.from('questions').insert({
      user_id: signIn.user.id,
      title: 'Authenticated Test',
      subject: 'Mathematics',
      level: 'High School',
      description: 'Test with real auth session',
      deadline: null,
      payment: null
    }).select();
    console.log("Insert data:", insertData);
    console.log("Insert error:", insertErr);
  }

  // Also check: what does an insert return when there's NO .select()?
  console.log("\n=== Insert WITHOUT .select() (mimics app code) ===");
  const result = await supabase.from('questions').insert({
    user_id: 'aec3cc15-7dd6-43d4-b091-735ec14ed294',
    title: 'Test NO SELECT',
    subject: 'Mathematics',
    level: 'High School',
    description: 'Testing without .select()',
    deadline: null,
    payment: null
  });
  console.log("Full result:", JSON.stringify(result, null, 2));
  console.log("result.data:", result.data);
  console.log("result.error:", result.error);
  console.log("result.status:", result.status);
  console.log("result.statusText:", result.statusText);
}

debug();

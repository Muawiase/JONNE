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
  // Sign up a NEW user with a unique email, get auto-session if available
  // Since email confirmation is required, we won't get a session
  // BUT we can test with a user that DOES have confirmed email
  
  // Step 1: Create a user and immediately try insert (no session, acts as anon)
  const email = `rls_test_${Date.now()}@gmail.com`;
  console.log("=== Sign up user ===");
  const { data: signup, error: signupErr } = await supabase.auth.signUp({
    email,
    password: 'RlsTest123!',
    options: { data: { role: 'student' } }
  });
  
  if (signupErr) {
    console.log("Signup error:", signupErr);
    return;
  }
  
  const userId = signup.user.id;
  console.log("User ID:", userId);
  console.log("Has session:", !!signup.session);
  
  // Step 2: Insert WITHOUT session (as anon role)
  console.log("\n=== Insert as ANON (no session) ===");
  const { data: d1, error: e1, status: s1 } = await supabase.from('questions').insert({
    user_id: userId,
    title: 'RLS Test - Anon',
    subject: 'Physics',
    level: 'High School',
    description: 'Testing RLS as anon',
    deadline: null,
    payment: null
  }).select();
  console.log("Status:", s1, "Data:", d1, "Error:", e1);
  
  // Step 3: Now try to sign in (this will fail if email not confirmed)
  console.log("\n=== Try sign in ===");
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: 'RlsTest123!',
  });
  console.log("Sign in:", signInErr?.message || "SUCCESS");
  console.log("Has session after sign in:", !!signIn?.session);
  
  if (signIn?.session) {
    // Step 4: Insert WITH session (as authenticated role)
    console.log("\n=== Insert as AUTHENTICATED (with session) ===");
    const { data: d2, error: e2, status: s2 } = await supabase.from('questions').insert({
      user_id: userId,
      title: 'RLS Test - Authenticated',
      subject: 'Physics',
      level: 'High School',
      description: 'Testing RLS as authenticated',
      deadline: null,
      payment: null
    }).select();
    console.log("Status:", s2, "Data:", d2, "Error:", e2);
  } else {
    console.log("\nCannot test authenticated insert (email confirmation required)");
    console.log("This is likely the issue: the test scripts work as anon,");
    console.log("but the browser sends requests as authenticated (with JWT),");
    console.log("and RLS may be blocking authenticated inserts.");
    
    // Let's manually set the session to test
    console.log("\n=== Setting session manually and testing ===");
    // We can use the signup data to set session if it was auto-confirmed
    
    // Actually, let's check if there's a way to test this differently
    // Let's look at the RLS status by checking the error format
    
    // Create a second client with the session if we had one
    console.log("\nSuggestion: Check Supabase Dashboard → Table Editor → questions → Policies");
    console.log("Look for INSERT policies. There should be one for 'authenticated' role.");
    console.log("If missing, add: CREATE POLICY allow_insert ON questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);");
  }
}

debug();

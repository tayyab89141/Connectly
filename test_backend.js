import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log("=== BACKEND TESTS ===");
  
  // 1. Check if profiles table exists
  const { data: profiles, error: selectError } = await supabase.from('profiles').select('*').limit(1);
  if (selectError) {
    console.log("FAIL: profiles table -", selectError.message);
  } else {
    console.log("PASS: profiles table exists");
  }

  // 2. Test one signup
  const email = `test.user.connectly.${Date.now()}@test.com`;
  const password = "Password123!";
  console.log("Attempting ONE test signup for:", email);
  
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: `testuser_${Date.now()}`,
        full_name: "Test User"
      }
    }
  });

  if (signupError) {
    console.log("SIGNUP ERROR:", signupError.message);
  } else if (authData.user) {
    console.log("PASS: user created in auth.users, ID:", authData.user.id);
    
    // Wait a brief moment for the database trigger to execute
    await new Promise(r => setTimeout(r, 1000));
    
    // 3. Check if profile was auto-created
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError) {
      console.log("FAIL: profile auto-creation -", profileError.message);
    } else if (newProfile && newProfile.id === authData.user.id) {
      console.log("PASS: profiles row automatically created");
      console.log("PASS: profiles.id = auth.users.id");
    } else {
      console.log("FAIL: profile not found for user ID");
    }

    // 4. Test invalid login
    const { error: invalidLoginError } = await supabase.auth.signInWithPassword({
      email,
      password: "WrongPassword!"
    });
    if (invalidLoginError) {
      console.log("PASS: Invalid credentials correctly rejected");
    } else {
      console.log("FAIL: Invalid credentials were accepted");
    }

    // 5. Test valid login
    const { error: validLoginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (!validLoginError) {
      console.log("PASS: Valid login succeeds");
    } else {
      console.log("FAIL: Valid login -", validLoginError.message);
    }
  } else {
    console.log("FAIL: Signup returned no error but no user data either");
  }
}

runTests().catch(console.error);

const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getDB() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

async function initDB() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file");
  }
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  // Test connection
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error && error.code !== "PGRST116") {
    // PGRST116 = table not found (first run) - that's ok, we'll show SQL setup message
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("\n⚠️  Tables not found! Please run the SQL setup in Supabase Dashboard.");
      console.log("📋 Copy SQL from: backend/db/schema.sql\n");
    } else {
      throw new Error("Supabase connection failed: " + error.message);
    }
  }

  console.log("✅ Supabase connected successfully!");
  return supabase;
}

module.exports = { getDB, initDB };

/**
 * Seed script — inserts the 6 fixed players and official extensions.
 * The schema.sql already handles seeding via ON CONFLICT DO NOTHING,
 * but this script can be used to verify or re-run outside of Supabase SQL editor.
 *
 * Usage: npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const PLAYERS = [
  { name: "Martí", color: "#E53E3E" },
  { name: "Marcel", color: "#3182CE" },
  { name: "Alejandro", color: "#38A169" },
  { name: "Nacho", color: "#D69E2E" },
  { name: "Eudald", color: "#805AD5" },
  { name: "Iván", color: "#DD6B20" },
];

const EXTENSIONS = [
  { name: "Inns & Cathedrals", is_official: true, description: "Inns double road points, Cathedrals boost cities — but score 0 if incomplete" },
  { name: "Traders & Builders", is_official: true, description: "Trade goods, Builder for extra turns, Pig for bigger farm scoring" },
  { name: "The Princess & The Dragon", is_official: true, description: "Dragon devours meeples, Princess evicts knights, portal lets you place anywhere" },
  { name: "The Tower", is_official: true, description: "Towers capture opponent meeples for ransom" },
  { name: "Abbey & Mayor", is_official: true, description: "Abbey fills gaps, Mayor strength = pennants, Wagon moves on completion" },
  { name: "Count, King & Robber", is_official: true, description: "King holds largest city; Robber Baron holds longest road; both score at end" },
  { name: "Bridges, Castles & Bazaars", is_official: true, description: "Bridges extend roads, Castles copy neighbour scores, Bazaars auction tiles" },
  { name: "Hills & Sheep", is_official: true, description: "Shepherd collects sheep tokens; Wolf eats your flock; Hills break ties" },
  { name: "Under the Big Top", is_official: true, description: "Circus Big Top, acrobat pyramids, and the Ringmaster meeple" },
  { name: "The River", is_official: true, description: "River tiles form the starting spine before normal play begins" },
  { name: "The Cult", is_official: true, description: "Cult places compete against adjacent monasteries" },
  { name: "Mage & Witch", is_official: true, description: "Mage doubles scoring on features; Witch halves it" },
];

async function seed() {
  console.log("🏰 Seeding Catán Clune database...\n");

  // Players
  console.log("👥 Inserting players...");
  for (const player of PLAYERS) {
    const { error } = await supabase
      .from("players")
      .upsert(player, { onConflict: "name" });
    if (error) {
      console.error(`  ❌ ${player.name}:`, error.message);
    } else {
      console.log(`  ✅ ${player.name}`);
    }
  }

  // Extensions
  console.log("\n🧩 Inserting extensions...");
  for (const ext of EXTENSIONS) {
    const { error } = await supabase
      .from("extensions")
      .upsert(ext, { onConflict: "name" });
    if (error) {
      console.error(`  ❌ ${ext.name}:`, error.message);
    } else {
      console.log(`  ✅ ${ext.name}`);
    }
  }

  console.log("\n✨ Seed complete!");
  console.log("\nNext steps:");
  console.log(
    "1. Go to your Supabase project → Authentication → Users"
  );
  console.log("   Create one account per player (email + password).");
  console.log(
    "2. Go to Table Editor → players → for each player, set their user_id"
  );
  console.log("   to the UUID shown in the Authentication → Users table.");
  console.log("3. Done! Players can now log in and record games.");
}

seed().catch(console.error);

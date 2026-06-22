import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: participants, error: pError } = await supabase.from("participants").select("*");
  const { data: enrollments, error: eError } = await supabase.from("enrollments").select("*");
  const { data: payments, error: payError } = await supabase.from("payments").select("*");

  console.log("Participants:", participants?.length, pError);
  console.log("Enrollments:", enrollments?.length, eError);
  console.log("Payments:", payments?.length, payError);
}

run();

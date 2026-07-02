require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      payment_status,
      participant:participants (
        id,
        full_name,
        telegram,
        slug
      )
    `)
    .eq("event_id", "0bde9d6c-325a-4836-b3be-ec007fd2f7ec");
  console.log(error, data);
}
test();

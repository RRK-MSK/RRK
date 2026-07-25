export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function ClassesPage() {
  redirect("/crm/calendar");
}

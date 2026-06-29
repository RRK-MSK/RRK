export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";

export default function CrmIndexPage() {
  redirect("/crm/dashboard");
}

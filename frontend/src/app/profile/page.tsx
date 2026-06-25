import { PageHeader } from "@/components/crm/ui";
import { ProfileFeed } from "@/components/site/profile-feed";

export default function ProfilePage() {
  return (
    <main className="site-page" style={{ paddingBottom: "100px", paddingTop: "24px" }}>
      <div className="content-area" style={{ maxWidth: "600px", margin: "0 auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "8px", marginTop: "24px", color: "var(--brand)" }}>Профиль</h1>
        <p style={{ color: "var(--muted)", marginBottom: "32px" }}>Ваши тренировки и покупки</p>
        
        <ProfileFeed />
      </div>
    </main>
  );
}
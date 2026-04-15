import { Navbar } from "@/components/layout/Navbar";
import { getCurrentPlayer } from "@/app/actions/auth-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = await getCurrentPlayer();

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar playerName={player?.name} />
      <main className="flex-1">{children}</main>
      <footer className="border-t-2 border-medieval-brown/20 py-3 text-center">
        <p className="font-garamond text-medieval-stone text-xs">
          ⚔️ Catán Clune — Carcassonne Score Tracker ✦ {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/planner", label: "Planner" },
  { to: "/curriculum", label: "Curriculum" },
  { to: "/practice", label: "Practice" },
  { to: "/dashboard", label: "Progress" },
  { to: "/profile", label: "Profile" },
];

export function AppShell() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="hidden border-b border-line bg-card md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="font-serif text-lg tracking-wide">
            Lecturer Sam Academy
          </NavLink>
          <nav className="flex gap-5 text-sm font-medium" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "text-accent" : "text-ink-soft hover:text-ink"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-6 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

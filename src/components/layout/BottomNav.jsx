import { CalendarDays, CalendarRange, ClipboardList, Home, LineChart, UserRound, BookMarked } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/timetable", label: "Timetable", icon: CalendarRange },
  { to: "/curriculum", label: "Curriculum", icon: BookMarked },
  { to: "/scheme", label: "Scheme", icon: ClipboardList },
  { to: "/dashboard", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur md:hidden print:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-7">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                    isActive ? "text-accent" : "text-ink-soft"
                  }`
                }
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

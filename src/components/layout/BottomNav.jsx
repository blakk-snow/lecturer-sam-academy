import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { NAV_GROUPS, getGroupForPath } from "./navGroups";

/**
 * BottomNav.jsx — four grouped tabs (Teacher, Library, Student, Settings)
 * with a slide-up sub-menu listing each group's destinations.
 */

export function BottomNav() {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);

  const activeGroup = getGroupForPath(location.pathname);
  const menuGroup = NAV_GROUPS.find(g => g.id === openGroup) ?? null;

  function closeMenu() {
    setOpenGroup(null);
  }

  return (
    <>
      {/* Sub-menu sheet */}
      {menuGroup && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30 print:hidden" onClick={closeMenu} aria-hidden="true" />
          <div
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-line bg-card shadow-2xl px-4 pt-3 pb-4 print:hidden"
            role="menu"
            aria-label={`${menuGroup.label} menu`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                {menuGroup.label}
              </p>
              <button onClick={closeMenu} className="p-1 rounded-lg text-ink-soft hover:text-ink" aria-label="Close menu">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {menuGroup.items.map(item => (
                <NavLink
                  key={`${menuGroup.id}-${item.to}`}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-xl border px-4 py-3 text-sm font-medium text-center transition ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-paper text-ink hover:border-accent"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Group tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur md:hidden print:hidden"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-4">
          {NAV_GROUPS.map(group => {
            const Icon = group.icon;
            const isActive = activeGroup === group.id;
            const isOpen = openGroup === group.id;
            return (
              <li key={group.id}>
                <button
                  onClick={() => setOpenGroup(id => (id === group.id ? null : group.id))}
                  aria-expanded={isOpen}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition ${
                    isActive || isOpen ? "text-accent" : "text-ink-soft"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                  {group.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

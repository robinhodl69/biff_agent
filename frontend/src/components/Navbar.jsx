import { Link, useLocation } from "react-router-dom";
import { Briefcase, Activity, Terminal, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

export default function Navbar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();

  const links = [
    { to: "/how-it-works", label: "DOCS", icon: Terminal },
    { to: "/tracking", label: "TRACK", icon: Activity },
    { to: "/admin", label: "ADMIN", icon: ShieldAlert },
  ];

  return (
    <aside className={`fixed left-0 top-0 bottom-0 flex flex-col bg-bg border-r border-border-dim z-50 transition-all duration-300 ${
      isCollapsed ? "w-14" : "w-14 md:w-56"
    }`}>
      {/* Logo section */}
      <div className="h-16 flex items-center justify-center shrink-0 border-b border-border-dim">
        <Link to="/" className="text-primary hover:opacity-70 transition-opacity">
          <Briefcase size={20} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex h-10 items-center justify-center text-text-muted hover:text-primary transition-colors border-b border-border-dim hover:bg-primary/5"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation links */}
      <nav className="px-2 py-4 flex flex-col gap-0.5 shrink-0">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <div key={link.to} className="relative group">
              <Link
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 transition-all duration-150 relative ${
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-text-muted hover:text-primary hover:bg-primary/5"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <link.icon size={16} strokeWidth={1.5} />
                {!isCollapsed && (
                  <span className="hidden md:inline text-[10px] tracking-widest font-medium">
                    {link.label}
                  </span>
                )}
              </Link>

              {/* Hover tooltip when sidebar is collapsed */}
              {isCollapsed && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-dim px-2 py-1 rounded text-[10px] tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {link.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Footer balance */}
      <div className="h-12 shrink-0" />
    </aside>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Activity, Terminal, Shield, Settings } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home", icon: null },
    {
      to: "/how-it-works",
      label: "How it Works",
      icon: <Terminal size={14} />,
    },
    { to: "/tracking", label: "Tracking", icon: <Activity size={14} /> },
    { to: "/admin", label: "Admin", icon: <Shield size={14} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-brand font-mono text-sm font-bold tracking-wider glow-text">
              BIFF
            </span>
            <span className="hidden sm:inline-block w-px h-4 bg-border-default" />
            <span className="hidden sm:inline-block text-text-muted text-xs tracking-widest uppercase">
              Agent
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    isActive
                      ? "text-brand bg-brand/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

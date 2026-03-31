import { Link } from "react-router-dom";
import { Terminal, Activity, ArrowRight } from "lucide-react";

const BIFF_ASCII = `
 ██████╗ ██╗   ██╗██╗    ██╗██╗     ███████╗
 ██╔══██╗██║   ██║██║    ██║██║     ██╔════╝
 ██████╔╝██║   ██║██║ █╗ ██║██║     █████╗
 ██╔═══╝ ██║   ██║██║███╗██║██║     ██╔══╝
 ██║     ╚██████╔╝╚███╔███╔╝███████╗███████╗
 ╚═╝      ╚═════╝  ╚══╝╚══╝ ╚══════╝╚══════╝

        A G E N T

       ┌───────────────────┐
       │  ┌─────────────┐  │
       │  │             │  │
       │  │   ┌───┐     │  │
       │  │   │   │     │  │
       │  └───┴───┴─────┘  │
       └───────────────────┘`;

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        {/* Hero */}
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
          <pre className="text-brand font-mono text-xs sm:text-sm md:text-base leading-[1.1] mb-8 whitespace-pre matrix-text select-none">
            {BIFF_ASCII}
          </pre>

          <div className="text-center max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4">
              <span className="text-text-primary">Autonomous </span>
              <span className="text-brand glow-text">Finance</span>
            </h1>

            <p className="text-text-secondary text-base sm:text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
              An AI agent that manages treasury, borrows on Floe, and monetizes
              intelligence — all on Base.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/tracking"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-brand text-bg-primary font-semibold rounded-lg hover:bg-brand-dim transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)]"
              >
                <Activity size={18} />
                Live Tracking
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border-default rounded-lg text-text-secondary hover:text-text-primary hover:border-border-active transition-all"
              >
                <Terminal size={18} />
                How it Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Terminal, Activity } from "lucide-react";

const BIFF_ASCII = `
         ██████╗ ██╗   ██╗██╗    ██╗██╗
        ██╔════╝ ██║   ██║██║    ██║██║
        ██║  ███╗██║   ██║██║ █╗ ██║██║
        ██║   ██║██║   ██║██║███╗██║██║
        ╚██████╔╝╚██████╔╝╚███╔███╔╝███████╗
         ╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚══════╝

              ▄▀▀▀█▀▀▀▄
             █  ▄ ▄  █
             █ ▀██▀  █
             ▀▄▄▄▄▄▄▀
              █     █
              █ ▄▄▄ █
              █ █▄▄ █
              ▀▄▄▄▄▀
             ██║   ██║
             ██║   ██║
             ╚═╝   ╚═╝`;

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <pre className="text-green-400 font-mono text-xs sm:text-sm md:text-base leading-tight mb-8 whitespace-pre">
        {BIFF_ASCII}
      </pre>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-3">
        Biff Agent
      </h1>

      <p className="text-text-secondary text-lg sm:text-xl mb-12 text-center max-w-md">
        Autonomous Financial Agent on Base
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/how-it-works"
          className="flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border-default rounded-lg text-text-primary hover:border-green-600 hover:text-green-400 transition-colors"
        >
          <Terminal size={18} />
          How it Works
        </Link>
        <Link
          to="/tracking"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 border border-green-600 rounded-lg text-bg-primary font-medium hover:bg-green-500 transition-colors"
        >
          <Activity size={18} />
          Tracking
        </Link>
      </div>
    </div>
  );
}

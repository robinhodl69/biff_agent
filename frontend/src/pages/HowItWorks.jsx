import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Shield,
  Zap,
  Repeat,
  DollarSign,
  Lock,
} from "lucide-react";

export default function HowItWorks() {
  const sections = [
    {
      icon: <Brain size={24} className="text-green-400" />,
      title: "Perception",
      desc: "Every cycle, Biff syncs directly with the blockchain — reading USDC/WETH balances, querying Chainlink oracles for WETH price, and fetching active Floe loan positions from the Lending Intent Matcher contract.",
    },
    {
      icon: <Shield size={24} className="text-green-400" />,
      title: "Reasoning",
      desc: "The synchronized state is fed into Anthropic Claude Sonnet. The LLM evaluates against financial rulesets (LTV thresholds, balance minimums, expiry windows) and produces a deterministic, schema-validated decision.",
    },
    {
      icon: <Zap size={24} className="text-green-400" />,
      title: "Action",
      desc: "Based on the LLM's decision, the agent autonomously executes on-chain transactions: requesting credit via Floe, adding collateral to prevent liquidation, or repaying/renewing expiring loans.",
    },
    {
      icon: <Repeat size={24} className="text-green-400" />,
      title: "Cyclic Loop",
      desc: "Unlike linear bots, Biff runs an infinite LangGraph cycle. Each iteration is independent but logged. The agent runs every 5 minutes (configurable) and only acts when thresholds are breached — never spending gas unnecessarily.",
    },
    {
      icon: <DollarSign size={24} className="text-green-400" />,
      title: "Working Capital",
      desc: "Biff participates in the Floe Agent Working Capital Facility. It borrows USDC when reserves fall below threshold, manages LTV risk via Chainlink oracles, and repays debt from organic API revenue.",
    },
    {
      icon: <Lock size={24} className="text-green-400" />,
      title: "Secure Infrastructure",
      desc: "Private keys never leave Coinbase's Secure Enclave. The CDP v2 Server Wallet provides persistent identity with enterprise-grade security. All transactions are signed within the enclave.",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-secondary hover:text-green-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          How Biff Works
        </h1>
        <p className="text-text-secondary text-lg mb-12 max-w-2xl">
          Biff is an autonomous financial agent built on LangGraph, running on
          Base Sepolia. It manages its own treasury through decentralized credit
          markets using the Floe protocol.
        </p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div
              key={i}
              className="flex gap-4 p-6 bg-bg-surface border border-border-subtle rounded-lg"
            >
              <div className="flex-shrink-0 mt-1">{section.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  {section.title}
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  {section.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-bg-surface border border-border-subtle rounded-lg">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Tech Stack
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ["Network", "Base Sepolia"],
              ["Framework", "LangGraph"],
              ["LLM", "Anthropic Claude"],
              ["Wallet", "CDP v2 Server Wallet"],
              ["Lending", "Floe Protocol"],
              ["Oracle", "Chainlink"],
              ["Monitoring", "LangSmith"],
              ["Payments", "x402 Protocol"],
              ["Language", "TypeScript"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <span className="text-text-muted text-xs uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-text-primary font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Link
            to="/tracking"
            className="px-6 py-3 bg-green-600 rounded-lg text-bg-primary font-medium hover:bg-green-500 transition-colors"
          >
            View Live Tracking
          </Link>
          <a
            href="https://github.com/robinhodl69/biff_agent"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-bg-surface border border-border-default rounded-lg text-text-primary hover:border-green-600 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

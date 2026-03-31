import { Link } from "react-router-dom";
import {
  Brain,
  Shield,
  Zap,
  Repeat,
  DollarSign,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";

const ARCHITECTURE_ASCII = `
  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
  │  Perception │────▶│  Reasoning   │────▶│   Action    │
  │  (Monitor)  │     │  (Evaluate)  │     │  (Execute)  │
  └──────┬──────┘     └──────┬───────┘     └──────┬──────┘
         │                   │                    │
         │  ┌─────────┐     │     ┌────────┐     │
         └──│ Chainlink│     └────▶│ Claude │     │
            │ Oracles  │           │ Sonnet │     │
            └─────────┘           └────────┘     │
                                                 │
         ┌──────────────┐     ┌──────────┐      │
         │ Floe Matcher │◀────│  CDP v2  │◀─────┘
         │  Protocol    │     │  Wallet  │
         └──────────────┘     └──────────┘`;

export default function HowItWorks() {
  const sections = [
    {
      step: "01",
      icon: <Brain size={20} />,
      title: "Perception",
      desc: "Every cycle, Biff syncs directly with the blockchain — reading USDC/WETH balances, querying Chainlink oracles for WETH price, and fetching active Floe loan positions from the Lending Intent Matcher contract.",
    },
    {
      step: "02",
      icon: <Shield size={20} />,
      title: "Reasoning",
      desc: "The synchronized state is fed into Anthropic Claude Sonnet. The LLM evaluates against financial rulesets (LTV thresholds, balance minimums, expiry windows) and produces a deterministic, schema-validated decision.",
    },
    {
      step: "03",
      icon: <Zap size={20} />,
      title: "Action",
      desc: "Based on the LLM's decision, the agent autonomously executes on-chain transactions: requesting credit via Floe, adding collateral to prevent liquidation, or repaying/renewing expiring loans.",
    },
    {
      step: "04",
      icon: <Repeat size={20} />,
      title: "Cyclic Loop",
      desc: "Unlike linear bots, Biff runs an infinite LangGraph cycle. Each iteration is independent but logged. The agent runs every 5 minutes (configurable) and only acts when thresholds are breached — never spending gas unnecessarily.",
    },
    {
      step: "05",
      icon: <DollarSign size={20} />,
      title: "Working Capital",
      desc: "Biff participates in the Floe Agent Working Capital Facility. It borrows USDC when reserves fall below threshold, manages LTV risk via Chainlink oracles, and repays debt from organic API revenue.",
    },
    {
      step: "06",
      icon: <Lock size={20} />,
      title: "Secure Infrastructure",
      desc: "Private keys never leave Coinbase's Secure Enclave. The CDP v2 Server Wallet provides persistent identity with enterprise-grade security. All transactions are signed within the enclave.",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3">
            How Biff Works
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            An autonomous financial agent built on LangGraph, running on Base
            Sepolia. It manages its own treasury through decentralized credit
            markets using the Floe protocol.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Architecture
          </h2>
          <pre className="text-brand/80 font-mono text-[5px] xs:text-[6px] sm:text-[7px] md:text-xs leading-tight whitespace-pre overflow-x-auto matrix-text">
            {ARCHITECTURE_ASCII}
          </pre>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {sections.map((section, i) => (
            <div
              key={i}
              className="group relative flex gap-4 sm:gap-6 py-6 border-b border-border-subtle last:border-b-0"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand group-hover:bg-brand/20 group-hover:border-brand/30 transition-all">
                  {section.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-brand/40 font-mono text-xs">
                    {section.step}
                  </span>
                  <h2 className="text-text-primary font-semibold text-lg">
                    {section.title}
                  </h2>
                </div>
                <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
                  {section.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
            Tech Stack
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
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
                <span className="text-text-dim text-[10px] uppercase tracking-widest mb-0.5">
                  {label}
                </span>
                <span className="text-text-primary font-mono text-sm">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            to="/tracking"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-bg-primary font-semibold rounded-lg hover:bg-brand-dim transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)]"
          >
            View Live Tracking
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <a
            href="https://github.com/robinhodl69/biff_agent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-bg-surface border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary hover:border-border-active transition-all"
          >
            <ExternalLink size={16} />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

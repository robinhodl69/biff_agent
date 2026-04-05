import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";
import Panel from "../components/Panel";
import Label from "../components/Label";
import Button from "../components/Button";

const ARCHITECTURE_ASCII = `
PERCEPTION      REASONING      ACTION
     |              |            |
  ORACLES          AI           CDP
     |              |            |
     └──────────────┼────────────┘
                    |
                  FLOE
`;

export default function HowItWorks() {
  const [currentStep, setCurrentStep] = useState(0);

  const sections = [
    {
      step: "01",
      title: "Perception",
      desc: "Every cycle, Biff syncs directly with the blockchain — reading USDC/WETH balances, querying Chainlink oracles for WETH price, and fetching active Floe loan positions from the Lending Intent Matcher contract.",
    },
    {
      step: "02",
      title: "Reasoning",
      desc: "The synchronized state is fed into Anthropic Claude Sonnet. The LLM evaluates against financial rulesets (LTV thresholds, balance minimums, expiry windows) and produces a deterministic, schema-validated decision.",
    },
    {
      step: "03",
      title: "Action",
      desc: "Based on the LLM's decision, the agent autonomously executes on-chain transactions: requesting credit via Floe, adding collateral to prevent liquidation, or repaying/renewing expiring loans.",
    },
    {
      step: "04",
      title: "Cyclic Loop",
      desc: "Unlike linear bots, Biff runs an infinite LangGraph cycle. Each iteration is independent but logged. The agent runs every 5 minutes (configurable) and only acts when thresholds are breached — never spending gas unnecessarily.",
    },
    {
      step: "05",
      title: "Working Capital",
      desc: "Biff participates in the Floe Agent Working Capital Facility. It borrows USDC when reserves fall below threshold, manages LTV risk via Chainlink oracles, and repays debt from organic API revenue.",
    },
    {
      step: "06",
      title: "Secure Infrastructure",
      desc: "Private keys never leave Coinbase's Secure Enclave. The CDP v2 Server Wallet provides persistent identity with enterprise-grade security. All transactions are signed within the enclave.",
    },
  ];

  const nextStep = () => setCurrentStep((prev) => (prev + 1) % sections.length);
  const prevStep = () => setCurrentStep((prev) => (prev - 1 + sections.length) % sections.length);

  return (
    <Layout>
      <div className="flex flex-col gap-12">

        <p className="text-text-muted text-sm leading-relaxed max-w-xl text-center mx-auto">
          An autonomous financial agent built on LangGraph, running on Base.
          It manages its own treasury through decentralized credit markets.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/tracking">
            <Button variant="minimal" size="md">Track State</Button>
          </Link>
          <a href="https://github.com/robinhodl69/biff_agent" target="_blank" rel="noopener noreferrer">
            <Button variant="minimal" size="md">Repository</Button>
          </a>
        </div>

        {/* Architecture */}
        <Panel label="Architecture">
          <pre className="text-primary text-[0.45rem] md:text-[0.6rem] lg:text-xs leading-tight whitespace-pre overflow-x-auto">
            {ARCHITECTURE_ASCII}
          </pre>
        </Panel>

        {/* Lifecycle */}
        <Panel
          label={`Lifecycle — ${sections[currentStep].step}`}
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevStep}>‹</Button>
              <Button variant="ghost" size="sm" onClick={nextStep}>›</Button>
            </div>
          }
        >
          <div className="border-l border-primary/30 pl-5 py-1">
            <Label as="p" className="mb-3">{sections[currentStep].title}</Label>
            <p className="text-text-muted text-sm leading-relaxed max-w-xl">
              {sections[currentStep].desc}
            </p>
          </div>

          <div className="flex gap-2 mt-6">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-px transition-all duration-200 ${
                  currentStep === i ? "w-8 bg-primary" : "w-3 bg-border-dim"
                }`}
              />
            ))}
          </div>
        </Panel>

      </div>
    </Layout>
  );
}

import { useAgent } from "../hooks/useAgent";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import Panel from "../components/Panel";
import Label from "../components/Label";
import Tag from "../components/Tag";
import Divider from "../components/Divider";
import Button from "../components/Button";
import { Lock } from "lucide-react";

export default function Admin() {
  const { isPaused, togglePause } = useAgent();
  const { isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Layout centered={true}>
        <Panel label="Auth Required">
          <div className="flex flex-col items-center text-center gap-8 py-4">
            <Lock size={24} className="text-text-muted" strokeWidth={1.5} />
            <p className="text-text-muted text-sm max-w-xs">
              Administrative access requires authentication.
            </p>
            <Button
              variant="minimal"
              onClick={() => login(import.meta.env.VITE_ADMIN_SECRET || "biff-admin-secret-change-me")}
              size="lg"
            >
              Authenticate
            </Button>
          </div>
        </Panel>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-xl">

        <Panel label="Control" action={
          <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
        }>
          <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Label>Process State</Label>
                <Tag color={isPaused ? "yellow" : "green"} pulse={!isPaused}>
                  {isPaused ? "Paused" : "Active"}
                </Tag>
              </div>
              <Button variant="secondary" size="sm" onClick={togglePause}>
                {isPaused ? "Resume" : "Pause"}
              </Button>
            </div>

            <Divider />

            {/* Critical overrides */}
            <div className="flex flex-col gap-3">
              <Label>Critical Overrides</Label>
              <div className="flex gap-6">
                <Button variant="ghost" size="sm">Reset</Button>
                <Button variant="danger" size="sm">Stop</Button>
              </div>
            </div>

          </div>
        </Panel>

        <Panel label="Telemetry">
          <div className="flex flex-col gap-6">

            {[
              { label: "Compute Load",       value: 32 },
              { label: "Memory Allocation",  value: 64 },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Label>{label}</Label>
                  <Label>{value}%</Label>
                </div>
                <div className="h-px bg-bg-elevated">
                  <div className="h-full bg-primary/60 transition-all" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}

            <Divider />

            {[
              { label: "Kernel",         value: "v4.2.1-lts" },
              { label: "Authentication", value: "ECDSA_S256" },
              { label: "Uptime",         value: "42:12:09" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <Label>{label}</Label>
                <span className="text-primary text-xs tabular-nums">{value}</span>
              </div>
            ))}

          </div>
        </Panel>

      </div>
    </Layout>
  );
}

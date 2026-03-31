import { useState } from "react";
import {
  Lock,
  Play,
  Pause,
  Zap,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAgentState, useAgentConfig } from "../hooks/useAgent";
import { apiPost } from "../api/client";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";

function LoginScreen({ onLogin }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await onLogin(secret);
    if (!result.success) {
      setError(result.error || "Invalid secret");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Lock size={24} className="text-brand" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">
            Admin Access
          </h1>
          <p className="text-text-muted text-sm text-center mb-6">
            Enter your admin secret to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Admin secret"
                className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-xl text-text-primary placeholder-text-dim focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all"
                autoFocus
              />
              {error && (
                <p className="text-error text-sm flex items-center gap-1.5 mt-2">
                  <AlertTriangle size={14} />
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full py-3 bg-brand text-bg-primary font-semibold rounded-xl hover:bg-brand-dim transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,65,0.2)]"
            >
              {loading ? "Authenticating..." : "Access Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FeedbackToast({ message, onClose }) {
  const isError =
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("not configured");

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevated max-w-sm ${
        isError
          ? "bg-error/10 border-error/30 text-error"
          : "bg-success/10 border-success/30 text-success"
      }`}
    >
      {isError ? <XCircle size={16} /> : <CheckCircle size={16} />}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { data: state, refetch: refetchState } = useAgentState();
  const { data: config, refetch: refetchConfig } = useAgentConfig();
  const [showConfig, setShowConfig] = useState(false);
  const [formConfig, setFormConfig] = useState({});
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const s = state || {};
  const c = config || {};

  const handleAction = async (action, body, label) => {
    setActionLoading(label);
    setFeedback("");
    try {
      const result = await apiPost(action, body);
      setFeedback(result.message || "Success");
      refetchState();
      refetchConfig();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigUpdate = async () => {
    const updates = {};
    if (formConfig.minUsdcBalance !== undefined)
      updates.minUsdcBalance = Number(formConfig.minUsdcBalance);
    if (formConfig.maxLtv !== undefined)
      updates.maxLtv = Number(formConfig.maxLtv);
    if (formConfig.loanWarnDays !== undefined)
      updates.loanWarnDays = Number(formConfig.loanWarnDays);
    if (formConfig.loopIntervalMin !== undefined)
      updates.loopIntervalMin = Number(formConfig.loopIntervalMin);

    if (Object.keys(updates).length === 0) {
      setFeedback("No changes to apply");
      return;
    }

    setFeedback("");
    try {
      const result = await apiPost("/api/config", updates);
      setFeedback(result.message || "Configuration updated");
      refetchState();
      refetchConfig();
      setFormConfig({});
    } catch (e) {
      setFeedback(e.message);
    }
  };

  const uptimeHours = s.startTime
    ? Math.floor((Date.now() - new Date(s.startTime).getTime()) / 3600000)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      {feedback && (
        <FeedbackToast message={feedback} onClose={() => setFeedback("")} />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Admin Panel
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              Control and configure the agent
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-text-muted hover:text-error transition-colors text-sm"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Status"
            value={s.isPaused ? "Paused" : s.isRunning ? "Running" : "Offline"}
            icon={<Shield size={16} />}
          />
          <StatCard
            label="Cycles"
            value={s.totalCycles || 0}
            icon={<Zap size={16} />}
          />
          <StatCard
            label="Errors"
            value={s.totalErrors || 0}
            icon={<AlertTriangle size={16} />}
          />
          <StatCard
            label="Interval"
            value={`${c.loopIntervalMin || 5}m`}
            icon={<Clock size={16} />}
          />
        </div>

        {/* Controls */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Controls
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {s.isPaused ? (
                <button
                  onClick={() => handleAction("/api/resume", null, "resume")}
                  disabled={actionLoading === "resume"}
                  className="flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/30 text-success rounded-xl hover:bg-success/20 transition-all disabled:opacity-50 text-sm font-medium"
                >
                  <Play size={16} />
                  Resume Agent
                </button>
              ) : (
                <button
                  onClick={() => handleAction("/api/pause", null, "pause")}
                  disabled={actionLoading === "pause"}
                  className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 border border-warning/30 text-warning rounded-xl hover:bg-warning/20 transition-all disabled:opacity-50 text-sm font-medium"
                >
                  <Pause size={16} />
                  Pause Agent
                </button>
              )}
              <button
                onClick={() => handleAction("/api/force-cycle", null, "cycle")}
                disabled={actionLoading === "cycle"}
                className="flex items-center gap-2 px-4 py-2.5 bg-bg-elevated border border-border-default text-text-secondary rounded-xl hover:text-text-primary hover:border-brand/30 transition-all disabled:opacity-50 text-sm"
              >
                <Zap size={16} />
                Force Cycle
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-text-dim text-xs uppercase tracking-wider mb-3">
                Force Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { action: "request_credit", label: "Request Credit" },
                  { action: "add_collateral", label: "Add Collateral" },
                  { action: "repay_or_renew", label: "Repay / Renew" },
                ].map(({ action, label }) => (
                  <button
                    key={action}
                    onClick={() =>
                      handleAction("/api/force-action", { action }, action)
                    }
                    disabled={actionLoading === action}
                    className="px-3 py-2 bg-bg-elevated border border-border-subtle text-text-muted rounded-lg hover:text-text-secondary hover:border-border-active transition-all disabled:opacity-50 text-xs font-mono"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-hover/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                <Settings size={16} />
              </div>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Configuration
              </h2>
            </div>
            {showConfig ? (
              <ChevronUp size={18} className="text-text-dim" />
            ) : (
              <ChevronDown size={18} className="text-text-dim" />
            )}
          </button>

          {showConfig && (
            <div className="px-6 pb-6 border-t border-border-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {[
                  {
                    key: "minUsdcBalance",
                    label: "Min USDC Balance",
                    current: c.minUsdcBalance ?? 50,
                  },
                  {
                    key: "maxLtv",
                    label: "Max LTV (%)",
                    current: c.maxLtv ?? 70,
                  },
                  {
                    key: "loanWarnDays",
                    label: "Loan Warn Days",
                    current: c.loanWarnDays ?? 3,
                  },
                  {
                    key: "loopIntervalMin",
                    label: "Loop Interval (min)",
                    current: c.loopIntervalMin ?? 5,
                  },
                ].map(({ key, label, current }) => (
                  <div key={key}>
                    <label className="block text-text-dim text-xs uppercase tracking-wider mb-1.5">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={formConfig[key] ?? current}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, [key]: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-text-dim text-xs">
                  Changes take effect on the next cycle
                </p>
                <button
                  onClick={handleConfigUpdate}
                  className="px-5 py-2.5 bg-brand text-bg-primary font-semibold rounded-xl hover:bg-brand-dim transition-all text-sm shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

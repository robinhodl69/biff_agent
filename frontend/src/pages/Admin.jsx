import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Play,
  Pause,
  Zap,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAgentState, useAgentConfig } from "../hooks/useAgent";
import { apiPost } from "../api/client";

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
      <div className="w-full max-w-md">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center">
              <Lock size={24} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
            Admin Access
          </h1>
          <p className="text-text-secondary text-center mb-6">
            Enter your admin secret to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-green-600 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-error text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full py-3 bg-green-600 rounded-lg text-bg-primary font-medium hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Access Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  variant = "default",
  children,
  disabled = false,
}) {
  const variants = {
    default:
      "bg-bg-elevated border-border-default text-text-primary hover:border-green-600",
    success: "bg-success/10 border-success/30 text-success hover:bg-success/20",
    warning: "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20",
    danger: "bg-error/10 border-error/30 text-error hover:bg-error/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { data: state, refetch: refetchState } = useAgentState();
  const { data: config, refetch: refetchConfig } = useAgentConfig();
  const [showConfig, setShowConfig] = useState(false);
  const [formConfig, setFormConfig] = useState({});
  const [feedback, setFeedback] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const s = state || {};
  const c = config || {};

  const handleAction = async (action, body) => {
    setFeedback("");
    try {
      const result = await apiPost(action, body);
      setFeedback(result.message || "Success");
      refetchState();
      refetchConfig();
    } catch (e) {
      setFeedback(e.message);
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

    await handleAction("/api/config", updates);
    setFormConfig({});
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-secondary hover:text-green-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/tracking"
              className="text-sm text-text-secondary hover:text-green-400 transition-colors"
            >
              Tracking
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-error transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-sm ${
              feedback.includes("Success") || feedback.includes("Success")
                ? "bg-success/10 text-success border border-success/30"
                : "bg-error/10 text-error border border-error/30"
            }`}
          >
            {feedback}
          </div>
        )}

        {/* Agent Status */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Agent Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-text-muted text-xs uppercase">Status</p>
              <p className="text-text-primary font-mono">
                {s.isPaused ? "Paused" : s.isRunning ? "Running" : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Cycles</p>
              <p className="text-text-primary font-mono">
                {s.totalCycles || 0}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Errors</p>
              <p className="text-text-primary font-mono">
                {s.totalErrors || 0}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Interval</p>
              <p className="text-text-primary font-mono">
                {c.loopIntervalMin || 5}m
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {s.isPaused ? (
              <ControlButton
                onClick={() => handleAction("/api/resume")}
                variant="success"
              >
                <Play size={16} /> Resume Agent
              </ControlButton>
            ) : (
              <ControlButton
                onClick={() => handleAction("/api/pause")}
                variant="warning"
              >
                <Pause size={16} /> Pause Agent
              </ControlButton>
            )}
            <ControlButton
              onClick={() => handleAction("/api/force-cycle")}
              variant="default"
            >
              <Zap size={16} /> Force Cycle
            </ControlButton>
            <ControlButton
              onClick={() =>
                handleAction("/api/force-action", { action: "request_credit" })
              }
              variant="default"
            >
              Force: Request Credit
            </ControlButton>
            <ControlButton
              onClick={() =>
                handleAction("/api/force-action", { action: "add_collateral" })
              }
              variant="default"
            >
              Force: Add Collateral
            </ControlButton>
            <ControlButton
              onClick={() =>
                handleAction("/api/force-action", { action: "repay_or_renew" })
              }
              variant="default"
            >
              Force: Repay/Renew
            </ControlButton>
          </div>
        </div>

        {/* Config */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-green-400" />
              <h2 className="text-lg font-semibold text-text-primary">
                Configuration
              </h2>
            </div>
            {showConfig ? (
              <ChevronUp size={18} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} className="text-text-muted" />
            )}
          </button>

          {showConfig && (
            <div className="px-6 pb-6 space-y-4 border-t border-border-subtle pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-xs uppercase mb-1">
                    Min USDC Balance
                  </label>
                  <input
                    type="number"
                    value={formConfig.minUsdcBalance ?? c.minUsdcBalance ?? 50}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        minUsdcBalance: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-xs uppercase mb-1">
                    Max LTV (%)
                  </label>
                  <input
                    type="number"
                    value={formConfig.maxLtv ?? c.maxLtv ?? 70}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, maxLtv: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-xs uppercase mb-1">
                    Loan Warn Days
                  </label>
                  <input
                    type="number"
                    value={formConfig.loanWarnDays ?? c.loanWarnDays ?? 3}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        loanWarnDays: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-xs uppercase mb-1">
                    Loop Interval (min)
                  </label>
                  <input
                    type="number"
                    value={formConfig.loopIntervalMin ?? c.loopIntervalMin ?? 5}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        loopIntervalMin: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>
              <button
                onClick={handleConfigUpdate}
                className="px-6 py-2.5 bg-green-600 rounded-lg text-bg-primary font-medium hover:bg-green-500 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

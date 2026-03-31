import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  Wallet,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  ExternalLink,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAgentState, useAgentHistory } from "../hooks/useAgent";

const COLORS = ["#00FF41", "#00CC33", "#D97706", "#DC2626", "#3B82F6"];

function StatusBadge({ isRunning, isPaused }) {
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
        <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
        Paused
      </span>
    );
  }
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-error/10 text-error rounded-full text-sm font-medium">
      <span className="w-2 h-2 bg-error rounded-full" />
      Error
    </span>
  );
}

function formatAddress(addr) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatUSD(val) {
  if (val == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
}

function Card({ title, icon, children, className = "" }) {
  return (
    <div
      className={`bg-bg-surface border border-border-subtle rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-text-secondary text-sm font-medium uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function Tracking() {
  const { data: state, isLoading: stateLoading } = useAgentState();
  const { data: history, isLoading: historyLoading } = useAgentHistory(50);

  if (stateLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading agent data...</div>
      </div>
    );
  }

  const s = state || {};
  const snapshot = s.currentSnapshot;
  const config = s.config || {};
  const loans = snapshot?.activeLoans || [];
  const totalPortfolio =
    (snapshot?.usdcBalance || 0) +
    (snapshot?.wethBalance || 0) * (snapshot?.wethPriceUSD || 0);

  // Action distribution for pie chart
  const actionCounts = {};
  (history || []).forEach((h) => {
    actionCounts[h.lastAction] = (actionCounts[h.lastAction] || 0) + 1;
  });
  const pieData = Object.entries(actionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // USDC history for sparkline
  const usdcHistory = (history || []).slice(-20).map((h, i) => ({
    cycle: i + 1,
    usdc: h.usdcBalance,
    weth: h.wethBalance,
  }));

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="border-b border-border-subtle sticky top-0 bg-bg-primary/90 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-secondary hover:text-green-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="text-sm text-text-secondary hover:text-green-400 transition-colors"
            >
              Admin
            </Link>
            <a
              href={`https://sepolia.basescan.org/address/${s.walletAddress || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-text-muted hover:text-green-400 transition-colors"
            >
              <ExternalLink size={14} />
              BaseScan
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 1. Agent Vitality */}
        <Card
          title="Agent Vitality"
          icon={<Activity size={18} className="text-green-400" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-text-muted text-xs uppercase">Status</p>
              <StatusBadge isRunning={s.isRunning} isPaused={s.isPaused} />
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Last Cycle</p>
              <p className="text-text-primary font-mono text-lg">
                {formatTimeAgo(s.lastCycleTime)}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Total Cycles</p>
              <p className="text-text-primary font-mono text-lg">
                {s.totalCycles || 0}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Uptime</p>
              <p className="text-text-primary font-mono text-lg">
                {s.startTime
                  ? `${Math.floor((Date.now() - new Date(s.startTime).getTime()) / 3600000)}h`
                  : "0h"}
              </p>
            </div>
          </div>
          {s.walletAddress && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-text-muted text-xs uppercase">Wallet</p>
              <p className="text-text-secondary font-mono text-sm">
                {formatAddress(s.walletAddress)}
              </p>
            </div>
          )}
        </Card>

        {/* 2. Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Portfolio"
            icon={<Wallet size={18} className="text-green-400" />}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-text-muted text-xs uppercase">
                  USDC Balance
                </p>
                <p className="text-text-primary font-mono text-2xl">
                  {formatUSD(snapshot?.usdcBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase">
                  WETH Balance
                </p>
                <p className="text-text-primary font-mono text-2xl">
                  {(snapshot?.wethBalance || 0).toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <div>
                <p className="text-text-muted text-xs uppercase">WETH Price</p>
                <p className="text-text-secondary font-mono">
                  {snapshot?.wethPriceUSD
                    ? formatUSD(snapshot.wethPriceUSD)
                    : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-text-muted text-xs uppercase">Total Value</p>
                <p className="text-green-400 font-mono text-xl font-bold">
                  {formatUSD(totalPortfolio)}
                </p>
              </div>
            </div>
          </Card>

          {/* 4. ROI & Performance */}
          <Card
            title="Performance"
            icon={<TrendingUp size={18} className="text-green-400" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-xs uppercase">Errors</p>
                <p className="text-text-primary font-mono text-2xl">
                  {s.totalErrors || 0}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase">
                  Success Rate
                </p>
                <p className="text-text-primary font-mono text-2xl">
                  {s.totalCycles > 0
                    ? `${Math.round(((s.totalCycles - (s.totalErrors || 0)) / s.totalCycles) * 100)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-text-muted text-xs uppercase">Last Action</p>
              <p className="text-text-primary font-mono">
                {snapshot?.lastAction || "N/A"}
              </p>
              {snapshot?.actionReason && (
                <p className="text-text-secondary text-sm mt-1">
                  {snapshot.actionReason}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* 3. Loan Health */}
        {loans.length > 0 && (
          <Card
            title="Loan Health"
            icon={<Shield size={18} className="text-green-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const ltvColor =
                  loan.ltv > 70
                    ? "text-error"
                    : loan.ltv > 60
                      ? "text-warning"
                      : "text-success";
                const daysColor =
                  loan.daysRemaining < 3
                    ? "text-error"
                    : loan.daysRemaining < 7
                      ? "text-warning"
                      : "text-success";
                return (
                  <div
                    key={loan.id}
                    className="p-4 bg-bg-elevated border border-border-subtle rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-text-primary font-mono font-semibold">
                        Loan #{loan.id}
                      </span>
                      <span className={`text-xs font-mono ${daysColor}`}>
                        {Math.floor(loan.daysRemaining)}d left
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">LTV</span>
                        <span className={`font-mono ${ltvColor}`}>
                          {loan.ltv.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-hover rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            loan.ltv > 70
                              ? "bg-error"
                              : loan.ltv > 60
                                ? "bg-warning"
                                : "bg-success"
                          }`}
                          style={{ width: `${Math.min(loan.ltv, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Principal</span>
                        <span className="text-text-secondary font-mono">
                          {formatUSD(loan.principal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Collateral</span>
                        <span className="text-text-secondary font-mono">
                          {loan.collateral.toFixed(4)} WETH
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 5. Decision Timeline + 6. Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Action Distribution"
            icon={<BarChart3 size={18} className="text-green-400" />}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E5E5E5" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-center py-8">
                No cycle data yet
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center gap-1.5 text-xs text-text-secondary"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="USDC Balance History"
            icon={<DollarSign size={18} className="text-green-400" />}
          >
            {usdcHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usdcHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                  <XAxis dataKey="cycle" stroke="#6B6B6B" fontSize={12} />
                  <YAxis stroke="#6B6B6B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E5E5E5" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usdc"
                    stroke="#00FF41"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-center py-8">
                No history data yet
              </p>
            )}
          </Card>
        </div>

        {/* 7. Recent Activity */}
        <Card
          title="Recent Activity"
          icon={<Clock size={18} className="text-green-400" />}
        >
          {historyLoading ? (
            <p className="text-text-muted text-center py-4">Loading...</p>
          ) : history && history.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...history]
                .reverse()
                .slice(0, 30)
                .map((cycle, i) => {
                  const actionColor =
                    cycle.lastAction === "credit_opened" ||
                    cycle.lastAction === "collateral_added" ||
                    cycle.lastAction === "repaid"
                      ? "text-success"
                      : cycle.lastAction === "credit_failed" ||
                          cycle.lastAction === "payment_error"
                        ? "text-error"
                        : cycle.lastAction === "idle"
                          ? "text-text-muted"
                          : "text-info";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg"
                    >
                      <div
                        className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          cycle.lastAction.includes("error") ||
                          cycle.lastAction === "credit_failed"
                            ? "bg-error"
                            : cycle.lastAction === "idle"
                              ? "bg-text-muted"
                              : "bg-green-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-sm font-medium ${actionColor}`}
                          >
                            {cycle.lastAction}
                          </span>
                          <span className="text-text-muted text-xs">
                            {new Date(cycle.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {cycle.actionReason && (
                          <p className="text-text-secondary text-xs mt-0.5 truncate">
                            {cycle.actionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-text-muted text-center py-8">
              No activity recorded yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

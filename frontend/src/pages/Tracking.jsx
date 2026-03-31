import {
  Activity,
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  ExternalLink,
  BarChart3,
  Shield,
  Zap,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAgentState, useAgentHistory } from "../hooks/useAgent";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import EmptyState from "../components/EmptyState";

const COLORS = ["#00FF41", "#00D4FF", "#F59E0B", "#EF4444", "#3B82F6"];

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
    minimumFractionDigits: 2,
  }).format(val);
}

function formatNumber(val, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

function SectionCard({ title, icon, children, className = "" }) {
  return (
    <div
      className={`bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
          {icon}
        </div>
        <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function LTVGauge({ value, max = 100 }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value > 70 ? "#EF4444" : value > 60 ? "#F59E0B" : "#22C55E";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-text-muted">LTV</span>
        <span className="font-mono font-medium" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 bg-bg-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 shadow-elevated">
      <p className="text-text-muted text-xs mb-1">Cycle {label}</p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="text-text-primary text-sm font-mono"
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          {typeof entry.value === "number"
            ? formatUSD(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Tracking() {
  const { data: state, isLoading: stateLoading } = useAgentState();
  const { data: history, isLoading: historyLoading } = useAgentHistory(50);

  if (stateLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const s = state || {};
  const snapshot = s.currentSnapshot;
  const loans = snapshot?.activeLoans || [];
  const totalPortfolio =
    (snapshot?.usdcBalance || 0) +
    (snapshot?.wethBalance || 0) * (snapshot?.wethPriceUSD || 0);

  // Action distribution
  const actionCounts = {};
  (history || []).forEach((h) => {
    actionCounts[h.lastAction] = (actionCounts[h.lastAction] || 0) + 1;
  });
  const pieData = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // USDC history for chart
  const usdcHistory = (history || []).slice(-20).map((h, i) => ({
    cycle: i + 1,
    usdc: h.usdcBalance,
  }));

  const successRate =
    s.totalCycles > 0
      ? Math.round(
          ((s.totalCycles - (s.totalErrors || 0)) / s.totalCycles) * 100,
        )
      : 0;

  const uptimeHours = s.startTime
    ? Math.floor((Date.now() - new Date(s.startTime).getTime()) / 3600000)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Agent Dashboard
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Real-time monitoring and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge isRunning={s.isRunning} isPaused={s.isPaused} />
            {s.walletAddress && (
              <a
                href={`https://sepolia.basescan.org/address/${s.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface border border-border-subtle rounded-lg text-text-muted text-xs hover:text-brand hover:border-brand/30 transition-all"
              >
                <ExternalLink size={12} />
                {formatAddress(s.walletAddress)}
              </a>
            )}
          </div>
        </div>

        {/* 1. Agent Vitality - Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Status"
            value={s.isPaused ? "Paused" : s.isRunning ? "Running" : "Offline"}
            icon={<Activity size={16} />}
          />
          <StatCard
            label="Last Cycle"
            value={formatTimeAgo(s.lastCycleTime)}
            icon={<Clock size={16} />}
          />
          <StatCard
            label="Total Cycles"
            value={formatNumber(s.totalCycles || 0, 0)}
            icon={<Zap size={16} />}
          />
          <StatCard
            label="Uptime"
            value={`${uptimeHours}h`}
            icon={<TrendingUp size={16} />}
          />
        </div>

        {/* 2. Portfolio + 4. Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Portfolio" icon={<Wallet size={18} />}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                  USDC Balance
                </p>
                <p className="text-text-primary font-mono text-2xl sm:text-3xl font-semibold tabular">
                  {formatUSD(snapshot?.usdcBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                  WETH Balance
                </p>
                <p className="text-text-primary font-mono text-2xl sm:text-3xl font-semibold tabular">
                  {formatNumber(snapshot?.wethBalance || 0, 4)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider">
                  WETH Price
                </p>
                <p className="text-text-secondary font-mono text-sm">
                  {snapshot?.wethPriceUSD
                    ? formatUSD(snapshot.wethPriceUSD)
                    : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-text-muted text-xs uppercase tracking-wider">
                  Total Value
                </p>
                <p className="text-brand font-mono text-xl sm:text-2xl font-bold glow-text tabular">
                  {formatUSD(totalPortfolio)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Performance" icon={<TrendingUp size={18} />}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                  Errors
                </p>
                <p className="text-text-primary font-mono text-2xl sm:text-3xl font-semibold tabular">
                  {s.totalErrors || 0}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                  Success Rate
                </p>
                <p
                  className={`font-mono text-2xl sm:text-3xl font-semibold tabular ${
                    successRate >= 90
                      ? "text-success"
                      : successRate >= 70
                        ? "text-warning"
                        : "text-error"
                  }`}
                >
                  {successRate}%
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                Last Action
              </p>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-mono text-sm font-medium">
                  {snapshot?.lastAction || "N/A"}
                </span>
                {snapshot?.actionReason && (
                  <span className="text-text-muted text-xs truncate">
                    — {snapshot.actionReason}
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* 3. Loan Health */}
        {loans.length > 0 ? (
          <SectionCard title="Loan Health" icon={<Shield size={18} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const daysColor =
                  loan.daysRemaining < 3
                    ? "text-error"
                    : loan.daysRemaining < 7
                      ? "text-warning"
                      : "text-success";
                return (
                  <div
                    key={loan.id}
                    className="p-4 bg-bg-card border border-border-subtle rounded-xl card-hover"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-primary font-mono font-semibold text-sm">
                        Loan #{loan.id}
                      </span>
                      <span
                        className={`text-xs font-mono font-medium ${daysColor}`}
                      >
                        {Math.floor(loan.daysRemaining)}d left
                      </span>
                    </div>
                    <div className="space-y-3">
                      <LTVGauge value={loan.ltv} />
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Principal</span>
                        <span className="text-text-secondary font-mono tabular">
                          {formatUSD(loan.principal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Collateral</span>
                        <span className="text-text-secondary font-mono tabular">
                          {formatNumber(loan.collateral, 4)} WETH
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Loan Health" icon={<Shield size={18} />}>
            <EmptyState
              title="No active loans"
              description="The agent has no open positions on Floe Protocol"
            />
          </SectionCard>
        )}

        {/* 5. Action Distribution + 6. USDC History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            title="Action Distribution"
            icon={<BarChart3 size={18} />}
          >
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161616",
                        border: "1px solid #262626",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      }}
                      labelStyle={{ color: "#9ca3af" }}
                      itemStyle={{ color: "#f0f0f0", fontFamily: "monospace" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2 pt-4 border-t border-border-subtle">
                  {pieData.map((d, i) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-text-secondary font-mono tabular">
                        {d.value}
                      </span>
                      <span className="text-text-muted">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No cycle data"
                description="Action distribution will appear after the agent completes cycles"
              />
            )}
          </SectionCard>

          <SectionCard
            title="USDC Balance History"
            icon={<DollarSign size={18} />}
          >
            {usdcHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={usdcHistory}>
                  <defs>
                    <linearGradient
                      id="usdcGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="cycle"
                    stroke="#4b5563"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#4b5563"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="usdc"
                    stroke="#00FF41"
                    strokeWidth={2}
                    fill="url(#usdcGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#00FF41",
                      stroke: "#050505",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No history data"
                description="Balance history will appear as the agent runs cycles"
              />
            )}
          </SectionCard>
        </div>

        {/* 7. Recent Activity */}
        <SectionCard title="Recent Activity" icon={<Clock size={18} />}>
          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-lg" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {[...history]
                .reverse()
                .slice(0, 30)
                .map((cycle, i) => {
                  const isError =
                    cycle.lastAction.includes("error") ||
                    cycle.lastAction === "credit_failed";
                  const isSuccess = [
                    "credit_opened",
                    "collateral_added",
                    "repaid",
                    "monitor",
                  ].includes(cycle.lastAction);
                  const dotColor = isError
                    ? "bg-error"
                    : isSuccess
                      ? "bg-brand"
                      : "bg-text-dim";

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 bg-bg-card border border-transparent hover:border-border-subtle rounded-lg transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-2 h-2 rounded-full ${dotColor}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                              isError
                                ? "text-error"
                                : isSuccess
                                  ? "text-brand"
                                  : "text-text-muted"
                            }`}
                          >
                            {cycle.lastAction.replace(/_/g, " ")}
                          </span>
                          <span className="text-text-dim text-[10px] font-mono">
                            {new Date(cycle.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {cycle.actionReason && (
                          <p className="text-text-muted text-xs mt-0.5 truncate">
                            {cycle.actionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              title="No activity recorded"
              description="Recent activity will appear as the agent completes cycles"
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

import { useAgent, useAgentState, useAgentHistory } from "../hooks/useAgent";
import { StatCard } from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import Panel from "../components/Panel";
import Button from "../components/Button";
import { Wallet, ArrowUpRight, History, RefreshCcw } from "lucide-react";

export default function Tracking() {
  const { state, isLoading } = useAgent();
  const { refetch: refetchState } = useAgentState();
  const { refetch: refetchHistory } = useAgentHistory(50);

  const handleRefresh = async () => {
    await Promise.all([refetchState(), refetchHistory()]);
  };

  const isInitialLoading = isLoading && (!state || !state.balance);

  if (isInitialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="text-text-muted text-[10px] tracking-widest uppercase">Loading</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-10">

        <div className="flex items-center justify-between">
          <StatusBadge isRunning={state?.isRunning} isPaused={state?.isPaused} />
          <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <StatCard label="Balance" value={`$${state?.balance || "0.00"}`} icon={<Wallet size={14} />} />
          <StatCard label="Loans"   value={state?.loans   || "0"}          icon={<ArrowUpRight size={14} />} />
          <StatCard label="Cycles"  value={state?.cycles  || "0"}          icon={<History size={14} />} />
        </div>

        <Panel label="History">
          {state?.logs?.length > 0 ? (
            <div className="divide-y divide-border-dim -mx-6 -mb-6">
              {state.logs.map((log, i) => (
                <div key={i} className="px-6 py-3 flex gap-6">
                  <span className="text-text-muted text-[10px] shrink-0 tabular-nums">{log.timestamp}</span>
                  <span className="text-primary/40 text-[10px] shrink-0 tabular-nums">{log.id}</span>
                  <span className="text-text-muted text-[10px] flex-grow">{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No logs yet" description="The agent has not generated any logs yet." />
          )}
        </Panel>

      </div>
    </Layout>
  );
}

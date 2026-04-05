import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../api/client";

export function useAgentState() {
  return useQuery({
    queryKey: ["agentState"],
    queryFn: () => apiGet("/api/state"),
  });
}

export function useAgentHistory(limit = 100) {
  return useQuery({
    queryKey: ["agentHistory", limit],
    queryFn: () => apiGet(`/api/history?limit=${limit}`),
  });
}

export function useAgentConfig() {
  return useQuery({
    queryKey: ["agentConfig"],
    queryFn: () => apiGet("/api/config"),
  });
}

/**
 * Consolidated hook for agent state and controls
 */
export function useAgent() {
  const queryClient = useQueryClient();
  const stateQuery = useAgentState();
  const historyQuery = useAgentHistory(50);

  const pauseMutation = useMutation({
    mutationFn: () => apiPost("/api/pause"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentState"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiPost("/api/resume"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentState"] }),
  });

  return {
    state: {
      ...stateQuery.data,
      logs: historyQuery.data || []
    },
    isLoading: stateQuery.isLoading || historyQuery.isLoading,
    isError: stateQuery.isError || historyQuery.isError,
    isPaused: stateQuery.data?.isPaused,
    togglePause: () => {
      if (stateQuery.data?.isPaused) {
        resumeMutation.mutate();
      } else {
        pauseMutation.mutate();
      }
    }
  };
}

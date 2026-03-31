import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";

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

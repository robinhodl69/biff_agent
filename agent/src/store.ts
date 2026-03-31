import fs from "fs";
import path from "path";
import { BiffAction } from "./state";
import { logger } from "./logger";

const DATA_DIR = path.join(__dirname, "..", "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

export interface AgentConfig {
  minUsdcBalance: number;
  maxLtv: number;
  loanWarnDays: number;
  loopIntervalMin: number;
  isPaused: boolean;
}

export interface CycleSnapshot {
  timestamp: string;
  usdcBalance: number;
  wethBalance: number;
  wethPriceUSD: number | null;
  activeLoans: Array<{
    id: string;
    ltv: number;
    daysRemaining: number;
    principal: number;
    collateral: number;
  }>;
  lastAction: BiffAction;
  actionReason: string;
  llmCostEstimate: number;
  gasEstimate: number;
}

export interface AgentState {
  isRunning: boolean;
  isPaused: boolean;
  lastCycleTime: string | null;
  nextCycleTime: string | null;
  totalCycles: number;
  totalErrors: number;
  startTime: string;
  walletAddress: string | null;
  currentSnapshot: CycleSnapshot | null;
  config: AgentConfig;
  history: CycleSnapshot[];
}

const DEFAULT_CONFIG: AgentConfig = {
  minUsdcBalance: 50,
  maxLtv: 70,
  loanWarnDays: 3,
  loopIntervalMin: 5,
  isPaused: false,
};

const MAX_HISTORY = 1000;

class AgentStore {
  private state: AgentState;
  private forceCycleTrigger = false;
  private forceActionOverride: BiffAction | null = null;

  constructor(walletAddress?: string) {
    this.state = {
      isRunning: false,
      isPaused: false,
      lastCycleTime: null,
      nextCycleTime: null,
      totalCycles: 0,
      totalErrors: 0,
      startTime: new Date().toISOString(),
      walletAddress: walletAddress || null,
      currentSnapshot: null,
      config: this.loadConfig(),
      history: this.loadHistory(),
    };
  }

  // ─── Persistence ───────────────────────────────────────────────

  private loadConfig(): AgentConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (e) {
      logger.error("Failed to load config, using defaults");
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.state.config, null, 2));
    } catch (e) {
      logger.error("Failed to save config");
    }
  }

  private loadHistory(): CycleSnapshot[] {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("Failed to load history");
    }
    return [];
  }

  private saveHistory() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(this.state.history, null, 2),
      );
    } catch (e) {
      logger.error("Failed to save history");
    }
  }

  // ─── State Accessors ───────────────────────────────────────────

  getState(): AgentState {
    const intervalMs = this.state.config.loopIntervalMin * 60 * 1000;
    const nextCycle = this.state.lastCycleTime
      ? new Date(
          new Date(this.state.lastCycleTime).getTime() + intervalMs,
        ).toISOString()
      : null;

    return {
      ...this.state,
      nextCycleTime: this.state.isPaused ? null : nextCycle,
    };
  }

  getConfig(): AgentConfig {
    return { ...this.state.config };
  }

  getHistory(limit = 100): CycleSnapshot[] {
    return this.state.history.slice(-limit);
  }

  isPaused(): boolean {
    return this.state.config.isPaused;
  }

  shouldForceCycle(): boolean {
    if (this.forceCycleTrigger) {
      this.forceCycleTrigger = false;
      return true;
    }
    return false;
  }

  getForcedAction(): BiffAction | null {
    const action = this.forceActionOverride;
    this.forceActionOverride = null;
    return action;
  }

  // ─── State Mutators ────────────────────────────────────────────

  setRunning(running: boolean) {
    this.state.isRunning = running;
  }

  setWalletAddress(address: string) {
    this.state.walletAddress = address;
  }

  pause() {
    this.state.config.isPaused = true;
    this.state.isPaused = true;
    this.saveConfig();
    logger.info("Agent paused via admin");
  }

  resume() {
    this.state.config.isPaused = false;
    this.state.isPaused = false;
    this.saveConfig();
    logger.info("Agent resumed via admin");
  }

  forceCycle() {
    this.forceCycleTrigger = true;
    logger.info("Force cycle triggered");
  }

  forceAction(action: BiffAction) {
    this.forceActionOverride = action;
    logger.info(`Force action set: ${action}`);
  }

  updateConfig(updates: Partial<AgentConfig>) {
    this.state.config = { ...this.state.config, ...updates };
    this.saveConfig();
    logger.info("Config updated", { updates });
  }

  recordCycle(snapshot: CycleSnapshot) {
    this.state.currentSnapshot = snapshot;
    this.state.lastCycleTime = snapshot.timestamp;
    this.state.totalCycles++;
    this.state.history.push(snapshot);

    if (this.state.history.length > MAX_HISTORY) {
      this.state.history = this.state.history.slice(-MAX_HISTORY);
    }

    this.saveHistory();
  }

  recordError() {
    this.state.totalErrors++;
  }

  getUptimeHours(): number {
    const start = new Date(this.state.startTime).getTime();
    const now = Date.now();
    return (now - start) / (1000 * 60 * 60);
  }
}

let store: AgentStore | null = null;

export function initStore(walletAddress?: string): AgentStore {
  store = new AgentStore(walletAddress);
  return store;
}

export function getStore(): AgentStore {
  if (!store)
    throw new Error("AgentStore not initialized. Call initStore() first.");
  return store;
}

import { ExperimentGroup, LogEntry, PerformanceMetric, User } from '../types';

class MonitoringService {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  
  // Assign a user to a group deterministically based on ID, or randomly if new
  public assignGroup(userId: string): ExperimentGroup {
    // Simple hash to ensure the same user always gets the same group
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'A_STABLE' : 'B_CANARY';
  }

  public logError(message: string, user?: User | null, meta?: any) {
    this.addLog('ERROR', message, user, meta);
  }

  public logInfo(message: string, user?: User | null, meta?: any) {
    this.addLog('INFO', message, user, meta);
  }

  public trackPerformance(operation: string, durationMs: number, success: boolean, user?: User | null) {
    const metric: PerformanceMetric = {
      operation,
      durationMs,
      success,
      group: user?.abGroup || 'A_STABLE',
      timestamp: Date.now()
    };
    this.metrics.push(metric);
    
    // In a real app, you would batch send this to a backend (Datadog, Sentry, etc.)
    if (!success) {
      console.error(`[Monitor] ${operation} failed (${durationMs}ms) for group ${metric.group}`);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  public getStats() {
    const totalA = this.metrics.filter(m => m.group === 'A_STABLE');
    const totalB = this.metrics.filter(m => m.group === 'B_CANARY');
    
    const errorsA = totalA.filter(m => !m.success).length;
    const errorsB = totalB.filter(m => !m.success).length;

    return {
      groupA: {
        total: totalA.length,
        errors: errorsA,
        errorRate: totalA.length ? (errorsA / totalA.length * 100).toFixed(1) : '0.0',
        avgLatency: totalA.length ? Math.round(totalA.reduce((sum, m) => sum + m.durationMs, 0) / totalA.length) : 0
      },
      groupB: {
        total: totalB.length,
        errors: errorsB,
        errorRate: totalB.length ? (errorsB / totalB.length * 100).toFixed(1) : '0.0',
        avgLatency: totalB.length ? Math.round(totalB.reduce((sum, m) => sum + m.durationMs, 0) / totalB.length) : 0
      }
    };
  }

  private addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, user?: User | null, meta?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      level,
      message,
      userId: user?.id,
      group: user?.abGroup,
      metadata: meta
    };
    this.logs.unshift(entry);
    
    // Keep log size manageable in memory
    if (this.logs.length > 500) {
        this.logs = this.logs.slice(0, 500);
    }
    
    if (level === 'ERROR') {
        console.error(`[${entry.group || 'Unknown'}] ${message}`, meta);
    }
  }
}

export const monitor = new MonitoringService();
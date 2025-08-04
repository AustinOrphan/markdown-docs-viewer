/**
 * Production Error Handling Module
 * Provides comprehensive error handling for production optimization scenarios
 */

import { OptimizationErrorType, OptimizationErrorContext } from './base-errors';

export interface ProductionErrorReport {
  error: BaseOptimizationError;
  context: OptimizationErrorContext;
  timestamp: number;
  recoveryAction?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'disable' | 'escalate';
  maxAttempts?: number;
  backoffMs?: number;
  fallbackMethod?: string;
}

export class ProductionErrorHandler {
  private errorHistory: ProductionErrorReport[] = [];
  private recoveryStrategies: Map<OptimizationErrorType, ErrorRecoveryStrategy> = new Map();
  private maxErrorHistorySize: number = 1000;

  constructor() {
    this.initializeDefaultRecoveryStrategies();
  }

  private initializeDefaultRecoveryStrategies(): void {
    // Default recovery strategies for different error types
    this.recoveryStrategies.set(OptimizationErrorType.CONFIG_DISCOVERY_FAILED, {
      type: 'retry',
      maxAttempts: 3,
      backoffMs: 1000,
    });

    this.recoveryStrategies.set(OptimizationErrorType.DOCUMENT_DISCOVERY_FAILED, {
      type: 'fallback',
      maxAttempts: 2,
      fallbackMethod: 'basic-discovery',
    });

    this.recoveryStrategies.set(OptimizationErrorType.REQUEST_POOL_EXHAUSTED, {
      type: 'retry',
      maxAttempts: 1,
      backoffMs: 2000,
    });

    this.recoveryStrategies.set(OptimizationErrorType.CACHE_CORRUPTION, {
      type: 'fallback',
      fallbackMethod: 'clear-cache-and-retry',
    });
  }

  handleError(error: BaseOptimizationError, context: OptimizationErrorContext): ProductionErrorReport {
    const report: ProductionErrorReport = {
      error,
      context,
      timestamp: Date.now(),
      severity: this.determineSeverity(error, context),
    };

    // Add recovery action based on error type
    const strategy = this.recoveryStrategies.get(error.type);
    if (strategy) {
      report.recoveryAction = this.generateRecoveryAction(strategy);
    }

    // Store in error history
    this.errorHistory.push(report);
    this.trimErrorHistory();

    // Log error for monitoring
    this.logError(report);

    return report;
  }

  private determineSeverity(error: BaseOptimizationError, context: OptimizationErrorContext): ProductionErrorReport['severity'] {
    // Determine severity based on error type and context
    switch (error.type) {
      case OptimizationErrorType.CONFIG_DISCOVERY_FAILED:
      case OptimizationErrorType.CACHE_CORRUPTION:
        return 'high';
      
      case OptimizationErrorType.REQUEST_POOL_EXHAUSTED:
        return 'critical';
      
      case OptimizationErrorType.DOCUMENT_DISCOVERY_FAILED:
        return context.retryAttempt && context.retryAttempt > 2 ? 'high' : 'medium';
      
      default:
        return 'medium';
    }
  }

  private generateRecoveryAction(strategy: ErrorRecoveryStrategy): string {
    switch (strategy.type) {
      case 'retry':
        return `Retrying operation (max ${strategy.maxAttempts} attempts with ${strategy.backoffMs}ms backoff)`;
      case 'fallback':
        return `Using fallback method: ${strategy.fallbackMethod}`;
      case 'disable':
        return 'Disabling optimization feature temporarily';
      case 'escalate':
        return 'Escalating error to higher-level error handler';
      default:
        return 'No specific recovery action defined';
    }
  }

  private trimErrorHistory(): void {
    if (this.errorHistory.length > this.maxErrorHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistorySize / 2);
    }
  }

  private logError(report: ProductionErrorReport): void {
    const logLevel = report.severity === 'critical' ? 'error' : 
                     report.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel]('Production Error:', {
      type: report.error.type,
      message: report.error.message,
      severity: report.severity,
      context: report.context,
      recoveryAction: report.recoveryAction,
      timestamp: new Date(report.timestamp).toISOString(),
    });
  }

  getErrorHistory(): ProductionErrorReport[] {
    return [...this.errorHistory];
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ProductionErrorReport[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    for (const report of this.errorHistory) {
      errorsByType[report.error.type] = (errorsByType[report.error.type] || 0) + 1;
      errorsBySeverity[report.severity] = (errorsBySeverity[report.severity] || 0) + 1;
    }

    // Get errors from last 24 hours
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(report => report.timestamp > twentyFourHoursAgo);

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors,
    };
  }

  setRecoveryStrategy(errorType: OptimizationErrorType, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// Global instance
let globalErrorHandler: ProductionErrorHandler | null = null;

export function getGlobalProductionErrorHandler(): ProductionErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ProductionErrorHandler();
  }
  return globalErrorHandler;
}

export function resetGlobalProductionErrorHandler(): void {
  globalErrorHandler = null;
}

// Export aliases for backward compatibility
export const createProductionErrorHandling = ProductionErrorHandler;
export type ErrorContext = OptimizationErrorContext;

// Create BaseOptimizationError class here since it's expected by the production error handler
export class BaseOptimizationError extends Error {
  constructor(
    public type: OptimizationErrorType,
    public message: string,
    public context?: OptimizationErrorContext
  ) {
    super(message);
    this.name = 'BaseOptimizationError';
  }
}

export type OptimizationError = BaseOptimizationError;
export type ErrorPattern = {
  errorType: OptimizationErrorType;
  frequency: number;
  contexts: OptimizationErrorContext[];
};
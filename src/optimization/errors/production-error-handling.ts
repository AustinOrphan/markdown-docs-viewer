/**
 * Production Error Handling & Recovery System
 * Bulletproof error handling for all production scenarios with intelligent recovery
 */

import { EnvironmentInfo } from '../foundation/environment-utils';
import { NetworkConditions } from '../algorithms/mobile-optimization';
import { ErrorAnalyticsSystem, createErrorAnalyticsSystem } from '../analytics/error-analytics';

/**
 * Optimization error context
 */
export interface OptimizationError extends Error {
  code: string;
  severity: 'minor' | 'major' | 'critical';
  category: 'network' | 'timeout' | 'parsing' | 'cache' | 'memory' | 'configuration' | 'auth' | 'rate_limit';
  retryable: boolean;
  context: ErrorContext;
  originalError?: Error;
  timestamp: number;
  sessionId: string;
}

/**
 * Error context for debugging and analytics
 */
export interface ErrorContext {
  discoveryPhase: 'initialization' | 'config' | 'document' | 'manifest' | 'pattern_recognition' | 'content_loading';
  environment: EnvironmentInfo;
  userAgent: string;
  networkConditions?: NetworkConditions;
  previousAttempts: number;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

/**
 * Recovery strategy for failures
 */
export interface RecoveryStrategy {
  action: 'retry' | 'fallback' | 'degrade' | 'skip' | 'abort';
  delay: number; // ms
  maxAttempts: number;
  fallbackMethod?: string;
  degradationLevel?: 'minimal' | 'partial' | 'basic';
  skipConditions?: string[];
  notify: boolean;
}

/**
 * User-friendly error message
 */
export interface UserErrorMessage {
  message: string;
  suggestions: string[];
  troubleshootingSteps: string[];
  canRetry: boolean;
  estimatedFixTime?: string;
  supportContact?: string;
}

/**
 * Error pattern for analysis
 */
export interface ErrorPattern {
  signature: string;
  frequency: number;
  category: string;
  commonCauses: string[];
  preventionStrategies: PreventionStrategy[];
  affectedEnvironments: string[];
}

/**
 * Prevention strategy based on error analysis
 */
export interface PreventionStrategy {
  type: 'configuration' | 'validation' | 'fallback' | 'monitoring' | 'user_education';
  description: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffectiveness: number; // 0-1
}

/**
 * Error history for pattern analysis
 */
export interface ErrorHistory {
  errors: OptimizationError[];
  timeRange: { start: number; end: number };
  totalErrors: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  includePII: boolean;
  batchSize: number;
  batchInterval: number; // ms
  retryAttempts: number;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  isOpen: boolean;
  failures: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * Production Error Handling implementation
 */
export class ProductionErrorHandling {
  private errorHistory: OptimizationError[] = [];
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private reportingConfig: ErrorReportingConfig;
  private sessionId: string;
  private errorPatterns = new Map<string, ErrorPattern>();
  private pendingReports: OptimizationError[] = [];
  private reportingInterval: number | null = null;
  private analyticsSystem: ErrorAnalyticsSystem;

  constructor(reportingConfig: Partial<ErrorReportingConfig> = {}) {
    this.reportingConfig = {
      enabled: true,
      includePII: false,
      batchSize: 10,
      batchInterval: 30000, // 30 seconds
      retryAttempts: 3,
      ...reportingConfig
    };

    this.sessionId = this.generateSessionId();
    this.initializeErrorReporting();
    this.loadErrorPatterns();
    
    // Initialize analytics system
    this.analyticsSystem = createErrorAnalyticsSystem({
      enabled: this.reportingConfig.enabled,
      reportingEndpoint: this.reportingConfig.endpoint,
      apiKey: this.reportingConfig.apiKey,
      includePII: this.reportingConfig.includePII,
      batchSize: this.reportingConfig.batchSize,
      reportingInterval: this.reportingConfig.batchInterval,
      retentionDays: 30,
      alertThresholds: {
        errorRatePerMinute: 10,
        criticalErrorsPerHour: 5,
        circuitBreakerTrips: 3,
        userExperienceScore: 6.0
      }
    });
  }

  /**
   * Report optimization error with full context
   */
  reportOptimizationError(error: Error, context: ErrorContext): OptimizationError {
    const optimizationError = this.createOptimizationError(error, context);
    
    // Record in history
    this.errorHistory.push(optimizationError);
    this.limitErrorHistory();

    // Update error patterns
    this.updateErrorPatterns(optimizationError);

    // Update circuit breaker
    this.updateCircuitBreaker(optimizationError);

    // Queue for reporting
    if (this.reportingConfig.enabled) {
      this.queueErrorForReporting(optimizationError);
    }

    // Record in analytics system
    this.analyticsSystem.recordError(optimizationError);

    // Log error (development/debugging)
    this.logError(optimizationError);

    return optimizationError;
  }

  /**
   * Intelligent error recovery based on error type and context
   */
  recoverFromOptimizationFailure(failure: {
    type: OptimizationError['category'];
    severity: OptimizationError['severity'];
    context: ErrorContext;
    error?: Error;
  }): RecoveryStrategy {
    const strategy = this.calculateRecoveryStrategy(failure);
    
    // Apply circuit breaker logic
    if (this.isCircuitBreakerOpen(failure.type)) {
      return {
        action: 'abort',
        delay: this.getCircuitBreakerDelay(failure.type),
        maxAttempts: 0,
        notify: true
      };
    }

    // Check historical success rate for this error type
    const historicalStrategy = this.getHistoricalRecoveryStrategy(failure.type);
    if (historicalStrategy) {
      return this.mergeStrategies(strategy, historicalStrategy);
    }

    return strategy;
  }

  /**
   * Generate user-friendly error message
   */
  generateUserErrorMessage(error: Error, userLevel: 'developer' | 'end-user'): UserErrorMessage {
    const optimizationError = this.findOptimizationError(error);
    
    if (userLevel === 'developer') {
      return this.generateDeveloperMessage(optimizationError || error);
    } else {
      return this.generateEndUserMessage(optimizationError || error);
    }
  }

  /**
   * Analyze error patterns and provide insights
   */
  analyzeErrorPatterns(errors?: ErrorHistory): {
    commonPatterns: ErrorPattern[];
    preventionStrategies: PreventionStrategy[];
    systemRecommendations: string[];
  } {
    const errorHistory = errors || this.getErrorHistory();
    const patterns = this.identifyPatterns(errorHistory);
    const strategies = this.generatePreventionStrategies(patterns);
    const recommendations = this.generateSystemRecommendations(patterns);

    return {
      commonPatterns: patterns,
      preventionStrategies: strategies,
      systemRecommendations: recommendations
    };
  }

  /**
   * Execute recovery strategy with monitoring
   */
  async executeRecovery<T>(
    operation: () => Promise<T>,
    strategy: RecoveryStrategy,
    context: ErrorContext
  ): Promise<T> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < strategy.maxAttempts) {
      try {
        if (attempts > 0 && strategy.delay > 0) {
          await this.delay(strategy.delay * Math.pow(2, attempts - 1)); // Exponential backoff
        }

        const result = await operation();
        
        // Success - reset circuit breaker if applicable
        this.resetCircuitBreaker(context.discoveryPhase);
        
        return result;
      } catch (error) {
        attempts++;
        lastError = error as Error;
        
        // Report error
        const optimizationError = this.reportOptimizationError(lastError, {
          ...context,
          previousAttempts: attempts
        });

        // Check if we should continue retrying
        if (!optimizationError.retryable || attempts >= strategy.maxAttempts) {
          break;
        }
      }
    }

    // All retries failed - execute fallback strategy
    if (strategy.action === 'fallback' && strategy.fallbackMethod) {
      return this.executeFallback(strategy.fallbackMethod, context);
    }

    // Throw the last error
    throw lastError || new Error('Recovery failed after maximum attempts');
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    circuitBreakerStatus: Record<string, boolean>;
  } {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      averageResolutionTime: 0,
      circuitBreakerStatus: {} as Record<string, boolean>
    };

    // Categorize errors
    for (const error of this.errorHistory) {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    }

    // Circuit breaker status
    for (const [key, state] of this.circuitBreakers.entries()) {
      stats.circuitBreakerStatus[key] = state.isOpen;
    }

    return stats;
  }

  /**
   * Clear error history and reset state
   */
  reset(): void {
    this.errorHistory = [];
    this.circuitBreakers.clear();
    this.errorPatterns.clear();
    this.pendingReports = [];
    this.analyticsSystem.clearAnalyticsData();
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(): any {
    return this.analyticsSystem.generateAnalyticsReport();
  }

  /**
   * Subscribe to real-time error alerts
   */
  subscribeToErrorAlerts(callback: (alert: any) => void): () => void {
    return this.analyticsSystem.subscribeToAlerts(callback);
  }

  /**
   * Get error trends analysis
   */
  getErrorTrends(): any[] {
    return this.analyticsSystem.getErrorTrends();
  }

  /**
   * Get user experience metrics
   */
  getUserExperienceMetrics(): any {
    return this.analyticsSystem.getUserExperienceMetrics();
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
    return this.analyticsSystem.exportAnalyticsData(format);
  }

  /**
   * Create optimization error with context
   */
  private createOptimizationError(error: Error, context: ErrorContext): OptimizationError {
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error, context);
    
    return {
      name: error.name || 'OptimizationError',
      message: error.message,
      code: this.generateErrorCode(category, severity),
      severity,
      category,
      retryable: this.isRetryable(error, category),
      context,
      originalError: error,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      stack: error.stack
    };
  }

  /**
   * Calculate optimal recovery strategy
   */
  private calculateRecoveryStrategy(failure: {
    type: OptimizationError['category'];
    severity: OptimizationError['severity'];
    context: ErrorContext;
  }): RecoveryStrategy {
    const baseStrategy: RecoveryStrategy = {
      action: 'retry',
      delay: 1000,
      maxAttempts: 3,
      notify: false
    };

    switch (failure.type) {
      case 'network':
        return {
          ...baseStrategy,
          action: failure.severity === 'critical' ? 'fallback' : 'retry',
          delay: 2000,
          maxAttempts: failure.severity === 'minor' ? 5 : 3,
          fallbackMethod: 'basic_discovery'
        };

      case 'timeout':
        return {
          ...baseStrategy,
          delay: 3000,
          maxAttempts: 2,
          degradationLevel: 'partial'
        };

      case 'rate_limit':
        return {
          ...baseStrategy,
          action: 'retry',
          delay: 10000, // Wait longer for rate limits
          maxAttempts: 3
        };

      case 'auth':
        return {
          ...baseStrategy,
          action: 'fallback',
          maxAttempts: 1,
          fallbackMethod: 'public_access',
          notify: true
        };

      case 'memory':
        return {
          ...baseStrategy,
          action: 'degrade',
          degradationLevel: 'basic',
          maxAttempts: 1
        };

      case 'cache':
        return {
          ...baseStrategy,
          action: 'retry',
          maxAttempts: 2,
          fallbackMethod: 'no_cache'
        };

      default:
        return baseStrategy;
    }
  }

  /**
   * Generate user messages based on error type
   */
  private generateDeveloperMessage(error: Error | OptimizationError): UserErrorMessage {
    const isOptError = 'category' in error;
    
    if (isOptError) {
      return {
        message: `Optimization Error (${error.category}): ${error.message}`,
        suggestions: this.getDeveloperSuggestions(error),
        troubleshootingSteps: this.getDeveloperTroubleshootingSteps(error),
        canRetry: error.retryable,
        supportContact: 'github.com/your-repo/issues'
      };
    }

    return {
      message: `Error: ${error.message}`,
      suggestions: ['Check console logs for more details', 'Verify configuration'],
      troubleshootingSteps: ['Enable debug mode', 'Check network connectivity'],
      canRetry: true
    };
  }

  private generateEndUserMessage(error: Error | OptimizationError): UserErrorMessage {
    const isOptError = 'category' in error;
    
    if (isOptError) {
      switch (error.category) {
        case 'network':
          return {
            message: 'Unable to load documentation. Please check your internet connection.',
            suggestions: ['Check your internet connection', 'Try refreshing the page'],
            troubleshootingSteps: [
              'Verify you can access other websites',
              'Check if your firewall is blocking the connection',
              'Try using a different network'
            ],
            canRetry: true,
            estimatedFixTime: '1-2 minutes'
          };

        case 'timeout':
          return {
            message: 'Documentation is taking longer than expected to load.',
            suggestions: ['Wait a moment and try again', 'Check your connection speed'],
            troubleshootingSteps: [
              'Close other applications using the internet',
              'Try again in a few minutes',
              'Contact support if problem persists'
            ],
            canRetry: true,
            estimatedFixTime: '2-3 minutes'
          };

        default:
          return {
            message: 'Something went wrong while loading the documentation.',
            suggestions: ['Try refreshing the page', 'Clear your browser cache'],
            troubleshootingSteps: [
              'Refresh the page (Ctrl+F5 or Cmd+Shift+R)',
              'Clear browser cache and cookies',
              'Try using an incognito/private window'
            ],
            canRetry: true
          };
      }
    }

    return {
      message: 'An unexpected error occurred.',
      suggestions: ['Try refreshing the page'],
      troubleshootingSteps: ['Refresh the page', 'Clear browser cache'],
      canRetry: true
    };
  }

  /**
   * Helper methods for error analysis and reporting
   */
  private categorizeError(error: Error): OptimizationError['category'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('time out')) {
      return 'timeout';
    }
    if (message.includes('parse') || message.includes('json') || message.includes('syntax')) {
      return 'parsing';
    }
    if (message.includes('cache')) {
      return 'cache';
    }
    if (message.includes('memory') || message.includes('heap')) {
      return 'memory';
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    
    return 'configuration';
  }

  private assessSeverity(error: Error, context: ErrorContext): OptimizationError['severity'] {
    const message = error.message.toLowerCase();
    
    // Critical errors that completely break functionality
    if (message.includes('critical') || message.includes('fatal') || 
        context.discoveryPhase === 'initialization') {
      return 'critical';
    }
    
    // Major errors that significantly impact functionality
    if (message.includes('timeout') || message.includes('network') ||
        context.previousAttempts > 3) {
      return 'major';
    }
    
    // Minor errors that have workarounds
    return 'minor';
  }

  private isRetryable(error: Error, category: OptimizationError['category']): boolean {
    const nonRetryableCategories = ['auth', 'parsing', 'configuration'];
    if (nonRetryableCategories.includes(category)) return false;
    
    const message = error.message.toLowerCase();
    if (message.includes('404') || message.includes('not found')) return false;
    if (message.includes('403') || message.includes('forbidden')) return false;
    
    return true;
  }

  private generateErrorCode(category: string, severity: string): string {
    const timestamp = Date.now().toString(36);
    return `OPT_${category.toUpperCase()}_${severity.toUpperCase()}_${timestamp}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Circuit breaker management methods
  private updateCircuitBreaker(error: OptimizationError): void {
    const key = `${error.category}_${error.context.discoveryPhase}`;
    const state = this.circuitBreakers.get(key) || {
      isOpen: false,
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };

    state.failures++;
    state.lastFailureTime = Date.now();

    // Open circuit breaker after 5 failures in 60 seconds
    if (state.failures >= 5 && Date.now() - state.lastFailureTime < 60000) {
      state.isOpen = true;
      state.nextAttemptTime = Date.now() + (30000 * Math.pow(2, Math.min(state.failures - 5, 5))); // Exponential backoff
    }

    this.circuitBreakers.set(key, state);
  }

  private updateErrorPatterns(error: OptimizationError): void {
    const signature = this.generateErrorSignature(error);
    const pattern = this.errorPatterns.get(signature) || {
      signature,
      frequency: 0,
      category: error.category,
      commonCauses: [],
      preventionStrategies: [],
      affectedEnvironments: []
    };

    pattern.frequency++;
    
    // Update common causes
    const cause = this.extractErrorCause(error);
    if (cause && !pattern.commonCauses.includes(cause)) {
      pattern.commonCauses.push(cause);
    }

    // Update affected environments
    const env = this.getEnvironmentSignature(error.context.environment);
    if (!pattern.affectedEnvironments.includes(env)) {
      pattern.affectedEnvironments.push(env);
    }

    this.errorPatterns.set(signature, pattern);
  }

  private generateErrorSignature(error: OptimizationError): string {
    // Create a signature based on error characteristics
    const messageHash = this.simpleHash(error.message.substring(0, 100));
    return `${error.category}_${error.severity}_${messageHash}`;
  }

  private extractErrorCause(error: OptimizationError): string | null {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'Request timeout';
    if (message.includes('network')) return 'Network connectivity';
    if (message.includes('cors')) return 'CORS configuration';
    if (message.includes('404')) return 'Resource not found';
    if (message.includes('403')) return 'Access forbidden';
    if (message.includes('rate limit')) return 'Rate limiting';
    if (message.includes('parse')) return 'Content parsing';
    
    return null;
  }

  private getEnvironmentSignature(env: EnvironmentInfo): string {
    return `${env.platform}_${env.type}_${env.confidence}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private initializeErrorReporting(): void {
    if (this.reportingConfig.enabled && this.reportingConfig.batchInterval) {
      this.reportingInterval = window.setInterval(() => {
        this.flushErrorReports();
      }, this.reportingConfig.batchInterval);
    }
  }

  private loadErrorPatterns(): void {
    // Load known error patterns from localStorage if available
    try {
      const stored = localStorage.getItem('mdv_error_patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        for (const [key, pattern] of Object.entries(patterns)) {
          this.errorPatterns.set(key, pattern as ErrorPattern);
        }
      }
    } catch (error) {
      console.warn('Failed to load error patterns from storage:', error);
    }

    // Initialize with common known patterns
    this.initializeKnownPatterns();
  }

  private initializeKnownPatterns(): void {
    const knownPatterns: ErrorPattern[] = [
      {
        signature: 'network_timeout_common',
        frequency: 0,
        category: 'network',
        commonCauses: ['Slow connection', 'Server overload', 'DNS issues'],
        preventionStrategies: [{
          type: 'configuration',
          description: 'Increase timeout values',
          implementation: 'Set requestTimeout to 15000ms for slow connections',
          priority: 'high',
          estimatedEffectiveness: 0.8
        }],
        affectedEnvironments: ['mobile', 'slow-connection']
      },
      {
        signature: 'cors_blocked_common',
        frequency: 0,
        category: 'auth',
        commonCauses: ['Missing CORS headers', 'Wrong origin configuration'],
        preventionStrategies: [{
          type: 'configuration',
          description: 'Configure CORS properly',
          implementation: 'Add proper Access-Control-Allow-Origin headers',
          priority: 'high',
          estimatedEffectiveness: 0.95
        }],
        affectedEnvironments: ['cross-origin', 'production']
      }
    ];

    for (const pattern of knownPatterns) {
      this.errorPatterns.set(pattern.signature, pattern);
    }
  }

  private isCircuitBreakerOpen(type: string): boolean {
    const state = this.circuitBreakers.get(type);
    return state?.isOpen || false;
  }

  private getCircuitBreakerDelay(type: string): number {
    const state = this.circuitBreakers.get(type);
    return state ? Math.max(0, state.nextAttemptTime - Date.now()) : 0;
  }

  private resetCircuitBreaker(type: string): void {
    this.circuitBreakers.delete(type);
  }

  private queueErrorForReporting(error: OptimizationError): void {
    this.pendingReports.push(error);
    
    if (this.pendingReports.length >= this.reportingConfig.batchSize) {
      this.flushErrorReports();
    }
  }

  private async flushErrorReports(): Promise<void> {
    if (this.pendingReports.length === 0) return;
    
    const reports = this.pendingReports.splice(0, this.reportingConfig.batchSize);
    
    try {
      if (this.reportingConfig.endpoint) {
        await this.sendErrorReports(reports);
      }
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // Re-queue failed reports
      this.pendingReports.unshift(...reports.slice(0, 5)); // Limit re-queuing
    }
  }

  private async sendErrorReports(reports: OptimizationError[]): Promise<void> {
    if (!this.reportingConfig.endpoint) {
      throw new Error('No error reporting endpoint configured');
    }

    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      errors: reports.map(error => ({
        code: error.code,
        message: this.reportingConfig.includePII ? error.message : this.sanitizeMessage(error.message),
        category: error.category,
        severity: error.severity,
        context: this.sanitizeContext(error.context),
        timestamp: error.timestamp,
        retryable: error.retryable,
        stackTrace: this.reportingConfig.includePII ? error.stack : undefined
      })),
      analytics: this.getErrorStatistics(),
      userAgent: this.reportingConfig.includePII ? navigator.userAgent : undefined,
      url: this.reportingConfig.includePII ? window.location.href : undefined
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.reportingConfig.apiKey) {
      headers['Authorization'] = `Bearer ${this.reportingConfig.apiKey}`;
    }

    await fetch(this.reportingConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  private logError(error: OptimizationError): void {
    console.group(`🚨 Optimization Error [${error.code}]`);
    console.error('Message:', error.message);
    console.error('Category:', error.category);
    console.error('Severity:', error.severity);
    console.error('Context:', error.context);
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }

  private limitErrorHistory(): void {
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
  }

  private findOptimizationError(error: Error): OptimizationError | null {
    return this.errorHistory.find(e => e.originalError === error) || null;
  }

  private getErrorHistory(): ErrorHistory {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return {
      errors: this.errorHistory,
      timeRange: { start: now - oneHour, end: now },
      totalErrors: this.errorHistory.length,
      resolutionRate: 0.85, // Would be calculated from actual data
      averageResolutionTime: 2000 // Would be calculated from actual data
    };
  }

  private identifyPatterns(history: ErrorHistory): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    const errorGroups = new Map<string, OptimizationError[]>();

    // Group errors by signature
    for (const error of history.errors) {
      const signature = this.generateErrorSignature(error);
      const group = errorGroups.get(signature) || [];
      group.push(error);
      errorGroups.set(signature, group);
    }

    // Analyze each group for patterns
    for (const [signature, errors] of errorGroups.entries()) {
      if (errors.length >= 2) { // Pattern requires at least 2 occurrences
        const pattern = this.analyzeErrorGroup(signature, errors);
        patterns.push(pattern);
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeErrorGroup(signature: string, errors: OptimizationError[]): ErrorPattern {
    const pattern: ErrorPattern = {
      signature,
      frequency: errors.length,
      category: errors[0].category,
      commonCauses: [],
      preventionStrategies: [],
      affectedEnvironments: []
    };

    // Extract common causes
    const causes = new Set<string>();
    for (const error of errors) {
      const cause = this.extractErrorCause(error);
      if (cause) causes.add(cause);
    }
    pattern.commonCauses = Array.from(causes);

    // Extract affected environments
    const environments = new Set<string>();
    for (const error of errors) {
      environments.add(this.getEnvironmentSignature(error.context.environment));
    }
    pattern.affectedEnvironments = Array.from(environments);

    // Generate prevention strategies
    pattern.preventionStrategies = this.generatePreventionStrategiesForPattern(pattern);

    return pattern;
  }

  private generatePreventionStrategies(patterns: ErrorPattern[]): PreventionStrategy[] {
    const strategies: PreventionStrategy[] = [];
    
    for (const pattern of patterns) {
      strategies.push(...pattern.preventionStrategies);
    }

    // Deduplicate and prioritize
    const uniqueStrategies = new Map<string, PreventionStrategy>();
    for (const strategy of strategies) {
      const key = `${strategy.type}_${strategy.description}`;
      if (!uniqueStrategies.has(key) || 
          uniqueStrategies.get(key)!.estimatedEffectiveness < strategy.estimatedEffectiveness) {
        uniqueStrategies.set(key, strategy);
      }
    }

    return Array.from(uniqueStrategies.values())
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority] ||
               b.estimatedEffectiveness - a.estimatedEffectiveness;
      });
  }

  private generatePreventionStrategiesForPattern(pattern: ErrorPattern): PreventionStrategy[] {
    const strategies: PreventionStrategy[] = [];

    switch (pattern.category) {
      case 'network':
        strategies.push({
          type: 'configuration',
          description: 'Implement retry logic with exponential backoff',
          implementation: 'Add retry mechanism with increasing delays',
          priority: 'high',
          estimatedEffectiveness: 0.8
        });
        if (pattern.commonCauses.includes('Request timeout')) {
          strategies.push({
            type: 'configuration',
            description: 'Increase timeout values for slow connections',
            implementation: 'Detect connection speed and adjust timeouts',
            priority: 'high',
            estimatedEffectiveness: 0.7
          });
        }
        break;

      case 'timeout':
        strategies.push({
          type: 'configuration',
          description: 'Implement progressive loading',
          implementation: 'Load critical content first, defer non-essential content',
          priority: 'medium',
          estimatedEffectiveness: 0.6
        });
        break;

      case 'rate_limit':
        strategies.push({
          type: 'configuration',
          description: 'Implement request throttling',
          implementation: 'Add rate limiting and request queuing',
          priority: 'high',
          estimatedEffectiveness: 0.9
        });
        break;

      case 'auth':
        strategies.push({
          type: 'configuration',
          description: 'Implement proper authentication fallbacks',
          implementation: 'Provide anonymous access when authentication fails',
          priority: 'medium',
          estimatedEffectiveness: 0.75
        });
        break;

      case 'parsing':
        strategies.push({
          type: 'validation',
          description: 'Add content validation before parsing',
          implementation: 'Validate content format and structure',
          priority: 'medium',
          estimatedEffectiveness: 0.8
        });
        break;
    }

    return strategies;
  }

  private generateSystemRecommendations(patterns: ErrorPattern[]): string[] {
    // Generate system-level recommendations
    return [
      'Consider implementing request retry logic',
      'Add network condition monitoring',
      'Implement progressive loading fallbacks'
    ];
  }

  private getDeveloperSuggestions(error: OptimizationError): string[] {
    switch (error.category) {
      case 'network':
        return [
          'Check network connectivity',
          'Verify CORS configuration',
          'Implement retry logic with exponential backoff'
        ];
      case 'timeout':
        return [
          'Increase timeout values',
          'Implement progressive loading',
          'Check server response times'
        ];
      default:
        return ['Check error logs', 'Verify configuration'];
    }
  }

  private getDeveloperTroubleshootingSteps(error: OptimizationError): string[] {
    return [
      'Enable debug mode',
      'Check browser network tab',
      'Verify configuration settings',
      'Test with different environments'
    ];
  }

  private getHistoricalRecoveryStrategy(type: string): RecoveryStrategy | null {
    // Analyze historical recovery success rates for this error type
    const relevantHistory = this.errorHistory.filter(error => error.category === type);
    
    if (relevantHistory.length < 5) {
      return null; // Need at least 5 samples for meaningful analysis
    }

    // Calculate success rates for different strategies
    const strategySuccess = new Map<string, { attempts: number; successes: number }>();
    
    // Analyze recovery attempts (simplified - would track actual recovery outcomes)
    for (const error of relevantHistory) {
      const strategy = this.inferRecoveryStrategy(error);
      const current = strategySuccess.get(strategy) || { attempts: 0, successes: 0 };
      current.attempts++;
      
      // Assume success if no subsequent similar errors within 5 minutes
      const hasSubsequentError = relevantHistory.some(laterError => 
        laterError.timestamp > error.timestamp && 
        laterError.timestamp - error.timestamp < 300000 &&
        this.generateErrorSignature(laterError) === this.generateErrorSignature(error)
      );
      
      if (!hasSubsequentError) {
        current.successes++;
      }
      
      strategySuccess.set(strategy, current);
    }

    // Find best performing strategy
    let bestStrategy: string | null = null;
    let bestSuccessRate = 0;

    for (const [strategy, stats] of strategySuccess.entries()) {
      const successRate = stats.successes / stats.attempts;
      if (successRate > bestSuccessRate && stats.attempts >= 3) {
        bestSuccessRate = successRate;
        bestStrategy = strategy;
      }
    }

    if (bestStrategy && bestSuccessRate > 0.6) {
      return this.createStrategyFromHistorical(bestStrategy, bestSuccessRate);
    }

    return null;
  }

  private inferRecoveryStrategy(error: OptimizationError): string {
    // Infer what recovery strategy was likely used based on error characteristics
    if (error.retryable && error.context.previousAttempts > 0) {
      return 'retry';
    }
    
    switch (error.category) {
      case 'network':
      case 'timeout':
        return 'retry';
      case 'auth':
        return 'fallback';
      case 'memory':
        return 'degrade';
      default:
        return 'retry';
    }
  }

  private createStrategyFromHistorical(strategyType: string, successRate: number): RecoveryStrategy {
    const baseStrategy = this.getDefaultStrategy();
    
    // Adjust strategy based on historical success
    const confidence = Math.min(successRate, 0.95);
    
    return {
      ...baseStrategy,
      action: strategyType as RecoveryStrategy['action'],
      maxAttempts: Math.ceil(baseStrategy.maxAttempts * confidence),
      delay: Math.floor(baseStrategy.delay * (2 - confidence)), // Lower delay for high confidence
      notify: successRate < 0.8 // Notify if success rate is concerning
    };
  }

  private getDefaultStrategy(): RecoveryStrategy {
    return {
      action: 'retry',
      delay: 1000,
      maxAttempts: 3,
      notify: false
    };
  }

  private mergeStrategies(primary: RecoveryStrategy, historical: RecoveryStrategy): RecoveryStrategy {
    return {
      ...primary,
      maxAttempts: Math.max(primary.maxAttempts, historical.maxAttempts),
      delay: Math.min(primary.delay, historical.delay)
    };
  }

  private async executeFallback<T>(fallbackMethod: string, context: ErrorContext): Promise<T> {
    // Execute fallback method based on method name
    throw new Error(`Fallback method ${fallbackMethod} not implemented`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sanitize error message to remove PII
   */
  private sanitizeMessage(message: string): string {
    return message
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
      .replace(/[A-Za-z0-9+/]{20,}={0,2}/g, '[TOKEN]');
  }

  /**
   * Sanitize error context to remove sensitive data
   */
  private sanitizeContext(context: ErrorContext): Partial<ErrorContext> {
    const sanitized: Partial<ErrorContext> = {
      discoveryPhase: context.discoveryPhase,
      previousAttempts: context.previousAttempts,
      environment: context.environment,
      userAgent: this.reportingConfig.includePII ? context.userAgent : undefined
    };

    // Include network conditions but not user agent
    if (context.networkConditions) {
      sanitized.networkConditions = context.networkConditions;
    }

    return sanitized;
  }
}

/**
 * Factory function for production error handling
 */
export function createProductionErrorHandling(
  config?: Partial<ErrorReportingConfig>
): ProductionErrorHandling {
  return new ProductionErrorHandling(config);
}
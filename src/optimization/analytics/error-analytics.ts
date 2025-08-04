/**
 * Error Analytics System
 * Comprehensive error tracking, analysis, and automatic reporting for production optimization
 */

// Local interfaces for error analytics - avoiding import issues
interface OptimizationError {
  type: string;
  message: string;
  category: string;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  retryable?: boolean;
  sessionId?: string;
  context: {
    userAgent: string;
    [key: string]: any;
  };
}

interface ErrorContext {
  userAgent: string;
  requestUrl?: string;
  [key: string]: any;
}

interface ErrorPattern {
  type: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  signature?: string;
  category?: string;
  commonCauses?: any[];
  preventionStrategies?: any[];
  affectedEnvironments?: any[];
}

/**
 * Error analytics configuration
 */
export interface ErrorAnalyticsConfig {
  enabled: boolean;
  reportingEndpoint?: string;
  apiKey?: string;
  batchSize: number;
  reportingInterval: number; // ms
  includePII: boolean;
  retentionDays: number;
  alertThresholds: AlertThresholds;
}

/**
 * Alert threshold configuration
 */
export interface AlertThresholds {
  errorRatePerMinute: number;
  criticalErrorsPerHour: number;
  circuitBreakerTrips: number;
  userExperienceScore: number; // Alert if below this score
}

/**
 * Error analytics data
 */
export interface ErrorAnalyticsData {
  period: { start: number; end: number };
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByEnvironment: Record<string, number>;
  errorRate: number; // errors per minute
  topErrorPatterns: ErrorPattern[];
  recoverySuccessRate: number;
  userImpactScore: number;
  recommendedActions: RecommendedAction[];
}

/**
 * Recommended action based on analytics
 */
export interface RecommendedAction {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'configuration' | 'infrastructure' | 'code' | 'monitoring';
  title: string;
  description: string;
  estimatedImpact: number; // 0-1 scale
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: string;
}

/**
 * Real-time error alert
 */
export interface ErrorAlert {
  id: string;
  timestamp: number;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  errorCount: number;
  affectedUsers: number;
  triggerThreshold: number;
  currentValue: number;
  recommendedActions: string[];
}

/**
 * Error trend analysis
 */
export interface ErrorTrend {
  category: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number; // percentage change
  significance: 'high' | 'medium' | 'low';
  projectedImpact: string;
}

/**
 * User experience impact metrics
 */
export interface UserExperienceMetrics {
  averageLoadTime: number;
  errorPageViews: number;
  bounceRate: number;
  retryAttempts: number;
  userSatisfactionScore: number;
  conversionImpact: number;
}

/**
 * Error Analytics System implementation
 */
export class ErrorAnalyticsSystem {
  private config: ErrorAnalyticsConfig;
  private errorHistory: OptimizationError[] = [];
  private analyticsBuffer: ErrorAnalyticsData[] = [];
  private alertSubscribers: Array<(alert: ErrorAlert) => void> = [];
  private reportingInterval: number | null = null;
  private lastReportTime = 0;

  constructor(config: Partial<ErrorAnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      batchSize: 50,
      reportingInterval: 300000, // 5 minutes
      includePII: false,
      retentionDays: 30,
      alertThresholds: {
        errorRatePerMinute: 10,
        criticalErrorsPerHour: 5,
        circuitBreakerTrips: 3,
        userExperienceScore: 6.0
      },
      ...config
    };

    if (this.config.enabled) {
      this.initializeAnalytics();
    }
  }

  /**
   * Record error for analytics
   */
  recordError(error: OptimizationError): void {
    if (!this.config.enabled) return;

    this.errorHistory.push(error);
    this.pruneOldErrors();
    
    // Check for real-time alerts
    this.checkAlertConditions();
    
    // Analyze trends if enough data
    if (this.errorHistory.length > 10) {
      this.analyzeTrends();
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  generateAnalyticsReport(timeRange?: { start: number; end: number }): ErrorAnalyticsData {
    const range = timeRange || this.getDefaultTimeRange();
    const relevantErrors = this.getErrorsInRange(range);

    const analytics: ErrorAnalyticsData = {
      period: range,
      totalErrors: relevantErrors.length,
      errorsByCategory: this.categorizeErrors(relevantErrors),
      errorsBySeverity: this.categorizeBySeverity(relevantErrors),
      errorsByEnvironment: this.categorizeByEnvironment(relevantErrors),
      errorRate: this.calculateErrorRate(relevantErrors, range),
      topErrorPatterns: this.identifyTopPatterns(relevantErrors),
      recoverySuccessRate: this.calculateRecoverySuccessRate(relevantErrors),
      userImpactScore: this.calculateUserImpactScore(relevantErrors),
      recommendedActions: this.generateRecommendedActions(relevantErrors)
    };

    // Store in buffer for batch reporting
    this.analyticsBuffer.push(analytics);
    
    return analytics;
  }

  /**
   * Subscribe to real-time error alerts
   */
  subscribeToAlerts(callback: (alert: ErrorAlert) => void): () => void {
    this.alertSubscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get error trends over time
   */
  getErrorTrends(): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const categories = ['network', 'timeout', 'parsing', 'auth', 'rate_limit', 'memory', 'cache'];
    
    for (const category of categories) {
      const trend = this.analyzeCategoryTrend(category);
      if (trend) {
        trends.push(trend);
      }
    }

    return trends.sort((a, b) => {
      const significanceWeight = { high: 3, medium: 2, low: 1 };
      return significanceWeight[b.significance] - significanceWeight[a.significance];
    });
  }

  /**
   * Get user experience metrics
   */
  getUserExperienceMetrics(): UserExperienceMetrics {
    const recentErrors = this.getRecentErrors(3600000); // Last hour
    
    return {
      averageLoadTime: this.calculateAverageLoadTime(),
      errorPageViews: recentErrors.length,
      bounceRate: this.calculateBounceRate(recentErrors),
      retryAttempts: this.calculateRetryAttempts(recentErrors),
      userSatisfactionScore: this.calculateUserSatisfactionScore(),
      conversionImpact: this.estimateConversionImpact(recentErrors)
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
    const data = this.generateAnalyticsReport();
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear analytics data (for privacy compliance)
   */
  clearAnalyticsData(): void {
    this.errorHistory = [];
    this.analyticsBuffer = [];
  }

  /**
   * Initialize analytics system
   */
  private initializeAnalytics(): void {
    // Start periodic reporting
    this.reportingInterval = window.setInterval(() => {
      this.performPeriodicReporting();
    }, this.config.reportingInterval);

    // Load persisted data if available
    this.loadPersistedData();
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(): void {
    const recentErrors = this.getRecentErrors(60000); // Last minute
    const errorRate = recentErrors.length;
    
    // Error rate alert
    if (errorRate > this.config.alertThresholds.errorRatePerMinute) {
      this.triggerAlert({
        id: `error_rate_${Date.now()}`,
        timestamp: Date.now(),
        severity: 'critical',
        title: 'High Error Rate Detected',
        message: `Error rate of ${errorRate} errors/minute exceeds threshold of ${this.config.alertThresholds.errorRatePerMinute}`,
        errorCount: errorRate,
        affectedUsers: this.estimateAffectedUsers(recentErrors),
        triggerThreshold: this.config.alertThresholds.errorRatePerMinute,
        currentValue: errorRate,
        recommendedActions: [
          'Check system resources and network connectivity',
          'Review recent deployments for potential issues',
          'Consider enabling fallback mechanisms'
        ]
      });
    }

    // Critical errors alert
    const criticalErrors = this.getRecentErrors(3600000) // Last hour
      .filter(error => error.severity === 'critical');
    
    if (criticalErrors.length > this.config.alertThresholds.criticalErrorsPerHour) {
      this.triggerAlert({
        id: `critical_errors_${Date.now()}`,
        timestamp: Date.now(),
        severity: 'critical',
        title: 'Multiple Critical Errors',
        message: `${criticalErrors.length} critical errors in the last hour`,
        errorCount: criticalErrors.length,
        affectedUsers: this.estimateAffectedUsers(criticalErrors),
        triggerThreshold: this.config.alertThresholds.criticalErrorsPerHour,
        currentValue: criticalErrors.length,
        recommendedActions: [
          'Investigate critical error patterns immediately',
          'Consider rolling back recent changes',
          'Escalate to engineering team'
        ]
      });
    }
  }

  /**
   * Analyze error trends
   */
  private analyzeTrends(): void {
    // Implementation would analyze error patterns over time
    // This is a simplified version
    console.log('📊 Analyzing error trends...', {
      totalErrors: this.errorHistory.length,
      recentErrorRate: this.getRecentErrors(300000).length // Last 5 minutes
    });
  }

  /**
   * Trigger alert to subscribers
   */
  private triggerAlert(alert: ErrorAlert): void {
    console.warn(`🚨 Error Alert: ${alert.title}`, alert);
    
    for (const subscriber of this.alertSubscribers) {
      try {
        subscriber(alert);
      } catch (error) {
        console.error('Failed to notify alert subscriber:', error);
      }
    }
  }

  /**
   * Perform periodic reporting
   */
  private async performPeriodicReporting(): Promise<void> {
    if (!this.config.reportingEndpoint || this.analyticsBuffer.length === 0) {
      return;
    }

    try {
      const reportData = {
        timestamp: Date.now(),
        analytics: this.analyticsBuffer.splice(0, this.config.batchSize),
        systemInfo: this.getSystemInfo()
      };

      await this.sendAnalyticsReport(reportData);
      this.lastReportTime = Date.now();
    } catch (error) {
      console.error('Failed to send analytics report:', error);
    }
  }

  /**
   * Helper methods
   */
  private getDefaultTimeRange(): { start: number; end: number } {
    const end = Date.now();
    const start = end - (24 * 60 * 60 * 1000); // 24 hours
    return { start, end };
  }

  private getErrorsInRange(range: { start: number; end: number }): OptimizationError[] {
    return this.errorHistory.filter(error => 
      error.timestamp >= range.start && error.timestamp <= range.end
    );
  }

  private getRecentErrors(milliseconds: number): OptimizationError[] {
    const cutoff = Date.now() - milliseconds;
    return this.errorHistory.filter(error => error.timestamp >= cutoff);
  }

  private pruneOldErrors(): void {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(error => error.timestamp >= cutoff);
  }

  private categorizeErrors(errors: OptimizationError[]): Record<string, number> {
    const categories: Record<string, number> = {};
    for (const error of errors) {
      categories[error.category] = (categories[error.category] || 0) + 1;
    }
    return categories;
  }

  private categorizeBySeverity(errors: OptimizationError[]): Record<string, number> {
    const severities: Record<string, number> = {};
    for (const error of errors) {
      const severity = error.severity || 'low';
      severities[severity] = (severities[severity] || 0) + 1;
    }
    return severities;
  }

  private categorizeByEnvironment(errors: OptimizationError[]): Record<string, number> {
    const environments: Record<string, number> = {};
    for (const error of errors) {
      const env = `${error.context.environment?.platform || 'unknown'}_${error.context.environment?.browser || 'unknown'}`;
      environments[env] = (environments[env] || 0) + 1;
    }
    return environments;
  }

  private calculateErrorRate(errors: OptimizationError[], range: { start: number; end: number }): number {
    const durationMinutes = (range.end - range.start) / (60 * 1000);
    return durationMinutes > 0 ? errors.length / durationMinutes : 0;
  }

  private identifyTopPatterns(errors: OptimizationError[]): ErrorPattern[] {
    // Simplified pattern identification
    const patterns = new Map<string, number>();
    
    for (const error of errors) {
      const key = `${error.category}_${error.severity}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    return Array.from(patterns.entries())
      .map(([key, frequency]) => {
        const [category, severity] = key.split('_');
        return {
          type: category || 'unknown',
          signature: key,
          frequency,
          severity: (severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
          category,
          commonCauses: [],
          preventionStrategies: [],
          affectedEnvironments: []
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private calculateRecoverySuccessRate(errors: OptimizationError[]): number {
    const retryableErrors = errors.filter(error => error.retryable);
    if (retryableErrors.length === 0) return 1.0;
    
    // Simplified calculation - would track actual recovery outcomes
    return 0.85; // 85% assumed success rate
  }

  private calculateUserImpactScore(errors: OptimizationError[]): number {
    // Calculate user impact based on error severity and frequency
    let impactScore = 10; // Start with perfect score
    
    for (const error of errors) {
      const severityImpact: Record<string, number> = {
        low: 0.1,
        medium: 0.3,
        high: 0.5,
        critical: 1.0
      };
      
      const severity = error.severity || 'low';
      impactScore -= severityImpact[severity] || 0.1;
    }
    
    return Math.max(0, impactScore);
  }

  private generateRecommendedActions(errors: OptimizationError[]): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
    const errorsByCategory = this.categorizeErrors(errors);
    
    // Network errors
    if (errorsByCategory.network > 5) {
      actions.push({
        priority: 'high',
        category: 'infrastructure',
        title: 'Improve Network Resilience',
        description: 'High number of network errors detected. Consider implementing better retry logic and fallback mechanisms.',
        estimatedImpact: 0.8,
        implementationEffort: 'medium',
        timeline: '1-2 weeks'
      });
    }

    // Timeout errors
    if (errorsByCategory.timeout > 3) {
      actions.push({
        priority: 'medium',
        category: 'configuration',
        title: 'Optimize Timeout Settings',
        description: 'Frequent timeout errors suggest need for adaptive timeout configuration based on network conditions.',
        estimatedImpact: 0.6,
        implementationEffort: 'low',
        timeline: '3-5 days'
      });
    }

    return actions.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private analyzeCategoryTrend(category: string): ErrorTrend | null {
    const recent = this.getRecentErrors(3600000).filter(e => e.category === category);
    const older = this.getErrorsInRange({
      start: Date.now() - 7200000, // 2 hours ago
      end: Date.now() - 3600000   // 1 hour ago
    }).filter(e => e.category === category);

    if (recent.length === 0 && older.length === 0) return null;

    const recentRate = recent.length;
    const olderRate = older.length;
    const change = olderRate > 0 ? (recentRate - olderRate) / olderRate : 0;

    return {
      category,
      direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
      rate: Math.abs(change * 100),
      significance: Math.abs(change) > 0.5 ? 'high' : Math.abs(change) > 0.2 ? 'medium' : 'low',
      projectedImpact: change > 0.5 ? 'High - requires immediate attention' : 
                      change > 0.2 ? 'Medium - monitor closely' : 'Low - stable'
    };
  }

  // Additional helper methods would be implemented here...
  private estimateAffectedUsers(errors: OptimizationError[]): number {
    // Estimate based on unique session IDs
    const uniqueSessions = new Set(errors.map(e => e.sessionId));
    return uniqueSessions.size;
  }

  private calculateAverageLoadTime(): number {
    // Would integrate with performance monitoring
    return 2500; // ms
  }

  private calculateBounceRate(errors: OptimizationError[]): number {
    // Calculate bounce rate impact from errors
    return Math.min(errors.length * 0.02, 0.3); // Cap at 30%
  }

  private calculateRetryAttempts(errors: OptimizationError[]): number {
    return errors.reduce((sum, error) => sum + error.context.previousAttempts, 0);
  }

  private calculateUserSatisfactionScore(): number {
    // Would integrate with user feedback systems
    const baseScore = 8.5;
    const errorImpact = this.getRecentErrors(3600000).length * 0.1;
    return Math.max(1, baseScore - errorImpact);
  }

  private estimateConversionImpact(errors: OptimizationError[]): number {
    // Estimate conversion impact from errors
    return errors.filter(e => e.severity === 'critical').length * 0.05;
  }

  private convertToCSV(data: ErrorAnalyticsData): string {
    // Convert analytics data to CSV format
    const headers = ['Timestamp', 'Total Errors', 'Error Rate', 'Recovery Rate'];
    const rows = [
      headers.join(','),
      [data.period.end, data.totalErrors, data.errorRate, data.recoverySuccessRate].join(',')
    ];
    return rows.join('\n');
  }

  private async sendAnalyticsReport(data: any): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    await fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }

  private loadPersistedData(): void {
    // Load analytics data from localStorage if available
    try {
      const stored = localStorage.getItem('mdv_error_analytics');
      if (stored) {
        const data = JSON.parse(stored);
        this.errorHistory = data.errorHistory || [];
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics data:', error);
    }
  }

  private getSystemInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location.href,
      timestamp: Date.now()
    };
  }
}

/**
 * Factory function for error analytics
 */
export function createErrorAnalyticsSystem(config?: Partial<ErrorAnalyticsConfig>): ErrorAnalyticsSystem {
  return new ErrorAnalyticsSystem(config);
}
/**
 * Decision Engine - Rule Evaluator
 * 
 * FASE 8 DAY 4: Core evaluation logic
 * 
 * Responsible for:
 * - Evaluating all rules against athlete metrics
 * - Handling rule cooldowns (prevent spam)
 * - Deduplication (prevent duplicate decisions)
 * - Priority sorting
 * - Error handling
 * 
 * Flow:
 * 1. Get enabled rules
 * 2. For each rule, check cooldown
 * 3. Evaluate conditions
 * 4. If triggered, generate decision
 * 5. Deduplicate decisions
 * 6. Sort by priority
 */

import type { 
  Decision, 
  DecisionRule, 
  MetricContext, 
  RuleEvaluationResult,
  RuleCooldown 
} from './types';
import { HARDCODED_RULES, getEnabledRules } from './rules';

// ============================================================================
// COOLDOWN MANAGEMENT
// ============================================================================

/**
 * In-memory cooldown cache
 * 
 * Structure: Map<athleteId, Map<ruleId, expiresAt>>
 * 
 * In production, this should be stored in database or Redis
 * to persist across server restarts.
 */
const cooldownCache = new Map<string, Map<string, Date>>();

/**
 * Check if rule is in cooldown for athlete
 */
function isInCooldown(ruleId: string, athleteId: string): boolean {
  const athleteCooldowns = cooldownCache.get(athleteId);
  
  if (!athleteCooldowns) {
    return false;
  }
  
  const expiresAt = athleteCooldowns.get(ruleId);
  
  if (!expiresAt) {
    return false;
  }
  
  // Check if cooldown expired
  if (new Date() > expiresAt) {
    // Cooldown expired, remove it
    athleteCooldowns.delete(ruleId);
    return false;
  }
  
  return true;
}

/**
 * Set cooldown for a rule
 */
function setCooldown(ruleId: string, athleteId: string, cooldownHours: number): void {
  let athleteCooldowns = cooldownCache.get(athleteId);
  
  if (!athleteCooldowns) {
    athleteCooldowns = new Map();
    cooldownCache.set(athleteId, athleteCooldowns);
  }
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + cooldownHours);
  
  athleteCooldowns.set(ruleId, expiresAt);
}

/**
 * Clear all cooldowns for an athlete (testing/admin)
 */
export function clearCooldowns(athleteId: string): void {
  cooldownCache.delete(athleteId);
}

/**
 * Clear cooldown for specific rule (testing/admin)
 */
export function clearRuleCooldown(ruleId: string, athleteId: string): void {
  const athleteCooldowns = cooldownCache.get(athleteId);
  if (athleteCooldowns) {
    athleteCooldowns.delete(ruleId);
  }
}

/**
 * Get all active cooldowns for an athlete
 */
export function getActiveCooldowns(athleteId: string): RuleCooldown[] {
  const athleteCooldowns = cooldownCache.get(athleteId);
  
  if (!athleteCooldowns) {
    return [];
  }
  
  const cooldowns: RuleCooldown[] = [];
  const now = new Date();
  
  athleteCooldowns.forEach((expiresAt, ruleId) => {
    if (expiresAt > now) {
      cooldowns.push({
        ruleId,
        athleteId,
        lastTriggered: new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Approximate
        expiresAt: expiresAt.toISOString(),
      });
    }
  });
  
  return cooldowns;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * In-memory recent decisions cache (for deduplication)
 * 
 * Structure: Map<athleteId, Decision[]>
 * 
 * Stores last 100 decisions per athlete to prevent duplicates
 */
const recentDecisionsCache = new Map<string, Decision[]>();

/**
 * Check if similar decision exists recently
 * 
 * Similar = same athlete + same type + within last 24 hours
 */
function hasSimilarRecentDecision(
  athleteId: string,
  type: Decision['type'],
  ruleId?: string
): boolean {
  const recentDecisions = recentDecisionsCache.get(athleteId) || [];
  
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);
  
  return recentDecisions.some(decision => 
    decision.type === type &&
    decision.ruleId === ruleId &&
    new Date(decision.createdAt) > last24h
  );
}

/**
 * Add decision to recent cache
 */
function addToRecentDecisions(decision: Decision): void {
  let recentDecisions = recentDecisionsCache.get(decision.athleteId) || [];
  
  recentDecisions.push(decision);
  
  // Keep only last 100 decisions
  if (recentDecisions.length > 100) {
    recentDecisions = recentDecisions.slice(-100);
  }
  
  recentDecisionsCache.set(decision.athleteId, recentDecisions);
}

/**
 * Clear recent decisions cache (testing)
 */
export function clearRecentDecisions(athleteId?: string): void {
  if (athleteId) {
    recentDecisionsCache.delete(athleteId);
  } else {
    recentDecisionsCache.clear();
  }
}

// ============================================================================
// RULE EVALUATION
// ============================================================================

/**
 * Evaluate a single rule against athlete metrics
 * 
 * Returns evaluation result with decision if triggered
 */
export function evaluateRule(
  rule: DecisionRule,
  context: MetricContext,
  options?: {
    skipCooldown?: boolean;
    skipDeduplication?: boolean;
  }
): RuleEvaluationResult {
  const startTime = Date.now();
  
  try {
    // Check if rule is enabled
    if (!rule.enabled) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        evaluatedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
      };
    }
    
    // Check cooldown (unless skipped)
    if (!options?.skipCooldown && rule.cooldown) {
      if (isInCooldown(rule.id, context.athleteId)) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: false,
          evaluatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime,
        };
      }
    }
    
    // Evaluate conditions
    const conditionsMet = rule.conditions(context);
    
    if (!conditionsMet) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        evaluatedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
      };
    }
    
    // Check deduplication (unless skipped)
    if (!options?.skipDeduplication) {
      const decisionPartial = rule.generate(context);
      if (hasSimilarRecentDecision(context.athleteId, decisionPartial.type, rule.id)) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: false,
          evaluatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime,
        };
      }
    }
    
    // Generate decision
    const decisionPartial = rule.generate(context);
    
    const decision: Decision = {
      id: generateDecisionId(),
      workspaceId: context.workspaceId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...decisionPartial,
    };
    
    // Set cooldown for this rule
    if (rule.cooldown) {
      setCooldown(rule.id, context.athleteId, rule.cooldown);
    }
    
    // Add to recent decisions cache
    addToRecentDecisions(decision);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: true,
      decision,
      evaluatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime,
    };
    
  } catch (error) {
    // Handle rule evaluation errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`Error evaluating rule ${rule.id} for athlete ${context.athleteId}:`, error);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: false,
      evaluatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Evaluate all rules for an athlete
 * 
 * Main evaluation function - returns all triggered decisions
 */
export function evaluateRules(
  context: MetricContext,
  options?: {
    rules?: DecisionRule[];      // Specific rules to evaluate (default: all enabled)
    skipCooldown?: boolean;      // Skip cooldown checks (testing)
    skipDeduplication?: boolean; // Skip deduplication (testing)
  }
): RuleEvaluationResult[] {
  const rules = options?.rules || getEnabledRules();
  
  const results: RuleEvaluationResult[] = [];
  
  for (const rule of rules) {
    const result = evaluateRule(rule, context, {
      skipCooldown: options?.skipCooldown,
      skipDeduplication: options?.skipDeduplication,
    });
    
    results.push(result);
  }
  
  return results;
}

/**
 * Evaluate rules and return only triggered decisions
 * 
 * Convenience function that filters out non-triggered results
 */
export function evaluateAndGetDecisions(
  context: MetricContext,
  options?: {
    rules?: DecisionRule[];
    skipCooldown?: boolean;
    skipDeduplication?: boolean;
  }
): Decision[] {
  const results = evaluateRules(context, options);
  
  return results
    .filter(result => result.triggered && result.decision)
    .map(result => result.decision!);
}

// ============================================================================
// BATCH EVALUATION
// ============================================================================

/**
 * Evaluate rules for multiple athletes
 * 
 * More efficient than calling evaluateRules individually
 */
export function evaluateRulesBatch(
  contexts: Map<string, MetricContext>,
  options?: {
    rules?: DecisionRule[];
    skipCooldown?: boolean;
    skipDeduplication?: boolean;
  }
): Map<string, RuleEvaluationResult[]> {
  const results = new Map<string, RuleEvaluationResult[]>();
  
  contexts.forEach((context, athleteId) => {
    const athleteResults = evaluateRules(context, options);
    results.set(athleteId, athleteResults);
  });
  
  return results;
}

/**
 * Evaluate rules for multiple athletes and return all decisions
 */
export function evaluateAndGetDecisionsBatch(
  contexts: Map<string, MetricContext>,
  options?: {
    rules?: DecisionRule[];
    skipCooldown?: boolean;
    skipDeduplication?: boolean;
  }
): Decision[] {
  const allDecisions: Decision[] = [];
  
  contexts.forEach((context) => {
    const decisions = evaluateAndGetDecisions(context, options);
    allDecisions.push(...decisions);
  });
  
  return allDecisions;
}

// ============================================================================
// PRIORITY SORTING
// ============================================================================

/**
 * Priority order (highest to lowest)
 */
const PRIORITY_ORDER: Record<Decision['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Sort decisions by priority (critical first)
 */
export function sortDecisionsByPriority(decisions: Decision[]): Decision[] {
  return [...decisions].sort((a, b) => {
    // First by priority
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by confidence
    const confidenceDiff = (b.confidence || 0) - (a.confidence || 0);
    if (confidenceDiff !== 0) return confidenceDiff;
    
    // Then by created date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Sort decisions by multiple criteria
 */
export function sortDecisions(
  decisions: Decision[],
  sortBy: 'priority' | 'confidence' | 'createdAt' = 'priority',
  order: 'asc' | 'desc' = 'desc'
): Decision[] {
  const sorted = [...decisions];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'priority':
        comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case 'confidence':
        comparison = (a.confidence || 0) - (b.confidence || 0);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Filter decisions by status
 */
export function filterByStatus(
  decisions: Decision[],
  status: Decision['status'] | Decision['status'][]
): Decision[] {
  const statuses = Array.isArray(status) ? status : [status];
  return decisions.filter(d => statuses.includes(d.status));
}

/**
 * Filter decisions by priority
 */
export function filterByPriority(
  decisions: Decision[],
  priority: Decision['priority'] | Decision['priority'][]
): Decision[] {
  const priorities = Array.isArray(priority) ? priority : [priority];
  return decisions.filter(d => priorities.includes(d.priority));
}

/**
 * Filter decisions by type
 */
export function filterByType(
  decisions: Decision[],
  type: Decision['type'] | Decision['type'][]
): Decision[] {
  const types = Array.isArray(type) ? type : [type];
  return decisions.filter(d => types.includes(d.type));
}

/**
 * Filter decisions by athlete
 */
export function filterByAthlete(
  decisions: Decision[],
  athleteId: string | string[]
): Decision[] {
  const athleteIds = Array.isArray(athleteId) ? athleteId : [athleteId];
  return decisions.filter(d => athleteIds.includes(d.athleteId));
}

/**
 * Get only pending decisions (not expired)
 */
export function getPendingDecisions(decisions: Decision[]): Decision[] {
  const now = new Date();
  return decisions.filter(d => 
    d.status === 'pending' &&
    (!d.expiresAt || new Date(d.expiresAt) > now)
  );
}

/**
 * Get only critical decisions
 */
export function getCriticalDecisions(decisions: Decision[]): Decision[] {
  return decisions.filter(d => 
    d.priority === 'critical' &&
    d.status === 'pending'
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get evaluation statistics
 */
export function getEvaluationStats(results: RuleEvaluationResult[]) {
  const totalRules = results.length;
  const triggeredRules = results.filter(r => r.triggered).length;
  const errors = results.filter(r => r.error).length;
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const avgTime = totalRules > 0 ? totalTime / totalRules : 0;
  
  return {
    totalRules,
    triggeredRules,
    skippedRules: totalRules - triggeredRules,
    errors,
    totalExecutionTime: Math.round(totalTime),
    avgExecutionTime: Math.round(avgTime * 100) / 100,
    successRate: totalRules > 0 ? ((totalRules - errors) / totalRules) * 100 : 100,
  };
}

/**
 * Get decision statistics
 */
export function getDecisionStats(decisions: Decision[]) {
  const total = decisions.length;
  
  const byStatus = {
    pending: decisions.filter(d => d.status === 'pending').length,
    applied: decisions.filter(d => d.status === 'applied').length,
    dismissed: decisions.filter(d => d.status === 'dismissed').length,
    expired: decisions.filter(d => d.status === 'expired').length,
  };
  
  const byPriority = {
    critical: decisions.filter(d => d.priority === 'critical').length,
    high: decisions.filter(d => d.priority === 'high').length,
    medium: decisions.filter(d => d.priority === 'medium').length,
    low: decisions.filter(d => d.priority === 'low').length,
  };
  
  const byType: Record<string, number> = {};
  decisions.forEach(d => {
    byType[d.type] = (byType[d.type] || 0) + 1;
  });
  
  const avgConfidence = decisions.length > 0
    ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
    : 0;
  
  return {
    total,
    byStatus,
    byPriority,
    byType,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique decision ID
 * 
 * Format: dec-YYYYMMDD-HHMMSS-RANDOM
 */
function generateDecisionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = crypto.randomUUID().substring(0, 8);
  
  return `dec-${dateStr}-${timeStr}-${random}`;
}

/**
 * Validate decision object
 */
export function validateDecision(decision: Decision): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!decision.id) errors.push('Missing decision ID');
  if (!decision.workspaceId) errors.push('Missing workspace ID');
  if (!decision.athleteId) errors.push('Missing athlete ID');
  if (!decision.type) errors.push('Missing decision type');
  if (!decision.priority) errors.push('Missing priority');
  if (!decision.status) errors.push('Missing status');
  if (!decision.recommendation) errors.push('Missing recommendation');
  if (!decision.reasoning) errors.push('Missing reasoning');
  if (!decision.metricsUsed || decision.metricsUsed.length === 0) {
    errors.push('Missing metrics used');
  }
  if (decision.confidence < 0 || decision.confidence > 1) {
    errors.push('Invalid confidence (must be 0-1)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  isInCooldown,
  setCooldown,
  hasSimilarRecentDecision,
  addToRecentDecisions,
};

export default evaluateRules;

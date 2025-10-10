/**
 * Life Metrics Calculator
 * Calculates scores for 6 life axes based on weekly tracking data
 */

export type WeeklyMetricsData = {
  // Axis 0: Management & Organization
  management: {
    weeklyLogSetup: boolean
    dailyLoggedDays: number // 0-7
    financeLogSetup: boolean
  }

  // Axis 1: Learning
  learning: {
    loggedDays: number // 0-7
    learningArtifactsCount: number
    revisionNotesCreated: number
    revisionRevisitPoints: number
    learningTodo: {
      s0: number // open at start
      add: number
      close: number
    }
  }

  // Axis 2: Producer
  producer: {
    publicOutputsCount: number
    producerTodo: {
      s0: number
      add: number
      close: number
    }
  }

  // Axis 3: Finance
  finance: {
    income: number
    spend: number
    spendCap: number // e.g. 12500
    targetSavingsRate: number // e.g. 0.40
    financeConceptApplied: 'none' | 'noted' | 'implemented'
    portfolioReview: 'none' | 'reviewed' | 'ips_checked'
    financeTodo: {
      s0: number
      add: number
      close: number
    }
  }

  // Axis 4: Fitness
  fitness: {
    loggedDays: number // 0-7
    gymSessions: number
    avgWeightActual: number // actual average weight from daily logs
    targetWeight: number // target weight for end of week
    caloriesTrackedDays: number // 0-7
    fitnessTodo: {
      s0: number
      add: number
      close: number
    }
  }

  // Axis 5: Relationship
  relationship: {
    newInteractions: number
    familyCalls: number
    unresolvedConflicts: number
    primaryRelationshipActive: boolean
    relationshipTodo: {
      s0: number
      add: number
      close: number
    }
  }

  // Targets (quarterly constants)
  targets: {
    artifactsPerWeek: number // e.g. 3
    gymSessionsPerWeek: number // e.g. 3
    newInteractionsPerWeek: number // e.g. 3
    familyCallsPerWeek: number // e.g. 2
  }
}

export type AxisScore = {
  score: number
  components: {
    name: string
    score: number
    weight: number
  }[]
}

export type CalculatedScores = {
  management: AxisScore
  learning: AxisScore
  producer: AxisScore
  finance: AxisScore
  fitness: AxisScore
  relationship: AxisScore
}

function calculateTodoHygiene(s0: number, add: number, close: number): number {
  // Handle NaN or invalid inputs
  s0 = isNaN(s0) || !isFinite(s0) ? 0 : s0
  add = isNaN(add) || !isFinite(add) ? 0 : add
  close = isNaN(close) || !isFinite(close) ? 0 : close

  // If no starting tasks, return 0
  if (s0 === 0 && add === 0 && close === 0) return 0

  // Throughput: How many tasks you closed relative to what was open
  // Cap at 1.0 (100%) - closing all open tasks is perfect
  const throughput = close / Math.max(1, s0)
  const cappedThroughput = Math.min(1, throughput)

  // Hygiene: Net backlog change (close - add) relative to starting backlog
  // Positive if closing more than adding (backlog shrinking = good)
  // Negative if adding more than closing (backlog growing = bad)
  const netChange = close - add
  const backlogHealthRatio = netChange / Math.max(1, s0)

  // Convert to 0-1 scale where:
  // - backlogHealthRatio >= 0 (shrinking/stable) maps to 0.5-1.0
  // - backlogHealthRatio < 0 (growing) maps to 0.0-0.5
  const hygiene = backlogHealthRatio >= 0
    ? 0.5 + Math.min(0.5, backlogHealthRatio * 0.5)  // Shrinking backlog: 50-100%
    : Math.max(0, 0.5 + backlogHealthRatio)          // Growing backlog: 0-50%

  const result = 100 * (0.6 * cappedThroughput + 0.4 * hygiene)
  return isNaN(result) || !isFinite(result) ? 0 : result
}

// Helper function to safely handle NaN values
function safeValue(value: number, fallback: number = 0): number {
  return isNaN(value) || !isFinite(value) ? fallback : value
}

export function calculateMetrics(data: WeeklyMetricsData): CalculatedScores {
  // Axis 0: Management & Organization
  const mgmt_a1 = data.management.weeklyLogSetup ? 100 : 0
  const mgmt_a2 = safeValue(100 * (data.management.dailyLoggedDays / 7))
  const mgmt_a3 = data.management.financeLogSetup ? 100 : 0
  const managementScore = safeValue(0.4 * mgmt_a1 + 0.3 * mgmt_a2 + 0.3 * mgmt_a3)

  // Axis 1: Learning
  const learn_coverage = safeValue(data.learning.loggedDays / 7)
  const learn_artifacts_eff = safeValue(data.learning.learningArtifactsCount * learn_coverage)
  const learn_a1 = safeValue(Math.min(100, 100 * (learn_artifacts_eff / Math.max(1, data.targets.artifactsPerWeek))))

  const rev_eq = safeValue(data.learning.revisionNotesCreated * 10 + data.learning.revisionRevisitPoints)
  const rev_eq_eff = safeValue(rev_eq * learn_coverage)
  const learn_a2 = safeValue(Math.min(100, 100 * (rev_eq_eff / 35)))

  const learn_a3 = calculateTodoHygiene(
    data.learning.learningTodo.s0,
    data.learning.learningTodo.add,
    data.learning.learningTodo.close
  )
  const learningScore = safeValue(0.3 * learn_a1 + 0.4 * learn_a2 + 0.3 * learn_a3)

  // Axis 2: Producer
  const prod_a1 = safeValue(Math.min(100, 100 * data.producer.publicOutputsCount))
  const prod_a2 = calculateTodoHygiene(
    data.producer.producerTodo.s0,
    data.producer.producerTodo.add,
    data.producer.producerTodo.close
  )
  const producerScore = safeValue(0.5 * prod_a1 + 0.5 * prod_a2)

  // Axis 3: Finance
  const savingsRate = safeValue((data.finance.income - data.finance.spend) / Math.max(1, data.finance.income))
  const srn = safeValue(Math.min(1, savingsRate / Math.max(0.01, data.finance.targetSavingsRate)))
  const spn = safeValue(Math.min(1, data.finance.spendCap / Math.max(data.finance.spend, data.finance.spendCap)))
  const fin_a1 = safeValue(100 * (0.5 * srn + 0.5 * spn))

  const fin_a2 =
    data.finance.financeConceptApplied === 'implemented'
      ? 100
      : data.finance.financeConceptApplied === 'noted'
      ? 50
      : 0

  const fin_a3 =
    data.finance.portfolioReview === 'ips_checked'
      ? 100
      : data.finance.portfolioReview === 'reviewed'
      ? 60
      : 0

  const fin_a4 = calculateTodoHygiene(
    data.finance.financeTodo.s0,
    data.finance.financeTodo.add,
    data.finance.financeTodo.close
  )
  const financeScore = safeValue(0.2 * fin_a1 + 0.2 * fin_a2 + 0.2 * fin_a3 + 0.4 * fin_a4)

  // Axis 4: Fitness
  const fit_coverage = safeValue(data.fitness.loggedDays / 7)
  const fit_sessions_eff = safeValue(data.fitness.gymSessions * fit_coverage)
  const fit_a1 = safeValue(Math.min(100, 100 * (fit_sessions_eff / Math.max(1, data.targets.gymSessionsPerWeek))))

  // Weight progress: compare actual vs target
  // Calculate how close you got to your target weight
  const weightDifference = safeValue(Math.abs(data.fitness.avgWeightActual - data.fitness.targetWeight))

  // Score based on how close you are to target
  // 0kg difference = 100%, 1kg difference = ~80%, 2kg = ~60%, 3kg+ = lower
  // Using exponential decay: score = 100 * exp(-0.2 * difference)
  const fit_a2 = data.fitness.targetWeight > 0
    ? safeValue(Math.min(100, 100 * Math.exp(-0.2 * weightDifference)))
    : 0

  const fit_a3 = safeValue(100 * (data.fitness.caloriesTrackedDays / 7))

  const fit_a4 = calculateTodoHygiene(
    data.fitness.fitnessTodo.s0,
    data.fitness.fitnessTodo.add,
    data.fitness.fitnessTodo.close
  )
  const fitnessScore = safeValue(0.4 * fit_a1 + 0.3 * fit_a2 + 0.2 * fit_a3 + 0.1 * fit_a4)

  // Axis 5: Relationship
  const rel_a1 = safeValue(Math.min(100, 100 * (data.relationship.newInteractions / Math.max(1, data.targets.newInteractionsPerWeek))))
  const rel_a2 = safeValue(Math.min(100, 100 * (data.relationship.familyCalls / Math.max(1, data.targets.familyCallsPerWeek))))

  const rel_a3_raw = calculateTodoHygiene(
    data.relationship.relationshipTodo.s0,
    data.relationship.relationshipTodo.add,
    data.relationship.relationshipTodo.close
  )
  const rel_a3 = data.relationship.unresolvedConflicts > 0 ? Math.min(rel_a3_raw, 80) : rel_a3_raw

  const rel_computed = safeValue(0.6 * rel_a1 + 0.1 * rel_a2 + 0.3 * rel_a3)
  const relationshipScore = data.relationship.primaryRelationshipActive ? Math.max(60, rel_computed) : rel_computed

  return {
    management: {
      score: managementScore,
      components: [
        { name: 'Weekly log exists', score: mgmt_a1, weight: 0.4 },
        { name: 'Days actually logged', score: mgmt_a2, weight: 0.3 },
        { name: 'Finance tracking active', score: mgmt_a3, weight: 0.3 },
      ],
    },
    learning: {
      score: learningScore,
      components: [
        { name: 'New stuff learned', score: learn_a1, weight: 0.3 },
        { name: 'Old stuff reviewed', score: learn_a2, weight: 0.4 },
        { name: 'Backlog health', score: learn_a3, weight: 0.3 },
      ],
    },
    producer: {
      score: producerScore,
      components: [
        { name: 'Shipped work', score: prod_a1, weight: 0.5 },
        { name: 'Backlog health', score: prod_a2, weight: 0.5 },
      ],
    },
    finance: {
      score: financeScore,
      components: [
        { name: 'Money in vs out', score: fin_a1, weight: 0.2 },
        { name: 'Concept applied', score: fin_a2, weight: 0.2 },
        { name: 'Portfolio checked', score: fin_a3, weight: 0.2 },
        { name: 'Backlog health', score: fin_a4, weight: 0.4 },
      ],
    },
    fitness: {
      score: fitnessScore,
      components: [
        { name: 'Sessions completed', score: fit_a1, weight: 0.4 },
        { name: 'Weight target hit', score: fit_a2, weight: 0.3 },
        { name: 'Food tracked', score: fit_a3, weight: 0.2 },
        { name: 'Backlog health', score: fit_a4, weight: 0.1 },
      ],
    },
    relationship: {
      score: relationshipScore,
      components: [
        { name: 'Met new people', score: rel_a1, weight: 0.6 },
        { name: 'Called family', score: rel_a2, weight: 0.1 },
        { name: 'Conflicts + backlog', score: rel_a3, weight: 0.3 },
      ],
    },
  }
}

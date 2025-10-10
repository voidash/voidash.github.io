'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { CalculatedScores } from '@/lib/metrics-calculator'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import './metrics.css'

type MetricsClientProps = {
  scores: CalculatedScores
  weekStart?: string
  weekEnd?: string
}

function getColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  return 'red'
}

function getFormula(axis: string, data: any): string {
  const weights = data.components.map((c: any) => c.weight)

  switch(axis) {
    case 'management':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2 + ${weights[2]} \\times a_3`
    case 'learning':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2 + ${weights[2]} \\times a_3`
    case 'producer':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2`
    case 'finance':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2 + ${weights[2]} \\times a_3 + ${weights[3]} \\times a_4`
    case 'fitness':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2 + ${weights[2]} \\times a_3 + ${weights[3]} \\times a_4`
    case 'relationship':
      return `\\text{Score} = ${weights[0]} \\times a_1 + ${weights[1]} \\times a_2 + ${weights[2]} \\times a_3`
    default:
      return ''
  }
}

function getComponentFormulas(axis: string): string[] {
  switch(axis) {
    case 'management':
      return [
        'a_1 = \\begin{cases} 100 & \\text{weekly log exists} \\\\ 0 & \\text{else} \\end{cases}',
        'a_2 = 100 \\times \\frac{\\text{days logged}}{7}',
        'a_3 = \\begin{cases} 100 & \\text{finance active} \\\\ 0 & \\text{else} \\end{cases}'
      ]
    case 'learning':
      return [
        'a_1 = \\min\\left(100, 100 \\times \\frac{\\text{artifacts} \\times c}{\\text{target}}\\right), \\quad c = \\frac{\\text{logged}}{7}',
        'a_2 = \\min\\left(100, 100 \\times \\frac{r \\times c}{35}\\right), \\quad r = 10n + p',
        'a_3 = 100(0.6t + 0.4h)'
      ]
    case 'producer':
      return [
        'a_1 = \\min(100, 100 \\times \\text{outputs})',
        'a_2 = 100(0.6t + 0.4h)'
      ]
    case 'finance':
      return [
        'a_1 = 100(0.5 \\times \\text{srn} + 0.5 \\times \\text{spn})',
        'a_2 = \\begin{cases} 100 & \\text{implemented} \\\\ 50 & \\text{noted} \\\\ 0 & \\text{none} \\end{cases}',
        'a_3 = \\begin{cases} 100 & \\text{IPS} \\\\ 60 & \\text{reviewed} \\\\ 0 & \\text{none} \\end{cases}',
        'a_4 = 100(0.6t + 0.4h)'
      ]
    case 'fitness':
      return [
        'a_1 = \\min\\left(100, 100 \\times \\frac{\\text{sessions} \\times c}{\\text{target}}\\right), \\quad c = \\frac{\\text{logged}}{7}',
        'a_2 = 100 \\times e^{-0.2d}, \\quad d = |\\text{actual} - \\text{target}|',
        'a_3 = 100 \\times \\frac{\\text{tracked days}}{7}',
        'a_4 = 100(0.6t + 0.4h)'
      ]
    case 'relationship':
      return [
        'a_1 = \\min\\left(100, 100 \\times \\frac{\\text{interactions}}{\\text{target}}\\right)',
        'a_2 = \\min\\left(100, 100 \\times \\frac{\\text{calls}}{\\text{target}}\\right)',
        'a_3 = \\begin{cases} \\min(\\text{todo}, 80) & \\text{conflicts} \\\\ \\text{todo} & \\text{else} \\end{cases}'
      ]
    default:
      return []
  }
}

function getVariableLegend(axis: string): string {
  switch(axis) {
    case 'learning':
      return 'c=coverage, r=revision equivalent, n=new notes, p=review points, t=throughput (close/s0), h=hygiene (net change)'
    case 'fitness':
      return 'c=coverage, t=throughput (close/s0), h=hygiene (net change)'
    case 'producer':
    case 'finance':
      return 't=throughput (close/s0), h=hygiene (net change), net=(close-add)'
    case 'relationship':
      return 't=throughput (close/s0), h=hygiene (net change)'
    default:
      return ''
  }
}

function getCalculationSteps(axis: string, data: any) {
  const comps = data.components
  const score = data.score
  const formulas = getComponentFormulas(axis)
  const legend = getVariableLegend(axis)

  return (
    <div style={{ fontSize: '14px' }}>
      {legend && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Variables:</strong> {legend}
        </div>
      )}

      {comps.map((comp: any, idx: number) => (
        <div
          key={idx}
          style={{
            marginBottom: '20px',
            padding: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{
            fontWeight: '600',
            marginBottom: '12px',
            fontSize: '15px'
          }}>
            Component {idx + 1}: {comp.name} ({(comp.weight * 100).toFixed(0)}%)
          </div>

          {formulas[idx] && (
            <div style={{
              marginBottom: '12px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              overflowX: 'auto'
            }}>
              <BlockMath math={formulas[idx]} />
            </div>
          )}

          <div style={{
            padding: '10px',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Result: a<sub>{idx + 1}</sub> = {comp.score.toFixed(2)}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '2px solid var(--border-color)'
      }}>
        <div style={{
          padding: '12px',
          border: '2px solid var(--border-color)',
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          Final Score = {score.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

const axisDescriptions = {
  management: {
    title: 'Management',
    subtitle: 'Tracking foundations',
    description:
      'Weekly log setup, daily notes used consistently, finance tracking maintained.',
  },
  learning: {
    title: 'Learning',
    subtitle: 'New knowledge & review',
    description:
      'Learning artifacts created (papers, code, proofs), revision notes made, old concepts revisited.',
  },
  producer: {
    title: 'Producer',
    subtitle: 'Shipped work',
    description: 'Blog posts published, videos released, PRs merged. Closing tasks faster than adding them.',
  },
  finance: {
    title: 'Finance',
    subtitle: 'Money discipline',
    description:
      'Hitting savings targets, staying under spend cap, learning new concepts, portfolio reviewed.',
  },
  fitness: {
    title: 'Fitness',
    subtitle: 'Physical progress',
    description: 'Gym sessions completed, actual weight vs target weight, calories tracked.',
  },
  relationship: {
    title: 'Relationship',
    subtitle: 'People & connections',
    description: 'New interactions, family calls, conflicts resolved. Min 60 if in primary relationship.',
  },
}

export default function MetricsClient({ scores, weekStart, weekEnd }: MetricsClientProps) {
  const radarData = [
    { axis: 'Mgmt', score: Math.round(scores.management.score) },
    { axis: 'Learn', score: Math.round(scores.learning.score) },
    { axis: 'Producer', score: Math.round(scores.producer.score) },
    { axis: 'Finance', score: Math.round(scores.finance.score) },
    { axis: 'Fitness', score: Math.round(scores.fitness.score) },
    { axis: 'Relation', score: Math.round(scores.relationship.score) },
  ]

  return (
    <div>
      <div className="radar-section">
        <h2 className="radar-title">Weekly Overview</h2>
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-primary)', fontSize: 14 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#0066cc"
              fill="#0066cc"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
        {weekStart && weekEnd && (
          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            padding: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace'
          }}>
            Week: {weekStart} to {weekEnd}
          </div>
        )}
      </div>

      <div className="cards-grid">
        {Object.entries(scores).map(([key, data]) => {
          const desc = axisDescriptions[key as keyof typeof axisDescriptions]
          return (
            <div key={key} className="axis-card">
              <div className="axis-header">
                <h3 className="axis-title">{desc.title}</h3>
                <span className={`axis-score ${getColor(data.score)}`}>{Math.round(data.score)}</span>
              </div>

              <p className="axis-subtitle">{desc.subtitle}</p>

              <div className="components-section">
                <p className="components-title">Components</p>
                {data.components.map((comp, idx) => (
                  <div key={idx} className="component-item">
                    <div className="component-header">
                      <span className="component-name">
                        {comp.name} ({Math.round(comp.weight * 100)}%)
                      </span>
                      <span className={`component-score ${getColor(comp.score)}`}>
                        {Math.round(comp.score)}
                      </span>
                    </div>
                    <div className="component-bar">
                      <div className={`component-fill bg-${getColor(comp.score)}`} style={{ width: `${comp.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Formula Section */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                border: '2px solid var(--border-color)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  borderBottom: '2px solid var(--border-color)',
                  paddingBottom: '12px'
                }}>
                  Calculation Details
                </div>

                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '10px' }}>
                    Master Formula:
                  </div>
                  <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                    <BlockMath math={getFormula(key as keyof typeof scores, data)} />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  {getCalculationSteps(key as keyof typeof scores, data)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="legend-section">
        <h3 className="legend-title">Notes</h3>
        <ul className="legend-list">
          <li>
            <strong>Management</strong> is the foundation. If you don't log consistently, the other scores become meaningless.
          </li>
          <li>
            <strong>Learning</strong> = ~3 new artifacts/week (papers with notes, code repos, proofs) + regular revision. Target: 35 revision points/week (could be 3 new notes + 5 reviews = 10×3 + 5 = 35, or 1 new note + 25 reviews = 10×1 + 25 = 35).
          </li>
          <li>
            <strong>Producer</strong> = 1 public output/week gets you 100 on the output component. Blog post, video, merged PR.
          </li>
          <li>
            <strong>Finance</strong> = hitting your savings rate, staying under weekly spend cap, applying concepts, reviewing portfolio.
          </li>
          <li>
            <strong>Fitness</strong> = 3 quality gym sessions/week, hitting your target weight (from weekly log), tracking food. Weight score uses exponential decay: 100% at 0kg difference, ~82% at 1kg, ~67% at 2kg, ~55% at 3kg.
          </li>
          <li>
            <strong>Relationship</strong> = 3 new interactions/week, 2 family calls. Guaranteed min 60 if you're in a primary relationship.
          </li>
          <li>If you only logged 5 of 7 days, all your scores get scaled down by 5/7. Log everything or pay the price.</li>
        </ul>

        <h3 className="legend-title" style={{ marginTop: '30px' }}>Variable Explanations</h3>
        <ul className="legend-list">
          <li>
            <strong>n (new revision notes)</strong>: Tasks tagged with #new-review. Creating NEW summary notes from old material. Each note = 10 points.
          </li>
          <li>
            <strong>p (review points)</strong>: Tasks tagged with #review. Reviewing EXISTING material or notes. Each review = 1 point.
          </li>
          <li>
            <strong>r (revision equivalent)</strong>: Total revision score = 10n + p. Example: 2 new notes + 5 reviews = 10(2) + 5 = 25 points.
          </li>
          <li>
            <strong>c (coverage)</strong>: Logging coverage = logged days / 7. If you only logged 5 days, c = 5/7 = 0.714, and all scores get scaled down.
          </li>
          <li>
            <strong>s0 (starting open)</strong>: Number of todos that existed at the start of the week and weren't completed yet.
          </li>
          <li>
            <strong>add (added)</strong>: New todos created during the week.
          </li>
          <li>
            <strong>close (closed)</strong>: Todos completed during the week.
          </li>
          <li>
            <strong>t (throughput)</strong>: How fast you close tasks = close / s0. Example: closed 5 out of 10 open tasks = 5/10 = 50%.
          </li>
          <li>
            <strong>h (hygiene)</strong>: Backlog health based on net change = (close - add) / s0. If net ≥ 0 (shrinking backlog), h = 50-100%. If net &lt; 0 (growing backlog), h = 0-50%.
          </li>
          <li>
            <strong>Backlog health score</strong>: 100 × (0.6t + 0.4h). Rewards both closing tasks (throughput) and shrinking the backlog (hygiene). Closing 5 and adding 2 (net +3) scores better than closing 5 and adding 8 (net -3).
          </li>
        </ul>
      </div>
    </div>
  )
}

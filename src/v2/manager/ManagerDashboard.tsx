import { useMemo, useState } from 'react'
import { StickyGuideBar } from '../components/StickyGuideBar'
import {
  MANAGER_FUNNEL_STEPS,
  MANAGER_TEACHERS,
  managerTierFromCompletedClasses,
  recommendedManagerAction,
  resolveManagerSegment,
  stepLabel,
  type ManagerSegment,
  type ManagerStepKey,
  type ManagerTeacherRecord,
} from './managerData'

type SegmentFilter = 'All' | ManagerSegment
type RegularFilter = 'All' | 'Yes' | 'No'
type TierFilter = 'All' | 'Tier 1' | 'Tier 2+'
type StuckFilter = 'All' | '0-7' | '8-14' | '15-21' | '22+'
type OnboardingFilter = 'All' | '0-30' | '31-60'
type PeakFilter = 'All' | '0-10' | '11-30' | '31+'

const SEGMENTS: ManagerSegment[] = ['高增长老师', '正常推进', '需要关注', '高风险']

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[mid] ?? 0
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
}

function segmentClass(segment: ManagerSegment): string {
  if (segment === '高增长老师') return 'high-growth'
  if (segment === '正常推进') return 'on-track'
  if (segment === '需要关注') return 'need-attention'
  return 'at-risk'
}

function completedStep(teacher: ManagerTeacherRecord, order: number): boolean {
  return teacher.completedStepIndex >= order
}

function inRange(value: number, filter: StuckFilter | OnboardingFilter | PeakFilter): boolean {
  if (filter === 'All') return true
  if (filter === '0-7') return value <= 7
  if (filter === '8-14') return value >= 8 && value <= 14
  if (filter === '15-21') return value >= 15 && value <= 21
  if (filter === '22+') return value >= 22
  if (filter === '0-30') return value <= 30
  if (filter === '31-60') return value >= 31 && value <= 60
  if (filter === '0-10') return value <= 10
  if (filter === '11-30') return value >= 11 && value <= 30
  if (filter === '31+') return value >= 31
  return true
}

export function ManagerDashboard() {
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('All')
  const [stepFilter, setStepFilter] = useState<'All' | ManagerStepKey>('All')
  const [regularFilter, setRegularFilter] = useState<RegularFilter>('All')
  const [tierFilter, setTierFilter] = useState<TierFilter>('All')
  const [stuckFilter, setStuckFilter] = useState<StuckFilter>('All')
  const [onboardingFilter, setOnboardingFilter] = useState<OnboardingFilter>('All')
  const [peakFilter, setPeakFilter] = useState<PeakFilter>('All')

  const enrichedTeachers = useMemo(
    () =>
      MANAGER_TEACHERS.map((teacher) => {
        const tier = managerTierFromCompletedClasses(teacher.completedClasses)
        const segment = resolveManagerSegment(teacher)
        return {
          ...teacher,
          tier,
          segment,
          recommendedAction: recommendedManagerAction(teacher),
        }
      }),
    [],
  )

  const filteredTeachers = useMemo(
    () =>
      enrichedTeachers.filter((teacher) => {
        if (segmentFilter !== 'All' && teacher.segment !== segmentFilter) return false
        if (stepFilter !== 'All' && teacher.currentStep !== stepFilter) return false
        if (regularFilter === 'Yes' && !teacher.hasFirstRegularStudent) return false
        if (regularFilter === 'No' && teacher.hasFirstRegularStudent) return false
        if (tierFilter === 'Tier 1' && teacher.tier !== 'Tier 1') return false
        if (tierFilter === 'Tier 2+' && teacher.tier === 'Tier 1') return false
        if (!inRange(teacher.daysStuck, stuckFilter)) return false
        if (!inRange(teacher.daysSinceOnboarding, onboardingFilter)) return false
        if (!inRange(teacher.peakTimeCompleted, peakFilter)) return false
        return true
      }),
    [enrichedTeachers, segmentFilter, stepFilter, regularFilter, tierFilter, stuckFilter, onboardingFilter, peakFilter],
  )

  const regularTimes = enrichedTeachers
    .map((teacher) => teacher.timeToFirstRegularStudent)
    .filter((value): value is number => typeof value === 'number')
  const firstRegularWithin30 = enrichedTeachers.filter(
    (teacher) => teacher.timeToFirstRegularStudent != null && teacher.timeToFirstRegularStudent <= 30,
  ).length
  const firstRegularWithin60 = enrichedTeachers.filter(
    (teacher) => teacher.timeToFirstRegularStudent != null && teacher.timeToFirstRegularStudent <= 60,
  ).length

  const summary = {
    total: enrichedTeachers.length,
    active: enrichedTeachers.filter((teacher) => teacher.completedClasses > 0 || teacher.lastTrainingActivityDate).length,
    completedStep1: enrichedTeachers.filter((teacher) => completedStep(teacher, 1)).length,
    completedStep2: enrichedTeachers.filter((teacher) => completedStep(teacher, 2)).length,
    completedMock: enrichedTeachers.filter((teacher) => completedStep(teacher, 3)).length,
    completedWorkshop1: enrichedTeachers.filter((teacher) => completedStep(teacher, 4)).length,
    completedWorkshop2: enrichedTeachers.filter((teacher) => completedStep(teacher, 5)).length,
    firstRegular: enrichedTeachers.filter((teacher) => teacher.hasFirstRegularStudent).length,
    avgFirstRegular: avg(regularTimes),
    tier2Plus: enrichedTeachers.filter((teacher) => teacher.tier !== 'Tier 1').length,
  }

  const funnel = MANAGER_FUNNEL_STEPS.map((step) => {
    const completed = enrichedTeachers.filter((teacher) => completedStep(teacher, step.order)).length
    const stuck = enrichedTeachers.filter(
      (teacher) => teacher.currentStep === step.key && teacher.daysStuck >= 14,
    ).length
    return {
      ...step,
      completed,
      completionRate: pct(completed, enrichedTeachers.length),
      stuck,
      avgDays: avg(enrichedTeachers.map((teacher) => teacher.stepDays[step.key]).filter((days) => days > 0)),
    }
  })

  const biggestStuckStep = [...funnel].sort((a, b) => b.stuck - a.stuck)[0]
  const segmentCounts = SEGMENTS.map((segment) => ({
    segment,
    count: enrichedTeachers.filter((teacher) => teacher.segment === segment).length,
  }))
  const teachersNeedAttention = enrichedTeachers.filter((teacher) => teacher.segment === '需要关注')
  const teachersAtRisk = enrichedTeachers.filter((teacher) => teacher.segment === '高风险')
  const recentFirstRegular = enrichedTeachers.filter(
    (teacher) => teacher.hasFirstRegularStudent && teacher.regularStudentGrowth === 'new',
  )
  const highGrowth = enrichedTeachers.filter((teacher) => teacher.segment === '高增长老师')

  return (
    <div className="manager-view-shell">
      <StickyGuideBar
        mode="default"
        message="管理端帮助运营判断：哪些老师需要提醒、激励、人工跟进，哪些高增长老师值得沉淀为成功案例。"
      />
      <main className="manager-dashboard">
        <header className="manager-hero">
          <div>
            <span className="manager-eyebrow">Teacher Success Operating System</span>
            <h1>管理端看板 · 入职前60天</h1>
            <p>
              培训停滞不等于老师存在风险。任何培训节点的停滞，都需要结合 Tier、完课量、Regular Students、
              Peak Time、Trial Conversion 等业务表现综合判断，再决定正确的运营动作。
            </p>
          </div>
          <div className="manager-hero-note">
            <strong>判断原则</strong>
            <span>
              高停滞量只是信号，不是结论。请先看老师真实业务表现，再选择自动邮件提醒、激励推送、人工跟进，或评估培训内容迭代。
            </span>
          </div>
        </header>

        <section className="manager-summary-grid" aria-label="60-day new teacher summary">
          <MetricCard label="60天内新老师" value={summary.total} />
          <MetricCard label="活跃老师" value={summary.active} />
          <MetricCard label="完成 Step 1" value={summary.completedStep1} />
          <MetricCard label="完成 Step 2" value={summary.completedStep2} />
          <MetricCard label="完成 Required Mock" value={summary.completedMock} />
          <MetricCard label="完成 Workshop 1" value={summary.completedWorkshop1} />
          <MetricCard label="完成 Workshop 2" value={summary.completedWorkshop2} />
          <MetricCard label="达成首个稳定学生" value={summary.firstRegular} />
          <MetricCard label="首个稳定学生平均达成时间" value={`${summary.avgFirstRegular}天`} />
          <MetricCard label="达到 Tier2+ 老师" value={summary.tier2Plus} accent="高潜信号" />
        </section>

        <section className="manager-two-col">
          <div className="manager-panel">
            <PanelHeader
              eyebrow="成长漏斗"
              title="Training Funnel / 成长漏斗"
              note="该节点需要运营关注。请结合业务表现判断下一步应为自动邮件提醒、激励推送、人工跟进，还是培训内容迭代。"
            />
            <div className="manager-funnel">
              {funnel.map((step) => (
                <article key={step.key} className="manager-funnel-card">
                  <div className="manager-funnel-card__head">
                    <span>{step.shortLabel}</span>
                    <strong>{step.completionRate}%</strong>
                  </div>
                  <div className="manager-progress-bar" aria-hidden>
                    <span style={{ width: `${step.completionRate}%` }} />
                  </div>
                  <dl>
                    <div>
                      <dt>已完成</dt>
                      <dd>{step.completed}</dd>
                    </div>
                    <div>
                      <dt>停滞</dt>
                      <dd>{step.stuck}</dd>
                    </div>
                    <div>
                      <dt>平均天数</dt>
                      <dd>{step.avgDays}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <div className="manager-panel">
            <PanelHeader
              eyebrow="成功速度"
              title="首个稳定学生达成时间"
              note="这是管理端最重要的新老师业务速度指标。Tier2+ 用于识别高增长老师，不作为主要时间指标。"
            />
            <div className="velocity-grid">
              <MetricCard label="平均达成时间" value={`${avg(regularTimes)}天`} />
              <MetricCard label="中位达成时间" value={`${median(regularTimes)}天`} />
              <VelocityBar label="30天内达成" value={pct(firstRegularWithin30, enrichedTeachers.length)} />
              <VelocityBar label="60天内达成" value={pct(firstRegularWithin60, enrichedTeachers.length)} />
            </div>
          </div>
        </section>

        <section className="manager-two-col manager-two-col--attention">
          <div className="manager-panel">
            <PanelHeader
              eyebrow="老师分层"
              title="谁需要什么运营动作？"
              note="分层同时结合培训进度与业务表现。即使部分培训未完成，老师也可能因为业务增长强而被识别为高增长老师。"
            />
            <div className="segment-grid">
              {segmentCounts.map(({ segment, count }) => (
                <article key={segment} className={`segment-card segment-card--${segmentClass(segment)}`}>
                  <span>{segment}</span>
                  <strong>{count}</strong>
                  <p>{segmentCopy(segment)}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="manager-panel manager-panel--attention">
            <PanelHeader
              eyebrow="运营关注"
              title="本周运营重点"
              note="高停滞量只是信号，不是结论。请先复核老师业务表现，再决定发送提醒、增加激励、人工跟进或迭代培训内容。"
            />
            <div className="attention-list">
              <AttentionItem label="需要关注老师" value={teachersNeedAttention.length} tone="warn" />
              <AttentionItem label="高风险老师" value={teachersAtRisk.length} tone="danger" />
              <AttentionItem label="最大停滞节点" value={biggestStuckStep?.shortLabel ?? '暂无'} tone="neutral" />
              <AttentionItem
                label="近期达成首个稳定学生"
                value={recentFirstRegular.map((teacher) => teacher.teacherName).join(', ') || '暂无'}
                tone="success"
              />
              <AttentionItem
                label="高潜老师案例池"
                value={highGrowth.slice(0, 3).map((teacher) => teacher.teacherName).join(', ') || '暂无'}
                tone="success"
              />
            </div>
          </div>
        </section>

        <section className="manager-panel manager-table-panel">
          <PanelHeader
            eyebrow="老师明细"
            title="60天内新老师运营表"
            note="可按入职天数、当前节点、老师分层、Tier、是否获得首个稳定学生、停滞天数和 Peak Time 范围筛选。"
          />
          <div className="manager-filters">
            <FilterSelect label="入职天数" value={onboardingFilter} onChange={setOnboardingFilter} options={['All', '0-30', '31-60']} optionLabel={filterLabel} />
            <FilterSelect label="当前节点" value={stepFilter} onChange={setStepFilter} options={['All', ...MANAGER_FUNNEL_STEPS.map((step) => step.key)]} optionLabel={(value) => (value === 'All' ? '全部' : stepLabel(value as ManagerStepKey))} />
            <FilterSelect label="老师分层" value={segmentFilter} onChange={setSegmentFilter} options={['All', ...SEGMENTS]} optionLabel={filterLabel} />
            <FilterSelect label="Tier" value={tierFilter} onChange={setTierFilter} options={['All', 'Tier 1', 'Tier 2+']} optionLabel={filterLabel} />
            <FilterSelect label="首个稳定学生" value={regularFilter} onChange={setRegularFilter} options={['All', 'Yes', 'No']} optionLabel={filterLabel} />
            <FilterSelect label="停滞天数" value={stuckFilter} onChange={setStuckFilter} options={['All', '0-7', '8-14', '15-21', '22+']} optionLabel={filterLabel} />
            <FilterSelect label="Peak Time 范围" value={peakFilter} onChange={setPeakFilter} options={['All', '0-10', '11-30', '31+']} optionLabel={filterLabel} />
          </div>
          <div className="manager-table-wrap">
            <table className="manager-teacher-table">
              <thead>
                <tr>
                  <th>老师姓名</th>
                  <th>老师ID</th>
                  <th>入职天数</th>
                  <th>当前节点</th>
                  <th>最近培训活动</th>
                  <th>停滞天数</th>
                  <th>完课量</th>
                  <th>Tier</th>
                  <th>Peak Time</th>
                  <th>Trial Conversion</th>
                  <th>首个稳定学生</th>
                  <th>达成时间</th>
                  <th>分层</th>
                  <th>推荐运营动作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.teacherId}>
                    <td>{teacher.teacherName}</td>
                    <td>{teacher.teacherId}</td>
                    <td>{teacher.daysSinceOnboarding}</td>
                    <td>{stepLabel(teacher.currentStep)}</td>
                    <td>{teacher.lastTrainingActivityDate}</td>
                    <td>{teacher.daysStuck}</td>
                    <td>{teacher.completedClasses}</td>
                    <td>{teacher.tier}</td>
                    <td>{teacher.peakTimeCompleted}</td>
                    <td>{teacher.trialConversion}</td>
                    <td>{teacher.hasFirstRegularStudent ? '是' : '否'}</td>
                    <td>{teacher.timeToFirstRegularStudent == null ? '未达成' : `${teacher.timeToFirstRegularStudent}天`}</td>
                    <td>
                      <span className={`manager-segment-pill manager-segment-pill--${segmentClass(teacher.segment)}`}>
                        {teacher.segment}
                      </span>
                    </td>
                    <td>{teacher.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <article className="manager-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {accent ? <em>{accent}</em> : null}
    </article>
  )
}

function PanelHeader({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <header className="manager-panel-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{note}</p>
    </header>
  )
}

function VelocityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="velocity-bar">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="manager-progress-bar" aria-hidden>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function AttentionItem({ label, value, tone }: { label: string; value: string | number; tone: 'warn' | 'danger' | 'success' | 'neutral' }) {
  return (
    <article className={`attention-item attention-item--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function segmentCopy(segment: ManagerSegment): string {
  if (segment === '高增长老师') return '可邀请分享经验、沉淀成功案例，并鼓励继续开放 Peak Time。'
  if (segment === '正常推进') return '培训和业务表现均在推进中，轻量提醒下一步即可。'
  if (segment === '需要关注') return '培训停滞且增长较慢，需要定向提醒、激励或下一步培训建议。'
  return '停滞时间长且业务表现弱，需要人工跟进并诊断真实卡点。'
}

function filterLabel(value: string): string {
  if (value === 'All') return '全部'
  if (value === 'Yes') return '是'
  if (value === 'No') return '否'
  return value
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  optionLabel,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: T[]
  optionLabel?: (value: T) => string
}) {
  return (
    <label className="manager-filter">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel ? optionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  )
}

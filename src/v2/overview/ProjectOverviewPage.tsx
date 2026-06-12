interface ProjectOverviewPageProps {
  onOpenTeacherView: () => void
  onOpenManagerView: () => void
}

const teacherMetrics = ['预计月收入', '计划完课量', 'Peak Time Gap', '当前 Tier', '下一步培训任务']

const managerMetrics = [
  '60天内新老师人数',
  '首个稳定学生达成人数',
  '首个稳定学生平均达成时间',
  'Tier2+ 老师人数',
  '需要关注老师人数',
  '高风险老师人数',
]

export function ProjectOverviewPage({ onOpenTeacherView, onOpenManagerView }: ProjectOverviewPageProps) {
  return (
    <main className="project-overview-page">
      <section className="project-hero">
        <div className="project-hero__content">
          <span className="project-eyebrow">Teacher Success Operating System</span>
          <h1>北美新老师成长与运营闭环系统</h1>
          <p>
            从新老师入职前60天的关键窗口出发，让老师知道如何更快获得收入，也让运营知道谁正在增长、谁需要帮助、哪些成功经验可以被规模化复制。
          </p>
          <div className="project-hero__actions">
            <button type="button" className="project-primary-btn" onClick={onOpenTeacherView}>
              进入老师端
            </button>
            <button type="button" className="project-secondary-btn" onClick={onOpenManagerView}>
              进入管理端
            </button>
          </div>
        </div>
        <div className="project-hero__summary" aria-label="项目闭环摘要">
          <div>
            <strong>Teacher View</strong>
            <span>我想赚到目标收入，需要完成什么、开放多少 timeslots、如何成长？</span>
          </div>
          <div>
            <strong>Manager View</strong>
            <span>哪些老师正在成功？哪些老师需要帮助？哪些节点需要运营动作？哪些经验可以复制？</span>
          </div>
        </div>
      </section>

      <section className="project-section">
        <header className="project-section-header">
          <span>项目背景</span>
          <h2>为什么需要这个系统？</h2>
        </header>
        <div className="project-card-grid project-card-grid--three">
          <InfoCard
            index="01"
            title="新老师入职前60天是关键窗口期"
            groups={[
              {
                title: '优势',
                items: ['对平台有新鲜感和信任感', '愿意开放更多 Peak Time / PPT', '有较强的尝试意愿和配合度'],
              },
              {
                title: '不足',
                items: ['不熟悉平台规则和 Teacher Portal 功能', '不熟悉课程体系和学生特点', '不熟悉订课逻辑、Trial 转化和 Regular Student 经营方法'],
              },
            ]}
          />
          <InfoCard
            index="02"
            title="传统培训管理难以规模化"
            groups={[
              {
                title: '过去主要依赖',
                items: ['线下跑数据', '人工判断老师卡在第几个培训节点', '人工发邮件提醒', '人工识别表现好的老师'],
              },
              {
                title: '带来的问题',
                items: ['跟进效率低', '运营动作不稳定', '难以及时发现 C / D 类风险老师', '成功经验难以沉淀和复制'],
              },
            ]}
          />
          <InfoCard
            index="03"
            title="项目目标：从个体成长到运营闭环"
            groups={[
              {
                title: '老师端目标',
                items: ['看清自己的收入目标', '明确需要贡献多少 timeslots', '知道下一步应该完成哪些证书、Mock 或 Workshop', '更快获得稳定学生和持续收入机会'],
              },
              {
                title: '管理端目标',
                items: ['看清60天内新老师整体状态', '识别高增长、正常推进、需要关注和高风险老师', '明确哪些老师需要自动提醒、激励推动或人工跟进', '复制高增长老师的成功经验'],
              },
            ]}
          />
        </div>
      </section>

      <section className="project-section">
        <header className="project-section-header">
          <span>核心产品逻辑</span>
          <h2>从个体成长到运营闭环</h2>
        </header>
        <div className="logic-flow-grid">
          <FlowCard
            title="老师端逻辑"
            items={['收入目标', '计划完课量 / Peak Time / Trial Conversion / PB-JG-LR / Short Notice', '收入预测', '推荐培训路径', '成长进度', '更高订课与收入机会']}
          />
          <FlowCard
            title="管理端逻辑"
            items={['新老师数据', '培训进度', '业务表现', '风险分层', '运营动作', '成功经验复制']}
          />
        </div>
      </section>

      <section className="project-section">
        <header className="project-section-header">
          <span>双端入口</span>
          <h2>一个系统，两类使用者</h2>
        </header>
        <div className="entry-card-grid">
          <article className="project-entry-card project-entry-card--teacher">
            <span className="project-entry-card__tag">老师端｜Teacher View</span>
            <h3>老师成长地图</h3>
            <p>面向新老师，帮助老师理解自己的收入目标、开课目标、培训任务和成长路径。</p>
            <ul>
              <li>收入目标计算</li>
              <li>Timeslots 贡献提醒</li>
              <li>Peak Time Gap</li>
              <li>Pay Tier 展示</li>
              <li>证书 / Mock / Workshop 成长地图</li>
              <li>下一步行动建议</li>
            </ul>
            <button type="button" className="project-primary-btn" onClick={onOpenTeacherView}>
              进入老师端
            </button>
          </article>

          <article className="project-entry-card project-entry-card--manager">
            <span className="project-entry-card__tag">管理端｜Manager View</span>
            <h3>运营管理看板</h3>
            <p>面向老师运营团队，帮助管理者查看60天内新老师的成长进度、培训卡点、业务表现和运营干预优先级。</p>
            <ul>
              <li>60天内新老师总览</li>
              <li>Training Funnel / 成长漏斗</li>
              <li>首个稳定学生达成时间</li>
              <li>老师分层：高增长 / 正常推进 / 需要关注 / 高风险</li>
              <li>卡点提醒与本周运营重点</li>
              <li>高潜老师案例池</li>
            </ul>
            <button type="button" className="project-primary-btn" onClick={onOpenManagerView}>
              进入管理端
            </button>
          </article>
        </div>
      </section>

      <section className="project-principle">
        <span>关键判断原则</span>
        <h2>培训停滞不等于老师存在风险。</h2>
        <p>
          任何培训节点的停滞，都需要结合老师实际业务表现，如 Tier、完课量、Regular Students、Peak Time、Trial Conversion
          等综合判断后，再决定是自动邮件提醒、上激励、人工跟进，还是评估培训内容是否需要迭代。
        </p>
      </section>

      <section className="project-section">
        <header className="project-section-header">
          <span>核心指标</span>
          <h2>衡量老师成长，也衡量运营动作是否有效</h2>
        </header>
        <div className="metric-group-grid">
          <MetricGroup title="老师端核心指标" metrics={teacherMetrics} />
          <MetricGroup title="管理端核心指标" metrics={managerMetrics} />
        </div>
        <p className="project-metric-note">
          Time to First Regular Student 是管理端核心业务指标，比 Time to Tier2 更重要。Tier2+ 代表老师累计完课至少80节，如果老师在入职60天内达到
          Tier2，说明老师比较被平台接受，正在进入增长状态，应识别为高增长 / 高潜老师。
        </p>
      </section>
    </main>
  )
}

function InfoCard({
  index,
  title,
  groups,
}: {
  index: string
  title: string
  groups: Array<{ title: string; items: string[] }>
}) {
  return (
    <article className="project-info-card">
      <span>{index}</span>
      <h3>{title}</h3>
      <div className="project-info-card__groups">
        {groups.map((group) => (
          <section key={group.title} className="project-info-card__group">
            <h4>{group.title}</h4>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  )
}

function FlowCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="logic-flow-card">
      <h3>{title}</h3>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </article>
  )
}

function MetricGroup({ title, metrics }: { title: string; metrics: string[] }) {
  return (
    <article className="metric-group-card">
      <h3>{title}</h3>
      <div>
        {metrics.map((metric) => (
          <span key={metric}>{metric}</span>
        ))}
      </div>
    </article>
  )
}

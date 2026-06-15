import { Link } from 'react-router-dom'
import { getCurrentUser, postLoginPath } from '../utils/auth'
import { roleHome } from '../utils/roles'
import { PLATFORM_AUDIENCES, PLATFORM_SUBJECTS } from '../utils/format'

const FLOW_STEPS = [
  {
    no: '01',
    icon: '📊',
    title: '智能诊断',
    desc: '精准摸底，定位薄弱微技能，生成可视化掌握度与根因链。',
  },
  {
    no: '02',
    icon: '💬',
    title: 'AI 引导讲题',
    desc: '苏格拉底式四阶段对话，只提问、不给答案，引导自己想通。',
  },
  {
    no: '03',
    icon: '🎯',
    title: '自适应练习',
    desc: '按薄弱点与遗忘曲线智能推题，每次都打在最近发展区。',
  },
]

export default function Landing() {
  const user = getCurrentUser()
  const loggedIn = !!user
  const enterPath = user ? postLoginPath(user.role) : '/register'
  const homePath = user ? roleHome(user.role) : '/login'

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">✦</span>
          <span>微光 Glimmer</span>
        </Link>
        <nav className="landing-nav-menu">
          <a href="#flow">学习闭环</a>
          <a href="#audiences">适用人群</a>
          <a href="#subjects">学科</a>
        </nav>
        <div className="landing-nav-actions">
          {loggedIn ? (
            <>
              <Link to={enterPath} className="btn ghost">进入平台</Link>
              <Link to={homePath} className="btn primary">我的工作台</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost">登录</Link>
              <Link to="/register" className="btn primary">免费注册</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy reveal">
          <span className="landing-badge">
            <span className="badge-dot" />
            全学科 · 全龄段 AI 学习平台
          </span>
          <h1>
            每一位学习者，
            <br />
            <span className="landing-gradient">都值得被温柔点亮</span>
          </h1>
          <p className="landing-lead">
            微光 Glimmer 覆盖幼儿园到银发族、K12 到职业考证的全学段学习场景。
            以「诊断 → AI 引导讲题 → 自适应练习」三层闭环，用苏格拉底式提问代替灌输，
            让每位学习者都能在自己的节奏里成长。
          </p>
          <div className="landing-cta">
            <Link to={loggedIn ? enterPath : '/register'} className="btn primary lg">
              {loggedIn ? '进入工作台' : '免费开始学习'}
            </Link>
            <Link to={loggedIn ? homePath : '/login'} className="btn lg">
              {loggedIn ? '返回首页' : '已有账号登录'}
            </Link>
          </div>
          <div className="landing-stats">
            <div>
              <strong>8 学段</strong>
              <span>幼 / 小 / 初 / 高 / 大学 / 职场 / 银发</span>
            </div>
            <div>
              <strong>全学科</strong>
              <span>数学 · 语文 · 英语 · 考证…</span>
            </div>
            <div>
              <strong>AI 讲题</strong>
              <span>苏格拉底式引导</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual reveal reveal-delay-1">
          <div className="landing-mock-card">
            <div className="mock-head">
              <span className="mock-avatar">✦</span>
              <div className="mock-head-text">
                <strong>AI 学习伙伴</strong>
                <span>体验中 · 小学数学 · 分数</span>
              </div>
              <span className="mock-live">● 在线</span>
            </div>
            <p className="mock-question">把 3/4 和 2/3 通分后比较大小，谁更大？</p>
            <div className="mock-chat">
              <div className="mock-bubble assistant">你觉得这两个分数的分母一样吗？</div>
              <div className="mock-bubble user">不一样，一个是 4，一个是 3</div>
              <div className="mock-bubble assistant">那怎样才能放在同一把「尺子」上比较呢？</div>
            </div>
            <p className="mock-note">更多学科与学段内容持续扩展中</p>
          </div>
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>
      </section>

      <section id="flow" className="landing-flow">
        <div className="landing-section-head">
          <h2>三步学习闭环</h2>
          <p className="landing-section-lead">学习有据可依，每一步都被记录与优化</p>
        </div>
        <div className="flow-track">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.no} className="flow-step">
              <div className="flow-card">
                <span className="flow-no">{step.no}</span>
                <span className="flow-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {i < FLOW_STEPS.length - 1 && <span className="flow-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section id="audiences" className="landing-audiences">
        <div className="landing-section-head">
          <h2>覆盖每一位学习者</h2>
          <p className="landing-section-lead">同一套学习内核，按学段自动适配教法与难度</p>
        </div>
        <div className="audience-grid">
          {PLATFORM_AUDIENCES.map((label) => (
            <div key={label} className="audience-chip">{label}</div>
          ))}
        </div>
      </section>

      <section id="subjects" className="landing-subjects">
        <div className="landing-section-head">
          <h2>全学科，持续扩展</h2>
          <p className="landing-section-lead">可插拔的知识图谱与判分策略，学科越多，平台越强</p>
        </div>
        <div className="subject-grid">
          {PLATFORM_SUBJECTS.map((s) => (
            <article key={s.name} className={`subject-card${s.status === '已开放' ? ' active' : ''}`}>
              <span className="subject-icon">{s.icon}</span>
              <strong>{s.name}</strong>
              <span className="subject-status">{s.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta">
        <h2>准备好点亮你的学习微光了吗？</h2>
        <p>注册账号，创建学习档案，从当前开放的学科体验开始，更多内容将陆续上线。</p>
        <Link to={loggedIn ? enterPath : '/register'} className="btn primary lg">
          {loggedIn ? '进入工作台' : '免费注册'}
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="brand-mark">✦</span>
          <span>微光 Glimmer</span>
        </div>
        <span className="landing-footer-meta">全学科 · 全龄段 AI 学习平台 · 诊断 → 教学 → 练习</span>
      </footer>
    </div>
  )
}

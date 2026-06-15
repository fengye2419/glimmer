import { useEffect, useState } from 'react'
import { getHealth } from '../../api/client'
import { PortalHeader, StatGrid, FeatureList } from '../../components/PortalShell'
import { PLATFORM_SUBJECTS } from '../../utils/format'

export default function PlatformHome() {
  const [aiOnline, setAiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    getHealth()
      .then((r) => setAiOnline(r.data.ollama_healthy))
      .catch(() => setAiOnline(false))
  }, [])

  return (
    <div className="page portal-page">
      <PortalHeader title="平台运营台" subtitle="平台方 · 租户、学科域与系统可观测" />

      <StatGrid items={[
        { label: '注册租户', value: '24', hint: '演示数据' },
        { label: '活跃学习者', value: '1.2k', hint: '近 30 天' },
        { label: '开放学科域', value: '1', hint: '数学' },
        { label: 'AI 服务', value: aiOnline == null ? '…' : aiOnline ? '在线' : '降级' },
      ]} />

      <FeatureList items={[
        { title: '租户管理', desc: '家庭租户与机构租户的开通、配额与账单。', to: '/platform/tenants', action: '租户列表' },
        { title: '学科域配置', desc: '管理各学科的知识图谱、判分策略与教法插件。', to: '/platform/domains', action: '学科域' },
        { title: '系统监控', desc: 'LLM 调用量、延迟、错误率与降级链路观测。' },
        { title: '内容运营', desc: '题库审核、苏格拉底 prompt 回归集与质量门禁。' },
      ]} />

      <section className="card">
        <h3>学科域状态</h3>
        <div className="subject-grid platform-domain-grid">
          {PLATFORM_SUBJECTS.map((s) => (
            <article key={s.name} className={`subject-card${s.status === '已开放' ? ' active' : ''}`}>
              <span className="subject-icon">{s.icon}</span>
              <strong>{s.name}</strong>
              <span className="subject-status">{s.status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

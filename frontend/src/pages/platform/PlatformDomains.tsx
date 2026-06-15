import { PortalHeader } from '../../components/PortalShell'
import { PLATFORM_SUBJECTS } from '../../utils/format'

export default function PlatformDomains() {
  return (
    <div className="page portal-page">
      <PortalHeader title="学科域管理" subtitle="平台方 · 可插拔的知识图谱、判分与教法配置" />
      <div className="portal-feature-list">
        {PLATFORM_SUBJECTS.map((s) => (
          <article key={s.name} className="portal-feature-item card">
            <div>
              <h3>{s.icon} {s.name}</h3>
              <p className="muted">
                状态：{s.status}
                {s.status === '已开放' && ' · 已配置知识图谱、mathcheck 判分、苏格拉底讲题'}
                {s.status === '即将上线' && ' · 知识图谱设计中'}
                {s.status === '规划中' && ' · 待立项'}
              </p>
            </div>
            {s.status === '已开放' && <span className="status-badge">生产</span>}
          </article>
        ))}
      </div>
    </div>
  )
}

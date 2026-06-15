import { PortalHeader } from '../../components/PortalShell'

const TENANTS = [
  { name: '星光教育', type: '机构', users: 186, plan: '专业版', status: '正常' },
  { name: '演示家庭', type: '家庭', users: 3, plan: '免费版', status: '正常' },
  { name: '未来学堂', type: '机构', users: 420, plan: '企业版', status: '试用' },
]

export default function PlatformTenants() {
  return (
    <div className="page portal-page">
      <PortalHeader title="租户管理" subtitle="平台方 · 家庭与机构租户一览" />
      <section className="card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>租户</th><th>类型</th><th>用户数</th><th>套餐</th><th>状态</th></tr>
            </thead>
            <tbody>
              {TENANTS.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.type}</td>
                  <td>{t.users}</td>
                  <td>{t.plan}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

import { PortalHeader, StatGrid, FeatureList } from '../../components/PortalShell'

export default function InstitutionHome() {
  return (
    <div className="page portal-page">
      <PortalHeader title="星光教育机构" subtitle="机构端 · 统一管理教师、班级与教学运营" />

      <StatGrid items={[
        { label: '在读学生', value: '186' },
        { label: '在职教师', value: '12' },
        { label: '开设班级', value: '8' },
        { label: '本月活跃率', value: '78%' },
      ]} />

      <FeatureList items={[
        { title: '教师管理', desc: '邀请教师、分配权限与查看授课数据。', to: '/institution/teachers', action: '管理教师' },
        { title: '班级运营', desc: '创建班级、排课与学情汇总报表。', to: '/institution/classes', action: '班级列表' },
        { title: '数据报表', desc: '机构维度的学习效果分析与导出（即将上线）。' },
        { title: '私有化部署', desc: '支持机构内网部署，数据不出机构（路线图能力）。' },
      ]} />
    </div>
  )
}

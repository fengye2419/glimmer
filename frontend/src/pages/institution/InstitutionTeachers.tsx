import { PortalHeader } from '../../components/PortalShell'

const TEACHERS = [
  { name: '李老师', subject: '数学', classes: 2, students: 62 },
  { name: '王老师', subject: '语文', classes: 1, students: 35 },
  { name: '张老师', subject: '英语', classes: 2, students: 58 },
]

export default function InstitutionTeachers() {
  return (
    <div className="page portal-page">
      <PortalHeader title="教师管理" subtitle="机构端 · 教师账号与授课安排" />
      <div className="portal-feature-list">
        {TEACHERS.map((t) => (
          <article key={t.name} className="portal-feature-item card">
            <div>
              <h3>{t.name}</h3>
              <p className="muted">{t.subject} · {t.classes} 个班级 · {t.students} 名学生</p>
            </div>
            <span className="status-badge">在职</span>
          </article>
        ))}
      </div>
    </div>
  )
}

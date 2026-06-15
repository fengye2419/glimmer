import { PortalHeader } from '../../components/PortalShell'

const MOCK_CLASSES = [
  { id: 'c1', name: '五年级一班', students: 32, subject: '数学', teacher: '李老师' },
  { id: 'c2', name: '五年级二班', students: 30, subject: '数学', teacher: '李老师' },
]

export default function TeacherClasses() {
  return (
    <div className="page portal-page">
      <PortalHeader title="班级管理" subtitle="教师端 · 管理所带班级与教学进度" />
      <div className="portal-feature-list">
        {MOCK_CLASSES.map((c) => (
          <article key={c.id} className="portal-feature-item card">
            <div>
              <h3>{c.name}</h3>
              <p className="muted">{c.subject} · {c.students} 名学生 · 任课 {c.teacher}</p>
            </div>
            <span className="status-badge">进行中</span>
          </article>
        ))}
      </div>
    </div>
  )
}

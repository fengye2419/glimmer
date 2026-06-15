import { PortalHeader } from '../../components/PortalShell'

const CLASSES = [
  { name: '五年级一班', teacher: '李老师', students: 32, subject: '数学' },
  { name: '五年级二班', teacher: '李老师', students: 30, subject: '数学' },
  { name: '四年级英语班', teacher: '张老师', students: 28, subject: '英语' },
]

export default function InstitutionClasses() {
  return (
    <div className="page portal-page">
      <PortalHeader title="班级管理" subtitle="机构端 · 全部班级与学情概览" />
      <section className="card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>班级</th><th>学科</th><th>任课教师</th><th>学生数</th></tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.subject}</td>
                  <td>{c.teacher}</td>
                  <td>{c.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

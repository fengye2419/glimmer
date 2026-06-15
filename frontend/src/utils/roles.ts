export type UserRole = 'parent' | 'student' | 'teacher' | 'institution' | 'platform'

export interface RoleMeta {
  key: UserRole
  label: string
  description: string
  home: string
}

export const ROLES: RoleMeta[] = [
  {
    key: 'parent',
    label: '家长',
    description: '管理孩子学习档案，查看进度报告与学习建议',
    home: '/parent',
  },
  {
    key: 'student',
    label: '学生',
    description: '参与诊断、AI 讲题与自适应练习',
    home: '/student',
  },
  {
    key: 'teacher',
    label: '老师',
    description: '管理班级与学生，布置测评与查看学情',
    home: '/teacher',
  },
  {
    key: 'institution',
    label: '机构',
    description: '管理机构、教师团队与班级运营数据',
    home: '/institution',
  },
  {
    key: 'platform',
    label: '平台方',
    description: '租户运营、内容域管理与系统可观测',
    home: '/platform',
  },
]

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.key, r])) as Record<UserRole, RoleMeta>

export function roleLabel(role: UserRole) {
  return ROLE_MAP[role]?.label ?? role
}

export function roleHome(role: UserRole) {
  return ROLE_MAP[role]?.home ?? '/'
}

export interface NavItem {
  to: string
  label: string
  icon: string
}

export function roleNavLinks(role: UserRole): NavItem[] {
  switch (role) {
    case 'parent':
      return [
        { to: '/parent', label: '首页', icon: '🏠' },
        { to: '/parent/children', label: '孩子档案', icon: '👧' },
        { to: '/parent/reports', label: '学情报告', icon: '📊' },
      ]
    case 'student':
      return [
        { to: '/student', label: '学习中心', icon: '📚' },
        { to: '/student/diagnose', label: '诊断测评', icon: '📋' },
        { to: '/student/practice', label: '自适应练习', icon: '✏️' },
      ]
    case 'teacher':
      return [
        { to: '/teacher', label: '工作台', icon: '🧑‍🏫' },
        { to: '/teacher/classes', label: '班级管理', icon: '🏫' },
        { to: '/teacher/students', label: '学生学情', icon: '👥' },
      ]
    case 'institution':
      return [
        { to: '/institution', label: '机构概览', icon: '🏢' },
        { to: '/institution/teachers', label: '教师管理', icon: '👨‍🏫' },
        { to: '/institution/classes', label: '班级运营', icon: '📁' },
      ]
    case 'platform':
      return [
        { to: '/platform', label: '运营台', icon: '⚙️' },
        { to: '/platform/tenants', label: '租户管理', icon: '🌐' },
        { to: '/platform/domains', label: '学科域', icon: '🧩' },
      ]
  }
}

export function roleBadgeClass(role: UserRole) {
  return `role-badge role-${role}`
}

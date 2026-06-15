import type { UserRole } from './roles'
import { roleHome } from './roles'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface StoredUser extends AuthUser {
  password: string
}

const USERS_KEY = 'glimmer_users'
const AUTH_KEY = 'glimmer_auth'

export const DEMO_ACCOUNTS = [
  {
    id: 'demo-parent-001',
    email: 'demo@glimmer.app',
    name: '演示家长',
    password: 'demo123456',
    role: 'parent' as const,
  },
  {
    id: 'demo-student-001',
    email: 'student@glimmer.app',
    name: '小明',
    password: 'demo123456',
    role: 'student' as const,
  },
  {
    id: 'demo-teacher-001',
    email: 'teacher@glimmer.app',
    name: '李老师',
    password: 'demo123456',
    role: 'teacher' as const,
  },
  {
    id: 'demo-institution-001',
    email: 'org@glimmer.app',
    name: '星光教育',
    password: 'demo123456',
    role: 'institution' as const,
  },
  {
    id: 'demo-platform-001',
    email: 'admin@glimmer.app',
    name: '平台管理员',
    password: 'demo123456',
    role: 'platform' as const,
  },
] as const

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number]

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? inferRoleFromEmail(user.email),
  }
}

function inferRoleFromEmail(email: string): UserRole {
  if (email.startsWith('student@')) return 'student'
  if (email.startsWith('teacher@')) return 'teacher'
  if (email.startsWith('org@')) return 'institution'
  if (email.startsWith('admin@')) return 'platform'
  return 'parent'
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as Partial<AuthUser>
    if (!user.id || !user.email || !user.name) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? inferRoleFromEmail(user.email),
    }
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getCurrentUser()
}

export function login(email: string, password: string): AuthUser {
  const normalized = email.trim().toLowerCase()
  const user = readUsers().find((u) => u.email === normalized && u.password === password)
  if (!user) {
    throw new Error('邮箱或密码错误')
  }
  const authUser = toAuthUser(user)
  localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
  return authUser
}

export function register(name: string, email: string, password: string, role: UserRole): AuthUser {
  const trimmedName = name.trim()
  const normalized = email.trim().toLowerCase()
  if (!trimmedName) throw new Error('请输入姓名')
  if (!normalized.includes('@')) throw new Error('请输入有效邮箱')
  if (password.length < 6) throw new Error('密码至少 6 位')

  const users = readUsers()
  if (users.some((u) => u.email === normalized)) {
    throw new Error('该邮箱已注册')
  }

  const authUser: AuthUser = {
    id: crypto.randomUUID(),
    email: normalized,
    name: trimmedName,
    role,
  }
  users.push({ ...authUser, password })
  writeUsers(users)
  localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
  return authUser
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function postLoginPath(role: UserRole) {
  if (role === 'parent') return '/parent/children'
  if (role === 'student') return '/student/setup'
  return roleHome(role)
}

/** 首次启动时写入演示账号（已存在则补齐 role 字段） */
export function ensureDemoAccounts() {
  const users = readUsers()
  let changed = false

  for (const demo of DEMO_ACCOUNTS) {
    const existing = users.find((u) => u.email === demo.email)
    if (!existing) {
      users.push({
        id: demo.id,
        email: demo.email,
        name: demo.name,
        password: demo.password,
        role: demo.role,
      })
      changed = true
      continue
    }
    if (!existing.role) {
      existing.role = demo.role
      changed = true
    }
  }

  if (changed) writeUsers(users)
}

export function loginDemo(account: DemoAccount): AuthUser {
  return login(account.email, account.password)
}

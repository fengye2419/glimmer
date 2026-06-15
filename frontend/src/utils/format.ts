const STAGE_LABELS: Record<number, string> = {
  0: '幼儿园',
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  7: '初一', 8: '初二', 9: '初三',
  10: '高一', 11: '高二', 12: '高三',
  13: '大学',
  14: '职业教育',
  15: '成人进修',
  16: '银发学习',
}

export function gradeLabel(grade: number) {
  return STAGE_LABELS[grade] || `${grade}年级`
}

export function learnerStageLabel(grade: number) {
  if (grade <= 0) return '幼儿园'
  if (grade <= 6) return '小学'
  if (grade <= 9) return '初中'
  if (grade <= 12) return '高中'
  if (grade === 13) return '大学'
  if (grade === 14) return '职业教育'
  if (grade === 15) return '成人进修'
  if (grade === 16) return '银发学习'
  return '其他学段'
}

export const LEARNER_STAGES = [
  { value: 0, label: '幼儿园' },
  { value: 1, label: '小学一年级' },
  { value: 4, label: '小学四年级' },
  { value: 5, label: '小学五年级' },
  { value: 7, label: '初中一年级' },
  { value: 10, label: '高中一年级' },
  { value: 13, label: '大学' },
  { value: 14, label: '职业教育' },
  { value: 15, label: '成人进修' },
  { value: 16, label: '银发学习' },
] as const

export const PLATFORM_SUBJECTS = [
  { icon: '∑', name: '数学', status: '已开放' },
  { icon: '文', name: '语文', status: '即将上线' },
  { icon: 'A', name: '英语', status: '即将上线' },
  { icon: '⚛', name: '物理', status: '规划中' },
  { icon: '证', name: '考证', status: '规划中' },
  { icon: '技', name: '职业技能', status: '规划中' },
] as const

export const PLATFORM_AUDIENCES = [
  '幼儿园', '中小学', '大学', '职业教育', '成人进修', '银发学习',
] as const

export function practiceReasonLabel(reason: string, skillName?: string) {
  switch (reason) {
    case 'review':
      return `📅 到期复习：${skillName || '相关技能'}`
    case 'weak_skill':
      return `🎯 强化薄弱点：${skillName || '相关技能'}`
    case 'zpd':
      return `⚡ 最近发展区：${skillName || '自适应推题'}`
    default:
      return '自适应推题'
  }
}

export function dedupeCauses<T extends { skill_id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.skill_id)) return false
    seen.add(item.skill_id)
    return true
  })
}

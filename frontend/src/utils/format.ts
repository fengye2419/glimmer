export function gradeLabel(grade: number) {
  return `${grade}年级`
}

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

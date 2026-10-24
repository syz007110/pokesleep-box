import type { NatureStat, Specialty, SkillUnit } from '../models/types'

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  berry: '树果',
  ingredient: '食材',
  skill: '技能',
  all: '全能'
}

export const NATURE_STAT_LABEL: Record<NatureStat, string> = {
  speed: '帮忙速度',
  ingredient: '食材发现',
  skill: '主技能',
  energy: '活力回复',
  exp: 'EXP',
  neutral: '无修正'
}

export const SKILL_UNIT_LABEL: Record<string, string> = {
  energy: '点活力',
  ingredients: '个食材',
  helps: '次帮忙',
  pot: '锅容量',
  shards: '梦之碎片',
  berries: '个树果',
  copy: '（复制类，按发动次数估算）'
}

export function skillUnitLabel(unit: SkillUnit): string {
  return SKILL_UNIT_LABEL[unit] || unit
}

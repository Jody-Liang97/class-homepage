import type { AffairStatus, ClassAffair, Resource, ResourceFilters } from '../types/content'

export const categoryLabels: Record<string, string> = {
  all: '全部资料',
  course: '校内课程',
  other: '其他资源',
}

export const affairTypeLabels: Record<string, string> = {
  all: '全部事务',
  'league-class': '团课',
  'league-activity': '团日活动',
  evaluation: '评优评选',
  teaching: '教学安排',
  other: '其他事务',
}

export function filterResources(resources: Resource[], filters: ResourceFilters): Resource[] {
  const query = filters.query.trim().toLocaleLowerCase('zh-CN')
  return resources.filter((resource) => {
    const haystack = [resource.title, resource.description, resource.subject, ...resource.tags]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return (
      (!query || haystack.includes(query)) &&
      (!filters.category || filters.category === 'all' || resource.category === filters.category) &&
      (!filters.courseId || filters.courseId === 'all' || resource.courseId === filters.courseId) &&
      (!filters.subject || filters.subject === 'all' || resource.subject === filters.subject) &&
      (!filters.fileType || filters.fileType === 'all' || resource.fileType === filters.fileType)
    )
  })
}

export function getAffairStatus(affair: ClassAffair, now = new Date()): AffairStatus {
  const start = new Date(affair.startAt)
  const end = new Date(affair.endAt ?? affair.deadline ?? affair.startAt)
  if (now < start) return 'upcoming'
  if (now <= end) return 'active'
  return 'ended'
}

export function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(new Date(value))
}

export function formatShortDate(value: string): { month: string; day: string } {
  const date = new Date(value)
  return {
    month: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'short' }).format(date),
    day: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', day: '2-digit' }).format(date),
  }
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

function getShanghaiCalendarTimestamp(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day))
}

export function getRoundedDownDaysSince(startDate: string, now = new Date()): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate)
  if (!match) throw new RangeError(`Invalid calendar date: ${startDate}`)

  const startTimestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const elapsedDays = Math.floor((getShanghaiCalendarTimestamp(now) - startTimestamp) / DAY_IN_MILLISECONDS)
  return Math.max(0, Math.floor(elapsedDays / 10) * 10)
}

export function resolveUrl(path?: string | null): string {
  if (!path || /^(?:https?:)?\/\//i.test(path)) return path ?? ''
  const base = import.meta.env.BASE_URL || './'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${normalizedBase}${cleanPath}`
}



import { describe, expect, it } from 'vitest'
import { filterResources, getAffairStatus, getRoundedDownDaysSince, resolveUrl } from './content'
import type { ClassAffair, Resource } from '../types/content'

const resource: Resource = {
  id: 'graph-notes',
  title: '图论知识梳理',
  category: 'course',
  courseId: 'graph-theory',
  subject: '图论',
  description: '基础概念',
  tags: ['图', '复习'],
  fileType: 'Markdown',
  fileSize: '2 KB',
  downloadUrl: '/files/resources/graph-theory-notes.md',
  updatedAt: '2026-10-20',
  source: '班委整理',
}

describe('content helpers', () => {
  it('filters resources by Chinese keyword and category', () => {
    expect(filterResources([resource], { query: '图论', category: 'course', courseId: 'all', subject: 'all', fileType: 'all' })).toHaveLength(1)
    expect(filterResources([resource], { query: '英语', category: 'all', courseId: 'all', subject: 'all', fileType: 'all' })).toHaveLength(0)
  })

  it('filters course resources by stable course id', () => {
    expect(filterResources([resource], { query: '', category: 'course', courseId: 'graph-theory', subject: 'all', fileType: 'all' })).toHaveLength(1)
    expect(filterResources([resource], { query: '', category: 'course', courseId: 'ics', subject: 'all', fileType: 'all' })).toHaveLength(0)
  })

  it('calculates affair status around its time range', () => {
    const affair: ClassAffair = {
      id: 'status-check', title: '状态测试事务', type: 'other', summary: '状态测试', details: '状态测试',
      startAt: '2026-11-01T09:00:00+08:00', endAt: '2026-11-01T11:00:00+08:00',
    }
    expect(getAffairStatus(affair, new Date('2026-10-30T10:00:00+08:00'))).toBe('upcoming')
    expect(getAffairStatus(affair, new Date('2026-11-01T10:00:00+08:00'))).toBe('active')
    expect(getAffairStatus(affair, new Date('2026-11-02T10:00:00+08:00'))).toBe('ended')
  })

  it('calculates rounded class days by Shanghai calendar date', () => {
    expect(getRoundedDownDaysSince('2025-09-01', new Date('2025-09-01T20:00:00+08:00'))).toBe(0)
    expect(getRoundedDownDaysSince('2025-09-01', new Date('2026-11-01T12:00:00+08:00'))).toBe(420)
    expect(getRoundedDownDaysSince('2025-09-01', new Date('2026-11-05T00:00:00+08:00'))).toBe(430)
    expect(getRoundedDownDaysSince('2025-09-01', new Date('2025-08-20T12:00:00+08:00'))).toBe(0)
  })

  it('resolves asset urls relative to base URL', () => {
    expect(resolveUrl('/images/photo.jpg')).toMatch(/images\/photo\.jpg$/)
    expect(resolveUrl('https://example.com/test.png')).toBe('https://example.com/test.png')
    expect(resolveUrl('')).toBe('')
  })
})


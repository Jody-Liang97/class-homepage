import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const contentDir = resolve(root, 'src/content')
const errors = []

function readJson(name) {
  try {
    return JSON.parse(readFileSync(resolve(contentDir, name), 'utf8'))
  } catch (error) {
    errors.push(`${name}: 无法读取或解析（${error.message}）`)
    return []
  }
}

function validateIds(name, items) {
  const ids = new Set()
  for (const item of items) {
    if (!item.id) errors.push(`${name}: 存在缺少 id 的项目`)
    if (ids.has(item.id)) errors.push(`${name}: id 重复：${item.id}`)
    ids.add(item.id)
  }
}

function validateDate(name, id, value) {
  if (!value || Number.isNaN(Date.parse(value))) errors.push(`${name}: ${id} 的日期无效：${value}`)
}

function validateLocalFile(name, id, url) {
  if (!url || !url.startsWith('/')) return
  const cleanUrl = url.split('#')[0].split('?')[0]
  const path = resolve(root, 'public', cleanUrl.replace(/^\//, ''))
  if (!existsSync(path)) errors.push(`${name}: ${id} 引用的文件不存在：${url}`)
}

const resources = readJson('resources.json')
const courses = readJson('courses.json')
const affairs = readJson('affairs.json')
const albums = readJson('albums.json')
const site = readJson('site.json')
const about = readJson('about.json')

validateIds('resources.json', resources)
validateIds('courses.json', courses)
validateIds('affairs.json', affairs)
validateIds('albums.json', albums)
validateIds('about.json (chapters)', about.chapters ?? [])
validateIds('about.json (gallery)', about.gallery ?? [])
validateIds('about.json (wishes)', about.wishes ?? [])

const courseIds = new Set(courses.map((course) => course.id))
const courseAccents = new Set(['violet', 'mint', 'orange', 'blue'])

for (const course of courses) {
  for (const key of ['name', 'description', 'icon', 'accent']) {
    if (!course[key]) errors.push(`courses.json: ${course.id ?? '未知课程'} 缺少 ${key}`)
  }
  if (!Number.isFinite(course.order)) errors.push(`courses.json: ${course.id ?? '未知课程'} 的 order 无效`)
  if (!courseAccents.has(course.accent)) errors.push(`courses.json: ${course.id ?? '未知课程'} 的 accent 无效：${course.accent}`)
}

for (const item of resources) {
  for (const key of ['title', 'category', 'subject', 'description', 'fileType', 'downloadUrl', 'updatedAt']) {
    if (!item[key]) errors.push(`resources.json: ${item.id ?? '未知项目'} 缺少 ${key}`)
  }
  if (item.category === 'course' && !item.courseId) errors.push(`resources.json: ${item.id ?? '未知项目'} 缺少 courseId`)
  if (item.category === 'course' && item.courseId && !courseIds.has(item.courseId)) {
    errors.push(`resources.json: ${item.id ?? '未知项目'} 引用了不存在的课程：${item.courseId}`)
  }
  validateDate('resources.json', item.id, item.updatedAt)
  validateLocalFile('resources.json', item.id, item.downloadUrl)
}

for (const item of affairs) {
  for (const key of ['title', 'type', 'summary', 'details', 'startAt']) {
    if (!item[key]) errors.push(`affairs.json: ${item.id ?? '未知项目'} 缺少 ${key}`)
  }
  validateDate('affairs.json', item.id, item.startAt)
  if (item.endAt) validateDate('affairs.json', item.id, item.endAt)
  if (item.deadline) validateDate('affairs.json', item.id, item.deadline)
  if (item.attachmentUrl) validateLocalFile('affairs.json', item.id, item.attachmentUrl)
}

for (const album of albums) {
  validateDate('albums.json', album.id, album.date)
  validateLocalFile('albums.json', album.id, album.cover)
  for (const photo of album.photos ?? []) {
    validateLocalFile('albums.json', album.id, photo.src)
    validateLocalFile('albums.json', album.id, photo.thumbnail)
    if (!photo.alt) errors.push(`albums.json: ${album.id} 有照片缺少 alt`)
  }
}

for (const key of ['className', 'shortName', 'grade', 'major', 'slogan', 'intro', 'maintainerName', 'maintainerRole', 'contact', 'contactEmail', 'updatedAt']) {
  if (!site[key]) errors.push(`site.json: 缺少 ${key}`)
}
validateDate('site.json', 'site', site.updatedAt)
if (site.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail)) {
  errors.push('site.json: contactEmail 格式不正确')
}

for (const key of ['badge', 'eyebrow', 'title', 'accent', 'lead']) {
  if (!about.hero?.[key]) errors.push(`about.json: hero 缺少 ${key}`)
}

for (const chapter of about.chapters ?? []) {
  for (const key of ['number', 'kicker', 'title', 'summary', 'detail', 'tone']) {
    if (!chapter[key]) errors.push(`about.json (chapters): ${chapter.id ?? '未知章节'} 缺少 ${key}`)
  }
}

for (const photo of about.gallery ?? []) {
  for (const key of ['src', 'alt', 'label', 'objectPosition']) {
    if (!photo[key]) errors.push(`about.json (gallery): ${photo.id ?? '未知照片'} 缺少 ${key}`)
  }
  validateLocalFile('about.json (gallery)', photo.id, photo.src)
}

for (const wish of about.wishes ?? []) {
  for (const key of ['number', 'title', 'body', 'tone']) {
    if (!wish[key]) errors.push(`about.json (wishes): ${wish.id ?? '未知愿望'} 缺少 ${key}`)
  }
}

validateDate('about.json (metrics)', 'classStartedAt', about.metrics?.classStartedAt)
if (!Number.isInteger(about.metrics?.hearts) || about.metrics.hearts < 0) {
  errors.push('about.json (metrics): hearts 必须是非负整数')
}

for (const key of ['eyebrow', 'title', 'summary']) {
  if (!about.siteNote?.[key]) errors.push(`about.json: siteNote 缺少 ${key}`)
}

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 项）：\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

console.log(`内容校验通过：${resources.length} 份资料、${courses.length} 门课程、${affairs.length} 项事务、${albums.length} 个相册、关于页温情数据合规。`)


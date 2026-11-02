export type ResourceCategory = 'course' | 'other'
export type CourseAccent = 'violet' | 'mint' | 'orange' | 'blue'

export interface Course {
  id: string
  name: string
  description: string
  icon: string
  accent: CourseAccent
  order: number
}

export interface Resource {
  id: string
  title: string
  category: ResourceCategory
  courseId?: string
  subject: string
  description: string
  tags: string[]
  fileType: string
  fileSize: string
  downloadUrl: string
  updatedAt: string
  source: string
  copyrightNote?: string
  featured?: boolean
}

export type AffairType = 'league-class' | 'league-activity' | 'evaluation' | 'teaching' | 'other'
export type AffairStatus = 'upcoming' | 'active' | 'ended'

export interface ClassAffair {
  id: string
  title: string
  type: AffairType
  summary: string
  details: string
  startAt: string
  endAt?: string
  deadline?: string
  location?: string
  attachmentUrl?: string
}

export interface AlbumPhoto {
  src: string
  thumbnail: string
  alt: string
  caption?: string
}

export interface Album {
  id: string
  title: string
  semester: string
  date: string
  location?: string
  description: string
  cover: string
  photos: AlbumPhoto[]
}

export interface SiteContent {
  className: string
  shortName: string
  grade: string
  major: string
  slogan: string
  intro: string
  maintainerName: string
  maintainerRole: string
  contact: string
  contactEmail: string
  updatedAt: string
}

export interface ResourceFilters {
  query: string
  category: string
  courseId: string
  subject: string
  fileType: string
}

export type AboutTone = 'violet' | 'mint' | 'orange' | 'rose'

export interface AboutChapter {
  id: string
  number: string
  kicker: string
  title: string
  summary: string
  detail: string
  tone: AboutTone
}

export interface AboutGalleryItem {
  id: string
  src: string
  alt: string
  label: string
  objectPosition: string
}

export interface AboutWish {
  id: string
  number: string
  title: string
  body: string
  tone: AboutTone
}

export interface AboutContent {
  hero: {
    badge: string
    eyebrow: string
    title: string
    accent: string
    lead: string
  }
  metrics: {
    classStartedAt: string
    hearts: number
  }
  chapters: AboutChapter[]
  gallery: AboutGalleryItem[]
  wishes: AboutWish[]
  siteNote: {
    eyebrow: string
    title: string
    summary: string
    items: Array<{ title: string; text: string }>
  }
}

import { useEffect, useState } from 'react'
import { CONTENT_TYPE_LABELS, STATUS_LABELS, STAGES, type ContentType, type PriorityKey, type StatusKey } from './data'

export function parseHash() {
  const hash = window.location.hash || '#/home'
  const [pathRaw, queryRaw] = hash.replace(/^#/, '').split('?')
  const query = Object.fromEntries(new URLSearchParams(queryRaw ?? '').entries())
  return { path: pathRaw || '/home', query }
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navTo(path: string, query?: Record<string, string>) {
  const params = query ? `?${new URLSearchParams(query).toString()}` : ''
  window.location.hash = `#${path}${params}`
}

export function useToastAutoClear(toast: string | null, clearToast: () => void) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(clearToast, 2800)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
}

export function formatStatus(status: StatusKey) {
  return STATUS_LABELS[status]
}

export function contentTypeName(type: ContentType) {
  return CONTENT_TYPE_LABELS[type]
}

export function priorityPill(priority: PriorityKey) {
  if (priority === 'must') return { label: '必做', tone: 'warn' }
  if (priority === 'strong') return { label: '强烈建议', tone: 'brand' }
  return { label: '推荐', tone: 'purple' }
}

export function statusTone(status: StatusKey) {
  if (status === 'completed' || status === 'passed' || status === 'substituted') return 'good'
  if (status === 'in_progress' || status === 'booked') return 'brand'
  return 'strong'
}

export function buttonLabelForStatus(status: StatusKey) {
  if (status === 'completed' || status === 'passed' || status === 'substituted') return '查看'
  if (status === 'in_progress') return '继续'
  if (status === 'booked') return '查看预约'
  return '去完成'
}

export function resolveActiveTab(path: string) {
  if (path.startsWith('/tasks')) return 'tasks'
  if (path.startsWith('/growth')) return 'growth'
  return 'home'
}

export function stageLabel(stageKey: string) {
  return STAGES.find((stage) => stage.key === stageKey)?.month ?? 'Month0'
}

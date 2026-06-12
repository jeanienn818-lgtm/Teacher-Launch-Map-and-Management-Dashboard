import { useCallback, useEffect, useState } from 'react'
import './v2/styles.css'
import { readDemoTeacherIdFromSession, writeDemoTeacherIdToSession } from './v2/data'
import { clearLaunchGuideSession } from './v2/launchGuideSession'
import { TeacherPortalHomePage } from './v2/portal/TeacherPortalHomePage'
import { TeacherTrainingDashboardV2 } from './v2/page'
import { ManagerDashboard } from './v2/manager/ManagerDashboard'
import { ProjectOverviewPage } from './v2/overview/ProjectOverviewPage'

type RouteView = 'overview' | 'portal' | 'map'

function normalizeRoutePath(pathname: string, hash: string): string {
  if (hash.startsWith('#/')) return hash.slice(1)
  const trimmed = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  return trimmed
}

function routeView(pathname: string, hash = ''): RouteView {
  const trimmed = normalizeRoutePath(pathname, hash)
  if (trimmed.endsWith('/launch-map')) return 'map'
  if (trimmed.endsWith('/portal-home')) return 'portal'
  return 'overview'
}

function writeStaticRoute(path: '/project-overview' | '/portal-home' | '/launch-map') {
  window.location.hash = path
}

export default function App() {
  const [view, setView] = useState<RouteView>(() => routeView(window.location.pathname, window.location.hash))
  const [launchViewMode, setLaunchViewMode] = useState<'teacher' | 'manager'>('teacher')
  const [mapMountKey, setMapMountKey] = useState(0)
  const [demoTeacherId, setDemoTeacherId] = useState(readDemoTeacherIdFromSession)

  useEffect(() => {
    if ((window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) && !window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}#/project-overview`)
      setView('overview')
    }
  }, [])

  useEffect(() => {
    const syncRoute = () => setView(routeView(window.location.pathname, window.location.hash))
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  const openMap = useCallback(() => {
    setLaunchViewMode('teacher')
    writeStaticRoute('/launch-map')
    setView('map')
  }, [])

  const openTeacherView = useCallback(() => {
    setLaunchViewMode('teacher')
    writeStaticRoute('/launch-map')
    setView('map')
  }, [])

  const openManagerView = useCallback(() => {
    setLaunchViewMode('manager')
    writeStaticRoute('/launch-map')
    setView('map')
  }, [])

  const openOverview = useCallback(() => {
    writeStaticRoute('/project-overview')
    setView('overview')
  }, [])

  const openPortal = useCallback(() => {
    writeStaticRoute('/portal-home')
    setView('portal')
  }, [])

  const resetDemo = useCallback(() => {
    clearLaunchGuideSession()
    setMapMountKey((k) => k + 1)
  }, [])

  const selectDemoTeacher = useCallback((id: string) => {
    setDemoTeacherId(id)
    writeDemoTeacherIdToSession(id)
    setMapMountKey((k) => k + 1)
  }, [])

  return (
    <div className="app-v29-root">
      <nav className={`launch-view-tabs ${view === 'overview' ? 'launch-view-tabs--overview' : ''}`} aria-label="项目导航">
        <button
          type="button"
          className={view === 'overview' ? 'launch-view-tab launch-view-tab--active' : 'launch-view-tab'}
          onClick={openOverview}
        >
          项目说明
        </button>
        <button
          type="button"
          className={view === 'map' && launchViewMode === 'teacher' ? 'launch-view-tab launch-view-tab--active' : 'launch-view-tab'}
          onClick={openTeacherView}
        >
          老师端
        </button>
        <button
          type="button"
          className={view === 'map' && launchViewMode === 'manager' ? 'launch-view-tab launch-view-tab--active' : 'launch-view-tab'}
          onClick={openManagerView}
        >
          管理端
        </button>
      </nav>

      {view === 'overview' ? (
        <ProjectOverviewPage onOpenTeacherView={openTeacherView} onOpenManagerView={openManagerView} />
      ) : view === 'portal' ? (
        <TeacherPortalHomePage
          demoTeacherId={demoTeacherId}
          onSelectDemoTeacher={selectDemoTeacher}
          onOpenLaunchMap={openMap}
          onResetDemo={resetDemo}
        />
      ) : (
        <div className="app-v29-route-fade app-v29-route-fade--launch" key={`${mapMountKey}-${demoTeacherId}`}>
          {launchViewMode === 'teacher' ? (
            <TeacherTrainingDashboardV2
              demoTeacherId={demoTeacherId}
              onBackToPortal={openPortal}
              onResetDemo={resetDemo}
            />
          ) : (
            <ManagerDashboard />
          )}
        </div>
      )}
    </div>
  )
}

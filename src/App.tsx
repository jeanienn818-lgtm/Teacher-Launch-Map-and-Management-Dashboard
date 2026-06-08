import { useCallback, useEffect, useState } from 'react'
import './v2/styles.css'
import { readDemoTeacherIdFromSession, writeDemoTeacherIdToSession } from './v2/data'
import { clearLaunchGuideSession } from './v2/launchGuideSession'
import { TeacherPortalHomePage } from './v2/portal/TeacherPortalHomePage'
import { TeacherTrainingDashboardV2 } from './v2/page'

function routeView(pathname: string): 'portal' | 'map' {
  const trimmed = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  if (trimmed.endsWith('/launch-map')) return 'map'
  return 'portal'
}

export default function App() {
  const [view, setView] = useState<'portal' | 'map'>(() => routeView(window.location.pathname))
  const [mapMountKey, setMapMountKey] = useState(0)
  const [demoTeacherId, setDemoTeacherId] = useState(readDemoTeacherIdFromSession)

  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState(null, '', '/portal-home')
      setView('portal')
    }
  }, [])

  useEffect(() => {
    const onPop = () => setView(routeView(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openMap = useCallback(() => {
    window.history.pushState(null, '', '/launch-map')
    setView('map')
  }, [])

  const openPortal = useCallback(() => {
    window.history.pushState(null, '', '/portal-home')
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
      {view === 'portal' ? (
        <TeacherPortalHomePage
          demoTeacherId={demoTeacherId}
          onSelectDemoTeacher={selectDemoTeacher}
          onOpenLaunchMap={openMap}
          onResetDemo={resetDemo}
        />
      ) : (
        <div className="app-v29-route-fade" key={`${mapMountKey}-${demoTeacherId}`}>
          <TeacherTrainingDashboardV2
            demoTeacherId={demoTeacherId}
            onBackToPortal={openPortal}
            onResetDemo={resetDemo}
          />
        </div>
      )}
    </div>
  )
}

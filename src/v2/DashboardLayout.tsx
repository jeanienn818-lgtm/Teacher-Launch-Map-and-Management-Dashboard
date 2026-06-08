import type { ReactNode } from 'react'

interface DashboardLayoutProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function DashboardLayout({ left, center, right }: DashboardLayoutProps) {
  return (
    <main className="dashboard-layout">
      <aside className="left-col">{left}</aside>
      <section className="center-col">{center}</section>
      <aside className="right-col right-col--v26">{right}</aside>
    </main>
  )
}

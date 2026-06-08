window.App = window.App || {};

const { useMemo } = React;
const { useRoute, useToast } = App.ui;
const { BottomTabBar, Pill } = App.components;

function Toast() {
  const toast = useToast();
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, top: 14, zIndex: 50, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div className="card soft" style={{ padding: "10px 12px", borderRadius: 16, maxWidth: 480, width: "calc(100% - 24px)" }}>
        <div className="row">
          <div style={{ fontWeight: 900 }}>下一步推荐</div>
          <Pill tone="brand">自动</Pill>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          {toast}
        </div>
      </div>
    </div>
  );
}

function resolveActiveTab(path) {
  if (path.startsWith("/tasks")) return "tasks";
  if (path.startsWith("/growth")) return "growth";
  return "home";
}

function AppRoot() {
  const route = useRoute();
  const path = route.path || "/home";
  const activeKey = resolveActiveTab(path);

  const Page = useMemo(() => {
    if (path === "/home" || path === "/") return App.pages.HomePage;
    if (path === "/tasks") return App.pages.TasksPage;
    if (path === "/growth") return App.pages.GrowthPage;
    if (path === "/income") return App.pages.IncomeDetailPage;
    if (path === "/starter-pack") return App.pages.StarterPackDetailPage;
    if (path === "/certificates") return App.pages.CertificatesPage;
    if (path === "/mock") return App.pages.MockPage;
    if (path === "/workshops") return App.pages.WorkshopsPage;
    if (path === "/dino-u") return App.pages.DinoUPage;
    if (path === "/content") return App.pages.ContentDetailPage;
    return App.pages.HomePage;
  }, [path]);

  return (
    <div className="app">
      <Toast />
      <Page />
      <BottomTabBar activeKey={activeKey} />
    </div>
  );
}

App.AppRoot = AppRoot;

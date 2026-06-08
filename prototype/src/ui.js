window.App = window.App || {};

const { useEffect, useMemo, useState } = React;

function useAppState(selector) {
  const [snap, setSnap] = useState(() => selector(App.store.getState()));
  useEffect(() => {
    return App.store.subscribe((s) => setSnap(selector(s)));
  }, [selector]);
  return snap;
}

function useToast() {
  const toast = useAppState((s) => s.ui.toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => App.store.clearToast(), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  return toast;
}

function parseHash() {
  const hash = window.location.hash || "#/home";
  const [pathRaw, queryRaw] = hash.replace(/^#/, "").split("?");
  const path = pathRaw || "/home";
  const query = {};
  if (queryRaw) {
    const parts = queryRaw.split("&");
    for (const p of parts) {
      const [k, v] = p.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  return { path, query };
}

function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function navTo(path, query) {
  const q = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  window.location.hash = `#${path}${q}`;
}

function formatStatus(statusKey) {
  return (App.Const.statuses || {})[statusKey] || "未开始";
}

function contentTypeName(typeKey) {
  return (App.Const.contentTypes || {})[typeKey] || typeKey;
}

function priorityPill(priorityKey) {
  if (priorityKey === "must") return { label: "必做", tone: "warn" };
  if (priorityKey === "strong") return { label: "强烈建议", tone: "brand" };
  return { label: "推荐", tone: "purple" };
}

function statusTone(statusKey) {
  if (statusKey === "completed" || statusKey === "passed" || statusKey === "substituted") return "good";
  if (statusKey === "in_progress" || statusKey === "booked") return "brand";
  return "strong";
}

function buttonLabelForStatus(statusKey) {
  if (statusKey === "completed" || statusKey === "passed" || statusKey === "substituted") return "查看";
  if (statusKey === "in_progress") return "继续";
  if (statusKey === "booked") return "查看预约";
  return "去完成";
}

function stageProgressForCurrentStage(state) {
  const stageKey = state.user.stageKey;
  const stageTasks = App.FakeDB.tasks.filter((t) => t.stageKeys.includes(stageKey));
  if (!stageTasks.length) return { done: 0, total: 0, pct: 0 };
  const doneCount = stageTasks.filter((t) => (state.progress.taskStatus[t.id] || "not_started") === "completed").length;
  const pct = Math.round((doneCount / stageTasks.length) * 100);
  return { done: doneCount, total: stageTasks.length, pct };
}

App.ui = {
  useAppState,
  useToast,
  useRoute,
  navTo,
  formatStatus,
  contentTypeName,
  priorityPill,
  statusTone,
  buttonLabelForStatus,
  stageProgressForCurrentStage,
};

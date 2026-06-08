window.App = window.App || {};

const LS_KEY = "na_teacher_growth_proto_v1";

function clampInt(v) {
  const n = Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 0;
  return Math.max(0, n);
}

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function calcTierIncentive(tierKey, expectedClasses) {
  const rules = (App.FakeDB.tierRules || {})[tierKey] || [];
  let remaining = expectedClasses;
  let prev = 0;
  let total = 0;
  for (const seg of rules) {
    const segCap = seg.upTo;
    const segCount = Math.max(0, Math.min(remaining, segCap - prev));
    total += segCount * seg.perClass;
    remaining -= segCount;
    prev = segCap;
    if (remaining <= 0) break;
  }
  return money(total);
}

function calcIncomeEstimate({ tierKey, inputs }) {
  const expectedClasses = clampInt(inputs.expectedClasses);
  const expectedConversions = clampInt(inputs.expectedConversions);
  const expectedPB = clampInt(inputs.expectedPB);
  const expectedJG = clampInt(inputs.expectedJG);
  const expectedLR = clampInt(inputs.expectedLR);

  const base = money(expectedClasses * 7);
  const tierIncentive = calcTierIncentive(tierKey, expectedClasses);
  const convertIncentive = money(expectedConversions * 5);
  const extraIncentive = money((expectedPB + expectedJG + expectedLR) * 2);

  const total = money(base + tierIncentive + convertIncentive + extraIncentive);
  return { base, tierIncentive, convertIncentive, extraIncentive, total };
}

function getContentById(id) {
  return App.FakeDB.contents.find((c) => c.id === id);
}

function defaultState() {
  // 用于演示：可通过页面里的“切换阶段”入口快速看不同 Month 状态
  const stageKey = "M0";
  const tierKey = "Tier2"; // 系统自动读取：前端只展示，不允许修改

  const contentStatus = {
    "cert-core-2-3": "in_progress",
    "mock-trial-2-3": "not_started",
    "workshop-kickoff": "not_started",
    "dino-portal-intro": "completed", // 演示：已完成其一
    "dino-cancellation-video": "not_started",
    "cert-trial-2-3": "not_started",
    "cert-core-4-6": "not_started",
    "mock-literature-5-8": "not_started",
    "dino-income-risk": "not_started",
  };

  const taskStatus = {
    task_rule_pack: "in_progress",
    task_cert_core_2_3: "in_progress",
    task_mock_trial_2_3: "not_started",
    task_cert_trial_2_3: "not_started",
    task_cert_core_4_6: "not_started",
    task_dino_income_risk: "not_started",
    task_mock_literature_5_8: "not_started",
  };

  const incomeInputs = {
    expectedClasses: 55,
    expectedConversions: 6,
    expectedPB: 5,
    expectedJG: 0,
    expectedLR: 2,
  };

  return {
    user: {
      name: "新老师",
      stageKey,
      tierKey,
      growthPointsAllTime: 62,
      growthPointsThisMonth: 46,
    },
    income: {
      inputs: incomeInputs,
    },
    progress: {
      contentStatus,
      taskStatus,
      badges: {
        certificate: ["cert-core-2-3"],
        mock: [],
        workshop: [],
        dinoU: ["dino-portal-intro"],
      },
      timeline: [
        {
          at: "Apr 20",
          text: "完成 Teacher Portal Introduction",
          points: 6,
          badge: "Dino U 勋章点亮",
          contentId: "dino-portal-intro",
        },
        {
          at: "Apr 18",
          text: "开始 主修 2-3 级别证书",
          points: 0,
          badge: null,
          contentId: "cert-core-2-3",
        },
      ],
    },
    ui: {
      tasksTab: "by_stage",
      selectedGoalKey: "qualify_fast",
      toast: null,
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function getStage() {
  const stKey = App.store.getState().user.stageKey;
  return App.Const.stages.find((s) => s.key === stKey) || App.Const.stages[0];
}

function getRewardModelForStage(stageKey) {
  // 纯演示：不同阶段的“前30%奖励区”门槛不同
  const map = { M0: 80, M1: 110, M2: 140, M3: 170 };
  return { targetPoints: map[stageKey] || 110 };
}

function isStarterPackCompleted(state) {
  const s = state.progress.contentStatus;
  // 起步包固定 3 项：
  // 1. 主修2-3证书
  // 2. 基础Mock：主修试听 Lv2-3
  // 3. 规则学习模块（KickOff 或 Portal+Cancellation）
  const certOk = ["completed", "passed", "substituted"].includes(s["cert-core-2-3"]);
  const mockOk = ["completed", "passed", "substituted"].includes(s["mock-trial-2-3"]);
  const ruleOk = isRuleModuleCompleted(state);
  const doneCount = [certOk, mockOk, ruleOk].filter(Boolean).length;
  return { doneCount, total: 3, certOk, mockOk, ruleOk, status: doneCount === 0 ? "未完成" : doneCount < 3 ? "部分完成" : "已完成" };
}

function isRuleModuleCompleted(state) {
  const s = state.progress.contentStatus;
  const kickoff = ["completed", "passed", "substituted"].includes(s["workshop-kickoff"]);
  const portal = ["completed", "passed", "substituted"].includes(s["dino-portal-intro"]);
  const cancel = ["completed", "passed", "substituted"].includes(s["dino-cancellation-video"]);
  return kickoff || (portal && cancel);
}

function ensureTaskStatusConsistency(state) {
  // 根据 contentStatus 推导某些 taskStatus（演示：不做复杂同步，只保证关键任务一致）
  const s = state.progress.contentStatus;
  const next = JSON.parse(JSON.stringify(state));

  // 证书/Mock 类 task 与对应 content 绑定
  const bind = [
    ["task-cert-core-2-3", "cert-core-2-3"],
    ["task-mock-trial-2-3", "mock-trial-2-3"],
    ["task-cert-trial-2-3", "cert-trial-2-3"],
    ["task-cert-core-4-6", "cert-core-4-6"],
    ["task-dino-income-risk", "dino-income-risk"],
    ["task-mock-literature-5-8", "mock-literature-5-8"],
  ];
  for (const [tid, cid] of bind) {
    if (!next.progress.taskStatus[tid]) continue;
    if (["completed", "passed", "substituted"].includes(s[cid])) next.progress.taskStatus[tid] = "completed";
    else if (s[cid] === "in_progress") next.progress.taskStatus[tid] = "in_progress";
    else next.progress.taskStatus[tid] = next.progress.taskStatus[tid] || "not_started";
  }

  // 规则学习模块 task：由组合条件决定
  const ruleDone = isRuleModuleCompleted(next);
  next.progress.taskStatus["task-rule-pack"] = ruleDone ? "completed" : next.progress.taskStatus["task-rule-pack"] || "not_started";
  return next;
}

function addTimeline(state, item) {
  const next = JSON.parse(JSON.stringify(state));
  next.progress.timeline = [item, ...(next.progress.timeline || [])].slice(0, 20);
  return next;
}

function awardPointsIfNeeded(state, contentId, toStatus) {
  const content = getContentById(contentId);
  if (!content) return state;
  const next = JSON.parse(JSON.stringify(state));

  const prevStatus = next.progress.contentStatus[contentId];
  const prevDone = ["completed", "passed", "substituted"].includes(prevStatus);
  const nextDone = ["completed", "passed", "substituted"].includes(toStatus);
  if (prevDone || !nextDone) return state;

  next.user.growthPointsAllTime = clampInt(next.user.growthPointsAllTime) + clampInt(content.points);
  next.user.growthPointsThisMonth = clampInt(next.user.growthPointsThisMonth) + clampInt(content.points);
  return addTimeline(next, {
    at: "今天",
    text: `完成 ${content.name}`,
    points: content.points,
    badge: `${App.Const.contentTypes[content.type] || "内容"} 勋章点亮`,
    contentId,
  });
}

function updateBadges(state, contentId, toStatus) {
  const content = getContentById(contentId);
  if (!content) return state;
  const done = ["completed", "passed", "substituted"].includes(toStatus);
  if (!done) return state;

  const next = JSON.parse(JSON.stringify(state));
  const key = content.type;
  next.progress.badges[key] = Array.from(new Set([...(next.progress.badges[key] || []), contentId]));
  return next;
}

function autoNextRecommendations(state, completedContentId) {
  const content = getContentById(completedContentId);
  if (!content) return state;
  const next = JSON.parse(JSON.stringify(state));
  const stageKey = next.user.stageKey;
  const reward = getRewardModelForStage(stageKey);
  const missing = Math.max(0, reward.targetPoints - clampInt(next.user.growthPointsThisMonth));
  const nearReward = missing > 0 && missing <= 18;

  // 用 UI toast + 首页提示条来“明确告诉下一步做什么”
  let msg = null;
  if (completedContentId === "cert-core-2-3") msg = "已完成主修2-3证书：下一步优先做「基础 Mock：主修试听 Lv2-3」。";
  else if (completedContentId === "mock-trial-2-3") msg = "已完成基础 Mock：下一步优先补齐「规则学习模块（Kick Off / Dino U）」。";
  else if (isStarterPackCompleted(next).status === "已完成") msg = "起步包已完成：下一步推荐「试听证书 Lv2-3」或「主修4-6级别证书」。";
  else if (nearReward) msg = `你接近前30%奖励：下一步建议做高成长积分任务（如「进阶 Mock」）。`;
  else if (content.next && content.next.length) {
    const n = getContentById(content.next[0]);
    if (n) msg = `下一步推荐：${n.name}`;
  }
  next.ui.toast = msg;
  return next;
}

function recommendTopThreeTasks(state) {
  const stageKey = state.user.stageKey;
  const starter = isStarterPackCompleted(state);
  const tasks = App.FakeDB.tasks;

  // 优先级规则（按你给的顺序做“效果”）
  // 1. 规则学习包未完成
  // 2. 大量订课必备证书未完成（主修2-3）
  // 3. 基础 Mock 未完成
  // 4. 当前热门推荐证书/内容
  // 5. 更接近前30%奖励的高效率任务（高成长积分）
  const s = state.progress.contentStatus;
  const done = (cid) => ["completed", "passed", "substituted"].includes(s[cid]);

  const candidates = [];
  const ruleDone = isRuleModuleCompleted(state);
  if (!ruleDone) candidates.push("task-rule-pack");
  if (!done("cert-core-2-3")) candidates.push("task-cert-core-2-3");
  if (!done("mock-trial-2-3")) candidates.push("task-mock-trial-2-3");

  // 热门推荐
  if (!done("cert-trial-2-3")) candidates.push("task-cert-trial-2-3");

  // 接近奖励：推高分任务
  const reward = getRewardModelForStage(stageKey);
  const missing = Math.max(0, reward.targetPoints - clampInt(state.user.growthPointsThisMonth));
  if (missing > 0 && missing <= 28) candidates.push("task-mock-literature-5-8");

  // 补齐 3 个
  const uniq = Array.from(new Set(candidates));
  const resolved = uniq
    .map((id) => App.FakeDB.tasks.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 3);

  // 如果还不够，按阶段+未完成补齐
  if (resolved.length < 3) {
    for (const t of tasks) {
      if (!t.stageKeys.includes(stageKey)) continue;
      if (resolved.find((x) => x.id === t.id)) continue;
      const st = state.progress.taskStatus[t.id] || "not_started";
      if (st === "completed") continue;
      resolved.push(t);
      if (resolved.length >= 3) break;
    }
  }
  return resolved.slice(0, 3).map((t) => ({ ...t, starterPack: starter }));
}

function createStore() {
  let state = ensureTaskStatusConsistency(loadState());
  const listeners = new Set();

  const api = {
    getState() {
      return state;
    },
    setState(updater) {
      const prev = state;
      const next = typeof updater === "function" ? updater(prev) : updater;
      state = ensureTaskStatusConsistency(next);
      saveState(state);
      for (const l of listeners) l(state);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // ===== selectors =====
    getStage,
    getRewardModelForStage,
    getIncomeEstimate() {
      const s = api.getState();
      return calcIncomeEstimate({ tierKey: s.user.tierKey, inputs: s.income.inputs });
    },
    getStarterPack() {
      return isStarterPackCompleted(api.getState());
    },
    getRewardStatus() {
      const s = api.getState();
      const model = getRewardModelForStage(s.user.stageKey);
      const cur = clampInt(s.user.growthPointsThisMonth);
      const missing = Math.max(0, model.targetPoints - cur);
      return {
        inTop30Reward: missing === 0,
        missingPoints: missing,
        targetPoints: model.targetPoints,
      };
    },
    getTopThreeTasks() {
      return recommendTopThreeTasks(api.getState());
    },
    getContentStatus(contentId) {
      return api.getState().progress.contentStatus[contentId] || "not_started";
    },

    // ===== actions =====
    setTasksTab(tabKey) {
      api.setState((s) => ({ ...s, ui: { ...s.ui, tasksTab: tabKey } }));
    },
    setSelectedGoal(goalKey) {
      api.setState((s) => ({ ...s, ui: { ...s.ui, selectedGoalKey: goalKey } }));
    },
    setIncomeInputs(patch) {
      api.setState((s) => ({
        ...s,
        income: { ...s.income, inputs: { ...s.income.inputs, ...patch } },
      }));
    },
    setStage(stageKey) {
      api.setState((s) => ({ ...s, user: { ...s.user, stageKey } }));
    },
    clearToast() {
      api.setState((s) => ({ ...s, ui: { ...s.ui, toast: null } }));
    },
    markContentStatus(contentId, toStatus) {
      api.setState((s) => {
        let next = JSON.parse(JSON.stringify(s));
        next.progress.contentStatus[contentId] = toStatus;

        next = awardPointsIfNeeded(next, contentId, toStatus);
        next = updateBadges(next, contentId, toStatus);

        // 规则学习模块完成时：如果通过 Dino U 两项，也视为完成
        // 且 StarterPack 状态会自动推导
        next = autoNextRecommendations(next, contentId);
        return next;
      });
    },
    resetAll() {
      api.setState(defaultState());
    },
  };

  return api;
}

App.store = createStore();
App.util = {
  clampInt,
  money,
  calcIncomeEstimate,
  calcTierIncentive,
  getContentById,
};

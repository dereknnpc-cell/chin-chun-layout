import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ujmgrcwtafonhttuyvzc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wcb1jdo-QsA4oOMcc54zzA_31I20Ocf";
const WORKSPACE_ID = "4b6e4e34-c332-4edc-9d06-a7c380272496";

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(input, { ...init, signal: init.signal || controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: { fetch: fetchWithTimeout }
});

let adapter = null;
let currentUser = null;
let currentRole = null;
let currentRevision = 0;
let saveTimer = null;
let realtimeChannel = null;
let applyingRemote = false;
let lastHandledUserId = null;

function byId(id) {
  return document.getElementById(id);
}

function setCloudStatus(text, state = "offline", title = "") {
  const indicator = byId("cloudSyncIndicator");
  const button = byId("openCloudBtn");
  if (indicator) {
    indicator.textContent = text;
    indicator.dataset.state = state;
    indicator.title = title || text;
  }
  if (button) {
    button.dataset.state = state;
    button.title = title || text;
  }
}

function showMessage(text, type = "info") {
  const message = byId("cloudAuthMessage");
  if (!message) return;
  message.textContent = text;
  message.dataset.type = type;
  message.hidden = !text;
}

function setBusy(isBusy) {
  ["cloudLoginBtn", "cloudAddMemberBtn", "cloudLogoutBtn"].forEach((id) => {
    const element = byId(id);
    if (element) element.disabled = isBusy;
  });
}

function updateAccountUi() {
  const signedOut = byId("cloudSignedOutPanel");
  const signedIn = byId("cloudSignedInPanel");
  const email = byId("cloudCurrentEmail");
  const role = byId("cloudCurrentRole");
  const memberManager = byId("cloudMemberManager");

  if (signedOut) signedOut.hidden = Boolean(currentUser);
  if (signedIn) signedIn.hidden = !currentUser;
  if (email) email.textContent = currentUser?.email || "—";
  if (role) role.textContent = currentRole === "owner" ? "管理員" : currentRole === "editor" ? "可編輯" : "唯讀";
  if (memberManager) memberManager.hidden = currentRole !== "owner";
}

function openModal() {
  const modal = byId("cloudModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  showMessage("");
  if (currentRole === "owner") loadMembers();
  setTimeout(() => (currentUser ? byId("cloudMemberEmail") : byId("cloudEmail"))?.focus(), 50);
}

function closeModal() {
  const modal = byId("cloudModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

async function signIn(event) {
  event.preventDefault();
  const email = (byId("cloudEmail")?.value || "").trim().toLowerCase();
  if (!email) return;

  setBusy(true);
  showMessage("正在寄送登入連結…");
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectUrl }
    });
    if (error) {
      showMessage(`登入連結寄送失敗：${error.message}`, "error");
      return;
    }
    showMessage("登入連結已寄出，請到信箱點擊連結。", "success");
  } catch (error) {
    showMessage("目前無法連上雲端，請檢查網路後再試一次。", "error");
  } finally {
    setBusy(false);
  }
}

async function signOut() {
  setBusy(true);
  await supabase.auth.signOut();
  setBusy(false);
  closeModal();
}

async function loadMembership() {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("email, role")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("email", currentUser.email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

function applyRemoteDocument(row, announce = false) {
  if (!row) return;
  currentRevision = Number(row.revision || 0);
  if (!row.layout_data) return;

  applyingRemote = true;
  adapter.applyRemote(row.layout_data, Array.isArray(row.custom_library) ? row.custom_library : []);
  applyingRemote = false;
  setCloudStatus("☁ 雲端已同步", "synced", `雲端版本 ${currentRevision}`);
  if (announce) adapter.notify("已載入其他裝置的最新配置", "info");
}

async function loadRemote(announce = false) {
  const { data, error } = await supabase
    .from("factory_layouts")
    .select("layout_data, custom_library, revision, updated_at")
    .eq("workspace_id", WORKSPACE_ID)
    .single();

  if (error) throw error;
  if (!data.layout_data) {
    currentRevision = Number(data.revision || 0);
    await saveNow(adapter.getLayout(), adapter.getCustomLibrary());
    adapter.notify("已將這台裝置的配置建立為第一份雲端版本", "success");
    return;
  }
  applyRemoteDocument(data, announce);
}

function subscribeToChanges() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`factory-layout:${WORKSPACE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "factory_layouts",
        filter: `workspace_id=eq.${WORKSPACE_ID}`
      },
      async (payload) => {
        const incomingRevision = Number(payload.new?.revision || 0);
        if (incomingRevision <= currentRevision) return;
        try {
          await loadRemote(true);
        } catch (error) {
          console.warn("Cloud realtime refresh failed:", error);
        }
      }
    )
    .subscribe();
}

async function handleSession(session) {
  const user = session?.user || null;
  if (!user) {
    currentUser = null;
    currentRole = null;
    lastHandledUserId = null;
    currentRevision = 0;
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    updateAccountUi();
    setCloudStatus("☁ 本機模式", "offline", "登入後可跨裝置同步");
    return;
  }
  if (lastHandledUserId === user.id) return;
  lastHandledUserId = user.id;
  currentUser = user;
  setCloudStatus("☁ 連線中…", "syncing");

  try {
    const membership = await loadMembership();
    if (!membership) {
      adapter.notify("此 Email 尚未加入金讚員工名單", "error");
      await supabase.auth.signOut();
      openModal();
      showMessage("此 Email 尚未獲得使用權限，請聯絡管理員。", "error");
      return;
    }
    currentRole = membership.role;
    updateAccountUi();
    await loadRemote();
    subscribeToChanges();
    setCloudStatus("☁ 雲端已同步", "synced", `${currentUser.email} · 雲端版本 ${currentRevision}`);
    adapter.notify(`已登入雲端：${currentUser.email}`, "success");
  } catch (error) {
    console.warn("Cloud initialization failed:", error);
    setCloudStatus("⚠ 同步失敗", "error", error.message);
    adapter.notify(`雲端連線失敗：${error.message}`, "error");
  }
}

async function saveNow(layout, customLibrary) {
  if (!currentUser || !["owner", "editor"].includes(currentRole)) return;
  setCloudStatus("☁ 儲存中…", "syncing");
  const expectedRevision = currentRevision;
  const { data, error } = await supabase
    .from("factory_layouts")
    .update({
      layout_data: layout,
      custom_library: customLibrary,
      updated_by: currentUser.id
    })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("revision", expectedRevision)
    .select("revision, updated_at")
    .maybeSingle();

  if (error) {
    setCloudStatus("⚠ 同步失敗", "error", error.message);
    throw error;
  }
  if (!data) {
    await loadRemote(true);
    adapter.notify("偵測到其他裝置已先儲存，已載入最新雲端版本", "info");
    return;
  }
  currentRevision = Number(data.revision);
  setCloudStatus("☁ 雲端已同步", "synced", `雲端版本 ${currentRevision}`);
}

function scheduleSave(layout, customLibrary) {
  if (applyingRemote || !currentUser || !["owner", "editor"].includes(currentRole)) return;
  const snapshot = JSON.parse(JSON.stringify({ layout, customLibrary }));
  clearTimeout(saveTimer);
  setCloudStatus("☁ 等待同步…", "pending");
  saveTimer = setTimeout(() => {
    saveNow(snapshot.layout, snapshot.customLibrary).catch((error) => {
      console.warn("Cloud save failed:", error);
      adapter.notify("雲端儲存失敗，本機副本仍已保留", "error");
    });
  }, 800);
}

async function loadMembers() {
  if (currentRole !== "owner") return;
  const list = byId("cloudMemberList");
  if (list) list.innerHTML = '<div class="cloud-empty">正在讀取員工名單…</div>';
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, email, role, created_at")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at");

  if (error) {
    showMessage(`讀取員工名單失敗：${error.message}`, "error");
    return;
  }
  if (!list) return;
  list.innerHTML = "";
  data.forEach((member) => {
    const row = document.createElement("div");
    row.className = "cloud-member-row";
    const info = document.createElement("div");
    info.innerHTML = `<strong></strong><span>${member.role === "owner" ? "管理員" : member.role === "editor" ? "可編輯" : "唯讀"}</span>`;
    info.querySelector("strong").textContent = member.email;
    row.appendChild(info);
    if (!(member.email === currentUser.email.toLowerCase() && member.role === "owner")) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cad-btn danger btn-sm";
      remove.textContent = "移除";
      remove.addEventListener("click", () => removeMember(member.id, member.email));
      row.appendChild(remove);
    }
    list.appendChild(row);
  });
}

async function addMember(event) {
  event.preventDefault();
  const emailInput = byId("cloudMemberEmail");
  const roleInput = byId("cloudMemberRole");
  const email = (emailInput?.value || "").trim().toLowerCase();
  if (!email) return;
  setBusy(true);
  const { error } = await supabase.from("workspace_members").insert({
    workspace_id: WORKSPACE_ID,
    email,
    role: roleInput?.value || "editor"
  });
  setBusy(false);
  if (error) {
    showMessage(error.code === "23505" ? "此 Email 已在員工名單中。" : `新增失敗：${error.message}`, "error");
    return;
  }
  if (emailInput) emailInput.value = "";
  showMessage(`已加入 ${email}`, "success");
  loadMembers();
}

async function removeMember(id, email) {
  if (!window.confirm(`確定要移除 ${email} 的雲端權限嗎？`)) return;
  const { error } = await supabase.from("workspace_members").delete().eq("id", id);
  if (error) {
    showMessage(`移除失敗：${error.message}`, "error");
    return;
  }
  showMessage(`已移除 ${email}`, "success");
  loadMembers();
}

function bindUi() {
  byId("openCloudBtn")?.addEventListener("click", openModal);
  byId("closeCloudModalBtn")?.addEventListener("click", closeModal);
  byId("cloudModal")?.addEventListener("click", (event) => {
    if (event.target.id === "cloudModal") closeModal();
  });
  byId("cloudLoginForm")?.addEventListener("submit", signIn);
  byId("cloudLogoutBtn")?.addEventListener("click", signOut);
  byId("cloudMemberForm")?.addEventListener("submit", addMember);
}

async function init(nextAdapter) {
  adapter = nextAdapter;
  bindUi();
  updateAccountUi();
  const { data } = await supabase.auth.getSession();
  await handleSession(data.session);
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => handleSession(session), 0);
  });
}

window.ChinChunCloud = { init, scheduleSave };

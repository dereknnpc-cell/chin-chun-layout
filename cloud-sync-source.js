import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ujmgrcwtafonhttuyvzc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wcb1jdo-QsA4oOMcc54zzA_31I20Ocf";
const WORKSPACE_ID = "4b6e4e34-c332-4edc-9d06-a7c380272496";
const ACTIVE_DOCUMENT_KEY = "chinChun.activeCloudDocument.v1";
const UNSYNCED_SNAPSHOT_KEY = "chinChun.unsyncedCloudSnapshot.v1";

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try { return await fetch(input, { ...init, signal: init.signal || controller.signal }); }
  finally { clearTimeout(timeout); }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: { fetch: fetchWithTimeout }
});

let adapter = null;
let currentUser = null;
let currentRole = null;
let currentDocumentId = null;
let currentDocumentName = "";
let currentRevision = 0;
let documentRows = [];
let baseLayout = null;
let baseCustomLibrary = [];
let pendingSnapshot = null;
let saveTimer = null;
let saveQueue = Promise.resolve();
let realtimeChannel = null;
let applyingRemote = false;
let lastHandledUserId = null;

const byId = (id) => document.getElementById(id);
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const jsonEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const canEdit = () => Boolean(currentUser && ["owner", "editor"].includes(currentRole));

function readUnsyncedSnapshot() {
  try { return JSON.parse(localStorage.getItem(UNSYNCED_SNAPSHOT_KEY) || "null"); }
  catch { return null; }
}

function rememberUnsyncedSnapshot(snapshot) {
  if (!currentDocumentId) return;
  try {
    localStorage.setItem(UNSYNCED_SNAPSHOT_KEY, JSON.stringify({
      documentId: currentDocumentId,
      token: snapshot.token,
      baseLayout,
      baseCustomLibrary,
      layout: snapshot.layout,
      customLibrary: snapshot.customLibrary,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.warn("Could not preserve pending cloud save:", error);
  }
}

function clearUnsyncedSnapshot(token) {
  if (!token) return;
  const stored = readUnsyncedSnapshot();
  if (stored?.documentId === currentDocumentId && stored.token === token) {
    localStorage.removeItem(UNSYNCED_SNAPSHOT_KEY);
  }
}

function objectKey(item) {
  return item && typeof item === "object" && !Array.isArray(item) ? item.id ?? item.code ?? null : null;
}

// Apply this browser's changes (base -> local) on top of the latest cloud copy.
// CAD entity arrays merge by id/code, so unrelated edits from two people survive.
function mergeChanged(base, local, remote) {
  if (jsonEqual(local, base)) return clone(remote);
  if (jsonEqual(remote, base)) return clone(local);
  if (Array.isArray(local) && Array.isArray(remote)) {
    const baseArray = Array.isArray(base) ? base : [];
    if (![...baseArray, ...local, ...remote].every((item) => objectKey(item) !== null)) return clone(local);
    const baseMap = new Map(baseArray.map((item) => [String(objectKey(item)), item]));
    const localMap = new Map(local.map((item) => [String(objectKey(item)), item]));
    const emitted = new Set();
    const result = [];
    remote.forEach((remoteItem) => {
      const key = String(objectKey(remoteItem));
      emitted.add(key);
      if (baseMap.has(key) && !localMap.has(key)) return;
      if (!localMap.has(key)) return result.push(clone(remoteItem));
      if (!baseMap.has(key)) return result.push(clone(localMap.get(key)));
      result.push(mergeChanged(baseMap.get(key), localMap.get(key), remoteItem));
    });
    local.forEach((localItem) => {
      const key = String(objectKey(localItem));
      if (emitted.has(key)) return;
      // A cloud-side deletion wins when this browser did not modify that entity.
      // If both sides touched it, preserve the local edit instead of losing work.
      if (baseMap.has(key) && jsonEqual(localItem, baseMap.get(key))) return;
      result.push(clone(localItem));
    });
    return result;
  }
  const localObject = local && typeof local === "object" && !Array.isArray(local);
  const remoteObject = remote && typeof remote === "object" && !Array.isArray(remote);
  if (localObject && remoteObject) {
    const baseObject = base && typeof base === "object" && !Array.isArray(base) ? base : {};
    const result = {};
    new Set([...Object.keys(baseObject), ...Object.keys(local), ...Object.keys(remote)]).forEach((key) => {
      const hasLocal = Object.prototype.hasOwnProperty.call(local, key);
      const hasBase = Object.prototype.hasOwnProperty.call(baseObject, key);
      const hasRemote = Object.prototype.hasOwnProperty.call(remote, key);
      if (!hasLocal && hasBase) return;
      if (!hasLocal) { if (hasRemote) result[key] = clone(remote[key]); return; }
      result[key] = mergeChanged(hasBase ? baseObject[key] : undefined, local[key], hasRemote ? remote[key] : undefined);
    });
    return result;
  }
  return clone(local);
}

function setCloudStatus(text, state = "offline", title = "") {
  [byId("cloudSyncIndicator"), byId("openCloudBtn")].forEach((element) => {
    if (!element) return;
    if (element.id === "cloudSyncIndicator") element.textContent = text;
    element.dataset.state = state;
    element.title = title || text;
  });
}

function showMessage(text, type = "info") {
  const message = byId("cloudAuthMessage");
  if (!message) return;
  message.textContent = text;
  message.dataset.type = type;
  message.hidden = !text;
}

function setBusy(isBusy) {
  ["cloudLoginBtn", "cloudAddMemberBtn", "cloudLogoutBtn", "cloudSaveAsBtn"].forEach((id) => {
    if (byId(id)) byId(id).disabled = isBusy;
  });
}

function updateAccountUi() {
  if (byId("cloudSignedOutPanel")) byId("cloudSignedOutPanel").hidden = Boolean(currentUser);
  if (byId("cloudSignedInPanel")) byId("cloudSignedInPanel").hidden = !currentUser;
  if (byId("cloudCurrentEmail")) byId("cloudCurrentEmail").textContent = currentUser?.email || "—";
  if (byId("cloudCurrentRole")) byId("cloudCurrentRole").textContent = currentRole === "owner" ? "管理員" : currentRole === "editor" ? "可編輯" : "唯讀";
  if (byId("cloudMemberManager")) byId("cloudMemberManager").hidden = currentRole !== "owner";
  if (byId("cloudDocumentBar")) byId("cloudDocumentBar").hidden = !currentUser;
  if (byId("cloudSaveAsBtn")) byId("cloudSaveAsBtn").disabled = !canEdit();
}

function renderDocumentOptions() {
  const select = byId("cloudDocumentSelect");
  if (!select) return;
  select.innerHTML = "";
  documentRows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.id;
    option.textContent = `${row.is_primary ? "★ " : ""}${row.name}`;
    option.selected = row.id === currentDocumentId;
    select.appendChild(option);
  });
  select.disabled = !currentUser || documentRows.length === 0;
  if (byId("cloudCurrentDocumentName")) byId("cloudCurrentDocumentName").textContent = currentDocumentName || "—";
}

function openModal() {
  const modal = byId("cloudModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  showMessage("");
  if (currentRole === "owner") loadMembers();
}

function closeModal() {
  byId("cloudModal")?.classList.remove("active");
  byId("cloudModal")?.setAttribute("aria-hidden", "true");
}

async function signIn(event) {
  event.preventDefault();
  const email = (byId("cloudEmail")?.value || "").trim().toLowerCase();
  if (!email) return;
  setBusy(true);
  showMessage("正在寄送登入連結…");
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}${location.pathname}` }
    });
    showMessage(error ? `登入連結寄送失敗：${error.message}` : "登入連結已寄出。必須完成登入，這台裝置的修改才會同步。", error ? "error" : "success");
  } catch (error) {
    showMessage(`目前無法連上雲端：${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function signOut() {
  await flushPendingSave();
  setBusy(true);
  await supabase.auth.signOut();
  setBusy(false);
  closeModal();
}

async function loadMembership() {
  const { data, error } = await supabase.from("workspace_members").select("email, role")
    .eq("workspace_id", WORKSPACE_ID).eq("email", currentUser.email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchDocument(documentId) {
  const { data, error } = await supabase.from("layout_documents")
    .select("id, name, layout_data, custom_library, revision, is_primary, updated_at, updated_by")
    .eq("workspace_id", WORKSPACE_ID).eq("id", documentId).single();
  if (error) throw error;
  return data;
}

async function loadDocumentList() {
  const { data, error } = await supabase.from("layout_documents")
    .select("id, name, revision, is_primary, updated_at, created_by")
    .eq("workspace_id", WORKSPACE_ID).order("is_primary", { ascending: false }).order("updated_at", { ascending: false });
  if (error) throw error;
  documentRows = data || [];
  currentDocumentName = documentRows.find((row) => row.id === currentDocumentId)?.name || currentDocumentName;
  renderDocumentOptions();
  return documentRows;
}

function applyRemoteDocument(row, announce = false) {
  if (!row?.layout_data) return;
  currentDocumentId = row.id;
  currentDocumentName = row.name;
  currentRevision = Number(row.revision || 0);
  baseLayout = clone(row.layout_data);
  baseCustomLibrary = clone(row.custom_library || []);
  localStorage.setItem(ACTIVE_DOCUMENT_KEY, currentDocumentId);
  applyingRemote = true;
  adapter.applyRemote(clone(row.layout_data), clone(baseCustomLibrary));
  applyingRemote = false;
  renderDocumentOptions();
  setCloudStatus("☁ 已同步", "synced", `${currentDocumentName} · 雲端版本 ${currentRevision}`);
  if (announce) adapter.notify(`已載入「${currentDocumentName}」的最新配置`, "info");
}

async function persistSnapshot(snapshot, attempt = 0, announceMerge = false) {
  if (!canEdit() || !currentDocumentId) return null;
  setCloudStatus("☁ 儲存中…", "syncing", currentDocumentName);
  const { data, error } = await supabase.from("layout_documents").update({
    layout_data: snapshot.layout, custom_library: snapshot.customLibrary, updated_by: currentUser.id
  }).eq("workspace_id", WORKSPACE_ID).eq("id", currentDocumentId).eq("revision", currentRevision)
    .select("id, name, revision, is_primary, updated_at").maybeSingle();
  if (error) throw error;
  if (!data) {
    if (attempt >= 2) throw new Error("多人同時修改過於頻繁，請稍後再試");
    const remote = await fetchDocument(currentDocumentId);
    const merged = {
      layout: mergeChanged(baseLayout ?? remote.layout_data, snapshot.layout, remote.layout_data),
      customLibrary: mergeChanged(baseCustomLibrary ?? [], snapshot.customLibrary, remote.custom_library || []),
      token: snapshot.token
    };
    currentRevision = Number(remote.revision || 0);
    baseLayout = clone(remote.layout_data);
    baseCustomLibrary = clone(remote.custom_library || []);
    return persistSnapshot(merged, attempt + 1, true);
  }
  currentRevision = Number(data.revision);
  baseLayout = clone(snapshot.layout);
  baseCustomLibrary = clone(snapshot.customLibrary);
  currentDocumentName = data.name || currentDocumentName;
  clearUnsyncedSnapshot(snapshot.token);
  setCloudStatus("☁ 已同步", "synced", `${currentDocumentName} · 雲端版本 ${currentRevision}`);
  if (announceMerge) {
    applyingRemote = true;
    adapter.applyRemote(clone(snapshot.layout), clone(snapshot.customLibrary));
    applyingRemote = false;
    adapter.notify("已合併其他裝置的修改，雙方變更皆已保留", "success");
  }
  loadDocumentList().catch(() => {});
  return data;
}

function enqueueSave(snapshot) {
  saveQueue = saveQueue.then(() => persistSnapshot(snapshot)).catch((error) => {
    console.warn("Cloud save failed:", error);
    setCloudStatus("⚠ 同步失敗", "error", error.message);
    adapter.notify("雲端儲存失敗，本機副本仍已保留", "error");
  });
  return saveQueue;
}

async function flushPendingSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!pendingSnapshot) return saveQueue;
  const snapshot = pendingSnapshot;
  pendingSnapshot = null;
  return enqueueSave(snapshot);
}

function scheduleSave(layout, customLibrary) {
  if (applyingRemote || !canEdit() || !currentDocumentId) return;
  pendingSnapshot = clone({
    layout,
    customLibrary,
    token: `${Date.now()}-${Math.random().toString(36).slice(2)}`
  });
  rememberUnsyncedSnapshot(pendingSnapshot);
  clearTimeout(saveTimer);
  setCloudStatus("☁ 等待同步…", "pending", currentDocumentName);
  saveTimer = setTimeout(() => {
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    saveTimer = null;
    if (snapshot) enqueueSave(snapshot);
  }, 500);
}

async function createDocument(name, layout, customLibrary) {
  const { data, error } = await supabase.from("layout_documents").insert({
    workspace_id: WORKSPACE_ID, name: name.trim(), layout_data: clone(layout),
    custom_library: clone(customLibrary || []), created_by: currentUser.id, updated_by: currentUser.id
  }).select("id, name, layout_data, custom_library, revision, is_primary, updated_at, updated_by").single();
  if (error) throw error;
  return data;
}

function backupName() {
  const stamp = new Date().toLocaleString("sv-SE", { hour12: false }).replace(/:/g, "-");
  return `${currentUser.email.split("@")[0]} 登入前備份 ${stamp}`;
}

async function saveAsNewDocument() {
  if (!canEdit()) return adapter.notify("目前帳號沒有建立新檔的權限", "error");
  await flushPendingSave();
  const name = prompt("新檔名稱（建立後的修改不會影響原檔）：", `${currentDocumentName || "廠房配置"} - 副本`)?.trim();
  if (!name) return;
  setBusy(true);
  try {
    const row = await createDocument(name, adapter.getLayout(), adapter.getCustomLibrary());
    currentDocumentId = row.id;
    currentDocumentName = row.name;
    currentRevision = Number(row.revision || 0);
    baseLayout = clone(row.layout_data);
    baseCustomLibrary = clone(row.custom_library || []);
    localStorage.setItem(ACTIVE_DOCUMENT_KEY, row.id);
    await loadDocumentList();
    setCloudStatus("☁ 已同步", "synced", `${currentDocumentName} · 雲端版本 ${currentRevision}`);
    adapter.notify(`已另存為「${currentDocumentName}」；後續修改只會寫入此檔`, "success");
  } catch (error) {
    adapter.notify(`另存新檔失敗：${error.code === "23505" ? "已有同名檔案" : error.message}`, "error");
  } finally { setBusy(false); }
}

async function loadDocument(documentId, announce = false) {
  const row = await fetchDocument(documentId);
  currentDocumentId = row.id;
  currentDocumentName = row.name;
  currentRevision = Number(row.revision || 0);
  localStorage.setItem(ACTIVE_DOCUMENT_KEY, row.id);
  if (!row.layout_data) {
    baseLayout = null;
    baseCustomLibrary = [];
    await persistSnapshot({ layout: clone(adapter.getLayout()), customLibrary: clone(adapter.getCustomLibrary()) });
    return adapter.notify(`已建立第一份「${row.name}」雲端配置`, "success");
  }
  applyRemoteDocument(row, announce);
}

async function switchDocument(documentId) {
  if (!documentId || documentId === currentDocumentId) return;
  try {
    await flushPendingSave();
    setCloudStatus("☁ 載入檔案…", "syncing");
    await loadDocument(documentId, true);
  } catch (error) {
    adapter.notify(`切換檔案失敗：${error.message}`, "error");
    renderDocumentOptions();
  }
}

async function mergeFirstLoginLocalChanges(primaryRow) {
  const localLayout = clone(adapter.getLayout());
  const localLibrary = clone(adapter.getCustomLibrary());
  const initialLayout = clone(adapter.getInitialLayout?.() || {});
  if ((jsonEqual(localLayout, initialLayout) && !localLibrary.length) || jsonEqual(localLayout, primaryRow.layout_data)) {
    return applyRemoteDocument(primaryRow);
  }
  try { await createDocument(backupName(), localLayout, localLibrary); }
  catch (error) { console.warn("Could not create pre-login backup:", error); }
  currentDocumentId = primaryRow.id;
  currentDocumentName = primaryRow.name;
  currentRevision = Number(primaryRow.revision || 0);
  baseLayout = clone(primaryRow.layout_data);
  baseCustomLibrary = clone(primaryRow.custom_library || []);
  await persistSnapshot({
    layout: mergeChanged(initialLayout, localLayout, primaryRow.layout_data),
    customLibrary: mergeChanged([], localLibrary, primaryRow.custom_library || [])
  }, 0, true);
  adapter.notify("已把這台原有的走道與配置合併到共用正式檔，並另存登入前備份", "success");
}

function subscribeToChanges() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase.channel(`layout-documents:${WORKSPACE_ID}`).on("postgres_changes", {
    event: "*", schema: "public", table: "layout_documents", filter: `workspace_id=eq.${WORKSPACE_ID}`
  }, async (payload) => {
    const changedId = payload.new?.id || payload.old?.id;
    const incomingRevision = Number(payload.new?.revision || 0);
    try {
      await loadDocumentList();
      if (changedId !== currentDocumentId || incomingRevision <= currentRevision) return;
      await flushPendingSave();
      if (incomingRevision > currentRevision) await loadDocument(currentDocumentId, true);
    } catch (error) {
      setCloudStatus("⚠ 即時同步中斷", "error", error.message);
    }
  }).subscribe((status, error) => {
    if (status === "SUBSCRIBED") setCloudStatus("☁ 已同步", "synced", `${currentDocumentName} · 即時同步已連線`);
    if (["CHANNEL_ERROR", "TIMED_OUT"].includes(status)) setCloudStatus("⚠ 即時同步中斷", "error", error?.message || status);
  });
}

async function handleSession(session) {
  const user = session?.user || null;
  if (!user) {
    currentUser = currentRole = currentDocumentId = null;
    currentDocumentName = "";
    currentRevision = 0;
    documentRows = [];
    lastHandledUserId = null;
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
    updateAccountUi();
    renderDocumentOptions();
    return setCloudStatus("⚠ 本機模式（不會同步）", "offline", "請登入雲端帳號，否則其他人看不到這台的修改");
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
      return showMessage("此 Email 尚未獲得使用權限，請由管理員先加入員工名單。", "error");
    }
    currentRole = membership.role;
    updateAccountUi();
    const rows = await loadDocumentList();
    const rememberedId = localStorage.getItem(ACTIVE_DOCUMENT_KEY);
    const target = rows.find((row) => row.id === rememberedId) || rows.find((row) => row.is_primary) || rows[0];
    if (!target) throw new Error("找不到可用的雲端配置檔");
    const targetRow = await fetchDocument(target.id);
    const unsynced = readUnsyncedSnapshot();
    if (!targetRow.layout_data) {
      currentDocumentId = targetRow.id;
      currentDocumentName = targetRow.name;
      currentRevision = Number(targetRow.revision || 0);
      await persistSnapshot({ layout: clone(adapter.getLayout()), customLibrary: clone(adapter.getCustomLibrary()) });
      adapter.notify("已將這台裝置的配置建立為共用正式檔", "success");
    } else if (unsynced?.documentId === targetRow.id && canEdit()) {
      currentDocumentId = targetRow.id;
      currentDocumentName = targetRow.name;
      currentRevision = Number(targetRow.revision || 0);
      baseLayout = clone(targetRow.layout_data);
      baseCustomLibrary = clone(targetRow.custom_library || []);
      await persistSnapshot({
        layout: mergeChanged(unsynced.baseLayout ?? targetRow.layout_data, unsynced.layout, targetRow.layout_data),
        customLibrary: mergeChanged(unsynced.baseCustomLibrary ?? [], unsynced.customLibrary || [], targetRow.custom_library || []),
        token: unsynced.token
      }, 0, true);
      adapter.notify("已自動續傳上次關閉前尚未完成的修改", "success");
    } else if (!rememberedId && targetRow.is_primary && canEdit()) await mergeFirstLoginLocalChanges(targetRow);
    else applyRemoteDocument(targetRow);
    await loadDocumentList();
    subscribeToChanges();
    setCloudStatus("☁ 已同步", "synced", `${currentUser.email} · ${currentDocumentName} · 版本 ${currentRevision}`);
    adapter.notify(`已登入雲端並開啟「${currentDocumentName}」`, "success");
  } catch (error) {
    console.warn("Cloud initialization failed:", error);
    setCloudStatus("⚠ 同步失敗", "error", error.message);
    adapter.notify(`雲端連線失敗：${error.message}`, "error");
  }
}

async function loadMembers() {
  if (currentRole !== "owner") return;
  const list = byId("cloudMemberList");
  if (list) list.innerHTML = '<div class="cloud-empty">正在讀取員工名單…</div>';
  const { data, error } = await supabase.from("workspace_members").select("id, email, role, created_at")
    .eq("workspace_id", WORKSPACE_ID).order("created_at");
  if (error) return showMessage(`讀取員工名單失敗：${error.message}`, "error");
  list.innerHTML = "";
  data.forEach((member) => {
    const row = document.createElement("div");
    row.className = "cloud-member-row";
    row.innerHTML = `<div><strong></strong><span>${member.role === "owner" ? "管理員" : member.role === "editor" ? "可編輯" : "唯讀"}</span></div>`;
    row.querySelector("strong").textContent = member.email;
    if (!(member.email === currentUser.email.toLowerCase() && member.role === "owner")) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cad-btn danger btn-sm";
      remove.textContent = "移除";
      remove.onclick = () => removeMember(member.id, member.email);
      row.appendChild(remove);
    }
    list.appendChild(row);
  });
}

async function addMember(event) {
  event.preventDefault();
  const email = (byId("cloudMemberEmail")?.value || "").trim().toLowerCase();
  if (!email) return;
  setBusy(true);
  const { error } = await supabase.from("workspace_members").insert({ workspace_id: WORKSPACE_ID, email, role: byId("cloudMemberRole")?.value || "editor" });
  setBusy(false);
  if (error) return showMessage(error.code === "23505" ? "此 Email 已在員工名單中。" : `新增失敗：${error.message}`, "error");
  byId("cloudMemberEmail").value = "";
  showMessage(`已加入 ${email}。請對方點「雲端帳號」並用此 Email 登入，之後所有修改才會同步。`, "success");
  loadMembers();
}

async function removeMember(id, email) {
  if (!confirm(`確定要移除 ${email} 的雲端權限嗎？`)) return;
  const { error } = await supabase.from("workspace_members").delete().eq("id", id);
  showMessage(error ? `移除失敗：${error.message}` : `已移除 ${email}`, error ? "error" : "success");
  if (!error) loadMembers();
}

function bindUi() {
  byId("openCloudBtn")?.addEventListener("click", openModal);
  byId("closeCloudModalBtn")?.addEventListener("click", closeModal);
  byId("cloudModal")?.addEventListener("click", (event) => { if (event.target.id === "cloudModal") closeModal(); });
  byId("cloudLoginForm")?.addEventListener("submit", signIn);
  byId("cloudLogoutBtn")?.addEventListener("click", signOut);
  byId("cloudMemberForm")?.addEventListener("submit", addMember);
  byId("cloudSaveAsBtn")?.addEventListener("click", saveAsNewDocument);
  byId("cloudDocumentSelect")?.addEventListener("change", (event) => switchDocument(event.target.value));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingSave();
  });
}

async function init(nextAdapter) {
  adapter = nextAdapter;
  bindUi();
  updateAccountUi();
  setCloudStatus("⚠ 本機模式（不會同步）", "offline", "登入後才會同步到其他裝置");
  const { data } = await supabase.auth.getSession();
  await handleSession(data.session);
  supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => handleSession(session), 0));
}

window.ChinChunCloud = { init, scheduleSave, flushPendingSave, saveAsNewDocument };

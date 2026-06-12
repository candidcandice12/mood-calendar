const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const selectedDateText = document.getElementById("selectedDateText");
const memoInput = document.getElementById("memo");
const emotionCards = document.getElementById("emotionCards");
const emotionPreview = document.getElementById("emotionPreview");
const selectedEmotionNames = document.getElementById("selectedEmotionNames");
const userList = document.getElementById("userList");
const currentUserText = document.getElementById("currentUserText");
const monthlyStats = document.getElementById("monthlyStats");
const monthlySummary = document.getElementById("monthlySummary");
const reportText = document.getElementById("reportText");
const weeklyReport = document.getElementById("weeklyReport");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const selectionCount = document.getElementById("selectionCount");
const recordModeText = document.getElementById("recordModeText");
const statusMessage = document.getElementById("statusMessage");
const saveRecordButton = document.getElementById("saveRecordButton");
const deleteRecordButton = document.getElementById("deleteRecordButton");
const importFile = document.getElementById("importFile");

const emotions = [
  { emoji: "😊", name: "좋아", color: "#FFD93D" },
  { emoji: "😄", name: "신나", color: "#FFD6A5" },
  { emoji: "🥰", name: "행복해", color: "#FFB3C6" },
  { emoji: "😌", name: "편안해", color: "#B8F2E6" },
  { emoji: "😢", name: "슬퍼", color: "#BDE0FE" },
  { emoji: "😡", name: "화나", color: "#FFADAD" },
  { emoji: "😟", name: "걱정돼", color: "#D0BFFF" },
  { emoji: "😴", name: "졸려", color: "#DDBDF1" },
  { emoji: "😣", name: "답답해", color: "#DEE2E6" },
  { emoji: "😐", name: "그냥 그래", color: "#E9ECEF" },
  { emoji: "😭", name: "속상해", color: "#CDE7F0" },
  { emoji: "😋", name: "만족해", color: "#CAFFBF" }
];

const defaultUsers = [
  { name: "첫째", avatar: "🐰", password: "0000" },
  { name: "둘째", avatar: "🐥", password: "0000" }
];

const avatarGuide = "🐰 🐥 🐻 🐼 🦊 🐶 🐱 🐹 🐨 🐯 🦁 🐸 🐵 🐷 🐮 🐧 🦄 🐙 🐢 🐳 ⭐ 🌙 ☀️ 🌈 🌸 🎀 🧸 🚀 🎮";
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDate = formatDate(today);
let selectedEmotions = [];
let users = normalizeUsers(readJson("emotionUsers", defaultUsers));
let currentUser = users.find(user => user.name === getSavedCurrentUserName()) || users[0];

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeUsers(savedUsers) {
  if (!Array.isArray(savedUsers) || savedUsers.length === 0) {
    return [...defaultUsers];
  }

  return savedUsers.map((user, index) => {
    if (typeof user === "string") {
      return {
        name: user,
        avatar: defaultUsers[index]?.avatar || "🙂",
        password: "0000"
      };
    }

    return {
      name: user.name || `사용자${index + 1}`,
      avatar: user.avatar || "🙂",
      password: user.password || "0000"
    };
  });
}

function getSavedCurrentUserName() {
  const savedUser = localStorage.getItem("currentEmotionUser");

  if (!savedUser) {
    return users[0].name;
  }

  try {
    const parsedUser = JSON.parse(savedUser);
    return parsedUser.name || savedUser;
  } catch {
    return savedUser;
  }
}

function saveUsers() {
  localStorage.setItem("emotionUsers", JSON.stringify(users));
  localStorage.setItem("currentEmotionUser", currentUser.name);
}

function getAllRecords() {
  return readJson("emotionRecordsByUser", {});
}

function saveAllRecords(records) {
  localStorage.setItem("emotionRecordsByUser", JSON.stringify(records));
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function renderUsers() {
  userList.innerHTML = "";

  users.forEach(user => {
    const button = document.createElement("button");
    button.className = "user-btn";
    button.type = "button";

    if (user.name === currentUser.name) {
      button.classList.add("active");
    }

    button.textContent = `${user.avatar} ${user.name}`;
    button.addEventListener("click", () => selectUser(user));
    userList.appendChild(button);
  });

  const addButton = document.createElement("button");
  addButton.className = "user-btn add-user-btn";
  addButton.type = "button";
  addButton.textContent = "➕ 추가";
  addButton.addEventListener("click", addUser);
  userList.appendChild(addButton);

  currentUserText.textContent = `${currentUser.avatar} ${currentUser.name}`;
}

function addUser() {
  const name = prompt("사용자 이름을 입력해 주세요.");
  if (!name) return;

  const trimmedName = name.trim();

  if (!trimmedName) {
    alert("이름을 입력해 주세요.");
    return;
  }

  if (users.some(user => user.name === trimmedName)) {
    alert("이미 있는 이름이에요.");
    return;
  }

  const avatar = prompt(`아바타를 골라 주세요.\n${avatarGuide}`) || "🙂";
  const password = askNewPassword();

  if (!password) return;

  const newUser = { name: trimmedName, avatar: avatar.trim() || "🙂", password };
  users.push(newUser);
  currentUser = newUser;

  const records = getAllRecords();
  records[currentUser.name] = records[currentUser.name] || {};
  saveAllRecords(records);
  saveUsers();
  resetEntryForm();
  renderAll();
  setStatus(`${currentUser.name} 사용자를 추가했어요.`);
}

function askNewPassword() {
  const password = prompt("사용자 비밀번호 4자리를 입력해 주세요.");

  if (!password) {
    alert("비밀번호를 입력해 주세요.");
    return null;
  }

  if (!/^\d{4}$/.test(password)) {
    alert("비밀번호는 숫자 4자리여야 해요.");
    return null;
  }

  const confirmPassword = prompt("비밀번호를 한번 더 입력해 주세요.");

  if (password !== confirmPassword) {
    alert("비밀번호가 서로 달라요.");
    return null;
  }

  return password;
}

function selectUser(user) {
  if (user.name !== currentUser.name) {
    const password = prompt(`${user.name} 비밀번호를 입력해 주세요.`);

    if (password !== user.password) {
      alert("비밀번호가 틀렸어요.");
      return;
    }
  }

  currentUser = user;
  saveUsers();
  resetEntryForm();
  renderAll();
  loadRecord();
}

function changeCurrentPassword() {
  const oldPassword = prompt("현재 비밀번호를 입력해 주세요.");

  if (oldPassword !== currentUser.password) {
    alert("현재 비밀번호가 틀렸어요.");
    return;
  }

  const newPassword = askNewPassword();

  if (!newPassword) return;

  currentUser.password = newPassword;
  users = users.map(user => user.name === currentUser.name ? currentUser : user);
  saveUsers();
  setStatus("비밀번호를 변경했어요.");
}

function deleteCurrentUser() {
  if (users.length <= 1) {
    alert("사용자는 최소 1명은 있어야 해요.");
    return;
  }

  const password = prompt("삭제하려면 현재 사용자 비밀번호를 입력해 주세요.");

  if (password !== currentUser.password) {
    alert("비밀번호가 틀렸어요.");
    return;
  }

  const ok = confirm(`${currentUser.avatar} ${currentUser.name} 사용자를 삭제할까요? 이 사용자의 기록도 함께 삭제돼요.`);

  if (!ok) return;

  const records = getAllRecords();
  delete records[currentUser.name];
  saveAllRecords(records);

  users = users.filter(user => user.name !== currentUser.name);
  currentUser = users[0];
  saveUsers();
  resetEntryForm();
  renderAll();
  loadRecord();
  setStatus("사용자를 삭제했어요.");
}

function renderEmotionCards() {
  emotionCards.innerHTML = "";

  emotions.forEach(emotion => {
    const card = document.createElement("button");
    card.className = "emotion";
    card.type = "button";
    card.style.background = emotion.color;
    card.innerHTML = `<span>${emotion.emoji}</span>${emotion.name}`;
    card.addEventListener("click", () => selectEmotion(emotion));
    emotionCards.appendChild(card);
  });
}

function renderCalendar() {
  calendarDays.innerHTML = "";
  monthYear.textContent = `${currentYear}년 ${currentMonth + 1}월`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i += 1) {
    calendarDays.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = formatDate(date);
    const record = getRecord(dateString);
    const savedEmotions = getRecordEmotions(record);
    const mainEmotion = savedEmotions[0];
    const extraEmotionCount = Math.max(savedEmotions.length - 1, 0);
    const hasMemo = Boolean(record && record.memo && record.memo.trim());
    const dayButton = document.createElement("button");

    dayButton.className = "day";
    dayButton.type = "button";

    if (mainEmotion && mainEmotion.color) {
      dayButton.style.background = hexToRgba(mainEmotion.color, 0.36);
    }

    if (dateString === formatDate(today)) {
      dayButton.classList.add("today");
    }

    if (dateString === selectedDate) {
      dayButton.classList.add("selected");
    }

    dayButton.innerHTML = `
      <div>${day}</div>
      <div class="record-emoji">
        ${mainEmotion ? mainEmotion.emoji : ""}
        ${extraEmotionCount > 0 ? `<span class="more-emotions">+${extraEmotionCount}</span>` : ""}
        ${hasMemo ? `<span class="memo-mark">📝</span>` : ""}
      </div>
    `;

    dayButton.addEventListener("click", () => {
      selectedDate = dateString;
      loadRecord();
      renderCalendar();
      renderMonthlyStats();
    });

    calendarDays.appendChild(dayButton);
  }
}

function renderMonthlyStats() {
  const records = getAllRecords();
  const userRecords = records[currentUser.name] || {};
  const stats = {};
  let recordedDays = 0;
  let memoDays = 0;
  let emotionTotal = 0;

  Object.keys(userRecords).forEach(date => {
    const [year, month] = date.split("-");
    const sameYear = Number(year) === currentYear;
    const sameMonth = Number(month) === currentMonth + 1;

    if (!sameYear || !sameMonth) return;

    recordedDays += 1;

    if (userRecords[date].memo && userRecords[date].memo.trim()) {
      memoDays += 1;
    }

    getRecordEmotions(userRecords[date]).forEach(emotion => {
      emotionTotal += 1;

      if (!stats[emotion.name]) {
        stats[emotion.name] = { emoji: emotion.emoji, color: emotion.color, count: 0 };
      }

      stats[emotion.name].count += 1;
    });
  });

  const statList = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  const topEmotionText = statList[0] ? `${statList[0][1].emoji} ${statList[0][0]}` : "아직 없음";
  const reportMessage = buildMonthlyReport(recordedDays, memoDays, statList);

  monthlySummary.innerHTML = `
    <div class="summary-card"><div class="summary-label">기록한 날</div><div class="summary-value">${recordedDays}일</div></div>
    <div class="summary-card"><div class="summary-label">가장 많은 마음</div><div class="summary-value">${topEmotionText}</div></div>
    <div class="summary-card"><div class="summary-label">고른 마음</div><div class="summary-value">${emotionTotal}개</div></div>
    <div class="summary-card"><div class="summary-label">메모 쓴 날</div><div class="summary-value">${memoDays}일</div></div>
  `;
  reportText.textContent = reportMessage;
  renderWeeklyReport();

  monthlyStats.innerHTML = "";

  if (statList.length === 0) {
    monthlyStats.innerHTML = `<div class="hint">이번 달에는 아직 기록이 없어요.</div>`;
    return;
  }

  const maxCount = statList[0][1].count;

  statList.forEach(([name, data]) => {
    const percent = (data.count / maxCount) * 100;
    const item = document.createElement("div");
    item.className = "stat-item";
    item.innerHTML = `
      <div class="stat-top">
        <div>${data.emoji} ${name}</div>
        <div class="stat-count">${data.count}번</div>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width: ${percent}%; background: ${data.color || "#ffb3c6"};"></div></div>
    `;
    monthlyStats.appendChild(item);
  });
}

function buildMonthlyReport(recordedDays, memoDays, statList) {
  if (recordedDays === 0) {
    return "이번 달 기록이 아직 없어요. 오늘 마음부터 하나 남겨볼까요?";
  }

  const topEmotion = statList[0] ? `${statList[0][1].emoji} ${statList[0][0]}` : "마음";
  const memoText = memoDays > 0 ? `메모도 ${memoDays}일 남겼어요.` : "메모를 함께 남기면 나중에 마음을 더 잘 떠올릴 수 있어요.";

  return `이번 달에는 ${recordedDays}일 기록했고, 가장 자주 나온 마음은 ${topEmotion}예요. ${memoText}`;
}

function renderWeeklyReport() {
  const records = getAllRecords();
  const userRecords = records[currentUser.name] || {};
  const weekDates = getWeekDateStrings(new Date(selectedDate));
  const stats = {};
  let recordedDays = 0;
  let memoDays = 0;

  weekDates.forEach(date => {
    const record = userRecords[date];

    if (!record) return;

    recordedDays += 1;

    if (record.memo && record.memo.trim()) {
      memoDays += 1;
    }

    getRecordEmotions(record).forEach(emotion => {
      if (!stats[emotion.name]) {
        stats[emotion.name] = { emoji: emotion.emoji, count: 0 };
      }

      stats[emotion.name].count += 1;
    });
  });

  const statList = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  const topEmotion = statList[0] ? `${statList[0][1].emoji} ${statList[0][0]}` : "아직 없음";
  const startDate = weekDates[0].slice(5).replace("-", "/");
  const endDate = weekDates[6].slice(5).replace("-", "/");

  if (recordedDays === 0) {
    weeklyReport.textContent = `${startDate}~${endDate} 주간에는 아직 기록이 없어요.`;
    return;
  }

  weeklyReport.textContent = `${startDate}~${endDate} 주간에는 ${recordedDays}일 기록했어요. 가장 많이 나온 마음은 ${topEmotion}이고, 메모는 ${memoDays}일 남겼어요.`;
}

function getWeekDateStrings(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return formatDate(day);
  });
}

function renderSearchResults() {
  const keyword = searchInput.value.trim().toLowerCase();
  const userRecords = getAllRecords()[currentUser.name] || {};
  const results = Object.entries(userRecords)
    .filter(([, record]) => {
      if (!keyword) return false;

      const emotionText = getRecordEmotions(record).map(emotion => emotion.name).join(" ").toLowerCase();
      const memoText = (record.memo || "").toLowerCase();
      return emotionText.includes(keyword) || memoText.includes(keyword);
    })
    .sort((a, b) => b[0].localeCompare(a[0]));

  searchResults.innerHTML = "";

  if (!keyword) {
    searchResults.innerHTML = `<div class="hint">검색어를 입력하면 기록이 보여요.</div>`;
    return;
  }

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="hint">찾은 기록이 없어요.</div>`;
    return;
  }

  results.forEach(([date, record]) => {
    const item = document.createElement("button");
    item.className = "search-result";
    item.type = "button";
    item.innerHTML = `
      <div class="search-result-date">${date} ${getRecordEmotions(record).map(emotion => emotion.emoji).join(" ")}</div>
      <div class="search-result-memo">${record.memo || "메모 없음"}</div>
    `;
    item.addEventListener("click", () => moveToRecordDate(date));
    searchResults.appendChild(item);
  });
}

function moveToRecordDate(dateString) {
  const [year, month] = dateString.split("-");
  currentYear = Number(year);
  currentMonth = Number(month) - 1;
  selectedDate = dateString;
  renderAll();
  loadRecord();
}

function selectEmotion(emotion) {
  const alreadySelected = selectedEmotions.some(item => item.name === emotion.name);

  if (alreadySelected) {
    selectedEmotions = selectedEmotions.filter(item => item.name !== emotion.name);
  } else {
    if (selectedEmotions.length >= 3) {
      setStatus("감정은 하루에 최대 3개까지 선택할 수 있어요.");
      return;
    }

    selectedEmotions.push(emotion);
  }

  setStatus("");
  renderSelectedEmotions();
}

function renderSelectedEmotions() {
  emotionPreview.textContent = selectedEmotions.map(item => item.emoji).join(" ");
  selectedEmotionNames.textContent = selectedEmotions.map(item => item.name).join(" · ");
  selectionCount.textContent = `${selectedEmotions.length}/3 선택`;

  document.querySelectorAll(".emotion").forEach((card, index) => {
    card.classList.toggle("active", selectedEmotions.some(item => item.name === emotions[index].name));
  });
}

function saveRecord() {
  if (selectedEmotions.length === 0) {
    setStatus("감정을 1개 이상 선택해 주세요.");
    return;
  }

  const records = getAllRecords();
  records[currentUser.name] = records[currentUser.name] || {};
  records[currentUser.name][selectedDate] = {
    emotions: selectedEmotions,
    memo: memoInput.value.trim(),
    updatedAt: new Date().toISOString()
  };

  saveAllRecords(records);
  renderCalendar();
  renderMonthlyStats();
  renderSearchResults();
  updateRecordMode();
  setStatus("저장했어요. 날짜를 다시 눌러 수정할 수 있어요.");
}

function getRecord(dateString) {
  const records = getAllRecords();
  return records[currentUser.name]?.[dateString] || null;
}

function getRecordEmotions(record) {
  if (!record) return [];
  if (Array.isArray(record.emotions)) return record.emotions;
  if (record.emotion) return [record.emotion];
  return [];
}

function loadRecord() {
  selectedDateText.textContent = selectedDate;
  const record = getRecord(selectedDate);

  if (record) {
    selectedEmotions = getRecordEmotions(record);
    memoInput.value = record.memo || "";
  } else {
    resetEntryForm();
  }

  renderSelectedEmotions();
  updateRecordMode();
  setStatus("");
}

function updateRecordMode() {
  const hasRecord = Boolean(getRecord(selectedDate));
  recordModeText.textContent = hasRecord ? "저장된 기록을 수정하는 중이에요." : "아직 기록이 없어요. 새 기록을 남겨보세요.";
  saveRecordButton.textContent = hasRecord ? "수정해서 저장하기" : "저장하기";
  deleteRecordButton.disabled = !hasRecord;
}

function deleteRecord() {
  const records = getAllRecords();

  if (!records[currentUser.name] || !records[currentUser.name][selectedDate]) {
    setStatus("삭제할 기록이 없어요.");
    return;
  }

  const ok = confirm(`${selectedDate} 기록을 삭제할까요?`);

  if (!ok) return;

  delete records[currentUser.name][selectedDate];
  saveAllRecords(records);
  resetEntryForm();
  renderSelectedEmotions();
  renderCalendar();
  renderMonthlyStats();
  renderSearchResults();
  updateRecordMode();
  setStatus("기록을 삭제했어요.");
}

function resetEntryForm() {
  selectedEmotions = [];
  memoInput.value = "";
}

function exportBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    emotionUsers: users,
    currentEmotionUser: currentUser.name,
    emotionRecordsByUser: getAllRecords()
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `emotion-calendar-backup-${formatDate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("백업 파일을 만들었어요.");
}

function importBackup(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const backup = JSON.parse(reader.result);

      if (!Array.isArray(backup.emotionUsers) || typeof backup.emotionRecordsByUser !== "object") {
        alert("백업 파일 형식이 올바르지 않아요.");
        return;
      }

      const ok = confirm("현재 기록을 백업 파일 내용으로 바꿀까요?");

      if (!ok) return;

      users = normalizeUsers(backup.emotionUsers);
      currentUser = users.find(user => user.name === backup.currentEmotionUser) || users[0];
      saveUsers();
      saveAllRecords(backup.emotionRecordsByUser || {});
      resetEntryForm();
      renderAll();
      loadRecord();
      setStatus("백업을 가져왔어요.");
    } catch {
      alert("백업 파일을 읽지 못했어요.");
    } finally {
      importFile.value = "";
    }
  });

  reader.readAsText(file);
}

function changeMonth(direction) {
  currentMonth += direction;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  }

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear += 1;
  }

  renderCalendar();
  renderMonthlyStats();
  renderSearchResults();
}

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace("#", "");
  const red = parseInt(cleanHex.slice(0, 2), 16);
  const green = parseInt(cleanHex.slice(2, 4), 16);
  const blue = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function renderAll() {
  renderUsers();
  renderCalendar();
  renderMonthlyStats();
  renderSearchResults();
}

document.getElementById("prevMonthButton").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonthButton").addEventListener("click", () => changeMonth(1));
document.getElementById("changePasswordButton").addEventListener("click", changeCurrentPassword);
document.getElementById("deleteUserButton").addEventListener("click", deleteCurrentUser);
document.getElementById("saveRecordButton").addEventListener("click", saveRecord);
document.getElementById("deleteRecordButton").addEventListener("click", deleteRecord);
document.getElementById("exportButton").addEventListener("click", exportBackup);
document.getElementById("importButton").addEventListener("click", () => importFile.click());
importFile.addEventListener("change", event => importBackup(event.target.files[0]));
searchInput.addEventListener("input", renderSearchResults);

saveUsers();
renderEmotionCards();
renderAll();
loadRecord();

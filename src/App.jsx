import { useEffect, useState } from "react";
import { AccountBox } from "./components/AccountBox";
import { BackupBox } from "./components/BackupBox";
import { Calendar } from "./components/Calendar";
import { EmotionPicker } from "./components/EmotionPicker";
import { HelperBubble } from "./components/HelperBubble";
import { RecordEditor } from "./components/RecordEditor";
import { SearchBox } from "./components/SearchBox";
import { SelectedDateCard } from "./components/SelectedDateCard";
import { StatsPanel } from "./components/StatsPanel";
import { TabNav } from "./components/TabNav";
import { UserManager } from "./components/UserManager";
import { defaultUsers } from "./data/emotions";
import { isFirebaseConfigured, missingFirebaseConfigKeys, signInWithGoogle, signOutFromFirebase, subscribeToFirebaseAuth } from "./firebase";
import { createFamilyRoom, deleteCloudRecord, joinFamilyRoom, loadCloudState, saveCloudState } from "./services/cloudDataService";
import { deleteRecordPhoto } from "./services/photoStorageService";
import { deleteLocalPhoto, getLocalPhotoId, loadLocalPhoto, saveLocalPhoto } from "./services/localPhotoService";
import { formatDate } from "./utils/date";
import { getSavedCurrentUserName, normalizeUsers, readJson } from "./utils/storage";
import { createFamilySecret } from "./utils/crypto";
import { resizeImage } from "./utils/photo";
import { getMonthStats, getRecordEmotions, getSearchResults, getWeeklyReport } from "./utils/stats";

const today = new Date();
const initialFamilyAccess = getInitialFamilyAccess();

function getInitialCloudStatus() {
  if (isFirebaseConfigured) {
    return "클라우드 연결 준비 중";
  }

  return `로컬 저장 모드: ${missingFirebaseConfigKeys.join(", ")} 값이 없어요`;
}

export function App() {
  const initialUsers = normalizeUsers(readJson("emotionUsers", defaultUsers));
  const [users, setUsers] = useState(initialUsers);
  const [currentUser, setCurrentUser] = useState(initialUsers.find((user) => user.name === getSavedCurrentUserName(initialUsers)) || initialUsers[0] || null);
  const [records, setRecords] = useState(readJson("emotionRecordsByUser", {}));
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [memo, setMemo] = useState("");
  const [photo, setPhoto] = useState("");
  const [status, setStatus] = useState("");
  const [cloudStatus, setCloudStatus] = useState(getInitialCloudStatus());
  const [isCloudLoaded, setIsCloudLoaded] = useState(!isFirebaseConfigured);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isFirebaseConfigured);
  const [familyId, setFamilyId] = useState(initialFamilyAccess.familyId);
  const [familyKey, setFamilyKey] = useState(initialFamilyAccess.familyKey);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("record");

  const currentRecord = currentUser ? records[currentUser.name]?.[selectedDate] || null : null;
  const monthStats = currentUser ? getMonthStats(records, currentUser.name, currentYear, currentMonth) : [];
  const weeklyReport = currentUser ? getWeeklyReport(records, currentUser.name, selectedDate) : [];
  const searchResults = currentUser ? getSearchResults(records, currentUser.name, searchText) : [];

  useEffect(() => {
    try {
      localStorage.setItem("emotionUsers", JSON.stringify(users));
      if (currentUser) {
        localStorage.setItem("currentEmotionUser", currentUser.name);
      } else {
        localStorage.removeItem("currentEmotionUser");
      }
    } catch (error) {
      setStatus("브라우저 저장 공간이 부족할 수 있어요.");
      console.error(error);
    }
  }, [users, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem("emotionRecordsByUser", JSON.stringify(records));
    } catch (error) {
      setStatus("사진 저장 공간이 부족해요. 더 작은 사진을 사용해 주세요.");
      console.error(error);
    }
  }, [records]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToFirebaseAuth((user) => {
      setAuthUser(user);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (familyId) {
      localStorage.setItem("emotionFamilyId", familyId);
      if (familyKey) {
        localStorage.setItem(getFamilyKeyStorageKey(familyId), familyKey);
      }
    } else {
      localStorage.removeItem("emotionFamilyId");
    }
  }, [familyId, familyKey]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!isAuthReady || !authUser) return;
    if (familyId && !familyKey) {
      setCloudStatus("가족방 암호키가 필요해요. 초대 링크로 다시 들어와 주세요.");
      setIsCloudLoaded(true);
      return;
    }

    let isMounted = true;

    async function loadState() {
      try {
        setIsCloudLoaded(false);
        const cloudState = await loadCloudState(familyId, familyKey);

        if (!isMounted) return;

        if (cloudState) {
          const cloudUsers = normalizeUsers(cloudState.emotionUsers || defaultUsers);
          const localRecords = readJson("emotionRecordsByUser", {});
          setUsers(cloudUsers);
          setCurrentUser(cloudUsers.find((user) => user.name === cloudState.currentEmotionUser) || cloudUsers[0] || null);
          setRecords(mergeLocalPhotos(cloudState.emotionRecordsByUser || {}, localRecords));
          setCloudStatus(familyId ? "가족방 기록을 불러왔어요" : "클라우드 기록을 불러왔어요");
        } else {
          setCloudStatus(familyId ? "가족방에 새 기록을 만들 준비가 됐어요" : "클라우드에 새 기록을 만들 준비가 됐어요");
        }
      } catch (error) {
        setCloudStatus(`클라우드 연결 실패: ${getFriendlyErrorMessage(error)}`);
        console.error(error);
      } finally {
        if (isMounted) {
          setIsCloudLoaded(true);
        }
      }
    }

    loadState();

    return () => {
      isMounted = false;
    };
  }, [authUser, familyId, familyKey, isAuthReady]);

  useEffect(() => {
    if (!isFirebaseConfigured || !isCloudLoaded) return;
    if (!isAuthReady || !authUser) return;
    if (!currentUser) return;
    if (familyId && !familyKey) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveCloudState({
          emotionUsers: users,
          currentEmotionUser: currentUser.name,
          emotionRecordsByUser: records,
        }, familyId, familyKey);
        setCloudStatus(familyId ? "가족방에 저장됐어요" : "클라우드에 저장됐어요");
      } catch (error) {
        setCloudStatus("클라우드 저장 실패: 로컬에는 저장됐어요");
        console.error(error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [users, currentUser, records, familyId, familyKey, authUser, isAuthReady, isCloudLoaded]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedEmotions([]);
      setMemo("");
      setPhoto("");
      setStatus("");
      return;
    }

    const record = records[currentUser.name]?.[selectedDate];

    let isMounted = true;

    async function loadRecordPhoto(recordToLoad) {
      if (recordToLoad?.photoLocalId) {
        try {
          const localPhoto = await loadLocalPhoto(recordToLoad.photoLocalId);

          if (isMounted && localPhoto) {
            setPhoto(localPhoto);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (record) {
      setSelectedEmotions(getRecordEmotions(record));
      setMemo(record.memo || "");
      setPhoto(record.photo || record.photoUrl || "");
      loadRecordPhoto(record);
    } else {
      setSelectedEmotions([]);
      setMemo("");
      setPhoto("");
    }

    return () => {
      isMounted = false;
    };
  }, [records, currentUser?.name, selectedDate]);

  function addUser(newUser) {
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    setRecords((prevRecords) => ({ ...prevRecords, [newUser.name]: prevRecords[newUser.name] || {} }));
    setStatus(`${newUser.name} 사용자를 추가했어요.`);
  }

  function editCurrentUser(updatedUser) {
    if (!currentUser) return;

    const previousName = currentUser.name;
    setUsers((prevUsers) => prevUsers.map((user) => user.name === previousName ? updatedUser : user));
    setCurrentUser(updatedUser);
    setRecords((prevRecords) => {
      if (previousName === updatedUser.name) {
        return prevRecords;
      }

      const nextRecords = { ...prevRecords };
      nextRecords[updatedUser.name] = {
        ...(nextRecords[updatedUser.name] || {}),
        ...(nextRecords[previousName] || {}),
      };
      delete nextRecords[previousName];
      return nextRecords;
    });
    setStatus("사용자 이름과 이모지를 바꿨어요.");
  }

  function selectUser(user) {
    if (!currentUser || user.name !== currentUser.name) {
      const password = prompt(`${user.name} 비밀번호를 입력해 주세요.`);

      if (password !== user.password) {
        alert("비밀번호가 틀렸어요.");
        return;
      }
    }

    setCurrentUser(user);
  }

  function changePassword() {
    if (!currentUser) return;

    const oldPassword = prompt("현재 비밀번호를 입력해 주세요.");

    if (oldPassword !== currentUser.password) {
      alert("현재 비밀번호가 틀렸어요.");
      return;
    }

    const newPassword = askNewPassword();

    if (!newPassword) return;

    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    setUsers((prevUsers) => prevUsers.map((user) => user.name === currentUser.name ? updatedUser : user));
    setStatus("비밀번호를 변경했어요.");
  }

  function deleteCurrentUser() {
    if (!currentUser) return;

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

    const nextUsers = users.filter((user) => user.name !== currentUser.name);
    const nextRecords = { ...records };
    delete nextRecords[currentUser.name];
    setUsers(nextUsers);
    setCurrentUser(nextUsers[0] || null);
    setRecords(nextRecords);
    setStatus("사용자를 삭제했어요.");
  }

  function changeMonth(direction) {
    const nextDate = new Date(currentYear, currentMonth + direction, 1);
    setCurrentYear(nextDate.getFullYear());
    setCurrentMonth(nextDate.getMonth());
  }

  function selectDate(dateString) {
    setSelectedDate(dateString);
    setActiveTab("record");
  }

  function toggleEmotion(emotion) {
    const alreadySelected = selectedEmotions.some((item) => item.name === emotion.name);

    if (alreadySelected) {
      setSelectedEmotions((prevEmotions) => prevEmotions.filter((item) => item.name !== emotion.name));
      setStatus("");
      return;
    }

    if (selectedEmotions.length >= 3) {
      setStatus("감정은 하루에 최대 3개까지 선택할 수 있어요.");
      return;
    }

    setSelectedEmotions((prevEmotions) => [...prevEmotions, emotion]);
    setStatus("");
  }

  async function saveRecord() {
    if (!currentUser) {
      setStatus("먼저 사용자를 만들어 주세요.");
      return;
    }

    if (selectedEmotions.length === 0) {
      setStatus("감정을 1개 이상 선택해 주세요.");
      return;
    }

    let nextPhoto = "";
    let nextPhotoLocalId = currentRecord?.photoLocalId || "";
    let nextPhotoUrl = photo?.startsWith("http") ? photo : currentRecord?.photoUrl || "";
    let nextPhotoPath = currentRecord?.photoPath || "";

    if (photo?.startsWith("data:")) {
      nextPhotoLocalId = getLocalPhotoId(currentUser.name, selectedDate);
      await saveLocalPhoto(nextPhotoLocalId, photo);
    }

    if (!photo) {
      if (currentRecord?.photoLocalId) {
        await deleteLocalPhoto(currentRecord.photoLocalId);
      }

      nextPhotoUrl = "";
      nextPhotoPath = "";
      nextPhotoLocalId = "";
    }

    setRecords((prevRecords) => ({
      ...prevRecords,
      [currentUser.name]: {
        ...(prevRecords[currentUser.name] || {}),
        [selectedDate]: {
          emotions: selectedEmotions,
          memo: memo.trim(),
          photo: nextPhoto,
          photoLocalId: nextPhotoLocalId,
          photoUrl: nextPhotoUrl,
          photoPath: nextPhotoPath,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    setPhoto(nextPhotoUrl || nextPhoto);
    setStatus(getSaveStatusMessage(Boolean(currentRecord)));
  }

  async function deleteRecord() {
    if (!currentUser) {
      setStatus("먼저 사용자를 만들어 주세요.");
      return;
    }

    if (!currentRecord) {
      setStatus("삭제할 기록이 없어요.");
      return;
    }

    const ok = confirm(`${selectedDate} 기록을 삭제할까요?`);

    if (!ok) return;

    try {
      if (currentRecord.photoPath) {
        await deleteRecordPhoto(currentRecord.photoPath);
      }

      if (currentRecord.photoLocalId) {
        await deleteLocalPhoto(currentRecord.photoLocalId);
      }

      await deleteCloudRecord(currentUser.name, selectedDate, familyId);
    } catch (error) {
      setStatus("클라우드 사진/기록 삭제 중 문제가 있었어요. 로컬 기록은 삭제합니다.");
      console.error(error);
    }

    setRecords((prevRecords) => {
      const userRecords = { ...(prevRecords[currentUser.name] || {}) };
      delete userRecords[selectedDate];
      return { ...prevRecords, [currentUser.name]: userRecords };
    });
    setStatus("기록을 삭제했어요.");
  }

  async function changePhoto(file) {
    if (!file) return;

    try {
      const resizedPhoto = await resizeImage(file);
      setPhoto(resizedPhoto);
      setStatus("사진을 추가했어요. 저장하기를 눌러 기록에 남겨주세요.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function addMemoPrompt(promptText) {
    setMemo((currentMemo) => {
      if (!currentMemo.trim()) {
        return promptText;
      }

      return `${currentMemo.trim()}\n${promptText}`;
    });
  }

  function moveToRecordDate(dateString) {
    const [year, month] = dateString.split("-");
    setCurrentYear(Number(year));
    setCurrentMonth(Number(month) - 1);
    setSelectedDate(dateString);
    setActiveTab("record");
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle();
      setCloudStatus("Google 로그인에 성공했어요");
    } catch (error) {
      setCloudStatus("Google 로그인에 실패했어요");
      console.error(error);
    }
  }

  async function handleSignOut() {
    const ok = confirm("로그아웃할까요? 이 브라우저에는 로컬 기록이 남아 있어요.");

    if (!ok) return;

    try {
      await signOutFromFirebase();
      setFamilyId("");
      setFamilyKey("");
      setCloudStatus("로그아웃했어요. 로컬 저장 모드입니다.");
    } catch (error) {
      setCloudStatus("로그아웃 중 문제가 있었어요.");
      console.error(error);
    }
  }

  async function handleCreateFamily() {
    if (!authUser?.email) {
      setStatus("먼저 Google로 로그인해 주세요.");
      return;
    }

    if (!currentUser) {
      setStatus("먼저 사용자를 만들어 주세요.");
      return;
    }

    try {
      const nextFamilyKey = createFamilySecret();
      const nextFamilyId = await createFamilyRoom({
        emotionUsers: users,
        currentEmotionUser: currentUser.name,
        emotionRecordsByUser: records,
      }, nextFamilyKey);
      setFamilyId(nextFamilyId);
      setFamilyKey(nextFamilyKey);
      setCloudStatus(`가족방을 만들었어요. 초대 코드: ${nextFamilyId}`);
      setActiveTab("settings");
    } catch (error) {
      setCloudStatus(`가족방 만들기 실패: ${getFriendlyErrorMessage(error)}`);
      console.error(error);
    }
  }

  async function handleJoinFamily(inviteCode, inviteKey) {
    if (!authUser?.email) {
      setStatus("먼저 Google로 로그인해 주세요.");
      return;
    }

    try {
      const nextFamilyId = await joinFamilyRoom(inviteCode);
      setFamilyId(nextFamilyId);
      setFamilyKey(inviteKey || localStorage.getItem(getFamilyKeyStorageKey(nextFamilyId)) || "");
      setCloudStatus("가족방에 참여했어요. 가족 기록을 불러올게요.");
      setActiveTab("settings");
    } catch (error) {
      setCloudStatus(`가족방 참여 실패: ${getFriendlyErrorMessage(error)}`);
      console.error(error);
    }
  }

  function handleLeaveFamily() {
    const ok = confirm("이 브라우저에서 가족방 연결을 해제할까요? 가족방 데이터는 삭제되지 않아요.");

    if (!ok) return;

    setFamilyId("");
    setFamilyKey("");
    setCloudStatus("가족방 연결을 해제했어요. 개인 클라우드 저장으로 전환합니다.");
  }

  async function copyFamilyShareLink() {
    if (!familyId || !familyKey) {
      setCloudStatus("공유 링크를 만들 암호키가 없어요.");
      return;
    }

    const shareLink = getFamilyShareLink(familyId, familyKey);

    try {
      await navigator.clipboard.writeText(shareLink);
      setCloudStatus("가족방 초대 링크를 복사했어요.");
    } catch (error) {
      prompt("가족에게 이 링크를 보내주세요.", shareLink);
      console.error(error);
    }
  }

  function exportBackup() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      emotionUsers: users,
      currentEmotionUser: currentUser?.name || "",
      emotionRecordsByUser: records,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `emotion-calendar-backup-${formatDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("백업 파일을 만들었어요.");
  }

  function importBackup(event) {
    const file = event.target.files[0];
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

        const nextUsers = normalizeUsers(backup.emotionUsers);
        setUsers(nextUsers);
        setCurrentUser(nextUsers.find((user) => user.name === backup.currentEmotionUser) || nextUsers[0]);
        setRecords(backup.emotionRecordsByUser || {});
        setStatus("백업을 가져왔어요.");
      } catch {
        alert("백업 파일을 읽지 못했어요.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  }

  return (
    <main className="app">
      <section className="hero-card">
        <div className="hero-badge">Mood Calendar</div>
        <h1>마음 캘린더</h1>
        <p className="subtitle">{currentUser ? `${currentUser.avatar} ${currentUser.name}의 오늘 마음을 기록해보세요.` : "새 사용자를 만들고 마음 기록을 시작해보세요."}</p>
        <div className="cloud-status">{cloudStatus}</div>
      </section>

      <UserManager
        users={users}
        currentUser={currentUser}
        onAddUser={addUser}
        onEditCurrentUser={editCurrentUser}
        onSelectUser={selectUser}
        onChangePassword={changePassword}
        onDeleteCurrentUser={deleteCurrentUser}
      />

      {currentUser && (
        <>
          <Calendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            records={records}
            currentUser={currentUser}
            onChangeMonth={changeMonth}
            onSelectDate={selectDate}
          />

          <TabNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </>
      )}

      {currentUser && activeTab === "record" && (
        <div className="tab-panel">
          <HelperBubble selectedEmotions={selectedEmotions} hasRecord={Boolean(currentRecord)} status={status} />
          <SelectedDateCard selectedDate={selectedDate} selectedEmotions={selectedEmotions} hasRecord={Boolean(currentRecord)} />
          <EmotionPicker selectedEmotions={selectedEmotions} onToggleEmotion={toggleEmotion} />
          <RecordEditor
            memo={memo}
            status={status}
            hasRecord={Boolean(currentRecord)}
            photo={photo}
            onMemoChange={setMemo}
            onMemoPromptClick={addMemoPrompt}
            onPhotoChange={changePhoto}
            onPhotoRemove={() => setPhoto("")}
            onSaveRecord={saveRecord}
            onDeleteRecord={deleteRecord}
          />
        </div>
      )}

      {currentUser && activeTab === "report" && <StatsPanel monthStats={monthStats} weeklyReport={weeklyReport} />}

      {currentUser && activeTab === "search" && (
        <SearchBox
          searchText={searchText}
          searchResults={searchResults}
          onSearchTextChange={setSearchText}
          onMoveToRecordDate={moveToRecordDate}
        />
      )}

      {currentUser && activeTab === "settings" && (
        <div className="tab-panel">
          <AccountBox
            authUser={authUser}
            familyId={familyId}
            familyKey={familyKey}
            familyShareLink={familyId && familyKey ? getFamilyShareLink(familyId, familyKey) : ""}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onCreateFamily={handleCreateFamily}
            onJoinFamily={handleJoinFamily}
            onLeaveFamily={handleLeaveFamily}
            onCopyFamilyShareLink={copyFamilyShareLink}
          />
          <BackupBox onExportBackup={exportBackup} onImportBackup={importBackup} />
        </div>
      )}
    </main>
  );
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

function getSaveStatusMessage(wasEditing) {
  const savedAt = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (wasEditing) {
    return `수정 완료! 오늘 마음 기록을 바꿨어요. ${savedAt}`;
  }

  return `처음 기록했어요! 오늘 마음을 저장했어요. ${savedAt}`;
}

function mergeLocalPhotos(cloudRecords, localRecords) {
  const mergedRecords = { ...cloudRecords };

  Object.entries(localRecords).forEach(([userName, userRecords]) => {
    Object.entries(userRecords || {}).forEach(([date, localRecord]) => {
      if (!localRecord.photo?.startsWith("data:")) return;

      const cloudRecord = mergedRecords[userName]?.[date];

      if (cloudRecord?.photoUrl || cloudRecord?.photo) return;

      mergedRecords[userName] = mergedRecords[userName] || {};
      mergedRecords[userName][date] = {
        ...(cloudRecord || localRecord),
        photo: localRecord.photo,
      };
    });
  });

  return mergedRecords;
}

function getFriendlyErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firebase 보안 규칙에서 가족방 저장을 허용해야 해요.";
  }

  if (/decrypt|암호|key|operation/i.test(error?.message || "")) {
    return "가족방 암호키가 맞지 않거나 없어요. 초대 링크로 다시 들어와 주세요.";
  }

  return error?.message || "잠시 후 다시 시도해 주세요.";
}

function getInitialFamilyAccess() {
  if (typeof window === "undefined") {
    return { familyId: "", familyKey: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const familyId = normalizeFamilyId(params.get("join") || localStorage.getItem("emotionFamilyId") || "");
  const familyKey = hashParams.get("key") || (familyId ? localStorage.getItem(getFamilyKeyStorageKey(familyId)) : "") || "";

  if (familyId && familyKey) {
    localStorage.setItem("emotionFamilyId", familyId);
    localStorage.setItem(getFamilyKeyStorageKey(familyId), familyKey);
  }

  return { familyId, familyKey };
}

function getFamilyShareLink(familyId, familyKey) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("join", familyId);
  return `${url.toString()}#key=${encodeURIComponent(familyKey)}`;
}

function getFamilyKeyStorageKey(familyId) {
  return `emotionFamilyKey:${familyId}`;
}

function normalizeFamilyId(familyId) {
  return String(familyId || "").trim().toUpperCase();
}

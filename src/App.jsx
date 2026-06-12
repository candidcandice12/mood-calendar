import { useEffect, useState } from "react";
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
import { isFirebaseConfigured, missingFirebaseConfigKeys } from "./firebase";
import { deleteCloudRecord, loadCloudState, saveCloudState } from "./services/cloudDataService";
import { deleteRecordPhoto, uploadRecordPhoto } from "./services/photoStorageService";
import { formatDate } from "./utils/date";
import { getSavedCurrentUserName, normalizeUsers, readJson } from "./utils/storage";
import { resizeImage } from "./utils/photo";
import { getMonthStats, getRecordEmotions, getSearchResults, getWeeklyReport } from "./utils/stats";

const today = new Date();

function getInitialCloudStatus() {
  if (isFirebaseConfigured) {
    return "클라우드 연결 준비 중";
  }

  return `로컬 저장 모드: Firebase 환경변수 ${missingFirebaseConfigKeys.length}개가 빠졌어요`;
}

export function App() {
  const initialUsers = normalizeUsers(readJson("emotionUsers", defaultUsers));
  const [users, setUsers] = useState(initialUsers);
  const [currentUser, setCurrentUser] = useState(initialUsers.find((user) => user.name === getSavedCurrentUserName(initialUsers)) || initialUsers[0]);
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
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("record");

  const currentRecord = records[currentUser.name]?.[selectedDate] || null;
  const monthStats = getMonthStats(records, currentUser.name, currentYear, currentMonth);
  const weeklyReport = getWeeklyReport(records, currentUser.name, selectedDate);
  const searchResults = getSearchResults(records, currentUser.name, searchText);

  useEffect(() => {
    try {
      localStorage.setItem("emotionUsers", JSON.stringify(users));
      localStorage.setItem("currentEmotionUser", currentUser.name);
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

    let isMounted = true;

    async function loadState() {
      try {
        const cloudState = await loadCloudState();

        if (!isMounted) return;

        if (cloudState) {
          const cloudUsers = normalizeUsers(cloudState.emotionUsers || defaultUsers);
          const localRecords = readJson("emotionRecordsByUser", {});
          setUsers(cloudUsers);
          setCurrentUser(cloudUsers.find((user) => user.name === cloudState.currentEmotionUser) || cloudUsers[0]);
          setRecords(mergeLocalPhotos(cloudState.emotionRecordsByUser || {}, localRecords));
          setCloudStatus("클라우드 기록을 불러왔어요");
        } else {
          setCloudStatus("클라우드에 새 기록을 만들 준비가 됐어요");
        }
      } catch (error) {
        setCloudStatus("클라우드 연결 실패: 로컬에 저장 중");
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
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !isCloudLoaded) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveCloudState({
          emotionUsers: users,
          currentEmotionUser: currentUser.name,
          emotionRecordsByUser: records,
        });
        setCloudStatus("클라우드에 저장됐어요");
      } catch (error) {
        setCloudStatus("클라우드 저장 실패: 로컬에는 저장됐어요");
        console.error(error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [users, currentUser, records, isCloudLoaded]);

  useEffect(() => {
    const record = records[currentUser.name]?.[selectedDate];

    if (record) {
      setSelectedEmotions(getRecordEmotions(record));
      setMemo(record.memo || "");
      setPhoto(record.photo || record.photoUrl || "");
    } else {
      setSelectedEmotions([]);
      setMemo("");
      setPhoto("");
    }

    setStatus("");
  }, [records, currentUser.name, selectedDate]);

  function addUser(newUser) {
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    setRecords((prevRecords) => ({ ...prevRecords, [newUser.name]: prevRecords[newUser.name] || {} }));
    setStatus(`${newUser.name} 사용자를 추가했어요.`);
  }

  function selectUser(user) {
    if (user.name !== currentUser.name) {
      const password = prompt(`${user.name} 비밀번호를 입력해 주세요.`);

      if (password !== user.password) {
        alert("비밀번호가 틀렸어요.");
        return;
      }
    }

    setCurrentUser(user);
  }

  function changePassword() {
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
    setCurrentUser(nextUsers[0]);
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
    if (selectedEmotions.length === 0) {
      setStatus("감정을 1개 이상 선택해 주세요.");
      return;
    }

    let nextPhoto = photo;
    let nextPhotoUrl = currentRecord?.photoUrl || "";
    let nextPhotoPath = currentRecord?.photoPath || "";
    let photoStatusMessage = "";

    try {
      if (isFirebaseConfigured && photo?.startsWith("data:")) {
        if (currentRecord?.photoPath) {
          await deleteRecordPhoto(currentRecord.photoPath);
        }

        const uploadedPhoto = await uploadRecordPhoto(currentUser.name, selectedDate, photo);
        nextPhoto = "";
        nextPhotoUrl = uploadedPhoto?.photoUrl || "";
        nextPhotoPath = uploadedPhoto?.photoPath || "";
      }

      if (isFirebaseConfigured && !photo && currentRecord?.photoPath) {
        await deleteRecordPhoto(currentRecord.photoPath);
        nextPhotoUrl = "";
        nextPhotoPath = "";
      }
    } catch (error) {
      nextPhoto = photo;
      nextPhotoUrl = currentRecord?.photoUrl || "";
      nextPhotoPath = currentRecord?.photoPath || "";
      photoStatusMessage = " 사진은 이 브라우저에만 저장했어요.";
      console.error(error);
    }

    setRecords((prevRecords) => ({
      ...prevRecords,
      [currentUser.name]: {
        ...(prevRecords[currentUser.name] || {}),
        [selectedDate]: {
          emotions: selectedEmotions,
          memo: memo.trim(),
          photo: nextPhotoUrl ? "" : nextPhoto,
          photoUrl: nextPhotoUrl,
          photoPath: nextPhotoPath,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    setPhoto(nextPhotoUrl || nextPhoto);
    setStatus(`참 잘했어요! 오늘 마음 기록을 저장했어요.${photoStatusMessage}`);
    alert("저장되었습니다.");
  }

  async function deleteRecord() {
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

      await deleteCloudRecord(currentUser.name, selectedDate);
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

  function exportBackup() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      emotionUsers: users,
      currentEmotionUser: currentUser.name,
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
        <p className="subtitle">{currentUser.avatar} {currentUser.name}의 오늘 마음을 기록해보세요.</p>
        <div className="cloud-status">{cloudStatus}</div>
      </section>

      <UserManager
        users={users}
        currentUser={currentUser}
        onAddUser={addUser}
        onSelectUser={selectUser}
        onChangePassword={changePassword}
        onDeleteCurrentUser={deleteCurrentUser}
      />

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

      {activeTab === "record" && (
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

      {activeTab === "report" && <StatsPanel monthStats={monthStats} weeklyReport={weeklyReport} />}

      {activeTab === "search" && (
        <SearchBox
          searchText={searchText}
          searchResults={searchResults}
          onSearchTextChange={setSearchText}
          onMoveToRecordDate={moveToRecordDate}
        />
      )}

      {activeTab === "settings" && <BackupBox onExportBackup={exportBackup} onImportBackup={importBackup} />}
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

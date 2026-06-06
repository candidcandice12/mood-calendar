import { getWeekDateStrings } from "./date";

export function getRecordEmotions(record) {
  if (!record) return [];
  if (Array.isArray(record.emotions)) return record.emotions;
  if (record.emotion) return [record.emotion];
  return [];
}

export function getMonthStats(records, userName, currentYear, currentMonth) {
  const userRecords = records[userName] || {};
  const stats = {};
  let recordedDays = 0;
  let memoDays = 0;
  let emotionTotal = 0;

  Object.keys(userRecords).forEach((date) => {
    const [year, month] = date.split("-");

    if (Number(year) !== currentYear || Number(month) !== currentMonth + 1) return;

    recordedDays += 1;

    if (userRecords[date].memo && userRecords[date].memo.trim()) {
      memoDays += 1;
    }

    getRecordEmotions(userRecords[date]).forEach((emotion) => {
      emotionTotal += 1;

      if (!stats[emotion.name]) {
        stats[emotion.name] = { emoji: emotion.emoji, color: emotion.color, count: 0 };
      }

      stats[emotion.name].count += 1;
    });
  });

  const statList = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  const topEmotionText = statList[0] ? `${statList[0][1].emoji} ${statList[0][0]}` : "아직 없음";
  const report = buildMonthlyReport(recordedDays, memoDays, statList);

  return { recordedDays, memoDays, emotionTotal, statList, topEmotionText, report };
}

export function getWeeklyReport(records, userName, selectedDate) {
  const userRecords = records[userName] || {};
  const weekDates = getWeekDateStrings(new Date(selectedDate));
  const stats = {};
  let recordedDays = 0;
  let memoDays = 0;

  weekDates.forEach((date) => {
    const record = userRecords[date];

    if (!record) return;

    recordedDays += 1;

    if (record.memo && record.memo.trim()) {
      memoDays += 1;
    }

    getRecordEmotions(record).forEach((emotion) => {
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
    return `${startDate}~${endDate} 주간에는 아직 기록이 없어요.`;
  }

  return `${startDate}~${endDate} 주간에는 ${recordedDays}일 기록했어요. 가장 많이 나온 마음은 ${topEmotion}이고, 메모는 ${memoDays}일 남겼어요.`;
}

export function getSearchResults(records, userName, searchText) {
  const keyword = searchText.trim().toLowerCase();

  if (!keyword) return [];

  return Object.entries(records[userName] || {})
    .filter(([, record]) => {
      const emotionText = getRecordEmotions(record).map((emotion) => emotion.name).join(" ").toLowerCase();
      const memoText = (record.memo || "").toLowerCase();
      return emotionText.includes(keyword) || memoText.includes(keyword);
    })
    .sort((a, b) => b[0].localeCompare(a[0]));
}

function buildMonthlyReport(recordedDays, memoDays, statList) {
  if (recordedDays === 0) {
    return "이번 달 기록이 아직 없어요. 오늘 마음부터 하나 남겨볼까요?";
  }

  const topEmotion = statList[0] ? `${statList[0][1].emoji} ${statList[0][0]}` : "마음";
  const memoText = memoDays > 0 ? `메모도 ${memoDays}일 남겼어요.` : "메모를 함께 남기면 나중에 마음을 더 잘 떠올릴 수 있어요.";
  return `이번 달에는 ${recordedDays}일 기록했고, 가장 자주 나온 마음은 ${topEmotion}예요. ${memoText}`;
}

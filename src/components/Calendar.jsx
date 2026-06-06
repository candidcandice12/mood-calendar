import { formatDate, hexToRgba } from "../utils/date";
import { getRecordEmotions } from "../utils/stats";

const today = new Date();

export function Calendar({ currentYear, currentMonth, selectedDate, records, currentUser, onChangeMonth, onSelectDate }) {
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstDay; i += 1) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = formatDate(date);
    const record = records[currentUser.name]?.[dateString];
    const savedEmotions = getRecordEmotions(record);
    const mainEmotion = savedEmotions[0];
    const extraEmotionCount = Math.max(savedEmotions.length - 1, 0);
    const hasMemo = Boolean(record && record.memo && record.memo.trim());
    const hasPhoto = Boolean(record && (record.photo || record.photoUrl));

    days.push(
      <button
        className={`day ${dateString === formatDate(today) ? "today" : ""} ${dateString === selectedDate ? "selected" : ""}`}
        key={dateString}
        style={mainEmotion?.color ? { background: hexToRgba(mainEmotion.color, 0.36) } : undefined}
        type="button"
        onClick={() => onSelectDate(dateString)}
      >
        <div>{day}</div>
        <div className="record-emoji">
          {mainEmotion?.emoji || ""}
          {extraEmotionCount > 0 && <span className="more-emotions">+{extraEmotionCount}</span>}
          {hasMemo && <span className="memo-mark">📝</span>}
          {hasPhoto && <span className="memo-mark">📷</span>}
        </div>
      </button>
    );
  }

  return (
    <section className="calendar-panel" aria-label="달력">
      <div className="calendar-header">
        <button type="button" onClick={() => onChangeMonth(-1)}>이전</button>
        <h2>{currentYear}년 {currentMonth + 1}월</h2>
        <button type="button" onClick={() => onChangeMonth(1)}>다음</button>
      </div>
      <div className="weekdays" aria-hidden="true">
        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
      </div>
      <div className="days">{days}</div>
    </section>
  );
}

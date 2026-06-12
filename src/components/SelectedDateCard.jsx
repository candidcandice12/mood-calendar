export function SelectedDateCard({ selectedDate, selectedEmotions, hasRecord }) {
  return (
    <section className="section selected-date-box" aria-label="선택한 날짜 기록 상태">
      <div className="selected-date-label">선택한 날짜</div>
      <div className="selected-date">{selectedDate}</div>
      <div className="record-mode">{hasRecord ? "저장된 기록을 수정하는 중이에요." : "아직 기록이 없어요. 새 기록을 남겨보세요."}</div>
      <div className="today-emotion-preview">{selectedEmotions.map((emotion) => emotion.emoji).join(" ")}</div>
      <div className="selected-emotion-names">{selectedEmotions.map((emotion) => emotion.name).join(" · ")}</div>
    </section>
  );
}

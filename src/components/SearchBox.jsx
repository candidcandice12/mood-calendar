import { getRecordEmotions } from "../utils/stats";

export function SearchBox({ searchText, searchResults, onSearchTextChange, onMoveToRecordDate }) {
  return (
    <section className="section search-box" aria-label="기록 검색">
      <h2>기록 검색</h2>
      <p className="hint">감정 이름이나 메모 내용으로 지난 기록을 찾아볼 수 있어요.</p>
      <input
        className="search-input"
        type="search"
        value={searchText}
        placeholder="예: 행복해, 친구, 피곤"
        onChange={(event) => onSearchTextChange(event.target.value)}
      />
      <div className="search-results">
        {!searchText.trim() && <div className="hint">검색어를 입력하면 기록이 보여요.</div>}
        {searchText.trim() && searchResults.length === 0 && <div className="hint">찾은 기록이 없어요.</div>}
        {searchResults.map(([date, record]) => (
          <button className="search-result" key={date} type="button" onClick={() => onMoveToRecordDate(date)}>
            <div className="search-result-date">{date} {getRecordEmotions(record).map((emotion) => emotion.emoji).join(" ")}</div>
            <div className="search-result-memo">{record.memo || "메모 없음"}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

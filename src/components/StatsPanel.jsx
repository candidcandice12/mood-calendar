export function StatsPanel({ monthStats, weeklyReport }) {
  return (
    <>
      <section className="section stats-box" aria-label="이번 달 마음 통계">
        <h2>이번 달 마음 통계</h2>
        <div className="monthly-summary">
          <SummaryCard label="기록한 날" value={`${monthStats.recordedDays}일`} />
          <SummaryCard label="가장 많은 마음" value={monthStats.topEmotionText} />
          <SummaryCard label="고른 마음" value={`${monthStats.emotionTotal}개`} />
          <SummaryCard label="메모 쓴 날" value={`${monthStats.memoDays}일`} />
        </div>
        <div className="report-text">{monthStats.report}</div>
        {monthStats.statList.length === 0 ? (
          <div className="hint">이번 달에는 아직 기록이 없어요.</div>
        ) : (
          monthStats.statList.map(([name, data]) => {
            const percent = (data.count / monthStats.statList[0][1].count) * 100;
            return (
              <div className="stat-item" key={name}>
                <div className="stat-top">
                  <div>{data.emoji} {name}</div>
                  <div className="stat-count">{data.count}번</div>
                </div>
                <div className="bar-bg"><div className="bar-fill" style={{ width: `${percent}%`, background: data.color || "#ffb3c6" }} /></div>
              </div>
            );
          })
        )}
      </section>

      <section className="section report-box" aria-label="이번 주 마음 리포트">
        <h2>이번 주 마음 리포트</h2>
        <div className="report-text">{weeklyReport}</div>
      </section>
    </>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  );
}

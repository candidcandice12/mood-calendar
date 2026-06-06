const tabs = [
  { id: "record", label: "기록하기" },
  { id: "report", label: "리포트" },
  { id: "search", label: "검색" },
  { id: "settings", label: "설정" },
];

export function TabNav({ activeTab, onChangeTab }) {
  return (
    <nav className="tab-nav" aria-label="앱 메뉴">
      {tabs.map((tab) => (
        <button
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          key={tab.id}
          type="button"
          onClick={() => onChangeTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

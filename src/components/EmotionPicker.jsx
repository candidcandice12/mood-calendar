import { emotions } from "../data/emotions";

export function EmotionPicker({ selectedEmotions, onToggleEmotion }) {
  return (
    <section className="section" aria-label="감정 선택">
      <div className="section-heading-row">
        <h2>오늘 마음은 어때?</h2>
        <span className="selection-count">{selectedEmotions.length}/3 선택</span>
      </div>
      <p className="hint">감정 카드를 누르면 선택되고, 한 번 더 누르면 취소돼요.</p>
      <div className="emotion-cards">
        {emotions.map((emotion) => (
          <button
            className={`emotion ${selectedEmotions.some((item) => item.name === emotion.name) ? "active" : ""}`}
            key={emotion.name}
            style={{ background: emotion.color }}
            type="button"
            onClick={() => onToggleEmotion(emotion)}
          >
            <span>{emotion.emoji}</span>
            {emotion.name}
          </button>
        ))}
      </div>
    </section>
  );
}

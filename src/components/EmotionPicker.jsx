import { useState } from "react";
import { emotionCategories, emotions } from "../data/emotions";

export function EmotionPicker({ selectedEmotions, onToggleEmotion }) {
  const [activeCategoryId, setActiveCategoryId] = useState(emotionCategories[0].id);
  const activeCategory = emotionCategories.find((category) => category.id === activeCategoryId) || emotionCategories[0];
  const visibleEmotions = emotions.filter((emotion) => emotion.categoryId === activeCategory.id);

  return (
    <section className="section" aria-label="감정 선택">
      <div className="section-heading-row">
        <h2>오늘 마음은 어떤 가족일까?</h2>
        <span className="selection-count">{selectedEmotions.length}/3 선택</span>
      </div>
      <p className="hint">먼저 감정 가족을 고르고, 가장 가까운 마음을 눌러주세요. 하루에 3개까지 고를 수 있어요.</p>
      <div className="emotion-category-tabs" role="tablist" aria-label="감정 카테고리">
        {emotionCategories.map((category) => (
          <button
            className={`emotion-category-tab ${activeCategory.id === category.id ? "active" : ""}`}
            key={category.id}
            style={{ "--category-color": category.color }}
            type="button"
            role="tab"
            aria-selected={activeCategory.id === category.id}
            onClick={() => setActiveCategoryId(category.id)}
          >
            <span>{category.emoji}</span>
            <strong>{category.name}</strong>
            <small>{category.englishName}</small>
          </button>
        ))}
      </div>
      <div className="active-category-card" style={{ "--category-color": activeCategory.color }}>
        <span>{activeCategory.emoji}</span>
        <div>
          <strong>{activeCategory.name}</strong>
          <small>{activeCategory.englishName}</small>
        </div>
      </div>
      <div className="emotion-cards">
        {visibleEmotions.map((emotion) => (
          <button
            className={`emotion ${selectedEmotions.some((item) => item.name === emotion.name) ? "active" : ""}`}
            key={emotion.name}
            style={{ background: emotion.color }}
            type="button"
            onClick={() => onToggleEmotion(emotion)}
          >
            <span>{emotion.emoji}</span>
            <strong>{emotion.name}</strong>
            <small>{emotion.englishName}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

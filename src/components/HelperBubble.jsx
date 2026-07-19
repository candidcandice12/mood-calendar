export function HelperBubble({ selectedEmotions, hasRecord, status }) {
  const helperMessage = getHelperMessage(selectedEmotions, hasRecord, status);

  return (
    <section className="helper-bubble" aria-label="캐릭터 도우미">
      <div className="helper-character">
        <img src="/favicon.png" alt="무디" />
      </div>
      <div className="helper-message">{helperMessage}</div>
    </section>
  );
}

function getHelperMessage(selectedEmotions, hasRecord, status) {
  if (status.includes("참 잘했어요") || status.includes("저장")) {
    return "참 잘했어요! 오늘 마음을 살펴본 멋진 하루예요.";
  }

  if (selectedEmotions.length > 0) {
    return `${selectedEmotions.map((emotion) => emotion.emoji).join(" ")} 이런 마음이 들었구나. 왜 그런 마음이 들었는지 이야기해볼래?`;
  }

  if (hasRecord) {
    return "저장된 기록을 다시 보고 있어요. 바꾸고 싶은 마음이나 이야기가 있으면 고쳐도 좋아요.";
  }

  return "오늘 마음은 어땠어? 마음 카드를 고르고 이야기를 조금 적어보자!";
}

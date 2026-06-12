const memoPrompts = [
  "오늘 좋았던 일은 ",
  "오늘 속상했던 일은 ",
  "친구랑 있었던 일은 ",
  "내일 하고 싶은 일은 ",
];

export function RecordEditor({ memo, status, hasRecord, photo, onMemoChange, onMemoPromptClick, onPhotoChange, onPhotoRemove, onSaveRecord, onDeleteRecord }) {
  return (
    <section className="section" aria-label="오늘 이야기 작성">
      <h2>오늘 이야기</h2>
      <div className="memo-prompts" aria-label="메모 예시">
        {memoPrompts.map((prompt) => (
          <button className="memo-prompt" key={prompt} type="button" onClick={() => onMemoPromptClick(prompt)}>
            {prompt.trim()}
          </button>
        ))}
      </div>
      <textarea
        value={memo}
        placeholder="예: 오늘 친구랑 놀아서 신났어요. 잠을 못 자서 조금 피곤했어요."
        onChange={(event) => onMemoChange(event.target.value)}
      />

      <div className="photo-box">
        <div className="section-heading-row photo-heading">
          <h3>오늘 사진</h3>
          {photo && <button className="small-soft-btn" type="button" onClick={onPhotoRemove}>사진 지우기</button>}
        </div>
        {photo ? (
          <img className="photo-preview" src={photo} alt="오늘 기록에 추가한 사진" />
        ) : (
          <div className="photo-empty">사진을 추가하면 이 날의 기억을 더 쉽게 떠올릴 수 있어요.</div>
        )}
        <label className="photo-upload-btn">
          사진 선택하기
          <input type="file" accept="image/*" hidden onChange={(event) => onPhotoChange(event.target.files[0])} />
        </label>
      </div>

      <button className="save-btn" type="button" onClick={onSaveRecord}>{hasRecord ? "수정해서 저장하기" : "저장하기"}</button>
      <button className="delete-btn" disabled={!hasRecord} type="button" onClick={onDeleteRecord}>기록 삭제</button>
      <p className="status-message" role="status">{status}</p>
    </section>
  );
}

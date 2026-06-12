export function BackupBox({ onExportBackup, onImportBackup }) {
  return (
    <section className="section backup-box" aria-label="백업과 복원">
      <h2>백업과 복원</h2>
      <p className="hint">브라우저를 바꾸면 기록이 사라질 수 있어요. 가끔 백업 파일을 저장해두면 안전해요.</p>
      <div className="button-row">
        <button className="soft-btn" type="button" onClick={onExportBackup}>백업 내보내기</button>
        <label className="soft-btn file-label">
          백업 가져오기
          <input type="file" accept="application/json" hidden onChange={onImportBackup} />
        </label>
      </div>
    </section>
  );
}

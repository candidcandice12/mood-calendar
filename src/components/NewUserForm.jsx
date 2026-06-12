import { useState } from "react";
import { avatarOptions } from "../data/emotions";

export function NewUserForm({ users, onCreateUser, onCancel }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function submitForm(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (users.some((user) => user.name === trimmedName)) {
      setError("이미 있는 이름이에요.");
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      setError("비밀번호는 숫자 4자리여야 해요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 서로 달라요.");
      return;
    }

    onCreateUser({ name: trimmedName, avatar, password });
  }

  return (
    <form className="new-user-form" onSubmit={submitForm}>
      <div className="section-heading-row">
        <h3>새 사용자 만들기</h3>
        <button className="small-soft-btn" type="button" onClick={onCancel}>취소</button>
      </div>

      <label className="form-field">
        <span>이름</span>
        <input value={name} placeholder="예: 하린" onChange={(event) => setName(event.target.value)} />
      </label>

      <div className="form-field">
        <span>아바타 고르기</span>
        <div className="avatar-grid">
          {avatarOptions.map((option) => (
            <button
              className={`avatar-option ${avatar === option ? "selected" : ""}`}
              key={option}
              type="button"
              onClick={() => setAvatar(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <label className="form-field">
        <span>비밀번호 4자리</span>
        <input inputMode="numeric" maxLength="4" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>

      <label className="form-field">
        <span>비밀번호 확인</span>
        <input inputMode="numeric" maxLength="4" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}
      <button className="save-btn" type="submit">만들기</button>
    </form>
  );
}

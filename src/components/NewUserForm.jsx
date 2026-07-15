import { useState } from "react";
import { avatarOptions } from "../data/emotions";

export function NewUserForm({ users, initialUser = null, onCreateUser, onCancel }) {
  const [name, setName] = useState(initialUser?.name || "");
  const [avatar, setAvatar] = useState(initialUser?.avatar || avatarOptions[0]);
  const [profileType, setProfileType] = useState(initialUser?.profileType || "child");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const isEditing = Boolean(initialUser);

  function submitForm(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (users.some((user) => user.name === trimmedName && user.name !== initialUser?.name)) {
      setError("이미 있는 이름이에요.");
      return;
    }

    if (!isEditing && !/^\d{4}$/.test(password)) {
      setError("비밀번호는 숫자 4자리여야 해요.");
      return;
    }

    if (!isEditing && password !== confirmPassword) {
      setError("비밀번호가 서로 달라요.");
      return;
    }

    onCreateUser({ name: trimmedName, avatar, profileType, password: initialUser?.password || password });
  }

  return (
    <form className="new-user-form" onSubmit={submitForm}>
      <div className="section-heading-row">
        <h3>{isEditing ? "사용자 꾸미기" : "새 사용자 만들기"}</h3>
        {onCancel && <button className="small-soft-btn" type="button" onClick={onCancel}>취소</button>}
      </div>

      <label className="form-field">
        <span>이름</span>
        <input value={name} placeholder="예: 하린" onChange={(event) => setName(event.target.value)} />
      </label>

      <div className="form-field">
        <span>감정 리스트 고르기</span>
        <div className="profile-type-options">
          <button
            className={`profile-type-option ${profileType === "child" ? "selected" : ""}`}
            type="button"
            onClick={() => setProfileType("child")}
          >
            <strong>유아</strong>
            <small>쉬운 말과 몸 느낌 포함</small>
          </button>
          <button
            className={`profile-type-option ${profileType === "adult" ? "selected" : ""}`}
            type="button"
            onClick={() => setProfileType("adult")}
          >
            <strong>성인</strong>
            <small>현재 감정 리스트 사용</small>
          </button>
        </div>
      </div>

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

      {!isEditing && (
        <>
          <label className="form-field">
            <span>비밀번호 4자리</span>
            <input inputMode="numeric" maxLength="4" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          <label className="form-field">
            <span>비밀번호 확인</span>
            <input inputMode="numeric" maxLength="4" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      <button className="save-btn" type="submit">{isEditing ? "저장하기" : "만들기"}</button>
    </form>
  );
}

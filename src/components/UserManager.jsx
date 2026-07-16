import { useEffect, useState } from "react";
import { NewUserForm } from "./NewUserForm";

export function UserManager({ users, currentUser, onAddUser, onEditCurrentUser, onSelectUser, onChangePassword, onDeleteCurrentUser }) {
  const [isAddingUser, setIsAddingUser] = useState(users.length === 0);
  const [isEditingUser, setIsEditingUser] = useState(false);

  function createUser(user) {
    onAddUser(user);
    setIsAddingUser(false);
  }

  function editUser(user) {
    onEditCurrentUser(user);
    setIsEditingUser(false);
  }

  useEffect(() => {
    if (users.length === 0) {
      setIsAddingUser(true);
    }
  }, [users.length]);

  return (
    <section className="user-section" aria-label="사용자 관리">
      <div className="section-heading-row">
        <h2 className="user-title">사용자 선택</h2>
        {currentUser ? <span className="current-user-pill">{currentUser.avatar} {currentUser.name} · {getProfileTypeLabel(currentUser.profileType)}</span> : <span className="current-user-pill">새 사용자 필요</span>}
      </div>
      {users.length === 0 && <p className="hint">처음 오셨네요. 먼저 사용할 이름과 이모지를 만들어 주세요.</p>}
      {users.length > 0 && (
        <div className="user-list">
          {users.map((user) => (
            <button
              className={`user-btn ${user.name === currentUser?.name ? "active" : ""}`}
              key={user.name}
              type="button"
              onClick={() => onSelectUser(user)}
            >
              {user.avatar} {user.name}
              <small>{getProfileTypeLabel(user.profileType)}</small>
            </button>
          ))}
          <button className="user-btn add-user-btn" type="button" onClick={() => setIsAddingUser(true)}>➕ 추가</button>
        </div>
      )}
      {isAddingUser && <NewUserForm users={users} onCreateUser={createUser} onCancel={users.length === 0 ? null : () => setIsAddingUser(false)} />}
      {isEditingUser && currentUser && <NewUserForm users={users} initialUser={currentUser} onCreateUser={editUser} onCancel={() => setIsEditingUser(false)} />}
      {currentUser && (
        <div className="button-row">
          <button className="soft-btn" type="button" onClick={() => setIsEditingUser(true)}>프로필/감정 리스트 변경</button>
          <button className="soft-btn" type="button" onClick={onChangePassword}>비밀번호 변경</button>
          <button className="soft-btn danger-light" type="button" onClick={onDeleteCurrentUser}>사용자 삭제</button>
        </div>
      )}
    </section>
  );
}

function getProfileTypeLabel(profileType) {
  return profileType === "child" ? "유아" : "성인";
}

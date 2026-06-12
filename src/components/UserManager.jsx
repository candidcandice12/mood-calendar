import { useState } from "react";
import { NewUserForm } from "./NewUserForm";

export function UserManager({ users, currentUser, onAddUser, onSelectUser, onChangePassword, onDeleteCurrentUser }) {
  const [isAddingUser, setIsAddingUser] = useState(false);

  function createUser(user) {
    onAddUser(user);
    setIsAddingUser(false);
  }

  return (
    <section className="user-section" aria-label="사용자 관리">
      <div className="section-heading-row">
        <h2 className="user-title">사용자 선택</h2>
        <span className="current-user-pill">{currentUser.avatar} {currentUser.name}</span>
      </div>
      <div className="user-list">
        {users.map((user) => (
          <button
            className={`user-btn ${user.name === currentUser.name ? "active" : ""}`}
            key={user.name}
            type="button"
            onClick={() => onSelectUser(user)}
          >
            {user.avatar} {user.name}
          </button>
        ))}
        <button className="user-btn add-user-btn" type="button" onClick={() => setIsAddingUser(true)}>➕ 추가</button>
      </div>
      {isAddingUser && <NewUserForm users={users} onCreateUser={createUser} onCancel={() => setIsAddingUser(false)} />}
      <div className="button-row">
        <button className="soft-btn" type="button" onClick={onChangePassword}>비밀번호 변경</button>
        <button className="soft-btn danger-light" type="button" onClick={onDeleteCurrentUser}>사용자 삭제</button>
      </div>
    </section>
  );
}

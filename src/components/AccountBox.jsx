import { useState } from "react";

export function AccountBox({ authUser, familyId, onGoogleSignIn, onSignOut, onCreateFamily, onJoinFamily, onLeaveFamily }) {
  const [inviteCode, setInviteCode] = useState("");
  const isBlockedBrowser = isGoogleBlockedBrowser();
  const externalBrowserUrl = getExternalBrowserUrl();

  function submitInvite(event) {
    event.preventDefault();
    onJoinFamily(inviteCode);
  }

  return (
    <section className="section account-box" aria-label="계정과 가족방">
      <h2>계정과 가족방</h2>
      <p className="hint">Google 로그인 후 가족방을 만들면 초대 코드로 가족이 같은 기록을 함께 볼 수 있어요.</p>

      <div className="account-card">
        {authUser?.email ? (
          <>
            <div className="account-label">Google 로그인됨</div>
            <strong>{authUser.email}</strong>
            <button className="small-soft-btn" type="button" onClick={onSignOut}>로그아웃</button>
          </>
        ) : (
          <>
            <div className="account-label">로그인 전</div>
            {isBlockedBrowser ? (
              <div className="browser-warning">
                <strong>앱 안 브라우저에서는 Google 로그인이 막힐 수 있어요.</strong>
                <p>카카오톡, 인스타그램 같은 앱 안에서 열었다면 Chrome 또는 Safari로 다시 열어 주세요.</p>
                {externalBrowserUrl && <a className="soft-link-btn" href={externalBrowserUrl}>Chrome으로 열기</a>}
                <p className="mini-guide">iPhone은 오른쪽 위 메뉴에서 “Safari로 열기”를 눌러 주세요.</p>
              </div>
            ) : (
              <button className="soft-btn" type="button" onClick={onGoogleSignIn}>Google로 로그인</button>
            )}
          </>
        )}
      </div>

      {authUser?.email && (
        <div className="family-card">
          {familyId ? (
            <>
              <div className="account-label">우리 가족방 초대 코드</div>
              <div className="invite-code">{familyId}</div>
              <p className="hint">가족에게 이 코드를 알려주세요. 같은 코드로 들어오면 기록을 함께 사용해요.</p>
              <button className="small-soft-btn" type="button" onClick={onLeaveFamily}>가족방 나가기</button>
            </>
          ) : (
            <>
              <button className="soft-btn" type="button" onClick={onCreateFamily}>새 가족방 만들기</button>
              <form className="invite-form" onSubmit={submitInvite}>
                <label className="form-field">
                  <span>초대 코드로 참여</span>
                  <input
                    type="text"
                    value={inviteCode}
                    placeholder="예: FAM-ABC123"
                    onChange={(event) => setInviteCode(event.target.value)}
                  />
                </label>
                <button className="soft-btn" type="submit">가족방 참여하기</button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function isGoogleBlockedBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|DaumApps/i.test(navigator.userAgent);
}

function getExternalBrowserUrl() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "";
  }

  if (/Android/i.test(navigator.userAgent)) {
    const url = window.location.href.replace(/^https?:\/\//, "");
    return `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  return "";
}

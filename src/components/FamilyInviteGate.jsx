export function FamilyInviteGate({ familyId, isAuthReady, isCloudLoaded, authUser, cloudStatus, onGoogleSignIn }) {
  const isBlockedBrowser = isGoogleBlockedBrowser();
  const externalBrowserUrl = getExternalBrowserUrl();

  if (!isAuthReady) {
    return <InviteCard familyId={familyId} title="로그인 상태를 확인하고 있어요" message="잠시만 기다려 주세요." />;
  }

  if (authUser && !isCloudLoaded) {
    return <InviteCard familyId={familyId} title="가족방 기록을 불러오고 있어요" message="암호화된 가족 기록을 안전하게 여는 중이에요." />;
  }

  if (authUser) return null;

  return (
    <section className="family-invite-gate">
      <div className="family-invite-icon">💌</div>
      <div className="hero-badge">Family Invitation</div>
      <h1>마음 캘린더 가족방 초대</h1>
      <p><strong>{familyId}</strong> 가족방을 이용하려면 먼저 Google로 로그인해 주세요.</p>

      {isBlockedBrowser ? (
        <div className="browser-warning">
          <strong>앱 안 브라우저에서는 Google 로그인이 막힐 수 있어요.</strong>
          <p>카카오톡, 인스타그램 같은 앱 안에서 열었다면 Chrome 또는 Safari로 다시 열어 주세요.</p>
          {externalBrowserUrl && <a className="soft-link-btn" href={externalBrowserUrl}>Chrome으로 열기</a>}
          <p className="mini-guide">iPhone은 오른쪽 위 메뉴에서 “Safari로 열기”를 눌러 주세요.</p>
        </div>
      ) : (
        <button className="soft-btn family-invite-login" type="button" onClick={onGoogleSignIn}>Google로 로그인하고 참여하기</button>
      )}

      <div className="cloud-status">{cloudStatus}</div>
      <p className="mini-guide">로그인 후 가족 프로필과 기록을 자동으로 불러옵니다.</p>
    </section>
  );
}

function InviteCard({ familyId, title, message }) {
  return (
    <section className="family-invite-gate" aria-live="polite">
      <div className="family-invite-icon">💌</div>
      <div className="hero-badge">{familyId}</div>
      <h1>{title}</h1>
      <p>{message}</p>
      <div className="invite-loading" aria-hidden="true" />
    </section>
  );
}

function isGoogleBlockedBrowser() {
  if (typeof navigator === "undefined") return false;
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|DaumApps/i.test(navigator.userAgent);
}

function getExternalBrowserUrl() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "";

  if (/Android/i.test(navigator.userAgent)) {
    const url = window.location.href.replace(/^https?:\/\//, "");
    return `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  return "";
}

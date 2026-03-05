import Head from "next/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — FinanceCalculator</title>
        <link rel="canonical" href="https://financecalculator.cloud/privacy" />
      </Head>
      <div className="post-detail-container">
        <header className="post-detail-header">
          <span className="category-tag">LEGAL</span>
          <h2>Privacy Policy</h2>
        </header>
        <div className="post-content-body" style={{ fontSize: "0.9rem" }}>
          <p>FinanceCalculator(이하 '본 블로그')는 이용자의 개인정보를 보호하며, 구글 애드센스 등 광고 프로그램의 정책을 준수합니다.</p>
          <h3>1. 수집하는 개인정보</h3>
          <p>본 블로그는 댓글 작성 및 문의 시 이름(닉네임), 이메일 주소를 수집할 수 있습니다. 이는 원활한 소통 및 문의 응대를 위함이며, 법적 근거 없이 제3자에게 제공하지 않습니다.</p>
          <h3>2. 쿠키(Cookie) 및 광고</h3>
          <p>구글을 포함한 제3자 제공업체는 사용자의 이전 방문 기록을 바탕으로 광고를 게재하기 위해 쿠키를 사용합니다. 이용자는 구글 광고 설정에서 맞춤 설정된 광고를 해제할 수 있습니다.</p>
          <h3>3. 로그 데이터</h3>
          <p>사이트 방문 시 브라우저가 전송하는 로그 정보를 자동으로 수집할 수 있습니다. (IP 주소, 브라우저 유형, 방문 시간 등)</p>
          <p>본 정책은 2026년 2월 27일부터 적용됩니다.</p>
        </div>
      </div>
    </>
  );
}

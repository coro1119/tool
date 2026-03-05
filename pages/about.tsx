import Head from "next/head";

export default function About() {
  return (
    <>
      <Head>
        <title>About — FinanceCalculator</title>
        <link rel="canonical" href="https://financecalculator.cloud/about" />
      </Head>
      <div className="post-detail-container">
        <header className="post-detail-header">
          <span className="category-tag">ABOUT</span>
          <h2>FinanceCalculator</h2>
        </header>
        <div className="post-content-body">
          <p>안녕하세요, <strong>FinanceCalculator</strong> 블로그에 오신 것을 환영합니다.</p>
          <p>본 블로그는 필명 <strong>Teslaburn</strong>이 운영하는 전문 금융 및 기술 리서치 플랫폼입니다. 우리는 복잡한 시장의 숫자를 단순히 나열하는 것이 아니라, 데이터를 기반으로 직접 '계산'하고 분석하여 독자분들께 명확하고 실질적인 인사이트를 제공하는 것을 목표로 합니다.</p>
          <h3>우리의 핵심 가치</h3>
          <ul>
            <li><strong>Data-Driven</strong>: 감정이 아닌 철저한 데이터와 계산을 바탕으로 분석합니다.</li>
            <li><strong>Innovation Focus</strong>: 테슬라와 같은 혁신 기업과 미래 기술이 자본 시장에 미치는 영향을 추적합니다.</li>
            <li><strong>Global Perspective</strong>: 해외 주식 시장의 흐름을 빠르게 파악하여 공유합니다.</li>
          </ul>
          <p>금융 지능을 높이고 더 나은 투자 결정을 내리는 여정에 FinanceCalculator가 함께하겠습니다.</p>
        </div>
      </div>
    </>
  );
}

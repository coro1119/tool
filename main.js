document.addEventListener('DOMContentLoaded', function() {
    var themeBtn = document.getElementById('theme-btn');
    var homeView = document.getElementById('home-view');
    var calcView = document.getElementById('calc-view');
    var calcTitle = document.getElementById('calc-title');
    var calcInfoBox = document.getElementById('calc-info-box');
    var calcInputs = document.getElementById('calc-inputs');
    var calcResults = document.getElementById('calc-results');
    var chartWrapper = document.querySelector('.chart-wrapper');
    var backBtn = document.querySelector('.back-btn');
    var shareArea = document.getElementById('share-area');
    
    var currentChart = null;
    var baseTitle = "머니마스터 (MoneyMaster)";

    // Kakao Init (Placeholder - user should replace with real key)
    try {
        if (window.Kakao && !Kakao.isInitialized()) {
            Kakao.init('YOUR_KAKAO_APP_KEY'); // Replace with actual JavaScript Key
        }
    } catch (e) { console.warn('Kakao SDK init failed', e); }

    // --- Helper: won formatter ---
    var won = function(v) { 
        if (isNaN(v)) return '0원';
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v)); 
    };

    // --- Helper: Progressive Tax ---
    function calcProgressiveTax(taxBase) {
        if (taxBase <= 14000000) return taxBase * 0.06;
        if (taxBase <= 50000000) return taxBase * 0.15 - 1260000;
        if (taxBase <= 88000000) return taxBase * 0.24 - 5760000;
        if (taxBase <= 150000000) return taxBase * 0.35 - 15440000;
        if (taxBase <= 300000000) return taxBase * 0.38 - 19940000;
        if (taxBase <= 500000000) return taxBase * 0.40 - 25940000;
        if (taxBase <= 1000000000) return taxBase * 0.42 - 35940000;
        return taxBase * 0.45 - 65940000;
    }

    // --- Calculator Data (book) ---
    var book = {
        'salary': {
            title: '2026 연봉 실수령액',
            descTitle: '2026년 최신 세법 및 4대보험 반영',
            description: '국민연금 상한액 인상 및 건강보험 요율을 반영한 2026년형 실제 통장 수령액입니다.',
            example: '연봉 5,000만원, 비과세 식대 20만원 기준',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            disclaimer: '실제 부양가족 및 공제 항목에 따라 차이가 발생할 수 있습니다.',
            inputs: [
                { id: 's1', label: '세전 연봉 (원)', value: 50000000 },
                { id: 's2', label: '비과세 식대 (월)', value: 200000 }
            ],
            run: function(d) {
                var month = Math.floor(d.s1 / 12);
                var tax_target = Math.max(0, month - d.s2);
                var pension = Math.floor(Math.min(tax_target, 6170000) * 0.045);
                var health = Math.floor(tax_target * 0.03545);
                var care = Math.floor(health * 0.1295);
                var employment = Math.floor(tax_target * 0.009);
                var tax_base = (d.s1 - 15000000 - 1500000); 
                var incomeTax = Math.floor((tax_base > 0 ? calcProgressiveTax(tax_base) : 0) / 12);
                var localTax = Math.floor(incomeTax * 0.1);
                var net = month - (pension + health + care + employment + incomeTax + localTax);
                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '공제액 합계 (4대보험+세금)', val: won(month - net) },
                        { label: '월 예상 실수령액', val: '<strong>' + won(net) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['실수령', '공제'], data: [net, month - net] }
                };
            }
        },
        'coin-tax': {
            title: '2026 코인 과세 멘붕기',
            descTitle: '가상자산 수익 22% 과세 현실화',
            description: '2026년 시행 예정인 코인 과세(공제 250만원 초과분 22%)를 미리 시뮬레이션합니다.',
            example: '수익 1억원 달성 시, 기본공제 250만원 적용',
            refName: '기획재정부 세법개정안',
            refLink: 'https://www.moef.go.kr',
            disclaimer: '정부 정책에 따라 과세 유예 및 공제 한도가 변경될 수 있습니다.',
            inputs: [
                { id: 'c1', label: '가상자산 총 수익 (원)', value: 100000000 },
                { id: 'c2', label: '기본 공제액 (원)', value: 2500000 }
            ],
            run: function(d) {
                var profit = d.c1;
                var taxable = Math.max(0, profit - d.c2);
                var tax = Math.floor(taxable * 0.22);
                var net = profit - tax;
                var comment = tax > 10000000 ? "차 한 대 값이 세금으로! 멘탈 잡으세요." : "이 정도면 세금 낼 만 하네요!";
                return {
                    items: [
                        { label: '과세 대상 수익', val: won(taxable) },
                        { label: '예상 납부 세액 (22%)', val: won(tax) },
                        { label: '세후 실수령액', val: '<strong>' + won(net) + '</strong>' },
                        { label: '멘붕 코멘트', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['내 돈', '나라 돈'], data: [net, tax] }
                };
            }
        },
        'son-salary': {
            title: '손흥민 vs 내 연봉',
            descTitle: '월클과 나의 현실적인 거리',
            description: '손흥민 선수의 추정 주급(약 3.4억 원)과 내 연봉을 비교하여 현타를 선사합니다.',
            example: '내 연봉이 4,000만원일 때 쏘니는 몇 분 만에 벌까요?',
            inputs: [{ id: 'ss1', label: '내 세전 연봉 (원)', value: 40000000 }],
            run: function(d) {
                var sonWeekly = 340000000;
                var sonHourly = sonWeekly / (7 * 24);
                var myAnnual = d.ss1;
                var timeToEarnMySalary = (myAnnual / sonHourly); 
                var comment = timeToEarnMySalary > 24 ? "흥민이 형이 하루 꼬박 일하면 내 연봉!" : "흥민이 형은 점심 먹고 오면 내 연봉 벌었네요.";
                return {
                    items: [
                        { label: '손흥민이 내 연봉 버는 시간', val: timeToEarnMySalary.toFixed(1) + ' 시간' },
                        { label: '내가 쏜 주급 버는 기간', val: (sonWeekly / myAnnual).toFixed(1) + ' 년' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['내 연봉', '손흥민 주급'], data: [myAnnual, sonWeekly] }
                };
            }
        },
        'car-vs-taxi': {
            title: '테슬라 vs 택시 VIP',
            descTitle: '카푸어 탈출 지능 지수 테스트',
            description: '차량 유지비로 평생 택시만 타는 것이 이득인지 비교해 드립니다.',
            example: '6천만원 차량 풀할부(60개월) vs 매일 택시 타기',
            inputs: [
                { id: 'ct1', label: '차량 가격 (원)', value: 60000000 },
                { id: 'ct2', label: '월 유지비/보험료 (원)', value: 300000 }
            ],
            run: function(d) {
                var monthlyInstallment = Math.floor(d.ct1 / 60); 
                var totalMonthly = monthlyInstallment + d.ct2;
                var rides = Math.floor(totalMonthly / 15000); 
                return {
                    items: [
                        { label: '월 예상 유지비', val: won(totalMonthly) },
                        { label: '택시 탑승 가능 횟수', val: rides + ' 회 (건당 1.5만원)' },
                        { label: '결론', val: rides > 60 ? '<strong>택시 타는게 개이득</strong>' : '차 사세요.' }
                    ],
                    chart: { type: 'bar', labels: ['월 유지비', '택시 60회 비용'], data: [totalMonthly, 900000] }
                };
            }
        },
        'part-time': {
            title: '알바 주휴수당',
            descTitle: '2026년 최저임금 10,030원 반영',
            description: '주당 15시간 이상 근무 시 반드시 받아야 할 주휴수당을 계산합니다.',
            example: '2026년 최저시급으로 주 20시간 편의점 알바 시',
            refName: '고용노동부',
            refLink: 'https://www.moel.go.kr',
            inputs: [
                { id: 'p1', label: '시급 (원)', value: 10030 },
                { id: 'p2', label: '주 근무시간', value: 20 }
            ],
            run: function(d) {
                var base = d.p1 * d.p2;
                var holiday = d.p2 >= 15 ? (d.p2 / 40) * 8 * d.p1 : 0;
                var total = (base + holiday) * 4.345;
                return {
                    items: [
                        { label: '주 기본급', val: won(base) },
                        { label: '주 주휴수당', val: won(holiday) },
                        { label: '월 예상 총액', val: '<strong>' + won(total) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['기본급', '주휴수당'], data: [base, holiday] }
                };
            }
        },
        'savings-vs-bitcoin': {
            title: '청년도약계좌 vs 비트코인',
            descTitle: '정부 지원금 vs 야수의 심장',
            description: '연 6% 고금리 적금과 비트코인 적립식 투자의 예상 수익을 비교합니다.',
            example: '월 70만원 풀납입 5년 만기 vs 비트코인 매달 적립',
            refName: '서민금융진흥원',
            refLink: 'https://www.kinfa.or.kr',
            inputs: [
                { id: 'sb1', label: '월 납입액 (원)', value: 700000 },
                { id: 'sb2', label: '기간 (년)', value: 5 }
            ],
            run: function(d) {
                var monthly = d.sb1;
                var months = d.sb2 * 12;
                var savings = (monthly * months) + (monthly * months * 0.06 * (d.sb2 + 1) / 2) + (24000 * months);
                var btc = monthly * (Math.pow(1 + 0.015, months) - 1) / 0.015 * 1.015; 
                return {
                    items: [
                        { label: '청년도약계좌 만기액', val: won(savings) },
                        { label: '비트코인 적립 예상액', val: won(btc) },
                        { label: '수익 차이', val: won(btc - savings) }
                    ],
                    chart: { type: 'line', labels: ['원금', '적금', '코인'], data: [monthly*months, savings, btc] }
                };
            }
        },
        'omakase-snp500': {
            title: '오마카세 vs S&P500',
            descTitle: '한 끼의 사치 vs 노후의 평안',
            description: '오늘 먹은 15만원 오마카세 대신 미국 주식을 샀다면 20년 뒤 얼마가 될지 계산합니다.',
            example: '한 달에 한 번 오마카세(15만원) 대신 S&P500에 투자하면?',
            inputs: [
                { id: 'os1', label: '오마카세 비용 (원)', value: 150000 },
                { id: 'os2', label: '투자 기간 (년)', value: 20 }
            ],
            run: function(d) {
                var rate = 0.10 / 12;
                var months = d.os2 * 12;
                var futureValue = d.os1 * (Math.pow(1 + rate, months) - 1) / rate * (1 + rate);
                return {
                    items: [
                        { label: '20년 총 투자 원금', val: won(d.os1 * months) },
                        { label: '미래 자산 가치 (연 10%)', val: '<strong>' + won(futureValue) + '</strong>' }
                    ],
                    chart: { type: 'line', labels: ['원금', '미래가치'], data: [d.os1 * months, futureValue] }
                };
            }
        },
        'freelancer-tax': {
            title: '프리랜서 종소세 방어',
            descTitle: '3.3% 환급받기 시뮬레이터',
            description: '미리 떼인 3.3% 세금을 5월 종합소득세 신고 때 얼마나 돌려받을 수 있는지 추정합니다.',
            example: '연 수입 3,000만원 프리랜서가 5월에 돌려받을 세금은?',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            inputs: [{ id: 'ft1', label: '연간 총 수입 (원)', value: 30000000 }],
            run: function(d) {
                var income = d.ft1;
                var paidTax = income * 0.033;
                var taxableIncome = income * 0.35; 
                var calcTax = calcProgressiveTax(taxableIncome - 1500000); 
                var diff = paidTax - calcTax;
                return {
                    items: [
                        { label: '이미 낸 세금 (3.3%)', val: won(paidTax) },
                        { label: '예상 환급액', val: '<strong>' + won(Math.max(0, diff)) + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['낸 세금', '결정 세액'], data: [paidTax, calcTax] }
                };
            }
        },
        'ai-subscription': {
            title: 'AI 구독료 합계',
            descTitle: '숨만 쉬어도 나가는 AI 비용',
            description: 'ChatGPT, Claude 등 다양한 AI 툴의 구독료를 합산하여 연간 지출을 확인합니다.',
            example: 'ChatGPT Plus + Claude Pro + 미드저니 사용 시',
            inputs: [
                { id: 'as1', label: '구독 툴 개수', value: 3 },
                { id: 'as2', label: '평균 구독료 ($)', value: 20 }
            ],
            run: function(d) {
                var monthly = d.as1 * d.as2 * 1450;
                var yearly = monthly * 12;
                return {
                    items: [
                        { label: '월 총 구독료', val: won(monthly) },
                        { label: '연간 총 지출', val: '<strong>' + won(yearly) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['구독료', '기타여유'], data: [yearly, 5000000] }
                };
            }
        },
        'shorts-income': {
            title: '쇼츠/틱톡 수익 계산',
            descTitle: '조회수 100만 찍으면 얼마 벌까?',
            description: '플랫폼별 조회수당 단가를 적용하여 예상 애드센스/크리에이터 수익을 계산합니다.',
            example: '조회수 100만 회 달성 시 예상 수익은?',
            inputs: [
                { id: 'si1', label: '월 조회수', value: 1000000 },
                { id: 'si2', label: '조회수당 단가 (원)', value: 0.2 }
            ],
            run: function(d) {
                var profit = d.si1 * d.si2;
                return {
                    items: [
                        { label: '예상 월 수익', val: '<strong>' + won(profit) + '</strong>' },
                        { label: '한 줄 평', val: profit > 1000000 ? "퇴사 준비 가능!" : "부업으로 쏠쏠하네요." }
                    ],
                    chart: { type: 'bar', labels: ['수익', '목표'], data: [profit, 2000000] }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            descTitle: '원리금 균등 상환 방식',
            description: '은행 대출의 매달 상환액과 총 이자를 계산합니다.',
            example: '3억원 주택담보대출, 금리 4.5%, 30년 상환 기준',
            refName: '금융감독원',
            refLink: 'https://finlife.fss.or.kr',
            inputs: [
                { id: 'l1', label: '대출금 (원)', value: 300000000 },
                { id: 'l2', label: '금리 (%)', value: 4.5 },
                { id: 'l3', label: '기간 (개월)', value: 360 }
            ],
            run: function(d) {
                var r = (d.l2/100)/12;
                var n = d.l3;
                var m = d.l1 * r * Math.pow(1+r, n) / (Math.pow(1+r, n)-1);
                var totalInterest = m * n - d.l1;
                return {
                    items: [
                        { label: '월 상환금', val: won(m) },
                        { label: '총 이자 합계', val: won(totalInterest) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.l1, totalInterest] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 환급 예상',
            descTitle: '13월의 월급 시뮬레이터',
            description: '결정세액과 기납부세액을 비교하여 환급 여부를 미리 확인합니다.',
            example: '연봉 5,500만원 직장인이 이미 300만원의 세금을 냈다면?',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            inputs: [
                { id: 'ts1', label: '총급여 (원)', value: 55000000 },
                { id: 'ts2', label: '기납부세액 (원)', value: 3000000 }
            ],
            run: function(d) {
                var tax = d.ts1 * 0.1;
                var diff = d.ts2 - tax;
                return {
                    items: [
                        { label: '예상 결정세액', val: won(tax) },
                        { label: diff > 0 ? '예상 환급액' : '추가 납부액', val: '<strong>' + won(Math.abs(diff)) + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['기납부', '결정세액'], data: [d.ts2, tax] }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            descTitle: '주거 비용 최적화',
            description: '전세 대출 이자와 월세를 비교하여 어떤 주거 방식이 더 경제적인지 분석합니다.',
            example: '전세 3억(대출금리 4%) vs 월세 100만원 비교 시',
            inputs: [
                { id: 'rc1', label: '전세금 (원)', value: 300000000 },
                { id: 'rc2', label: '대출금리 (%)', value: 4.0 },
                { id: 'rc3', label: '월세액 (원)', value: 1000000 }
            ],
            run: function(d) {
                var j = (d.rc1 * (d.rc2/100)) / 12;
                return {
                    items: [
                        { label: '전세 월 대출이자', val: won(j) },
                        { label: '현재 월세', val: won(d.rc3) },
                        { label: '유불리', val: j < d.rc3 ? '전세가 유리' : '월세가 유리' }
                    ],
                    chart: { type: 'bar', labels: ['전세이자', '월세'], data: [j, d.rc3] }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            descTitle: '부동산 매도 시 세금',
            description: '양도차익에 따른 양도소득세와 지방소득세를 추산합니다.',
            example: '5억원에 매수한 아파트를 8억원에 매도했을 때 양도세는?',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            inputs: [
                { id: 'cg1', label: '양도가액 (원)', value: 800000000 },
                { id: 'cg2', label: '취득가액 (원)', value: 500000000 }
            ],
            run: function(d) {
                var gain = d.cg1 - d.cg2;
                var tax = calcProgressiveTax(gain);
                return {
                    items: [
                        { label: '양도차익', val: won(gain) },
                        { label: '예상 세금', val: won(tax) }
                    ],
                    chart: { type: 'pie', labels: ['실수익', '세금'], data: [gain - tax, tax] }
                };
            }
        },
        'pension': {
            title: '연금보험 수익률',
            descTitle: '노후를 위한 복리 투자',
            description: '연금보험 납입 시 미래에 받을 수 있는 연금 총액을 시뮬레이션합니다.',
            example: '매달 100만원씩 10년 저축 시 노후 자금 규모는?',
            inputs: [{ id: 'pe1', label: '월 납입액', value: 1000000 }, { id: 'pe2', label: '기간 (년)', value: 10 }],
            run: function(d) {
                var total = d.pe1 * d.pe2 * 12 * 1.25;
                return {
                    items: [{ label: '예상 수령액', val: won(total) }],
                    chart: { type: 'doughnut', labels: ['원금', '수익'], data: [d.pe1*d.pe2*12, total*0.2] }
                };
            }
        },
        'real-estate': {
            title: '부동산 수익률',
            descTitle: '수익형 부동산 ROI 분석',
            description: '매입가와 임대료를 기준으로 부동산 투자 수익률을 계산합니다.',
            example: '5억원 상가 매입 후 월세 200만원을 받는다면?',
            inputs: [{ id: 're1', label: '매입가', value: 500000000 }, { id: 're2', label: '월세', value: 2000000 }],
            run: function(d) {
                var roi = (d.re2 * 12 / d.re1) * 100;
                return {
                    items: [{ label: '수익률(ROI)', val: roi.toFixed(2) + '%' }],
                    chart: { type: 'bar', labels: ['매입가', '1년수익'], data: [d.re1, d.re2*12] }
                };
            }
        },
        'property-tax': {
            title: '재산세/종부세 계산',
            descTitle: '부동산 보유세 추정',
            description: '공시지가 기준 연간 보유세를 대략적으로 계산합니다.',
            example: '공시가격 15억원 아파트의 연간 보유세 시뮬레이션',
            refName: '부동산공시가격 알리미',
            refLink: 'https://www.realtyprice.kr',
            inputs: [{ id: 'pt1', label: '공시지가 (원)', value: 1500000000 }],
            run: function(d) {
                var tax = d.pt1 * 0.0035;
                return {
                    items: [{ label: '예상 보유세', val: won(tax) }],
                    chart: { type: 'pie', labels: ['지가', '세금'], data: [d.pt1, tax] }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 계산',
            descTitle: '연간 자동차 보험료 추산',
            description: '차량가액과 연령을 기준으로 평균적인 보험료를 계산합니다.',
            example: '3,000만원 상당의 신차 가입 시 예상 보험료는?',
            inputs: [{ id: 'ai1', label: '차량가액 (원)', value: 30000000 }],
            run: function(d) {
                var tax = 1000000 + d.ai1 * 0.02;
                return {
                    items: [{ label: '예상 보험료', val: won(tax) }],
                    chart: { type: 'pie', labels: ['보험료', '기타'], data: [tax, tax*0.5] }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 분석',
            descTitle: '금리 상승 시 위험 진단',
            description: '금리 인상에 따른 추가 이자 부담액을 분석합니다.',
            example: '4억원 대출 금리가 4%에서 6%로 올랐을 때 이자 차이는?',
            inputs: [{ id: 'ra1', label: '대출잔액 (원)', value: 400000000 }, { id: 'ra2', label: '현재금리 (%)', value: 4.0 }, { id: 'ra3', label: '인상금리 (%)', value: 6.0 }],
            run: function(d) {
                var diff = d.ra1 * (d.ra3 - d.ra2) / 100 / 12;
                return {
                    items: [{ label: '월 추가 부담액', val: won(diff) }],
                    chart: { type: 'bar', labels: ['현재이자', '인상후이자'], data: [d.ra1*0.04/12, d.ra1*0.06/12] }
                };
            }
        },
        'delivery-travel': {
            title: '배달비 모아 해외여행',
            descTitle: '치킨 참으면 비행기표가 나온다',
            description: '평소 지출하는 배달 비용을 아껴 갈 수 있는 해외 여행지를 알려드립니다.',
            example: '일주일에 3번 치킨(2.5만원) 참으면 어디까지 갈 수 있을까?',
            inputs: [
                { id: 'dt1', label: '주당 배달 횟수', value: 3 },
                { id: 'dt2', label: '건당 배달비 (원)', value: 4000 },
                { id: 'dt3', label: '평균 음식값 (원)', value: 25000 }
            ],
            run: function(d) {
                var yearCost = (d.dt2 + d.dt3) * d.dt1 * 52;
                var dest = yearCost >= 3000000 ? "🇺🇸 하와이 / 🇦🇺 호주" : (yearCost >= 1500000 ? "🇹🇭 방콕 / 🇻🇳 다낭" : "🇯🇵 일본 / 🇹🇼 대만");
                return {
                    items: [
                        { label: '1년 총 배달 지출액', val: won(yearCost) },
                        { label: '갈 수 있는 여행지', val: '<strong style="color:#e11d48">' + dest + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['음식값', '배달비'], data: [d.dt3 * d.dt1 * 52, d.dt2 * d.dt1 * 52] }
                };
            }
        },
        'crypto-fomo': {
            title: '비트코인 타임머신',
            descTitle: '과거의 나를 반성하는 시간',
            description: '비트코인을 과거 특정 시점에 샀을 때의 수익률을 계산합니다.',
            example: '10년 전 비트코인을 100만원어치 샀다면 지금 서울 아파트 몇 채?',
            inputs: [
                { id: 'f1', label: '투자금액 (원)', value: 1000000 },
                { id: 'f2', label: '투자 시점', value: 5, type: 'select', options: [
                    { label: '5년 전 (2021년)', value: 5 },
                    { label: '10년 전 (2016년)', value: 10 },
                    { label: '15년 전 (2011년)', value: 15 }
                ]}
            ],
            run: function(d) {
                var multiplier = d.f2 == 15 ? 150000 : (d.f2 == 10 ? 300 : 2.72);
                var current = d.f1 * multiplier;
                return {
                    items: [
                        { label: '현재 가치 (추정)', val: won(current) },
                        { label: '상승률', val: (multiplier * 100).toLocaleString() + '%' }
                    ],
                    chart: { type: 'bar', labels: ['원금', '현재가치'], data: [d.f1, current] }
                };
            }
        },
        'coffee-tesla': {
            title: '커피값 vs 테슬라',
            descTitle: '스벅 아아 한 잔의 기회비용',
            description: '매일 커피값 4,500원을 아껴 테슬라 주식을 샀을 때의 가치를 계산합니다.',
            example: '매일 마시는 스타벅스(4,500원) 대신 테슬라 주식을 샀다면?',
            inputs: [{ id: 't1', label: '일일 커피값 (원)', value: 4500 }],
            run: function(d) {
                var totalCoffee = d.t1 * 365 * 5;
                var futureValue = (d.t1 * 30) * 80; 
                return {
                    items: [
                        { label: '5년 총 커피값', val: won(totalCoffee) },
                        { label: '테슬라 주식 가치', val: won(futureValue) }
                    ],
                    chart: { type: 'doughnut', labels: ['소비됨', '주식이득'], data: [totalCoffee, futureValue - totalCoffee] }
                };
            }
        },
        'breath-apartment': {
            title: '숨참고 한강뷰 다이브',
            descTitle: '내 집 마련 소요 기간',
            description: '내 연봉으로 한강뷰 아파트를 사기 위해 숨만 쉬고 돈을 모아야 하는 기간을 계산합니다.',
            example: '연봉 5,000만원 전액 저축 시 20억 아파트 매수 소요 시간',
            inputs: [
                { id: 'b1', label: '세후 연봉 (원)', value: 50000000 },
                { id: 'b2', label: '목표 아파트가 (원)', value: 2500000000 }
            ],
            run: function(d) {
                var years = d.b2 / d.b1;
                return {
                    items: [{ label: '소요 기간', val: years.toFixed(1) + ' 년' }],
                    chart: { type: 'pie', labels: ['현재연봉', '부족금액'], data: [d.b1, d.b2 - d.b1] }
                };
            }
        },
        'youtube-adsense': {
            title: '유튜브 롱폼 수익',
            descTitle: '조회수당 예상 수익',
            description: '조회수에 따른 예상 광고 수익을 계산합니다.',
            example: '조회수 100만 회, CPM 3,000원 기준 광고 수익',
            inputs: [
                { id: 'y1', label: '월 조회수', value: 1000000 },
                { id: 'y2', label: 'CPM(원)', value: 3000 }
            ],
            run: function(d) {
                var profit = (d.y1 / 1000) * d.y2;
                return {
                    items: [{ label: '예상 월 수익', val: won(profit) }],
                    chart: { type: 'bar', labels: ['월수익', '목표'], data: [profit, 10000000] }
                };
            }
        },
        'ott-dutch': {
            title: 'OTT N빵 최적화',
            descTitle: '주요 OTT 가격 & 정산 가이드',
            description: '넷플릭스, 유튜브 등 주요 OTT의 파티원 수별 1인당 최적 분담금을 계산합니다.',
            example: '넷플릭스 프리미엄(17,000원)을 4명이서 정산한다면?',
            inputs: [
                { id: 'o1', label: 'OTT 서비스 선택', value: 'netflix', type: 'select', options: [
                    { label: '넷플릭스 (프리미엄)', value: 'netflix' },
                    { label: '유튜브 프리미엄', value: 'youtube' },
                    { label: '디즈니+', value: 'disney' },
                    { label: '티빙 (프리미엄)', value: 'tving' },
                    { label: '웨이브 (프리미엄)', value: 'wavve' },
                    { label: '쿠팡플레이 (와우)', value: 'coupang' },
                    { label: '직접 입력', value: 'custom' }
                ]},
                { id: 'o2', label: '현재 파티원 수 (나 포함)', value: 4 },
                { id: 'o3', label: '총 금액 (원)', value: 17000 }
            ],
            run: function(d) {
                var ottNames = {
                    'netflix': '넷플릭스',
                    'youtube': '유튜브',
                    'disney': '디즈니+',
                    'tving': '티빙',
                    'wavve': '웨이브',
                    'coupang': '쿠팡플레이',
                    'custom': 'OTT'
                };
                var serviceName = ottNames[document.getElementById('o1').value] || 'OTT';
                var totalPrice = d.o3;
                var members = Math.max(1, d.o2);
                var perPerson = Math.ceil(totalPrice / members / 10) * 10;
                
                return {
                    items: [
                        { label: serviceName + ' 총액', val: won(totalPrice) },
                        { label: '인당 입금액 (1/N)', val: '<strong>' + won(perPerson) + '</strong>' },
                        { label: '한 줄 평', val: members > 1 ? "절약의 신!" : "혼자 보시나요? 파티원을 구해보세요." }
                    ],
                    chart: { type: 'pie', labels: ['내 부담', '파티원 부담'], data: [perPerson, Math.max(0, totalPrice - perPerson)] }
                };
            }
        },
        'travel-currency': {
            title: '유럽 물가 국밥 환산',
            descTitle: '현지 금액 -> 국밥 환산',
            description: '유럽 물가를 국밥 개수로 체감해봅니다.',
            example: '100유로 쇼핑 시, 한국 국밥으로 환산하면 몇 그릇?',
            inputs: [
                { id: 'tc1', label: '현지 금액 (유로/파운드)', value: 100 },
                { id: 'tc2', label: '환율', value: 1500 }
            ],
            run: function(d) {
                var wonVal = d.tc1 * d.tc2;
                var gukbap = Math.floor(wonVal / 10000);
                return {
                    items: [
                        { label: '한화 환산액', val: won(wonVal) },
                        { label: '국밥 환산', val: gukbap + ' 그릇' }
                    ],
                    chart: { type: 'bar', labels: ['지출', '국밥 10개'], data: [wonVal, 100000] }
                };
            }
        },
        'influencer-price': {
            title: '인플루언서 단가',
            descTitle: '광고 원고료 정산',
            description: '팔로워 수 기준 추천 협찬 단가를 제안합니다.',
            example: '팔로워 5만 명 인플루언서의 광고 원고료 적정가는?',
            inputs: [{ id: 'i1', label: '팔로워 수', value: 50000 }],
            run: function(d) {
                var price = d.i1 * 15;
                return {
                    items: [{ label: '추천 원고료', val: won(price) }],
                    chart: { type: 'doughnut', labels: ['원고료', '게시물가치'], data: [price, price * 1.5] }
                };
            }
        }
    };

    // --- UI Logic: Navigation & Delegation ---
    function goTo(viewName) {
        clearAll();
        if (viewName === 'home') {
            homeView.classList.add('active');
            calcView.classList.remove('active');
            document.title = "머니마스터 (MoneyMaster) — 2026 금융 계산기의 모든 것";
            if (window.location.hash) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        } else {
            homeView.classList.remove('active');
            calcView.classList.add('active');
        }
        window.scrollTo(0, 0);
    }

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>';
        if (chartWrapper) chartWrapper.style.display = 'none';
        if (calcInfoBox) calcInfoBox.innerHTML = '';
        if (shareArea) shareArea.style.display = 'none';
    }

    function startUI(id, initialData) {
        var cfg = book[id];
        if (!cfg) { console.error('Calculator not found:', id); goTo('home'); return; }
        calcTitle.textContent = cfg.title;
        document.title = cfg.title + " - " + baseTitle;
        
        if (calcInfoBox) {
            var refHtml = cfg.refLink ? 
                '<p style="margin-top: 10px; font-size: 0.85rem;"><span class="example-tag" style="background: #e2e8f0; color: #475569;">공식 근거</span> ' +
                '<a href="' + cfg.refLink + '" target="_blank" style="color: var(--accent); text-decoration: underline;">' + cfg.refName + ' 바로가기 ↗</a></p>' : '';

            calcInfoBox.innerHTML = '<h4>' + (cfg.descTitle || cfg.title) + '</h4>' +
                                    '<p>' + (cfg.description || '') + '</p>' +
                                    refHtml +
                                    '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border);">' +
                                    '<p style="margin-bottom: 5px;"><span class="example-tag">예시</span> ' + (cfg.example || '데이터를 입력하세요.') + '</p>' +
                                    '<p style="font-size: 0.8rem; color: var(--text-muted);">⚠️ ' + (cfg.disclaimer || '본 결과는 일반적인 기준을 적용한 시뮬레이션입니다.') + '</p>' +
                                    '</div>';
        }

        var html = '';
        cfg.inputs.forEach(function(i) {
            var val = (initialData && initialData[i.id]) ? initialData[i.id] : i.value;
            html += '<div class="input-group"><label>' + i.label + '</label>';
            if (i.type === 'select') {
                html += '<select id="' + i.id + '">';
                i.options.forEach(function(opt) {
                    html += '<option value="' + opt.value + '"' + (opt.value == val ? ' selected' : '') + '>' + opt.label + '</option>';
                });
                html += '</select>';
            } else {
                html += '<input type="number" id="' + i.id + '" value="' + val + '">';
            }
            html += '</div>';
        });
        
        html += '<button class="calc-btn" id="run">계산하기</button>';
        calcInputs.innerHTML = html;

        // --- OTT Price Sync Logic ---
        if (id === 'ott-dutch') {
            var serviceSelect = document.getElementById('o1');
            var priceInput = document.getElementById('o3');
            
            var updatePrice = function() {
                var prices = {
                    'netflix': 17000,
                    'youtube': 14900,
                    'disney': 13900,
                    'tving': 17000,
                    'wavve': 13900,
                    'coupang': 7890,
                    'custom': 0
                };
                if (serviceSelect.value !== 'custom') {
                    priceInput.value = prices[serviceSelect.value];
                }
            };

            serviceSelect.addEventListener('change', updatePrice);
            updatePrice(); // Initial sync
        }

        document.getElementById('run').addEventListener('click', function() {
            var vals = {};
            var params = new URLSearchParams();
            params.set('calc', id);

            cfg.inputs.forEach(function(i) {
                var v = document.getElementById(i.id).value;
                vals[i.id] = parseFloat(v) || 0;
                params.set(i.id, v);
            });
            
            // Update URL without refresh
            history.replaceState(null, '', '?' + params.toString());

            try {
                var out = cfg.run(vals);
                var resHtml = '';
                out.items.forEach(function(item) {
                    resHtml += '<div class="result-item"><span class="result-label">' + item.label + '</span>';
                    resHtml += '<span class="result-value">' + item.val + '</span></div>';
                });
                calcResults.innerHTML = resHtml;
                if (out.chart) draw(out.chart);
                if (shareArea) shareArea.style.display = 'block';
            } catch (err) {
                console.error(err);
                calcResults.innerHTML = '<p style="color:red">계산 중 에러가 발생했습니다.</p>';
            }
        });

        if (initialData || targetCalc === id) { document.getElementById('run').click(); }
    }

    // Share Logic
    document.getElementById('copy-link-btn').addEventListener('click', function() {
        var url = window.location.href;
        navigator.clipboard.writeText(url).then(function() {
            alert('공유 링크가 복사되었습니다! 결과값이 포함되어 있습니다.');
        });
    });

    document.getElementById('kakao-share-btn').addEventListener('click', function() {
        if (!window.Kakao) return;
        var title = calcTitle.textContent;
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '[머니마스터] ' + title + ' 결과 확인하기',
                description: '나의 금융 성적표는? 머니마스터에서 바로 확인해보세요.',
                imageUrl: 'https://financecalculator.cloud/og-image.png',
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            },
            buttons: [
                {
                    title: '결과 보기',
                    link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                    },
                },
            ],
        });
    });

    document.body.addEventListener('click', function(e) {
        var calcTarget = e.target.closest('[data-calc]');
        if (calcTarget) {
            e.preventDefault();
            var cid = calcTarget.getAttribute('data-calc');
            if (cid && book[cid]) { goTo('calc'); startUI(cid); }
            return;
        }
        var homeTarget = e.target.closest('[data-page="home"]');
        if (homeTarget) { e.preventDefault(); goTo('home'); return; }
    });

    if (backBtn) backBtn.addEventListener('click', function() { goTo('home'); });

    function draw(c) {
        if (!c || !c.data || c.data.length === 0) return;
        
        var chartWrapper = document.querySelector('.chart-wrapper');
        if (chartWrapper) chartWrapper.style.display = 'flex';
        
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        
        var isDark = document.body.getAttribute('data-theme') === 'dark';
        var textColor = isDark ? '#94a3b8' : '#64748b';
        var gridColor = isDark ? '#1e293b' : '#e2e8f0';

        var colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

        currentChart = new Chart(ctx, {
            type: c.type || 'bar',
            data: {
                labels: c.labels,
                datasets: [{
                    label: '금액',
                    data: c.data,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 20 },
                plugins: {
                    legend: {
                        display: c.type === 'pie' || c.type === 'doughnut',
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 20,
                            font: { family: 'Pretendard', size: 12, weight: '600' },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f1f5f9' : '#0f172a',
                        bodyColor: isDark ? '#cbd5e1' : '#475569',
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.label + ': ' + won(context.parsed.y || context.parsed);
                            }
                        }
                    }
                },
                scales: c.type === 'pie' || c.type === 'doughnut' ? {} : {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, drawBorder: false },
                        ticks: { 
                            color: textColor,
                            font: { family: 'Pretendard' },
                            callback: function(value) {
                                if (value >= 100000000) return (value / 100000000).toFixed(1) + '억';
                                if (value >= 10000) return (value / 10000).toFixed(0) + '만';
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Pretendard', weight: '600' } }
                    }
                }
            }
        });
    }

    // --- Filter & Search Logic ---
    var omnibar = document.getElementById('omnibar');
    var chips = document.querySelectorAll('.chip');
    var hotSection = document.getElementById('hot-section');
    var mainGridCards = document.querySelectorAll('#main-grid .calc-card');

    if (omnibar) {
        omnibar.addEventListener('input', function(e) {
            var query = e.target.value.toLowerCase().trim();
            chips.forEach(c => c.classList.remove('active'));
            if (hotSection) hotSection.style.display = query === '' ? 'block' : 'none';
            mainGridCards.forEach(card => {
                var title = card.querySelector('h3').textContent.toLowerCase();
                var keywords = card.dataset.keywords ? card.dataset.keywords.toLowerCase() : '';
                card.style.display = (title.includes(query) || keywords.includes(query)) ? 'flex' : 'none';
            });
        });
    }

    chips.forEach(function(chip) {
        chip.addEventListener('click', function() {
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            var filter = this.getAttribute('data-filter');
            if (hotSection) hotSection.style.display = filter === 'all' ? 'block' : 'none';
            mainGridCards.forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'flex' : 'none';
            });
        });
    });

    // --- Routing ---
    var urlParams = new URLSearchParams(window.location.search);
    var targetCalc = urlParams.get('calc');
    var isEmbed = urlParams.get('embed') === 'true';
    if (isEmbed) document.body.classList.add('embed-mode');

    if (targetCalc && book[targetCalc]) {
        var initData = {};
        for (var pair of urlParams.entries()) { initData[pair[0]] = pair[1]; }
        goTo('calc');
        startUI(targetCalc, initData);
    } else {
        var hash = window.location.hash.substring(1);
        if (hash && book[hash]) { goTo('calc'); startUI(hash); }
        else if (!isEmbed) goTo('home');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            var isDark = document.body.getAttribute('data-theme') === 'dark';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            themeBtn.textContent = isDark ? '🌓' : '☀️';
        });
    }
});

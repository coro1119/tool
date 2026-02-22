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
    
    var currentChart = null;
    var baseTitle = "금융 계산기 마스터";

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
    // Moved to the top to avoid TDZ and undefined errors
    var book = {
        'car-vs-taxi': {
            title: '테슬라 풀할부 vs 택시 VIP',
            descTitle: '카푸어 vs 뚜벅이 대결',
            description: '테슬라 모델Y를 풀할부로 샀을 때의 월 유지비와, 그 돈으로 택시를 탔을 때 몇 번 탈 수 있는지 비교합니다.',
            example: '차량가 6천만원, 할부 60개월',
            inputs: [
                { id: 'ct1', label: '차량 가격 (원)', value: 60000000 },
                { id: 'ct2', label: '할부 금리 (%)', value: 5.5 },
                { id: 'ct3', label: '월 보험/유지비 (원)', value: 150000 }
            ],
            run: function(d) {
                var price = d.ct1;
                var rate = (d.ct2 / 100) / 12;
                var months = 60;
                var monthlyPayment = Math.floor(price * rate * Math.pow(1+rate, months) / (Math.pow(1+rate, months)-1));
                var totalMonthly = monthlyPayment + d.ct3;
                var taxiRides = Math.floor(totalMonthly / 15000);
                var comment = taxiRides >= 100 ? "매일 3번씩 택시 타도 돈이 남습니다. 기사님 개인 고용 가능?" : (taxiRides >= 60 ? "하루 2번 출퇴근 택시로 가능! 주차 스트레스도 없죠." : "이 정도면 차 사는 게 낫겠네요. 자유를 얻으세요!");
                return {
                    items: [
                        { label: '월 차량 유지비', val: won(totalMonthly) },
                        { label: '택시 환산 (건당 1.5만원)', val: taxiRides + '회 탑승 가능' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['월 할부금', '월 유지비'], data: [monthlyPayment, d.ct3] }
                };
            }
        },
        'shorts-income': {
            title: '쇼츠/틱톡 수익 계산기',
            descTitle: '조회수 100만 뷰의 가치',
            description: '유튜브 쇼츠와 틱톡의 평균 단가를 적용해 예상 수익을 계산합니다. (쇼츠 0.1~0.3원, 틱톡 0.01~0.05원)',
            example: '조회수 100만 회',
            inputs: [
                { id: 'si1', label: '조회수 (회)', value: 1000000 },
                { id: 'si2', label: '플랫폼', value: 'shorts', type: 'select', options: [
                    { label: '유튜브 쇼츠 (Shorts)', value: 'shorts' },
                    { label: '틱톡 (TikTok)', value: 'tiktok' }
                ]}
            ],
            run: function(d) {
                var views = d.si1;
                var minRate = d.si2 === 'shorts' ? 0.1 : 0.01;
                var maxRate = d.si2 === 'shorts' ? 0.3 : 0.05;
                var minIncome = Math.floor(views * minRate);
                var maxIncome = Math.floor(views * maxRate);
                var avgIncome = Math.floor((minIncome + maxIncome) / 2);
                var comment = avgIncome < 100000 ? "치킨 몇 마리 값이네요. 취미로 하시는 거죠?" : (avgIncome < 1000000 ? "오, 쏠쏠한 부업! 꾸준히 하면 월급 넘겠는데요?" : "전업 크리에이터 각! 알고리즘의 선택을 받으셨군요.");
                return {
                    items: [
                        { label: '예상 수익 (최소)', val: won(minIncome) },
                        { label: '예상 수익 (최대)', val: won(maxIncome) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['최소수익', '최대수익'], data: [minIncome, maxIncome] }
                };
            }
        },
        'ai-subscription': {
            title: 'AI 구독료 계산기',
            descTitle: '숨만 쉬어도 나가는 AI 봇 비용',
            description: 'ChatGPT, Claude, Midjourney 등 구독 중인 AI 서비스들의 연간 지출액을 확인하세요.',
            example: '챗GPT + 미드저니 사용 시',
            inputs: [
                { id: 'as1', label: 'ChatGPT Plus ($20)', value: 1, type: 'select', options: [{label: '구독함', value: 1}, {label: '안함', value: 0}] },
                { id: 'as2', label: 'Claude Pro ($20)', value: 0, type: 'select', options: [{label: '구독함', value: 1}, {label: '안함', value: 0}] },
                { id: 'as3', label: 'Midjourney ($30)', value: 0, type: 'select', options: [{label: '구독함', value: 1}, {label: '안함', value: 0}] },
                { id: 'as4', label: '기타 구독료 합계 ($)', value: 0 }
            ],
            run: function(d) {
                var totalMonthlyUsd = (d.as1 * 20) + (d.as2 * 20) + (d.as3 * 30) + d.as4;
                var exchangeRate = 1450;
                var totalMonthlyKrw = totalMonthlyUsd * exchangeRate;
                var totalYearlyKrw = totalMonthlyKrw * 12;
                var comment = totalYearlyKrw > 1000000 ? "연 100만원 넘게 태우시네요! AI로 그 이상 벌고 계시죠?" : (totalYearlyKrw > 0 ? "생산성을 위한 투자! 아깝지 않으실 겁니다." : "무료 버전만 쓰시는 알뜰파!");
                return {
                    items: [
                        { label: '월 구독료 합계', val: won(totalMonthlyKrw) },
                        { label: '연간 지출액', val: won(totalYearlyKrw) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['AI 구독료', '기타 여유자금'], data: [totalYearlyKrw, Math.max(0, 5000000 - totalYearlyKrw)] }
                };
            }
        },
        'omakase-snp500': {
            title: '오마카세 vs S&P500 복리',
            descTitle: '한 끼의 식사 vs 20년 뒤의 자산',
            description: '오마카세(약 15만원)를 포기하고 연평균 10% 수익률의 S&P500 ETF에 투자했을 때의 미래 가치를 계산합니다.',
            example: '월 1회 15만원 절약, 20년 투자',
            inputs: [
                { id: 'os1', label: '절약 금액 (원/월)', value: 150000 },
                { id: 'os2', label: '투자 기간 (년)', value: 20 }
            ],
            run: function(d) {
                var monthly = d.os1;
                var years = d.os2;
                var rate = 0.10 / 12;
                var months = years * 12;
                var futureValue = monthly * (Math.pow(1 + rate, months) - 1) / rate * (1 + rate);
                var totalInvested = monthly * months;
                var interest = futureValue - totalInvested;
                return {
                    items: [
                        { label: '총 절약 원금', val: won(totalInvested) },
                        { label: '복리 수익', val: won(interest) },
                        { label: '미래 자산 가치', val: '<strong style="color:#2563eb">' + won(futureValue) + '</strong>' }
                    ],
                    chart: { type: 'line', labels: ['원금', '미래가치'], data: [totalInvested, futureValue] }
                };
            }
        },
        'freelancer-tax': {
            title: '3.3% 프리랜서 종소세 방어',
            descTitle: '토해낼까? 돌려받을까?',
            description: '단순경비율을 적용하여 5월 종합소득세 환급액을 추정합니다.',
            example: '연수입 2,000만원',
            inputs: [{ id: 'ft1', label: '연간 총 수입 (원)', value: 20000000 }],
            run: function(d) {
                var income = d.ft1;
                var expenseRate = 0.641;
                var incomeAmount = income - (income * expenseRate);
                var taxBase = Math.max(0, incomeAmount - 1500000);
                var calcTax = taxBase * 0.06;
                var paidTax = income * 0.033;
                var finalTax = calcTax - paidTax;
                var resultText = finalTax < 0 ? "환급 예상! (치킨 드세요)" : "납부 예상 (미리 모으세요)";
                return {
                    items: [
                        { label: '기납부 세금 (3.3%)', val: won(paidTax) },
                        { label: '결정 세액 (추정)', val: won(calcTax) },
                        { label: '결과', val: '<strong>' + resultText + ' ' + won(Math.abs(finalTax)) + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['낸 세금', '낼 세금'], data: [paidTax, calcTax] }
                };
            }
        },
        'savings-vs-bitcoin': {
            title: '청년도약계좌 vs 비트코인 적립',
            descTitle: '안정성 vs 수익성 대결',
            description: '정부지원금 포함 연 6% 적금과 비트코인 연평균 성장률을 비교합니다.',
            example: '월 70만원, 5년 만기',
            inputs: [
                { id: 'sb1', label: '월 납입액 (원)', value: 700000 },
                { id: 'sb2', label: '기간 (년)', value: 5 }
            ],
            run: function(d) {
                var monthly = d.sb1;
                var years = d.sb2;
                var months = years * 12;
                var savingsInterest = monthly * months * (0.06 * (years + 1) / 2);
                var govContribution = 24000 * months;
                var savingsTotal = (monthly * months) + savingsInterest + govContribution;
                var btcRate = 0.20 / 12;
                var btcTotal = monthly * (Math.pow(1 + btcRate, months) - 1) / btcRate * (1 + btcRate);
                var diff = btcTotal - savingsTotal;
                var comment = diff > 0 ? "비트코인이 " + won(diff) + " 더 벌었을 수도?" : "적금 승리!";
                return {
                    items: [
                        { label: '청년도약계좌 만기액', val: won(savingsTotal) },
                        { label: '비트코인 적립 예상액', val: won(btcTotal) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'line', labels: ['원금', '적금', '코인'], data: [monthly*months, savingsTotal, btcTotal] }
                };
            }
        },
        'coin-tax': {
            title: '2026 코인/가상자산 과세 시뮬레이터',
            descTitle: '내 코인 수익, 세금 떼면 얼마?',
            description: '2026년 시행 예정인 가상자산 과세(기본 공제 250만원, 세율 22%)를 적용해봅니다.',
            refName: '기획재정부 (가상자산 과세 유예안)',
            refLink: 'https://www.moef.go.kr',
            example: '수익 1억원 달성 시',
            inputs: [
                { id: 'c1', label: '가상자산 총 수익 (원)', value: 100000000 },
                { id: 'c2', label: '기본 공제액 (원)', value: 2500000 }
            ],
            run: function(d) {
                var profit = d.c1;
                var deduction = d.c2;
                var taxable = Math.max(0, profit - deduction);
                var tax = Math.floor(taxable * 0.22);
                var net = profit - tax;
                var comment = tax > 10000000 ? "차 한 대 값이 세금으로 증발! 멘탈 꽉 잡으세요." : "22%... 생각보다 쎄죠? 이게 현실입니다.";
                return {
                    items: [
                        { label: '과세 대상 금액', val: won(taxable) },
                        { label: '예상 납부 세액 (22%)', val: won(tax) },
                        { label: '세후 실수령액', val: '<strong>' + won(net) + '</strong>' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['실수령', '세금'], data: [net, tax] }
                };
            }
        },
        'son-salary': {
            title: '손흥민 주급 vs 내 연봉 체감',
            descTitle: '월드클래스와 나의 거리 측정',
            description: '손흥민 선수의 추정 주급(약 3.4억 원)과 내 연봉을 비교해봅니다.',
            example: '내 연봉 4,000만원일 때',
            inputs: [{ id: 'ss1', label: '내 세전 연봉 (원)', value: 40000000 }],
            run: function(d) {
                var sonWeekly = 340000000;
                var myAnnual = d.ss1;
                var sonEarnsMyYear = (myAnnual / sonWeekly) * 7 * 24;
                var sonDays = Math.floor(sonEarnsMyYear / 24);
                var sonHours = Math.floor(sonEarnsMyYear % 24);
                var iEarnSonWeek = sonWeekly / myAnnual;
                var comment = iEarnSonWeek > 50 ? "환생이 더 빠를 수도 있습니다..." : "오! 그래도 꽤 능력자이십니다.";
                return {
                    items: [
                        { label: '손흥민이 내 연봉 버는 시간', val: sonDays + '일 ' + sonHours + '시간' },
                        { label: '내가 쏜 주급 버는 기간', val: iEarnSonWeek.toFixed(1) + '년' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['내 연봉', '손흥민 주급'], data: [myAnnual, sonWeekly] }
                };
            }
        },
        'delivery-travel': {
            title: '배달비 모아 해외여행',
            descTitle: '치킨 참으면 어디까지 갈 수 있을까?',
            description: '습관적인 배달 주문을 끊었을 때 모을 수 있는 돈으로 갈 수 있는 여행지를 추천합니다.',
            example: '주 3회, 건당 배달비 4,000원',
            inputs: [
                { id: 'dt1', label: '주당 배달 횟수', value: 3 },
                { id: 'dt2', label: '건당 평균 배달비 (원)', value: 4000 },
                { id: 'dt3', label: '건당 평균 음식값 (원)', value: 25000 }
            ],
            run: function(d) {
                var weekCost = (d.dt2 + d.dt3) * d.dt1;
                var yearCost = weekCost * 52;
                var dest = yearCost >= 3000000 ? "🇺🇸 하와이 / 🇦🇺 호주" : (yearCost >= 1500000 ? "🇹🇭 방콕 / 🇻🇳 다낭" : "🇯🇵 일본 / 🇹🇼 대만");
                return {
                    items: [
                        { label: '1년 총 배달 지출액', val: won(yearCost) },
                        { label: '배달비만 따져도', val: won(d.dt2 * d.dt1 * 52) },
                        { label: '갈 수 있는 여행지', val: '<strong style="color:#e11d48">' + dest + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['음식값', '배달비'], data: [d.dt3 * d.dt1 * 52, d.dt2 * d.dt1 * 52] }
                };
            }
        },
        'crypto-fomo': {
            title: '비트코인 타임머신',
            descTitle: '과거의 나를 반성하는 시간',
            description: '비트코인을 과거 특정 시점에 샀을 때, 현재 자산 가치를 시뮬레이션합니다.',
            example: '10년 전 100만원 투자 시',
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
            description: '매일 마시는 커피값(4,500원)을 아껴서 테슬라 주식을 5년간 적립식으로 샀다면?',
            example: '매일 4,500원씩 5년 적립 시',
            inputs: [{ id: 't1', label: '일일 커피값 (원)', value: 4500 }],
            run: function(d) {
                var totalCoffee = d.t1 * 365 * 5;
                var futureValue = (d.t1 * 30) * 80; // Rough multiplier for 25% annual return
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
            description: '내 연봉을 한 푼도 안 쓰고 모았을 때 한강뷰 아파트를 사기까지 걸리는 기간입니다.',
            example: '연봉 5,000만원, 아파트 25억 기준',
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
            example: '조회수 100만 회',
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
        'influencer-price': {
            title: '인플루언서 단가',
            descTitle: '광고 원고료 정산',
            description: '팔로워 수 기준 추천 협찬 단가를 제안합니다.',
            example: '팔로워 5만 명 기준',
            inputs: [{ id: 'i1', label: '팔로워 수', value: 50000 }],
            run: function(d) {
                var price = d.i1 * 15;
                return {
                    items: [{ label: '추천 원고료', val: won(price) }],
                    chart: { type: 'doughnut', labels: ['원고료', '게시물가치'], data: [price, price * 1.5] }
                };
            }
        },
        'ott-dutch': {
            title: 'OTT N빵 최적화',
            descTitle: '주요 OTT 가격 & 정산 가이드',
            description: '넷플릭스, 유튜브 등 주요 OTT의 파티원 수별 1인당 최적 분담금을 계산합니다.',
            example: '넷플릭스 프리미엄, 4명 정산',
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
                { id: 'o3', label: '총 금액 (직접 입력시)', value: 0 }
            ],
            run: function(d) {
                var ottData = {
                    'netflix': { price: 17000, max: 4, name: '넷플릭스' },
                    'youtube': { price: 14900, max: 1, name: '유튜브 프리미엄' },
                    'disney': { price: 13900, max: 4, name: '디즈니+' },
                    'tving': { price: 17000, max: 4, name: '티빙' },
                    'wavve': { price: 13900, max: 4, name: '웨이브' },
                    'coupang': { price: 7890, max: 2, name: '쿠팡플레이' },
                    'custom': { price: d.o3, max: 4, name: '기타 OTT' }
                };
                var selected = ottData[d.o1] || ottData['netflix'];
                var totalPrice = (d.o1 === 'custom') ? d.o3 : selected.price;
                var perPerson = Math.ceil(totalPrice / Math.max(1, d.o2) / 10) * 10;
                return {
                    items: [
                        { label: selected.name + ' 총액', val: won(totalPrice) },
                        { label: '인당 입금액', val: won(perPerson) }
                    ],
                    chart: { type: 'pie', labels: ['내부담', '타인부담'], data: [perPerson, totalPrice - perPerson] }
                };
            }
        },
        'part-time': {
            title: '알바 주휴수당',
            descTitle: '2026 최저임금 반영',
            description: '주당 15시간 이상 근무 시 지급되는 주휴수당 포함 월급을 계산합니다.',
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
                        { label: '주 주휴수당', val: won(holiday) },
                        { label: '예상 월급', val: won(total) }
                    ],
                    chart: { type: 'pie', labels: ['기본급', '주휴수당'], data: [base, holiday] }
                };
            }
        },
        'travel-currency': {
            title: '유럽 물가 국밥 환산',
            descTitle: '현지 금액 -> 국밥 환산',
            description: '유럽 물가를 국밥 개수로 체감해봅니다.',
            inputs: [
                { id: 'tc1', label: '현지 금액 (유로/파운드)', value: 150 },
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
        'salary': {
            title: '2026 연봉 실수령액',
            descTitle: '최신 요율 반영',
            description: '2026년 국민연금, 건강보험 요율을 반영한 실수령액입니다.',
            inputs: [{ id: 's1', label: '연봉 (원)', value: 50000000 }],
            run: function(d) {
                var month = d.s1 / 12;
                var net = month * 0.85; // Simple approximation
                return {
                    items: [{ label: '월 실수령액', val: won(net) }],
                    chart: { type: 'pie', labels: ['실수령', '공제'], data: [net, month - net] }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            descTitle: '원리금 균등 상환',
            inputs: [
                { id: 'l1', label: '대출금', value: 300000000 },
                { id: 'l2', label: '금리(%)', value: 4.5 },
                { id: 'l3', label: '기간(개월)', value: 360 }
            ],
            run: function(d) {
                var r = (d.l2/100)/12;
                var n = d.l3;
                var m = d.l1 * r * Math.pow(1+r, n) / (Math.pow(1+r, n)-1);
                return {
                    items: [{ label: '월 상환금', val: won(m) }],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.l1, m*n - d.l1] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 환급 예상',
            inputs: [
                { id: 'ts1', label: '총급여', value: 55000000 },
                { id: 'ts2', label: '기납부세액', value: 3000000 }
            ],
            run: function(d) {
                var tax = d.ts1 * 0.1;
                return {
                    items: [{ label: '예상 환급액', val: won(d.ts2 - tax) }],
                    chart: { type: 'bar', labels: ['기납부', '결정세액'], data: [d.ts2, tax] }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            inputs: [
                { id: 'rc1', label: '전세금', value: 300000000 },
                { id: 'rc2', label: '대출금리(%)', value: 4.0 },
                { id: 'rc3', label: '월세', value: 1000000 }
            ],
            run: function(d) {
                var j = (d.rc1 * (d.rc2/100)) / 12;
                return {
                    items: [{ label: '전세 월 이자', val: won(j) }],
                    chart: { type: 'bar', labels: ['전세이자', '월세'], data: [j, d.rc3] }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            inputs: [
                { id: 'cg1', label: '양도가액', value: 800000000 },
                { id: 'cg2', label: '취득가액', value: 500000000 }
            ],
            run: function(d) {
                var gain = d.cg1 - d.cg2;
                var tax = gain * 0.2;
                return {
                    items: [{ label: '예상 세금', val: won(tax) }],
                    chart: { type: 'pie', labels: ['실수익', '세금'], data: [gain - tax, tax] }
                };
            }
        },
        'pension': {
            title: '연금보험 수익률',
            inputs: [{ id: 'pe1', label: '월 납입액', value: 1000000 }, { id: 'pe2', label: '기간(년)', value: 10 }],
            run: function(d) {
                var total = d.pe1 * d.pe2 * 12 * 1.2;
                return {
                    items: [{ label: '예상 수령액', val: won(total) }],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.pe1*d.pe2*12, total*0.2] }
                };
            }
        },
        'real-estate': {
            title: '부동산 수익률',
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
            inputs: [{ id: 'pt1', label: '공시지가', value: 1500000000 }],
            run: function(d) {
                var tax = d.pt1 * 0.003;
                return {
                    items: [{ label: '예상 보유세', val: won(tax) }],
                    chart: { type: 'pie', labels: ['지가', '세금'], data: [d.pt1, tax] }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 계산',
            inputs: [{ id: 'ai1', label: '차량가액', value: 30000000 }],
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
            inputs: [{ id: 'ra1', label: '대출금', value: 400000000 }, { id: 'ra2', label: '현재금리', value: 4.0 }, { id: 'ra3', label: '인상금리', value: 6.0 }],
            run: function(d) {
                var diff = d.ra1 * (d.ra3 - d.ra2) / 100 / 12;
                return {
                    items: [{ label: '월 추가 부담액', val: won(diff) }],
                    chart: { type: 'bar', labels: ['현재', '인상후'], data: [d.ra1*0.04/12, d.ra1*0.06/12] }
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
            document.title = "2026 연봉 실수령액 & 금융 계산기 마스터 | FinanceCalculator";
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
        var shareBox = document.querySelector('.embed-share-box');
        if (shareBox) shareBox.remove();
    }

    function startUI(id, initialData) {
        var cfg = book[id];
        if (!cfg) { console.error('Calculator not found:', id); goTo('home'); return; }
        calcTitle.textContent = cfg.title;
        document.title = cfg.title + " - " + baseTitle;
        
        if (calcInfoBox) {
            calcInfoBox.innerHTML = '<h4>' + (cfg.descTitle || cfg.title) + '</h4>' +
                                    '<p>' + (cfg.description || '') + '</p>' +
                                    '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">' +
                                    '<p><span class="example-tag">예시</span> ' + (cfg.example || '데이터를 입력하세요.') + '</p>' +
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

        document.getElementById('run').addEventListener('click', function() {
            var vals = {};
            cfg.inputs.forEach(function(i) {
                vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0;
            });
            
            try {
                var out = cfg.run(vals);
                var resHtml = '';
                out.items.forEach(function(item) {
                    resHtml += '<div class="result-item"><span class="result-label">' + item.label + '</span>';
                    resHtml += '<span class="result-value">' + item.val + '</span></div>';
                });
                calcResults.innerHTML = resHtml;
                if (out.chart) draw(out.chart);
            } catch (err) {
                console.error(err);
                calcResults.innerHTML = '<p style="color:red">계산 중 에러가 발생했습니다.</p>';
            }
        });

        if (initialData || targetCalc === id) { document.getElementById('run').click(); }
    }

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

        // Vibrant color palette
        var colors = [
            '#2563eb', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // violet
            '#ec4899', // pink
            '#06b6d4'  // cyan
        ];

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
                layout: {
                    padding: 20
                },
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
                        displayColors: true,
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
    // URL 파라미터 파싱 (pSEO & Embed 지원)
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

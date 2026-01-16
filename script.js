// ========================================
// HIQASC 수리부서 위키 - 메인 스크립트
// DEVELOPED BY DONGGU KANG
// ========================================

// Google Sheets 설정
const CONFIG = {
    // TODO: Google Sheets 웹 앱 URL을 여기에 입력하세요
    SHEETS_URL: 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE',
    // 또는 직접 Sheets API 사용 시
    SHEET_ID: 'YOUR_SHEET_ID_HERE',
    API_KEY: 'YOUR_API_KEY_HERE'
};

// 페이지 로드 시 통계 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
});

// 통계 데이터 로드
async function loadStats() {
    try {
        // TODO: Google Sheets에서 데이터 가져오기
        // 현재는 샘플 데이터로 표시
        const stats = {
            total: 0,
            recent: 0,
            solved: 0
        };

        // 임시 샘플 데이터
        // 실제 구현 시 Google Sheets에서 가져옴
        updateStatsDisplay(stats);
        
    } catch (error) {
        console.error('통계 로드 실패:', error);
    }
}

// 통계 표시 업데이트
function updateStatsDisplay(stats) {
    document.getElementById('totalSymptoms').textContent = stats.total;
    document.getElementById('recentSymptoms').textContent = stats.recent;
    document.getElementById('solvedSymptoms').textContent = stats.solved;
}

// Google Sheets 데이터 가져오기 함수 (구현 예정)
async function fetchFromSheets() {
    // 이 함수는 Google Sheets 설정 후 구현됩니다
    // Web App 또는 Apps Script API를 통해 데이터를 가져옵니다
    
    /* 예시 구조:
    const response = await fetch(CONFIG.SHEETS_URL + '?action=getAll');
    const data = await response.json();
    return data;
    */
}

// 로컬 스토리지 사용 (임시 저장소)
function getLocalData() {
    const data = localStorage.getItem('hiqasc_symptoms');
    return data ? JSON.parse(data) : [];
}

function saveLocalData(data) {
    localStorage.setItem('hiqasc_symptoms', JSON.stringify(data));
}

// 오늘 날짜 가져오기
function getToday() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// 7일 전 날짜 계산
function getSevenDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
}

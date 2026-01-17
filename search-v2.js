// ========================================
// HIQASC 수리부서 위키 - 증상 검색
// DEVELOPED BY DONGGU KANG
// ========================================

let allSymptoms = [];
let filteredSymptoms = [];

document.addEventListener('DOMContentLoaded', function() {
    loadSymptoms();
    
    // 검색창에서 엔터 키 입력 시 검색
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSymptoms();
        }
    });
});

// 증상 데이터 로드
async function loadSymptoms() {
    try {
        // TODO: Google Sheets에서 데이터 가져오기
        // 현재는 로컬 스토리지에서 가져오기
        allSymptoms = getLocalSymptoms();
        
        // Google Sheets 연동 시 사용할 코드:
        allSymptoms = await fetchFromGoogleSheets();
        
        filteredSymptoms = allSymptoms;
        displayResults(filteredSymptoms);
        updateResultCount(filteredSymptoms.length);
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showNoResults('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 로컬 스토리지에서 증상 가져오기
function getLocalSymptoms() {
    const data = localStorage.getItem('hiqasc_symptoms');
    return data ? JSON.parse(data) : getSampleData();
}

// Google Sheets에서 데이터 가져오기 (설정 후 구현)
async function fetchFromGoogleSheets() {
    const SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL';
    
    try {
        const response = await fetch(SHEETS_URL + '?action=getAll');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Google Sheets 연동 오류:', error);
        return [];
    }
}

// 검색 및 필터링
function searchSymptoms() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterModel = document.getElementById('filterModel').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterTag = document.getElementById('filterTag').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // 필터링
    filteredSymptoms = allSymptoms.filter(symptom => {
        const matchSearch = !searchTerm || 
            symptom.symptomTitle.toLowerCase().includes(searchTerm) ||
            symptom.machine.toLowerCase().includes(searchTerm) ||
            symptom.errorCode.toLowerCase().includes(searchTerm) ||
            symptom.symptomDesc.toLowerCase().includes(searchTerm);
            
        const matchModel = !filterModel || symptom.model === filterModel;
        const matchStatus = !filterStatus || symptom.status === filterStatus;
        const matchTag = !filterTag || (symptom.tags && symptom.tags.includes(filterTag));
        
        return matchSearch && matchModel && matchStatus && matchTag;
    });
    
    // 정렬
    sortSymptoms(filteredSymptoms, sortBy);
    
    // 결과 표시
    displayResults(filteredSymptoms);
    updateResultCount(filteredSymptoms.length);
}

// 정렬
function sortSymptoms(symptoms, sortBy) {
    switch(sortBy) {
        case 'date-desc':
            symptoms.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            symptoms.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'model':
            symptoms.sort((a, b) => a.model.localeCompare(b.model));
            break;
    }
}

// 결과 표시
function displayResults(symptoms) {
    const container = document.getElementById('resultsContainer');
    
    if (symptoms.length === 0) {
        showNoResults('검색 결과가 없습니다.');
        return;
    }
    
    container.innerHTML = symptoms.map(symptom => createResultCard(symptom)).join('');
}

// 결과 카드 생성
function createResultCard(symptom) {
    const badgeClass = symptom.model === 'ORIGINAL' ? 'badge-original' : 
                       symptom.model === 'VERTUO' ? 'badge-vertuo' : 'badge-original';
    
    const tags = Array.isArray(symptom.tags) ? symptom.tags : 
                 (symptom.tags ? symptom.tags.split(',').map(t => t.trim()) : []);
    
    return `
        <div class="result-card" onclick="showDetail('${symptom.id}')">
            <div class="result-header">
                <div class="result-title">${symptom.symptomTitle}</div>
                <span class="result-badge ${badgeClass}">${symptom.model}</span>
            </div>
            
            <div class="result-meta">
                <div class="meta-item">
                    <span>🔧</span>
                    <span>${symptom.machine}</span>
                </div>
                ${symptom.errorCode ? `
                <div class="meta-item">
                    <span>⚠️</span>
                    <span>${symptom.errorCode}</span>
                </div>
                ` : ''}
                <div class="meta-item">
                    <span>📅</span>
                    <span>${symptom.date}</span>
                </div>
                <div class="meta-item">
                    <span>${getStatusIcon(symptom.status)}</span>
                    <span>${symptom.status}</span>
                </div>
            </div>
            
            <div class="result-description">
                ${truncateText(symptom.symptomDesc, 150)}
            </div>
            
            ${tags.length > 0 ? `
            <div class="result-tags">
                ${tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
            ` : ''}
            
            <div class="meta-item" style="margin-top: 15px; color: var(--text-secondary);">
                <span>👤</span>
                <span>${symptom.author}</span>
            </div>
        </div>
    `;
}

// 상세 보기 모달
function showDetail(id) {
    const symptom = allSymptoms.find(s => s.id === id);
    if (!symptom) return;
    
    const tags = Array.isArray(symptom.tags) ? symptom.tags : 
                 (symptom.tags ? symptom.tags.split(',').map(t => t.trim()) : []);
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2 style="color: var(--primary-color); margin-bottom: 20px;">
            ${symptom.symptomTitle}
        </h2>
        
        <div style="display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap;">
            <span class="result-badge ${symptom.model === 'ORIGINAL' ? 'badge-original' : 'badge-vertuo'}">
                ${symptom.model}
            </span>
            <span class="tag">${symptom.machine}</span>
            ${symptom.errorCode ? `<span class="tag">에러: ${symptom.errorCode}</span>` : ''}
            <span class="tag">${getStatusIcon(symptom.status)} ${symptom.status}</span>
        </div>
        
        <div class="detail-section">
            <h4>📋 증상 설명</h4>
            <p>${symptom.symptomDesc}</p>
        </div>
        
        ${symptom.condition ? `
        <div class="detail-section">
            <h4>⚡ 발생 조건</h4>
            <p>${symptom.condition}</p>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>🔧 해결 방법</h4>
            <p>${symptom.solution}</p>
        </div>
        
        ${symptom.parts ? `
        <div class="detail-section">
            <h4>🛠️ 필요 부품</h4>
            <p>${symptom.parts}</p>
        </div>
        ` : ''}
        
        ${tags.length > 0 ? `
        <div class="detail-section">
            <h4>🏷️ 태그</h4>
            <div class="result-tags">
                ${tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${symptom.notes ? `
        <div class="detail-section">
            <h4>📝 추가 메모</h4>
            <p>${symptom.notes}</p>
        </div>
        ` : ''}
        
        <div class="detail-section" style="border-top: 2px solid var(--border-color); padding-top: 20px; margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>👤 작성자: <strong>${symptom.author}</strong></span>
                <span>📅 등록일: <strong>${symptom.date}</strong></span>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('detailModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

// 필터 초기화
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterModel').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterTag').value = '';
    document.getElementById('sortBy').value = 'date-desc';
    searchSymptoms();
}

// 결과 수 업데이트
function updateResultCount(count) {
    document.getElementById('resultCount').innerHTML = 
        `총 <strong>${count}</strong>건의 증상이 ${count === allSymptoms.length ? '등록되어 있습니다.' : '검색되었습니다.'}`;
}

// 결과 없음 표시
function showNoResults(message) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="text-center" style="padding: 60px 20px;">
            <div style="font-size: 3em; margin-bottom: 20px;">😕</div>
            <h3 style="color: var(--text-secondary);">${message}</h3>
            <p style="color: var(--text-secondary); margin-top: 10px;">
                다른 검색어나 필터를 시도해보세요.
            </p>
        </div>
    `;
}

// 텍스트 자르기
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 상태 아이콘
function getStatusIcon(status) {
    switch(status) {
        case '해결': return '✅';
        case '진행중': return '⏳';
        case '미해결': return '❓';
        default: return '📌';
    }
}

// 샘플 데이터 (테스트용)
function getSampleData() {
    return [
        {
            id: 'SYM001',
            date: '2025-01-15',
            time: '14:30:00',
            model: 'VERTUO',
            machine: 'ENV120',
            symptomTitle: '추출 시 이상 소음 발생',
            errorCode: 'E03',
            symptomDesc: '커피 추출 버튼을 누르면 "드드드" 하는 큰 소음이 발생합니다. 정상 추출은 되지만 소음이 매우 심합니다.',
            condition: '매번 추출할 때마다 발생하며, 특히 아침 첫 추출 시 더 심합니다.',
            solution: '1. 펌프 모터 연결부 확인\n2. 물탱크 분리 후 재장착\n3. 펌프 모터 교체 필요',
            parts: '펌프모터(NV-PUMP-120)',
            tags: ['소음', '펌프'],
            status: '해결',
            author: '강동구',
            notes: '펌프 모터 교체 후 정상 작동 확인'
        },
        {
            id: 'SYM002',
            date: '2025-01-14',
            time: '10:15:00',
            model: 'ORIGINAL',
            machine: 'CitiZ',
            symptomTitle: '물 누수 문제',
            errorCode: '',
            symptomDesc: '커피 추출 후 하단부에서 물이 새어나옵니다.',
            condition: '추출 완료 후 5-10초 후 발생',
            solution: '1. 물탱크 씰링 점검\n2. 드립트레이 확인\n3. 씰링 교체',
            parts: '워터탱크씰(OR-SEAL-01)',
            tags: ['누수'],
            status: '진행중',
            author: '김수리',
            notes: '부품 주문 완료, 입고 대기 중'
        }
    ];
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        closeModal();
    }
}

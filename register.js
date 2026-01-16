// ========================================
// HIQASC 수리부서 위키 - 증상 등록
// DEVELOPED BY DONGGU KANG
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('symptomForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 폼 데이터 수집
        const formData = {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ko-KR'),
            model: document.getElementById('model').value,
            machine: document.getElementById('machine').value,
            symptomTitle: document.getElementById('symptomTitle').value,
            errorCode: document.getElementById('errorCode').value,
            symptomDesc: document.getElementById('symptomDesc').value,
            condition: document.getElementById('condition').value,
            solution: document.getElementById('solution').value,
            parts: document.getElementById('parts').value,
            tags: Array.from(document.getElementById('tags').selectedOptions).map(opt => opt.value),
            status: document.getElementById('status').value,
            author: document.getElementById('author').value,
            notes: document.getElementById('notes').value,
            id: generateId()
        };

        try {
            // Google Sheets에 저장 (설정 후 활성화)
             await saveToGoogleSheets(formData);
            
            // 임시로 로컬 스토리지에 저장
            // saveToLocalStorage(formData);
            
            // 성공 메시지
            showAlert('success', '✅ 증상이 성공적으로 등록되었습니다!');
            
            // 폼 초기화
            setTimeout(() => {
                form.reset();
                // 3초 후 검색 페이지로 이동
                location.href = 'search.html';
            }, 2000);
            
        } catch (error) {
            console.error('등록 실패:', error);
            showAlert('error', '❌ 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
});

// 고유 ID 생성
function generateId() {
    return 'SYM' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// 로컬 스토리지에 저장
function saveToLocalStorage(data) {
    let symptoms = JSON.parse(localStorage.getItem('hiqasc_symptoms') || '[]');
    symptoms.push(data);
    localStorage.setItem('hiqasc_symptoms', JSON.stringify(symptoms));
}

// Google Sheets에 저장 (설정 후 구현)
async function saveToGoogleSheets(data) {
    const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwaCYC3isyOWKx6-AkvJ1ShEfN5fqbqg__s20yvFNdN4NN3bjPfRAZQwBWsIOSkgK9N/exec';
    
    const response = await fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'addSymptom',
            data: data
        })
    });
    
    // no-cors 모드에서는 응답을 읽을 수 없음
    // Web App이 정상 작동하는지는 Sheets에서 직접 확인 필요
    return true;
}

// 알림 메시지 표시
function showAlert(type, message) {
    const alertDiv = document.getElementById('alertMessage');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    alertDiv.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    // 5초 후 알림 제거
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

// Google Sheets Apps Script 웹 앱 예시 코드
/*
===========================================
Google Apps Script 코드 (별도 설정 필요)
===========================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('증상DB');
    
    if (data.action === 'addSymptom') {
      const row = [
        data.data.date,
        data.data.time,
        data.data.model,
        data.data.machine,
        data.data.symptomTitle,
        data.data.errorCode,
        data.data.symptomDesc,
        data.data.condition,
        data.data.solution,
        data.data.parts,
        data.data.tags.join(', '),
        data.data.status,
        data.data.author,
        data.data.notes,
        data.data.id
      ];
      
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        id: data.data.id
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('증상DB');
  
  if (action === 'getAll') {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

*/
// 강제 업데이트

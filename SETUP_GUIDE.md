# HIQASC 수리부서 위키 - Google Sheets 연동 가이드

**DEVELOPED BY DONGGU KANG**

---

## 📋 목차

1. [개요](#개요)
2. [Google Sheets 준비](#google-sheets-준비)
3. [Apps Script 설정](#apps-script-설정)
4. [웹 앱 배포](#웹-앱-배포)
5. [위키와 연동](#위키와-연동)
6. [테스트](#테스트)

---

## 개요

현재 위키는 **로컬 스토리지**를 사용하여 데이터를 임시 저장합니다.
실제 운영을 위해서는 **Google Sheets**와 연동하여 모든 팀원이 데이터를 공유해야 합니다.

### 연동 후 가능한 기능
- ✅ 모든 팀원의 증상 등록이 중앙 DB에 저장
- ✅ 실시간 검색 및 조회
- ✅ 데이터 백업 자동화
- ✅ Excel 내보내기 가능

---

## Google Sheets 준비

### Step 1: 새 스프레드시트 생성

1. Google Drive 접속 (https://drive.google.com)
2. **새로 만들기** → **Google 스프레드시트**
3. 이름: `HIQASC 수리 위키 데이터베이스`

### Step 2: 시트 이름 변경

- 기본 시트 이름을 `증상DB`로 변경

### Step 3: 헤더 행 생성

첫 번째 행에 다음 열 이름을 입력:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 날짜 | 시간 | 모델 | 기종 | 증상제목 | 에러코드 | 증상설명 | 발생조건 | 해결방법 | 필요부품 | 태그 | 상태 | 작성자 | 메모 | ID |

### Step 4: 데이터 형식 설정

- **날짜** 열: 날짜 형식
- **시간** 열: 시간 형식
- 나머지: 일반 텍스트

---

## Apps Script 설정

### Step 1: Apps Script 에디터 열기

1. 스프레드시트에서 **확장 프로그램** → **Apps Script**
2. 기본 코드 삭제

### Step 2: 코드 복사 & 붙여넣기

아래 코드를 Apps Script 에디터에 붙여넣기:

```javascript
// ========================================
// HIQASC 수리 위키 - Google Apps Script
// DEVELOPED BY DONGGU KANG
// ========================================

// POST 요청 처리 (증상 등록)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('증상DB');
    
    if (data.action === 'addSymptom') {
      const symptomData = data.data;
      
      // 태그 배열을 문자열로 변환
      const tags = Array.isArray(symptomData.tags) 
        ? symptomData.tags.join(', ') 
        : symptomData.tags;
      
      const row = [
        symptomData.date,
        symptomData.time,
        symptomData.model,
        symptomData.machine,
        symptomData.symptomTitle,
        symptomData.errorCode,
        symptomData.symptomDesc,
        symptomData.condition,
        symptomData.solution,
        symptomData.parts,
        tags,
        symptomData.status,
        symptomData.author,
        symptomData.notes,
        symptomData.id
      ];
      
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        id: symptomData.id
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 처리 (증상 조회)
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('증상DB');
    
    if (action === 'getAll') {
      const data = sheet.getDataRange().getValues();
      
      // 헤더가 없으면 빈 배열 반환
      if (data.length === 0) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const headers = data[0];
      const rows = data.slice(1);
      
      // 각 행을 객체로 변환
      const result = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          // 태그는 배열로 변환
          if (header === '태그' && row[index]) {
            obj.tags = row[index].split(',').map(tag => tag.trim());
          } else {
            obj[header] = row[index];
          }
        });
        return obj;
      });
      
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 통계 정보
    if (action === 'getStats') {
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1);
      
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      let recentCount = 0;
      let solvedCount = 0;
      
      rows.forEach(row => {
        const dateStr = row[0]; // 날짜 열
        const status = row[11]; // 상태 열
        
        if (dateStr) {
          const rowDate = new Date(dateStr);
          if (rowDate >= sevenDaysAgo) {
            recentCount++;
          }
        }
        
        if (status === '해결') {
          solvedCount++;
        }
      });
      
      const stats = {
        total: rows.length,
        recent: recentCount,
        solved: solvedCount
      };
      
      return ContentService.createTextOutput(JSON.stringify(stats))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 3: 저장

1. 프로젝트 이름: `HIQASC Wiki API`
2. **저장** 버튼 클릭 (💾 아이콘)

---

## 웹 앱 배포

### Step 1: 배포 설정

1. **배포** → **새 배포**
2. **유형 선택** → **웹 앱**
3. 설정:
   - **설명**: HIQASC 수리 위키 API v1
   - **실행 위치**: 나
   - **액세스 권한**: **모든 사용자** ⚠️ (중요!)

### Step 2: 배포 승인

1. **배포** 버튼 클릭
2. 권한 검토 및 승인
3. **고급** → **안전하지 않은 페이지로 이동** (신뢰할 수 있는 본인의 스크립트)
4. **허용** 클릭

### Step 3: 웹 앱 URL 복사

배포 완료 후 표시되는 **웹 앱 URL**을 복사합니다.

예시:
```
https://script.google.com/macros/s/AKfycby.../exec
```

⚠️ **이 URL을 안전하게 보관하세요!**

---

## 위키와 연동

### Step 1: JavaScript 파일 수정

다운로드한 위키 파일 중 다음 3개 파일을 텍스트 에디터로 엽니다:
- `script.js`
- `register.js`
- `search.js`

### Step 2: URL 입력

각 파일에서 다음 부분을 찾아 수정:

**script.js:**
```javascript
const CONFIG = {
    SHEETS_URL: 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE',  // ← 여기에 붙여넣기
```

**register.js:**
```javascript
async function saveToGoogleSheets(data) {
    const SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL';  // ← 여기에 붙여넣기
```

**search.js:**
```javascript
async function fetchFromGoogleSheets() {
    const SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL';  // ← 여기에 붙여넣기
```

### Step 3: 로컬 스토리지 → Sheets 전환

**register.js**에서 다음 부분 수정:

```javascript
// 기존 (주석 처리)
// saveToLocalStorage(formData);

// 새로 추가 (주석 해제)
await saveToGoogleSheets(formData);
```

**search.js**에서 다음 부분 수정:

```javascript
// 기존 (주석 처리)
// allSymptoms = getLocalSymptoms();

// 새로 추가 (주석 해제)
allSymptoms = await fetchFromGoogleSheets();
```

### Step 4: 파일 저장

모든 수정사항 저장

---

## 테스트

### Step 1: 웹페이지 열기

`index.html` 파일을 브라우저에서 열기

### Step 2: 증상 등록 테스트

1. **신규 증상 등록** 클릭
2. 테스트 데이터 입력
3. **등록하기** 클릭
4. Google Sheets에서 데이터 확인

### Step 3: 검색 테스트

1. **증상 검색** 클릭
2. 등록한 데이터가 표시되는지 확인

### Step 4: 문제 해결

**데이터가 저장되지 않는 경우:**
- Apps Script 배포 권한 확인 ("모든 사용자")
- 웹 앱 URL이 정확한지 확인
- 브라우저 콘솔 (F12)에서 오류 확인

**데이터가 조회되지 않는 경우:**
- Sheets에 헤더 행이 있는지 확인
- 시트 이름이 "증상DB"인지 확인

---

## 추가 기능 (선택사항)

### 데이터 백업

Google Sheets는 자동으로 버전 관리됩니다.
- **파일** → **버전 기록** → **버전 기록 보기**

### Excel 내보내기

언제든지 Excel로 내보내기 가능:
- **파일** → **다운로드** → **Microsoft Excel (.xlsx)**

### 권한 관리

Sheets 공유 설정:
- **공유** 버튼 → 팀원 이메일 추가
- 권한: "편집자" (데이터 수정 가능) 또는 "뷰어" (읽기만)

---

## 완료! 🎉

이제 HIQASC 수리부서 위키가 Google Sheets와 완전히 연동되었습니다!

모든 팀원이 웹사이트 URL만 알면:
- 계정 없이 접속
- 증상 등록 및 검색
- 실시간 데이터 공유

---

## 문의

문제가 발생하면 팀장 강동구에게 연락주세요.

**DEVELOPED BY DONGGU KANG**

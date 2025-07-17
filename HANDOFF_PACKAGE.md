# Level Up 2025 관리자 앱 개발을 위한 핸드오프 패키지

## 현재 상황
- **학생/교사 앱**: 완료 (모바일 최적화, 달란트 시스템 완벽 구현)
- **다음 단계**: 관리자 전용 앱 개발 (별도 프로젝트)

## 관리자 앱 요구사항

### 기술 스택
- React 19.1.0 + Vite 7.0.4
- Tailwind CSS 4.1.11 (16:9 비율 대응)
- Supabase (기존 데이터베이스 공유)

### 주요 기능
1. **사용자 관리**
   - 전체 사용자 목록 (학생/교사)
   - 사용자 정보 수정 (조, 역할, 개인정보)
   - 사용자 추가/삭제

2. **달란트 관리**
   - 전체 달란트 현황 대시보드
   - 개별 학생 달란트 조정
   - 일괄 달란트 지급/차감

3. **통계 및 리포트**
   - 조별 달란트 현황
   - 트랜잭션 히스토리 (전체)
   - 레벨별 학생 분포

4. **시스템 설정**
   - 조 관리 (생성/수정/삭제)
   - 레벨 시스템 설정
   - 백업/복원 기능

### 데이터베이스 정보
- **Supabase 연결**: 기존 프로젝트와 동일한 데이터베이스 사용
- **테이블**: users, talent_transactions
- **함수**: process_talent_transaction (이미 구현됨)

### 보안 요구사항
- 관리자 전용 인증 시스템
- 기존 학생/교사 앱에서 관리자 로그인 제거
- IP 제한 또는 별도 도메인 사용 권장

### 참조 파일들
1. **환경 설정**: levelup_2025/.env (Supabase 키)
2. **유틸리티**: levelup_2025/src/lib/ (재사용 가능)
3. **스타일**: 기존 색상 팔레트 (#21AFE6, #EC6034)

### 프로젝트 구조 제안
```
levelup_admin/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── UserManagement/
│   │   ├── TalentManagement/
│   │   └── Reports/
│   ├── lib/
│   │   ├── supabase.js (기존 것 복사)
│   │   ├── adminUtils.js (새로 작성)
│   │   └── talentTransactions.js (기존 것 복사)
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

### 즉시 시작 가능한 명령어
```bash
# 새 프로젝트 생성
npm create vite@latest levelup_admin -- --template react
cd levelup_admin

# 의존성 설치
npm install @supabase/supabase-js @tailwindcss/vite tailwindcss react-router-dom

# 개발 서버 시작
npm run dev
```

### 기존 코드 재사용
- `src/lib/supabase.js`: 그대로 복사
- `src/lib/talentTransactions.js`: 그대로 복사
- `src/lib/levelUtils.js`: 그대로 복사
- 환경 변수: 동일한 Supabase 설정 사용

## 현재 앱에서 제거할 부분
- 관리자 로그인 기능
- 관리자 페이지 컴포넌트
- 관리자 관련 라우팅
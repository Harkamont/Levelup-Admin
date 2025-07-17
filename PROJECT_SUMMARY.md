# Level Up 2025 프로젝트 요약

## 프로젝트 개요
- **목적**: 2025 여름 수련회 달란트 관리 시스템
- **사용자**: 학생, 교사, 관리자
- **기술 스택**: React 19.1.0, Vite 7.0.4, Tailwind CSS 4.1.11, Supabase

## 데이터베이스 구조

### users 테이블
```sql
- id (uuid, primary key)
- username (text, unique)
- name (text)
- gender (text: '남', '여')
- grade (text: '중1'~'고3', '교사', '관리자')
- church (text: '한내교회', '증가교회')
- group (text, nullable)
- role (text: 'admin', 'teacher', 'student')
- birthdate (date, nullable)
- password (text, nullable)
- max_talent (integer, default 0)
- current_talent (integer, default 0)
```

### talent_transactions 테이블
```sql
- id (uuid, primary key)
- student_id (uuid, foreign key to users)
- teacher_id (uuid, foreign key to users)
- amount (integer)
- reason (text, nullable)
- transaction_type (text: 'individual_give', 'individual_take', 'group_give')
- created_at (timestamptz, default now())
```

### PostgreSQL 함수ㅇ
```sql
process_talent_transaction(p_student_id, p_teacher_id, p_amount, p_reason, p_transaction_type)
- 안전한 트랜잭션 처리
- 달란트 부족 시 에러 반환
- 원자적 트랜잭션 보장
```

## 구현된 기능

### 학생 페이지
- 현재 달란트 현황 표시
- 레벨 시스템 (1000점당 1레벨)
- 개인 정보 표시
- 조 멤버 목록

### 교사 페이지
- 개인 달란트 지급/회수
- 조별 달란트 지급
- 트랜잭션 히스토리
- 실시간 학생 정보 업데이트

### 보안 기능
- 안전한 트랜잭션 처리 (PostgreSQL 함수)
- 달란트 부족 시 차감 방지
- 트랜잭션 무결성 보장

## 파일 구조
```
levelup_2025/
├── src/
│   ├── components/
│   │   └── LoginPage.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── levelUtils.js
│   │   └── talentTransactions.js
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── Logo.png
│   └── background.png
└── package.json
```

## 환경 변수
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 다음 단계: 관리자 앱
- 별도 프로젝트로 분리
- 16:9 비율 대응 (데스크톱/태블릿)
- 사용자 관리, 통계, 대시보드 기능
- 보안 강화된 별도 인증
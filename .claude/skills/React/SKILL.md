---
name: React
description: React 개발 원칙. 컴포넌트 설계, 상태 관리, 훅 사용 규칙, 성능 최적화.
keywords: [React, 컴포넌트, useState, useEffect, 훅, props, 상태관리, 렌더링, 최적화]
estimated_tokens: ~600
---

# React 개발 스킬

## 핵심 역할

- React 컴포넌트 설계 및 구현 가이드
- 상태 관리 패턴 적용
- 성능 최적화 기법 적용

## 컴포넌트 설계 원칙

### 파일/폴더 구조

```
src/
├── components/          # 재사용 가능한 공통 컴포넌트
│   └── Button/
│       ├── Button.tsx
│       ├── Button.styles.ts
│       └── index.ts
├── features/            # 기능별 모듈
│   └── auth/
│       ├── components/
│       ├── hooks/
│       └── utils/
├── hooks/               # 공통 커스텀 훅
├── utils/               # 유틸리티 함수
└── types/               # 공통 타입 정의
```

### 컴포넌트 분류

| 유형 | 설명 | 예시 |
|------|------|------|
| Presentational | UI만 담당, props로 데이터 수신 | Button, Card, Input |
| Container | 로직/상태 관리, 데이터 fetch | UserListContainer |
| Layout | 페이지 레이아웃 구조 | Header, Sidebar, Footer |
| Page | 라우트에 매핑되는 페이지 | HomePage, LoginPage |

## 필수 준수 사항

### 컴포넌트 작성

| 규칙 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| 함수형 컴포넌트 사용 | `function Button() {}` | `class Button extends React.Component` |
| Props 타입 명시 | `interface ButtonProps { ... }` | `props: any` |
| 단일 책임 원칙 | 하나의 역할만 담당 | 여러 기능 혼합 |
| 적절한 컴포넌트 분리 | 100줄 이하 권장 | 500줄 이상의 거대 컴포넌트 |

### 상태 관리

| 규칙 | 설명 |
|------|------|
| 상태 최소화 | 파생 가능한 값은 상태로 두지 않음 |
| 상태 위치 | 필요한 가장 가까운 공통 조상에 배치 |
| 불변성 유지 | 상태 직접 수정 금지, 새 객체/배열 생성 |
| 복잡한 상태 | useReducer 또는 상태 관리 라이브러리 사용 |

### Hooks 규칙

| 규칙 | 설명 |
|------|------|
| 최상위에서만 호출 | 조건문, 반복문 내부에서 호출 금지 |
| 의존성 배열 정확히 | useEffect, useMemo, useCallback의 deps 누락 금지 |
| 커스텀 훅 추출 | 재사용 가능한 로직은 커스텀 훅으로 분리 |
| 훅 네이밍 | `use` 접두사 필수 (예: `useAuth`, `useFetch`) |

## 성능 최적화

### 메모이제이션

```typescript
// 컴포넌트 메모이제이션
const MemoizedComponent = React.memo(Component);

// 값 메모이제이션
const expensiveValue = useMemo(() => computeExpensive(a, b), [a, b]);

// 함수 메모이제이션
const handleClick = useCallback(() => doSomething(id), [id]);
```

### 최적화 적용 기준

| 상황 | 적용 |
|------|------|
| 리스트 렌더링 | `key` prop 필수, 안정적인 ID 사용 |
| 자주 리렌더링되는 컴포넌트 | `React.memo` 적용 검토 |
| 비용이 큰 계산 | `useMemo` 사용 |
| 자식에게 전달하는 콜백 | `useCallback` 사용 |

### 불필요한 최적화 금지

- 모든 컴포넌트에 무조건 memo 적용 금지
- 측정 없이 최적화하지 않음 (React DevTools Profiler 사용)

## useEffect 패턴

### 올바른 사용

```typescript
// 데이터 fetch
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [dependency]);

// 이벤트 구독
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 피해야 할 패턴

| 안티패턴 | 대안 |
|----------|------|
| props를 state로 복사 | props 직접 사용 |
| 렌더링 중 상태 업데이트 | 조건부 렌더링 또는 useMemo |
| 불필요한 Effect | 이벤트 핸들러로 처리 |

## 체크리스트

### 컴포넌트 작성 시
- [ ] Props 타입이 명시되어 있는가?
- [ ] 컴포넌트가 단일 책임을 가지는가?
- [ ] 적절한 크기로 분리되어 있는가?

### 상태 관리
- [ ] 상태가 최소화되어 있는가?
- [ ] 상태 위치가 적절한가?
- [ ] 불변성이 유지되는가?

### Hooks
- [ ] 의존성 배열이 정확한가?
- [ ] cleanup 함수가 필요한 경우 작성되었는가?
- [ ] 커스텀 훅으로 분리할 로직이 있는가?

### 성능
- [ ] 리스트에 적절한 key가 사용되었는가?
- [ ] 불필요한 리렌더링이 없는가?
- [ ] 메모이제이션이 적절히 사용되었는가?

## 관련 문서

| 문서 | 설명 |
|------|------|
| `tanstack-router.md` | TanStack Router 파일 기반 라우팅 패턴 |
| `react-hook-form.md` | React Hook Form + Zod 폼 검증 패턴 |

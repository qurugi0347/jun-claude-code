---
name: Coding
description: 모든 코드 작성 시 참조. SRP/결합도/응집도 판단 기준, 폴더 구조 설계 원칙, 삼항연산자/try-catch 가독성 규칙 제공.
keywords: [SRP, 단일책임, 결합도, 응집도, 설계원칙, 폴더구조, 아키텍처, 가독성, 삼항연산자, try-catch]
user-invocable: false
---

# 공통 코딩 원칙

<rules>

## 단일 책임 원칙 (SRP)

> **하나의 모듈/컴포넌트는 하나의 책임만 가진다.**

### 백엔드 레이어별 책임

| 레이어 | 책임 | 전담 영역 |
|--------|------|----------|
| **Entity** | 데이터 구조 정의 | 구조 정의에 집중 |
| **Repository** | 데이터 접근 | 데이터 접근에 집중 |
| **Service** | 비즈니스 로직 | 비즈니스 로직에 집중 |
| **Controller** | 요청 라우팅 | 요청/응답 처리에 집중 |
| **DTO/Schema** | 데이터 전송 구조 | 데이터 전송에 집중 |

### 프론트엔드 컴포넌트별 책임

| 유형 | 책임 | 전담 영역 |
|------|------|----------|
| **Page** | 레이아웃, 데이터 fetch | 레이아웃과 fetch에 집중 |
| **Container** | 상태 관리, API 호출 | 상태/API에 집중 |
| **Presentational** | UI 렌더링 | UI 렌더링에 집중 (props로 데이터 수신) |
| **Hook** | 특정 로직 캡슐화 | 단일 로직에 집중 |
| **Store** | 전역 상태 | 상태 관리에 집중 |

---

## 결합도 낮추기

> **모듈 간 의존성을 최소화한다.**

### 공통 규칙

| 규칙 | 설명 |
|------|------|
| **단방향 의존 유지** | A → B 단방향으로 유지 (순환 구조 대신) |
| **상위 모듈은 독립적으로 유지** | shared는 도메인 모듈과 독립 유지 |
| **인터페이스에 의존** | 구체 클래스 대신 추상화에 의존 |
| **공개 API 통해 접근** | index.ts를 통한 export만 사용 |

### 백엔드

<examples>
<example type="good">
```typescript
// 토큰 기반 주입 / 인터페이스 의존
@Inject(PRODUCT_REPOSITORY)
private readonly repository: IProductRepository
```
</example>
<example type="bad">
```typescript
// ❌ 구체 클래스 직접 의존
private readonly repository: ProductRepository
```
</example>
</examples>

### 프론트엔드

<examples>
<example type="good">
```typescript
// props로 의존성 전달
function ProductCard({ product, onAction }: Props) { ... }
```
</example>
<example type="bad">
```typescript
// ❌ Presentational에서 전역 상태 직접 접근
const action = useStore(s => s.action);
```
</example>
</examples>

---

## 응집도 높이기

> **관련 있는 코드는 가까이 둔다.**

### 폴더 구조 원칙

```
높은 응집도:
- 같은 도메인 파일은 같은 폴더에
- 컴포넌트와 관련 스타일은 같은 파일에
- 기능별 hook 분리

낮은 응집도 (피해야 함):
- 관련 없는 기능을 한 파일에
- 모든 컴포넌트를 최상위에
- 여러 도메인을 한 모듈에서 처리
```

### 폴더 구조 예시

```
src/
├── module/
│   ├── domain/          # Entity (공유)
│   ├── product/         # 기능별 폴더
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   ├── product.dto.ts
│   │   └── product.module.ts
│   └── order/
└── shared/              # 공통 (도메인 모듈과 독립 유지)
```

```
src/
├── components/
│   ├── product/         # 도메인별 폴더
│   │   ├── ProductCard.tsx
│   │   ├── ProductList.tsx
│   │   └── index.ts
│   └── common/          # 공통 (도메인과 독립 유지)
├── hooks/               # 도메인별 hook
├── store/               # 전역 상태
└── shared/              # 유틸리티
```

</rules>

---

<rules>

## 가독성 규칙

### try-catch vs then-catch

> **Promise 처리 시 `then-catch` 패턴을 사용한다.**

<examples>
<example type="bad">
```typescript
// ❌ try-catch (가독성 저하)
async function fetchUser(id: string) {
  try {
    const user = await userService.findById(id);
    return user;
  } catch (error) {
    throw new NotFoundException('User not found');
  }
}
```
</example>
<example type="good">
```typescript
// ✅ then-catch (가독성 향상)
function fetchUser(id: string) {
  return userService.findById(id)
    .then(user => user)
    .catch(() => {
      throw new NotFoundException('User not found');
    });
}
```
</example>
</examples>

### 삼항연산자 규칙

> **삼항연산자에서 인자가 2개 이상인 함수 호출은 변수로 분리한다.**

<examples>
<example type="bad">
```typescript
// ❌ 삼항연산자 내 복잡한 함수 호출
const result = isAdmin
  ? processAdminData(data, options, config)
  : processUserData(data, options);
```
</example>
<example type="good">
```typescript
// ✅ 변수로 분리 후 사용
const processor = isAdmin ? processAdminData : processUserData;
const result = processor(data, options, config);

// ✅ 또는 if문 사용
let result;
if (isAdmin) {
  result = processAdminData(data, options, config);
} else {
  result = processUserData(data, options);
}
```
</example>
</examples>

**삼항연산자 허용 케이스:**
- 단순 값 선택: `const name = isKorean ? '홍길동' : 'John';`
- 인자 없는/1개 함수: `const value = isValid ? getValue() : getDefault();`

</rules>

---

<rules>

## 주석 작성 원칙

> **WHY를 남긴다. naming만으로 의도가 드러나면 주석을 생략한다.**

### 5가지 기준

| 항목 | 원칙 |
|------|------|
| **무엇을 (What)** | 의도/비자명한 제약/도메인 규칙 등 WHY 중심으로 작성. naming만으로 의도가 드러나는 자명한 코드는 주석 생략 |
| **어디에 (Where)** | 분기/블록 등 **로직 단위** 위에 작성. 함수 docstring은 필요한 경우에만 사용 |
| **어떻게 (How)** | 인라인 또는 block 주석으로 **최대 2줄, 부득이한 경우에만 3줄까지** |
| **TODO/FIXME/NOTE** | 단순 표시 대신 **다음에 어떻게 행동해야 하는지**까지 명시 |
| **시점** | 작성자의 주관적 판단으로 남기되, 코드리뷰의 추가/삭제 요구를 우선 반영 |

### 좋은 예 / 피해야 할 예

<examples>
<example type="bad">
```typescript
// ❌ 자명한 코드에 What 주석 (naming만으로 의도 파악 가능)
// 사용자 ID로 사용자 조회
const user = await userRepository.findById(userId);

// ❌ 단순 마커 — 다음 행동을 알 수 없음
// TODO: 나중에 처리
await sendNotification(user);

// ❌ 길이 초과 (4줄)
// 이 함수는 사용자에게 알림을 보냅니다.
// 알림 채널은 푸시와 이메일이 있고,
// 푸시가 실패하면 이메일로 fallback 합니다.
// 그리고 결과를 로그로 남깁니다.
await notify(user);
```
</example>
<example type="good">
```typescript
// ✅ WHY 중심 — 비자명한 도메인 규칙 설명 (분기 단위)
// VIP 고객은 결제 실패 시에도 즉시 차단하지 않는다 (CS 정책)
if (user.tier === 'VIP' && payment.failed) {
  return scheduleRetry(payment);
}

// ✅ TODO에 다음 행동 명시
// TODO: API rate limit 도입 시 retry interval을 backoff 기반으로 조정
await sendNotification(user);

// ✅ 2줄 이내 + WHY
// 푸시 실패 시 이메일 fallback 필요 — iOS APNs 일시 장애 대비책
await notifyWithFallback(user);
```
</example>
</examples>

</rules>

---

<checklist>

## 코드 작성 시 체크리스트

- [ ] 이 파일의 책임은 하나인가?
- [ ] 다른 모듈에 불필요한 의존이 있는가? (있다면 제거)
- [ ] 관련 파일들이 같은 폴더에 있는가?
- [ ] 단방향 의존이 유지되는가?
- [ ] 공개 API(index.ts)를 통해 접근하는가?
- [ ] Promise 처리에 then-catch 패턴을 사용했는가?
- [ ] 삼항연산자에서 복잡한 함수 호출을 변수로 분리했는가?
- [ ] 주석은 WHY 중심이며 로직 단위에 2~3줄로 작성되었는가?
- [ ] TODO/FIXME/NOTE에 다음 행동이 명시되어 있는가?

</checklist>

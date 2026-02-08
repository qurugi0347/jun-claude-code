---
name: tanstack-router
description: TanStack Router 파일 기반 라우팅 패턴. 동적 라우트, 레이아웃, 인증 guard.
keywords: [tanstack, router, 라우팅, 파일기반, createFileRoute, navigate, beforeLoad, guard]
estimated_tokens: ~450
---

# TanStack Router 패턴

## 핵심 역할

- 파일 기반 라우팅 설정
- 동적 라우트 및 레이아웃 구성
- 인증 guard 구현
- 타입 안전한 네비게이션

## 파일 기반 라우팅 구조

```
src/routes/
├── __root.tsx           # 루트 레이아웃
├── index.tsx            # / 경로
├── _layout.tsx          # 공통 레이아웃 (언더스코어)
├── _layout/
│   ├── dashboard.tsx    # /dashboard
│   └── settings.tsx     # /settings
├── products/
│   ├── index.tsx        # /products
│   └── $productId.tsx   # /products/:productId (동적)
└── auth/
    ├── login.tsx        # /auth/login
    └── register.tsx     # /auth/register
```

## 필수 준수 사항

| 규칙 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| 동적 라우트 | `$slug.tsx`, `$productId.tsx` | `:slug.tsx`, `[slug].tsx` |
| 레이아웃 라우트 | `_layout.tsx` (언더스코어) | `layout.tsx` |
| 루트 라우트 | `__root.tsx` (더블 언더스코어) | `root.tsx` |
| 네비게이션 훅 | `Route.useNavigate()` | `useNavigate()` 직접 import |

## 라우트 정의 패턴

### 기본 라우트

```typescript
// routes/products/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/')({
  component: ProductsPage,
})

function ProductsPage() {
  return <div>Products List</div>
}
```

### 동적 라우트

```typescript
// routes/products/$productId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  return <div>Product: {productId}</div>
}
```

### 루트 레이아웃

```typescript
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
```

### 레이아웃 라우트 (그룹화)

```typescript
// routes/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: LayoutWrapper,
})

function LayoutWrapper() {
  return (
    <div className="with-sidebar">
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

## 네비게이션

```typescript
function ProductCard({ productId }: { productId: string }) {
  const navigate = Route.useNavigate()

  const handleClick = () => {
    navigate({ to: '/products/$productId', params: { productId } })
  }

  return <button onClick={handleClick}>View Product</button>
}
```

## 인증 Guard (beforeLoad)

```typescript
// routes/_authenticated.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { isAuthenticated } = context.auth

    if (!isAuthenticated) {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.pathname },
      })
    }
  },
  component: AuthenticatedLayout,
})
```

### 역할 기반 Guard

```typescript
export const Route = createFileRoute('/_admin')({
  beforeLoad: async ({ context }) => {
    const { user } = context.auth

    if (!user || user.role !== 'admin') {
      throw redirect({ to: '/unauthorized' })
    }
  },
})
```

## 체크리스트

### 라우트 설정 시
- [ ] 동적 파라미터에 `$` 프리픽스 사용
- [ ] 레이아웃 라우트에 `_` 프리픽스 사용
- [ ] 루트 레이아웃은 `__root.tsx`

### 네비게이션
- [ ] `Route.useNavigate()` 사용
- [ ] 타입 안전한 params 전달
- [ ] 동적 파라미터는 params 객체로 전달

### 인증
- [ ] beforeLoad에서 인증 체크
- [ ] redirect로 리다이렉트 처리
- [ ] 원래 경로 저장 (redirect search param)

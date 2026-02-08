---
name: react-hook-form
description: React Hook Form + Zod 폼 검증 패턴. 스키마 정의, 필드 검증, TRPC 연동.
keywords: [react-hook-form, zod, form, 폼, validation, 검증, useForm, register, handleSubmit]
estimated_tokens: ~500
---

# React Hook Form + Zod 패턴

## 핵심 역할

- Zod 스키마 기반 폼 검증
- useForm 훅을 통한 폼 상태 관리
- TRPC mutation과의 연동
- 타입 안전한 폼 처리

## 파일 구조

```
src/features/auth/
├── components/
│   └── LoginForm.tsx        # 폼 컴포넌트
├── schemas/
│   └── loginFormSchema.ts   # Zod 스키마 (별도 파일)
└── hooks/
    └── useLoginMutation.ts  # TRPC mutation 훅
```

## 필수 준수 사항

| 규칙 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| 스키마 파일 분리 | `*FormSchema.ts` 별도 파일 | 컴포넌트 내 스키마 정의 |
| 타입 추론 | `z.infer<typeof schema>` | 수동 타입 정의 |
| 에러 표시 | `formState.errors` 사용 | 커스텀 에러 상태 |
| 로딩 상태 | `mutation.isPending` 사용 | 별도 loading 상태 |

## 스키마 정의 패턴

```typescript
// schemas/loginFormSchema.ts
import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
```

### 조건부 검증

```typescript
export const registerFormSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})
```

## 폼 컴포넌트 패턴

```typescript
// components/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginFormSchema, LoginFormData } from '../schemas/loginFormSchema'
import { trpc } from '@/utils/trpc'

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // 성공 처리
    },
    onError: (error) => {
      // 에러 처리
    },
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="이메일"
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>

      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="비밀번호"
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
```

## 필드별 검증 (safeParse)

```typescript
// 실시간 필드 검증이 필요한 경우
const validateEmail = (value: string) => {
  const result = loginFormSchema.shape.email.safeParse(value)
  return result.success ? true : result.error.errors[0].message
}

// useForm에서 사용
const { register } = useForm<LoginFormData>({
  mode: 'onBlur', // blur 시 검증
})
```

## 에러 처리 패턴

### 폼 에러 표시

```typescript
function FormField({ name, register, errors }: FormFieldProps) {
  return (
    <div className="form-field">
      <input {...register(name)} />
      {errors[name] && (
        <p className="error-message">{errors[name]?.message}</p>
      )}
    </div>
  )
}
```

### 서버 에러 처리

```typescript
const loginMutation = trpc.auth.login.useMutation({
  onError: (error) => {
    // TRPC 에러를 폼 에러로 변환
    if (error.data?.code === 'UNAUTHORIZED') {
      setError('password', {
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      })
    }
  },
})
```

## Watch 패턴

```typescript
const { watch, register } = useForm<FormData>()

// 특정 필드 감시
const watchedEmail = watch('email')

// 전체 폼 감시
const formValues = watch()

// 조건부 렌더링
{watchedEmail && <p>입력된 이메일: {watchedEmail}</p>}
```

## 체크리스트

### 스키마 설정
- [ ] 스키마를 별도 파일(*FormSchema.ts)로 분리
- [ ] z.infer로 타입 추론
- [ ] 에러 메시지 한글화

### 폼 구현
- [ ] zodResolver 사용
- [ ] defaultValues 설정
- [ ] register로 필드 등록

### 에러 처리
- [ ] formState.errors로 에러 표시
- [ ] 서버 에러는 setError로 처리
- [ ] 필드별 에러 메시지 표시

### TRPC 연동
- [ ] useMutation 사용
- [ ] isPending으로 로딩 상태 표시
- [ ] onSuccess/onError 핸들러 구현

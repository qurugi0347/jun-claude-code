---
name: tailwind-styled
description: tailwind-styled-components 사용 패턴. DOM depth 최소화, 스타일 컴포넌트 설계.
keywords: [tailwind, styled-components, tw, DOM, depth, wrapper, 스타일링]
estimated_tokens: ~350
---

# tailwind-styled-components 스킬

## 핵심 원칙

**DOM depth를 최소화하라.**
- 불필요한 wrapper div 제거
- 스타일만을 위한 중첩 요소 금지
- 하나의 Styled Component가 하나의 DOM 요소

## 필수 준수 사항

### DOM Depth 최소화

| 잘못된 예 | 올바른 예 |
|----------|----------|
| `<Wrapper><Inner><Content>...</Content></Inner></Wrapper>` | `<Container>...</Container>` |
| `<div><div className="...">...</div></div>` | `<StyledDiv>...</StyledDiv>` |

### 예제: 불필요한 중첩 제거

```typescript
// ❌ Bad - 불필요한 DOM depth
const Card = () => (
  <div>
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col gap-4">
          {content}
        </div>
      </div>
    </div>
  </div>
);

// ✅ Good - 최소한의 DOM depth
const CardContainer = tw.div`
  p-4
  bg-white
  rounded-lg
  shadow
  flex
  flex-col
  gap-4
`;

const Card = () => (
  <CardContainer>
    {content}
  </CardContainer>
);
```

### 예제: Tailwind 디자인 변환

```typescript
// 원본 Tailwind (depth: 3)
<div className="p-5">
  <div className="bg-white rounded-t-[32px]">
    <div className="flex flex-col gap-5">
      <h2>Title</h2>
    </div>
  </div>
</div>

// ✅ 변환 후 (depth: 1)
const StepContent = tw.div`
  p-5
  bg-white
  rounded-t-[32px]
  flex
  flex-col
  gap-5
`;

<StepContent>
  <Title>Title</Title>
</StepContent>
```

## Styled Component 네이밍

| 용도 | 네이밍 패턴 | 예시 |
|------|------------|------|
| 컨테이너 | `*Container`, `*Wrapper` | `CardContainer` |
| 섹션 | `*Section`, `*Area` | `HeaderSection` |
| 아이템 | `*Item`, `*Row` | `ListItem` |
| 텍스트 | `Title`, `Label`, `Text` | `SectionLabel` |
| 입력 | `*Input`, `*Field` | `PhoneInput` |
| 버튼 | `*Button`, `*Btn` | `SubmitButton` |

## Props 기반 동적 스타일링

```typescript
import tw from 'tailwind-styled-components';

interface ButtonProps {
  $primary?: boolean;
  $size?: 'sm' | 'md' | 'lg';
}

const Button = tw.button<ButtonProps>`
  rounded-lg
  font-medium
  transition-colors

  ${({ $primary }) =>
    $primary
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }

  ${({ $size }) => {
    switch ($size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  }}
`;

// 사용
<Button $primary $size="lg">Submit</Button>
```

## 기존 HTML 요소 확장

```typescript
// 기존 컴포넌트에 스타일 추가
const StyledLink = tw(Link)`
  text-blue-500
  hover:underline
`;

// input 확장
const Input = tw.input`
  w-full
  px-4
  py-2
  border
  border-gray-300
  rounded-lg
  focus:outline-none
  focus:ring-2
  focus:ring-blue-500
`;
```

## 체크리스트

### DOM 구조
- [ ] 스타일만을 위한 wrapper div가 있는가? → 제거
- [ ] 중첩된 div를 하나로 합칠 수 있는가? → 합치기
- [ ] depth가 3 이상인가? → 리팩토링 고려

### Styled Component
- [ ] 의미 있는 이름인가?
- [ ] transient props($prefix)를 사용하는가?
- [ ] 재사용 가능한 컴포넌트인가?

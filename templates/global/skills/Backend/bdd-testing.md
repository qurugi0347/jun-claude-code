---
name: bdd-testing
description: NestJS + Jest BDD 스타일 테스트 작성 시 사용. describe 네스팅 구조, Given/When/Then 패턴, Testing Module Mock 설정 규칙 제공.
keywords: [BDD, test, 테스트, Jest, NestJS, describe, it, Given, When, Then, mock, TestingModule]
estimated_tokens: ~500
---

# BDD 테스트 작성 규칙

<rules>

## describe 네스팅 구조

> **Service 클래스명 > 메서드명 > 시나리오** 구조로 describe를 네스팅한다.

| 레벨 | 대상 | 예시 |
|------|------|------|
| 1 | Service 클래스 | `describe('UserService', ...)` |
| 2 | 메서드명 | `describe('create', ...)` |
| 3 (선택) | 조건 그룹 | `describe('when role is admin', ...)` |

- 3레벨은 동일 메서드에서 조건 분기가 많을 때만 사용한다
- 3레벨까지만 사용한다

```typescript
describe('UserService', () => {
  // 공통 setup (TestingModule, mock 등)

  describe('create', () => {
    it('should create user when valid dto given', () => {});
    it('should throw ConflictException when email duplicated', () => {});
  });

  describe('findById', () => {
    it('should return user when id exists', () => {});
    it('should throw NotFoundException when id not found', () => {});
  });
});
```

## it 문구 및 Given/When/Then

### it 문구 형식

```
"should [결과] when [조건]"
```

| 요소 | 설명 | 예시 |
|------|------|------|
| 결과 | 기대하는 동작 | `create user`, `throw NotFoundException` |
| 조건 | 입력/상태 | `valid dto given`, `id not found` |

### 블록 내부 구조

각 `it` 블록 내부에 `// Given` / `// When` / `// Then` 주석으로 구분한다.

```typescript
it('should create user when valid dto given', async () => {
  // Given
  const dto: CreateUserDto = { name: 'John', email: 'john@test.com' };
  jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);
  jest.spyOn(userRepository, 'save').mockResolvedValue({ id: 1, ...dto } as User);

  // When
  const result = await service.create(dto);

  // Then
  expect(result.name).toBe('John');
  expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'John' }));
});
```

## NestJS Testing Module 설정

### 기본 패턴

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });
});
```

### Mock 규칙

| 패턴 | 용도 | 예시 |
|------|------|------|
| `useValue` + `jest.fn()` | Repository mock | `{ save: jest.fn() }` |
| `jest.spyOn` | 특정 호출에 반환값 지정 | `jest.spyOn(repo, 'findOneBy').mockResolvedValue(...)` |
| `jest.mocked` | 이미 mock된 함수 타입 캐스팅 | `jest.mocked(repo.save).mockResolvedValue(...)` |

- `useValue`로 mock 객체를 주입하고, 각 테스트에서 `jest.spyOn` 또는 `jest.mocked`로 반환값을 지정한다
- `jest.mock()` 모듈 레벨 mock은 외부 라이브러리에만 사용한다

### 외부 의존성 Mock

```typescript
// Service가 다른 Service에 의존할 때
{
  provide: EmailService,
  useValue: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  },
},
```

</rules>

<examples>

### describe 구조

<example type="good">
```typescript
// Service > Method > Scenario 명확
describe('OrderService', () => {
  describe('cancel', () => {
    it('should cancel order when status is pending', async () => {});
    it('should throw BadRequestException when status is shipped', async () => {});
  });
});
```
</example>
<example type="bad">
```typescript
// 메서드별 그룹 없이 플랫하게 나열
describe('OrderService', () => {
  it('cancel pending order', async () => {});
  it('cancel shipped order throws', async () => {});
  it('create order', async () => {});
});
```
</example>

### Assertion

<example type="good">
```typescript
// 구체적 assertion
expect(result.status).toBe('cancelled');
expect(orderRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({ status: 'cancelled' }),
);
```
</example>
<example type="bad">
```typescript
// 의미 없는 assertion
expect(result).toBeDefined();
expect(result).toBeTruthy();
```
</example>

### Exception 테스트

<example type="good">
```typescript
// 예외 타입 검증
await expect(service.cancel(orderId)).rejects.toThrow(BadRequestException);
```
</example>
<example type="bad">
```typescript
// try-catch로 예외 테스트
try {
  await service.cancel(orderId);
  fail('should have thrown');
} catch (e) {
  expect(e).toBeDefined();
}
```
</example>

</examples>

<checklist>

## 체크리스트

- [ ] describe 네스팅이 Service > Method > Scenario 구조인가?
- [ ] it 문구가 `"should [결과] when [조건]"` 형식인가?
- [ ] 각 it 블록에 `// Given` / `// When` / `// Then` 주석이 있는가?
- [ ] `Test.createTestingModule`로 테스트 모듈을 구성했는가?
- [ ] Repository mock은 `useValue` + `jest.fn()`으로 주입했는가?
- [ ] assertion이 구체적인 값을 검증하는가?
- [ ] 예외 테스트에 `rejects.toThrow`를 사용했는가?

</checklist>

---
name: Backend
description: NestJS 백엔드 개발 시 사용. 레이어 객체 변환 규칙, BDD 테스트 작성 규칙 제공.
keywords: [Backend, 백엔드, 레이어, DTO, Entity, Service, Controller, test, BDD, 테스트, Jest]
user-invocable: false
---

# 백엔드 개발 원칙

<rules>

## 레이어 간 객체 변환 규칙

> **객체 변환은 필요한 시점에 해당 레이어에서 수행한다.**

### 핵심 원칙

| 레이어 | 입력 | 출력 | 변환 책임 |
|--------|------|------|----------|
| **Controller** | Request DTO | Response DTO/Schema | Entity -> Response 변환 |
| **Service** | DTO (그대로 사용) | Entity 또는 일반 객체 | DTO -> Entity 변환 (필요시) |
| **Repository** | Entity | Entity | 없음 |

</rules>

### Controller -> Service 호출

<examples>
<example type="bad">
```typescript
// ❌ Controller에서 미리 Entity로 변환
@Post()
async create(@Body() dto: CreateUserDto) {
  const entity = new User();
  entity.name = dto.name;
  entity.email = dto.email;
  return this.userService.create(entity);  // Entity 전달
}
```
</example>
<example type="good">
```typescript
// ✅ DTO 그대로 전달
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);  // DTO 전달
}
```
</example>
</examples>

### Service 내부 처리

```typescript
// ✅ Service에서 DTO로 사용하다가 필요한 시점에 Entity로 변환
async create(dto: CreateUserDto) {
  // DTO로 비즈니스 로직 처리
  const isValid = this.validateEmail(dto.email);

  // Entity가 필요한 시점에 변환
  const user = new User();
  user.name = dto.name;
  user.email = dto.email;

  return this.userRepository.save(user);
}
```

### Service -> Controller 반환

```typescript
// ✅ Service: Entity 또는 일반 객체 반환
async findById(id: number): Promise<User> {
  return this.userRepository.findOneBy({ id });
}

async findWithStats(id: number): Promise<{ user: User; orderCount: number }> {
  const user = await this.userRepository.findOneBy({ id });
  const orderCount = await this.orderRepository.countBy({ userId: id });
  return { user, orderCount };
}

// ✅ Controller: Response DTO/Schema로 변환
@Get(':id')
async findOne(@Param('id') id: number) {
  const user = await this.userService.findById(id);
  return UserResponseDto.from(user);  // Controller에서 변환
}
```

---

<checklist>

## 체크리스트

- [ ] Controller에서 DTO를 그대로 Service에 전달하는가? (Entity 변환은 Service에서)
- [ ] Service에서 Entity가 필요한 시점에 변환하는가?
- [ ] Service의 return은 Entity 또는 일반 객체인가?
- [ ] Controller에서 Response DTO/Schema로 변환하는가?

</checklist>

<reference>

## 관련 문서

| 주제 | 위치 | 설명 |
|-----|------|------|
| TypeORM 사용 규칙 | `TypeORM/SKILL.md` | find vs queryBuilder 선택 기준 |
| BDD 테스트 | `bdd-testing.md` | NestJS + Jest BDD 스타일 테스트 작성 규칙 |

</reference>

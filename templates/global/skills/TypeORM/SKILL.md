---
name: TypeORM
description: TypeORM 사용 시 참조. find > queryBuilder > rawQuery 우선순위, 가독성 기반 선택 기준, Migration 생성 규칙 제공.
keywords: [TypeORM, find, queryBuilder, rawQuery, Repository, 쿼리, ORM, migration]
user-invocable: false
---

# TypeORM 사용 규칙

<rules>

## 쿼리 작성 우선순위

> **가독성을 최우선으로, find > QueryBuilder > Raw Query 순서로 사용한다.**

| 우선순위 | 방식 | 사용 조건 |
|---------|------|----------|
| 1 | **find 메서드** | 기본 CRUD, 단순 조건, relations |
| 2 | **QueryBuilder** | groupBy, 집계, 커스텀 JOIN — 가독성이 유지되는 경우 |
| 3 | **Raw Query** | QueryBuilder의 서브쿼리 등으로 가독성이 떨어지는 경우 |

### 핵심 판단 기준: 가독성

QueryBuilder가 허용되는 케이스라도, 서브쿼리 중첩 등으로 **코드 가독성이 떨어지면 Raw Query를 사용한다.**

## find 메서드 (우선순위 1)

```typescript
// ✅ 기본 조회
const user = await this.userRepository.findOneBy({ id });
const users = await this.userRepository.find({
  where: { status: 'active' },
  relations: ['orders'],
  order: { createdAt: 'DESC' },
  take: 10,
});

// ✅ 조건 조합
const users = await this.userRepository.find({
  where: [
    { status: 'active', role: 'admin' },
    { status: 'active', role: 'manager' },
  ],
});
```

## QueryBuilder (우선순위 2)

**다음 경우에 QueryBuilder 사용 (가독성이 유지될 때):**

| 케이스 | 예시 |
|--------|------|
| **groupBy** | 집계 쿼리 |
| **getRawMany/getRawOne** | 원시 데이터 필요 |
| **커스텀 JOIN 조건** | ON 절 커스텀 |
| **단순 서브쿼리** | 가독성이 유지되는 서브쿼리 |

## Raw Query (우선순위 3)

**QueryBuilder로 작성 시 가독성이 떨어지는 경우 Raw Query 사용:**

| 케이스 | 이유 |
|--------|------|
| **복잡한 서브쿼리 중첩** | QueryBuilder 체이닝이 읽기 어려움 |
| **복잡한 CTE (WITH 절)** | QueryBuilder로 표현 시 과도한 중첩 |
| **DB 특화 문법** | QueryBuilder가 지원하지 않는 문법 |

</rules>

<examples>

### find vs QueryBuilder

<example type="bad">
```typescript
// ❌ 불필요한 QueryBuilder 사용
const user = await this.userRepository
  .createQueryBuilder('user')
  .where('user.id = :id', { id })
  .getOne();
```
</example>
<example type="good">
```typescript
// ✅ find로 대체
const user = await this.userRepository.findOneBy({ id });
```
</example>

### QueryBuilder 허용

<example type="good">
```typescript
// ✅ QueryBuilder 허용: groupBy + getRawMany (가독성 유지)
const stats = await this.orderRepository
  .createQueryBuilder('order')
  .select('order.status', 'status')
  .addSelect('COUNT(*)', 'count')
  .addSelect('SUM(order.amount)', 'total')
  .groupBy('order.status')
  .getRawMany();
```
</example>

### QueryBuilder → Raw Query 전환

<example type="bad">
```typescript
// ❌ 서브쿼리 중첩으로 가독성 저하
const result = await this.orderRepository
  .createQueryBuilder('order')
  .where((qb) => {
    const subQuery = qb
      .subQuery()
      .select('oi.orderId')
      .from(OrderItem, 'oi')
      .where((qb2) => {
        const subQuery2 = qb2
          .subQuery()
          .select('p.id')
          .from(Product, 'p')
          .where('p.category = :cat', { cat: 'electronics' })
          .getQuery();
        return 'oi.productId IN ' + subQuery2;
      })
      .getQuery();
    return 'order.id IN ' + subQuery;
  })
  .getMany();
```
</example>
<example type="good">
```typescript
// ✅ Raw Query로 가독성 확보
const result = await this.orderRepository.query(
  `SELECT o.*
   FROM orders o
   WHERE o.id IN (
     SELECT oi.order_id
     FROM order_items oi
     WHERE oi.product_id IN (
       SELECT p.id FROM products p WHERE p.category = $1
     )
   )`,
  ['electronics'],
);
```
</example>

</examples>

<rules>

## Migration 생성 규칙

> **Migration 파일은 직접 생성하지 않고, `yarn migration:create` 명령어로 생성한 뒤 수정한다.**

### 이유

직접 파일을 생성하면 타임스탬프 충돌이 발생할 수 있다. CLI 명령어를 통해 생성해야 TypeORM이 타임스탬프를 자동 관리한다.

### 생성 방법

```bash
# package.json에 migration:create가 정의된 경우
yarn migration:create src/migrations/MigrationName

# 정의되지 않은 경우 직접 실행
yarn run typeorm migration:create src/migrations/MigrationName
```

### 작업 순서

1. `yarn migration:create`로 빈 migration 파일 생성
2. 생성된 파일의 `up()` / `down()` 메서드 작성
3. `yarn migration:run`으로 적용 확인

</rules>

<checklist>

## 체크리스트

- [ ] find 메서드를 우선 사용하는가?
- [ ] QueryBuilder는 find로 불가능한 경우에만 사용하는가?
- [ ] QueryBuilder 서브쿼리 중첩으로 가독성이 떨어지면 Raw Query로 전환했는가?
- [ ] Migration 파일을 `yarn migration:create`로 생성했는가? (직접 파일 생성 금지)

</checklist>

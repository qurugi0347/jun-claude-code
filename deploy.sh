#!/bin/bash
set -e

BUMP_TYPE=$1

if [[ "$BUMP_TYPE" != "major" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "patch" ]]; then
  echo "Usage: ./deploy.sh <major|minor|patch>"
  exit 1
fi

# 최신 코드 동기화
git pull
git push

# 현재 버전 읽기
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# 버전 계산
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
TAG="v${NEW_VERSION}"

echo "Deploying: $CURRENT_VERSION -> $NEW_VERSION"

git push

# 태그 생성 & 푸시 (버전 bump은 GitHub Actions에서 처리)
git tag "$TAG"
git push origin "$TAG"

echo "Deployed ${TAG} successfully!"

#!/bin/bash
set -e
cd "$(dirname "$0")"

GH="/tmp/gh_2.63.2_macOS_arm64/bin/gh"
if [ ! -x "$GH" ]; then
  echo "GitHub CLI 설치 중..."
  curl -fsSL "https://github.com/cli/cli/releases/download/v2.63.2/gh_2.63.2_macOS_arm64.zip" -o /tmp/gh.zip
  unzip -qo /tmp/gh.zip -d /tmp
fi

echo "=== 리듬 몬스터 RPG — GitHub Pages 배포 ==="

if ! "$GH" auth status >/dev/null 2>&1; then
  echo ""
  echo "GitHub 로그인 창이 열립니다. 브라우저에서 승인해 주세요."
  "$GH" auth login --hostname github.com --git-protocol https --web
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "Update for web deploy."
fi

LOGIN=$("$GH" api user -q .login)

if ! "$GH" repo view "${LOGIN}/ukulele-rhythm-monster-rpg" >/dev/null 2>&1; then
  echo "저장소 생성 중..."
  "$GH" repo create ukulele-rhythm-monster-rpg --public --source=. --remote=origin --push
else
  echo "GitHub에 업로드 중..."
  git push -u origin main
fi

echo "GitHub Pages 활성화..."
"$GH" api -X POST "repos/${LOGIN}/ukulele-rhythm-monster-rpg/pages" \
  -f build_type=workflow 2>/dev/null || true

URL="https://${LOGIN}.github.io/ukulele-rhythm-monster-rpg/"
echo ""
echo "============================================"
echo "  배포 완료!"
echo "  주소: ${URL}"
echo "  접속 코드: voxhyeon"
echo "============================================"
echo ""
echo "1~2분 후 Safari에서 접속하세요."
open "$URL" 2>/dev/null || true
read -r -p "Enter 키를 누르면 창이 닫힙니다..."

#!/bin/bash
# 리듬 몬스터 RPG — 더블클릭으로 실행
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

xattr -d com.apple.quarantine "$0" 2>/dev/null || true
xattr -d com.apple.quarantine "$DIR/run.py" 2>/dev/null || true

pause_on_error() {
  echo ""
  echo "────────────────────────────────────"
  echo "  ${1:-실행에 실패했습니다.}"
  echo "────────────────────────────────────"
  echo ""
  echo "터미널에서 직접 실행:"
  echo "  cd \"${DIR}\" && python3 run.py"
  echo ""
  read -r -p "Enter 키를 누르면 창을 닫습니다…" _
}

if ! command -v python3 >/dev/null 2>&1; then
  pause_on_error "Python 3가 설치되어 있지 않습니다."
  exit 1
fi

echo "🎵 리듬 몬스터 RPG 시작 중…"
echo "   (예전 포터블 창이 열려 있으면 닫고, 새로 열리는 탭을 사용하세요)"
python3 "$DIR/run.py" || pause_on_error "서버를 시작하지 못했습니다."

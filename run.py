#!/usr/bin/env python3
"""Simple launcher for Rhythm Monster RPG"""
import http.server
import socketserver
import sys
import webbrowser
import os
import urllib.request

DIR = os.path.dirname(os.path.abspath(__file__))
FALLBACK_PORTS = [8765, 8766, 8767, 8877]
SIG_NAME = 'sig.txt'

os.chdir(DIR)


def folder_signature() -> str:
    main_js = os.path.join(DIR, 'js', 'main.js')
    duel_js = os.path.join(DIR, 'js', 'components', 'duel-field.js')
    parts = [DIR]
    for path in (main_js, duel_js):
        if os.path.isfile(path):
            parts.append(f'{os.path.getsize(path)}:{int(os.path.getmtime(path))}')
    return '|'.join(parts)


def write_signature_file() -> str:
    sig = folder_signature()
    with open(os.path.join(DIR, SIG_NAME), 'w', encoding='utf-8') as f:
        f.write(sig)
    return sig


def port_has_http_server(port: int) -> bool:
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=1) as resp:
            return resp.status == 200
    except Exception:
        return False


def remote_signature(port: int):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/{SIG_NAME}', timeout=1) as resp:
            return resp.read().decode('utf-8').strip()
    except Exception:
        return None


def pick_port(local_sig: str) -> int:
    for port in FALLBACK_PORTS:
        if not port_has_http_server(port):
            return port
        if remote_signature(port) == local_sig:
            return port
    return FALLBACK_PORTS[0]


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, format, *args):
        if args and str(args[1]) != '200':
            super().log_message(format, *args)


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


local_sig = write_signature_file()
PORT = pick_port(local_sig)
url = f'http://127.0.0.1:{PORT}/'

if port_has_http_server(PORT) and remote_signature(PORT) == local_sig:
    print(f'이미 이 폴더에서 실행 중입니다: {url}')
    webbrowser.open(url)
    sys.exit(0)

if port_has_http_server(PORT) and remote_signature(PORT) != local_sig:
    print('⚠️  다른 폴더(또는 예전 포터블)의 게임이 8765에서 실행 중입니다.')
    print(f'   → 이 폴더의 최신 게임을 {url} 에서 시작합니다.')
    print('   예전 창은 닫고 새로 열린 탭을 사용하세요.')

print(f'리듬 몬스터 RPG 실행 중: {url}')
print(f'폴더: {DIR}')
print('종료: Ctrl+C (또는 터미널 창 닫기)')

try:
    httpd = ReusableTCPServer(('', PORT), Handler)
except OSError as err:
    print(f'포트 {PORT}을 사용할 수 없습니다: {err}', file=sys.stderr)
    print('다른 터미널에서 게임이 이미 실행 중인지 확인하세요.', file=sys.stderr)
    sys.exit(1)

with httpd:
    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n종료했습니다.')

#!/usr/bin/env python3
"""Simple launcher for Ukulele Rhythm Monster RPG"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8765
DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIR)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    url = f'http://localhost:{PORT}'
    print(f'우쿨렐레 리듬 몬스터 RPG 실행 중: {url}')
    print('종료: Ctrl+C')
    webbrowser.open(url)
    httpd.serve_forever()

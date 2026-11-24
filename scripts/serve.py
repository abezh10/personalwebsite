#!/usr/bin/env python3
"""Local preview: like `python3 -m http.server`, but tells the browser not to cache,
so every edit shows up on a normal refresh (no stale styles.css).

    python3 scripts/serve.py          -> http://127.0.0.1:8000
"""
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()

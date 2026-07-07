#!/usr/bin/env python3
"""Simple static file server for local development.

Usage:
    python serve.py          # serves on http://localhost:8765
    python serve.py 3000     # custom port

Required because fetch() for JSON and .sql files does not work over file://.
GitHub Pages serves the same static files with no server-side code needed.
"""

import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = HTTPServer(("", port), SimpleHTTPRequestHandler)
    print(f"Serving at http://localhost:{port}")
    print("Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()

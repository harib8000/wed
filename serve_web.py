import http.server
import os

WEB_DIR = '/workspaces/wed/apps/mobile/build/web'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serve index.html for all non-file paths (SPA fallback)."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        # If path has a file extension or exists as a file, serve it directly
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            super().do_GET()
        else:
            # SPA fallback: serve index.html
            self.path = '/index.html'
            super().do_GET()

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', 3000), SPAHandler)
    print(f'Serving Flutter web app from {WEB_DIR} at http://0.0.0.0:3000')
    server.serve_forever()

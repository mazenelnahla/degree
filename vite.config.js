import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'prerequisite-local-file-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save-prerequisites' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  const targetPath = path.resolve(process.cwd(), 'public', 'prerequisites.json');
                  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: parsed.length }));
                  return;
                }
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Expected array of prerequisite links' }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          if (req.url === '/api/set-default-prerequisites' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  // 1. Write to public/prerequisites.json
                  const targetJsonPath = path.resolve(process.cwd(), 'public', 'prerequisites.json');
                  fs.writeFileSync(targetJsonPath, JSON.stringify(parsed, null, 2), 'utf-8');

                  // 2. Also update PREREQUISITE_LINKS in src/services/courseMapping.js so it becomes permanent codebase default
                  const mappingFilePath = path.resolve(process.cwd(), 'src', 'services', 'courseMapping.js');
                  if (fs.existsSync(mappingFilePath)) {
                    let codeContent = fs.readFileSync(mappingFilePath, 'utf-8');
                    const arrayStr = JSON.stringify(parsed, null, 2);
                    const regex = /export const PREREQUISITE_LINKS = \[[\s\S]*?\];/;
                    if (regex.test(codeContent)) {
                      codeContent = codeContent.replace(regex, `export const PREREQUISITE_LINKS = ${arrayStr};`);
                      fs.writeFileSync(mappingFilePath, codeContent, 'utf-8');
                    }
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: parsed.length }));
                  return;
                }
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Expected array of prerequisite links' }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    open: true
  },
  optimizeDeps: {
    include: ['exceljs', 'pdfjs-dist']
  }
});

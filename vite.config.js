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
                const isEpp = (parsed && parsed.program === 'EEP') || (Array.isArray(parsed) && false);
                const links = Array.isArray(parsed) ? parsed : (parsed.links || []);
                if (Array.isArray(links)) {
                  const targetFileName = isEpp ? 'prerequisites_eep.json' : 'prerequisites.json';
                  const targetPath = path.resolve(process.cwd(), 'public', targetFileName);
                  fs.writeFileSync(targetPath, JSON.stringify(links, null, 2), 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: links.length, program: isEpp ? 'EEP' : 'AI' }));
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
                const isEpp = (parsed && parsed.program === 'EEP') || false;
                const links = Array.isArray(parsed) ? parsed : (parsed.links || []);
                if (Array.isArray(links)) {
                  // 1. Write to public/prerequisites[_eep].json
                  const targetFileName = isEpp ? 'prerequisites_eep.json' : 'prerequisites.json';
                  const targetJsonPath = path.resolve(process.cwd(), 'public', targetFileName);
                  fs.writeFileSync(targetJsonPath, JSON.stringify(links, null, 2), 'utf-8');

                  // 2. Also update in src/services/courseMapping.js
                  const mappingFilePath = path.resolve(process.cwd(), 'src', 'services', 'courseMapping.js');
                  if (fs.existsSync(mappingFilePath)) {
                    let codeContent = fs.readFileSync(mappingFilePath, 'utf-8');
                    const arrayStr = JSON.stringify(links, null, 2);
                    const varName = isEpp ? 'EEP_PREREQUISITE_LINKS' : 'PREREQUISITE_LINKS';
                    const regex = new RegExp(`export const ${varName} = \\[([\\s\\S]*?)\\];`);
                    if (regex.test(codeContent)) {
                      codeContent = codeContent.replace(regex, `export const ${varName} = ${arrayStr};`);
                      fs.writeFileSync(mappingFilePath, codeContent, 'utf-8');
                    }
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: links.length, program: isEpp ? 'EEP' : 'AI' }));
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

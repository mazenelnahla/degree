import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import { parseTranscriptText } from '../src/services/pdfParser.js';
import { generatePreservedExcelWorkbook } from '../src/services/excelPreserver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function extractPdfTextNode(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let pageStr = '';
    let lastItem = null;

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;

      if (!lastItem) {
        pageStr += item.str;
      } else {
        const sameLine = Math.abs(item.transform[5] - lastItem.transform[5]) <= 3;
        if (!sameLine) {
          pageStr += '\n' + item.str;
        } else {
          const prevEndsWithSpace = lastItem.str.endsWith(' ');
          const currStartsWithSpace = item.str.startsWith(' ');

          if (prevEndsWithSpace || currStartsWithSpace) {
            pageStr += item.str;
          } else {
            const isRtl = item.dir === 'rtl' || lastItem.dir === 'rtl';
            let gap = 0;
            if (isRtl) {
              gap = lastItem.transform[4] - (item.transform[4] + (item.width || 0));
            } else {
              gap = item.transform[4] - (lastItem.transform[4] + (lastItem.width || 0));
            }

            const fontSize = Math.max(Math.abs(item.transform[0] || 0), Math.abs(item.transform[3] || 0), 10);
            const spaceThreshold = fontSize * 0.22;

            if (gap > spaceThreshold) {
              pageStr += ' ' + item.str;
            } else {
              pageStr += item.str;
            }
          }
        }
      }
      lastItem = item;
    }
    fullText += '\n' + pageStr;
  }
  return fullText;
}

async function main() {
  console.log('--- Academic Transcript Excel Crosser CLI ---');

  const templatePath = path.join(rootDir, 'Book2.xlsx');
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template Book2.xlsx not found at ${templatePath}`);
    process.exit(1);
  }

  // Find all PDF files in root directory or command line args
  const args = process.argv.slice(2);
  let pdfFiles = [];
  if (args.length > 0) {
    pdfFiles = args.filter(f => f.endsWith('.pdf'));
  } else {
    pdfFiles = fs.readdirSync(rootDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => path.join(rootDir, f));
  }

  if (pdfFiles.length === 0) {
    console.error('No PDF transcript files found.');
    process.exit(1);
  }

  console.log(`Found ${pdfFiles.length} PDF file(s) to process.`);
  const studentTranscripts = [];

  for (const pdfPath of pdfFiles) {
    const fileName = path.basename(pdfPath);
    console.log(`\nParsing: ${fileName}...`);
    const text = await extractPdfTextNode(pdfPath);
    const student = parseTranscriptText(text, fileName);
    console.log(`  Student: ${student.studentName} (ID: ${student.studentId || 'N/A'})`);
    console.log(`  CGPA: ${student.cgpa} | Passed: ${student.passedCount} | Failed (0.00): ${student.failedCount}`);

    console.log('  Course Status:');
    Object.values(student.courseMap).forEach(c => {
      const status = c.isPassed ? 'PASSED (Crossed)' : 'FAILED (0.00 - NOT Crossed)';
      console.log(`    - [${c.code}] ${c.name}: Points=${c.points}, Grade=${c.grade} -> ${status}`);
    });

    studentTranscripts.push(student);
  }

  console.log(`\nLoading template: ${templatePath}...`);
  const templateBuffer = fs.readFileSync(templatePath);

  console.log('Generating crossed Excel sheets while preserving ALL 55 connector arrows & links...');
  const outputBuffer = await generatePreservedExcelWorkbook(templateBuffer, studentTranscripts, {
    useStrikethrough: true,
    useDiagonalCross: true,
    useHighlight: true
  });

  const outputPath = path.join(rootDir, 'Book2_Crossed_Output.xlsx');
  fs.writeFileSync(outputPath, Buffer.from(outputBuffer));
  console.log(`\nSUCCESS! Created: ${outputPath}`);
  console.log(`Total sheets created: ${studentTranscripts.length}`);
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});

// Copy Handlebars templates from src/ to dist/ after TypeScript compilation
import { cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'src', 'templates');
const dest = join(__dirname, '..', 'dist', 'templates');

if (!existsSync(src)) {
  console.error('❌ Source templates directory not found:', src);
  process.exit(1);
}

cpSync(src, dest, { recursive: true });
console.log('✅ Templates copied to dist/');

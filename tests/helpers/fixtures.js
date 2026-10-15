import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Reads a text file safely relative to project root.
 * @param {string} relativePath
 * @returns {string}
 */
export function readProjectFile(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Checks if a file exists relative to project root.
 * @param {string} relativePath
 * @returns {boolean}
 */
export function fileExists(relativePath) {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath));
}

/**
 * Returns paths to built dist HTML files.
 */
export const DIST_FILES = {
  index: 'dist/index.html',
  consultoria: 'dist/consultoria/index.html',
  enIndex: 'dist/en/index.html',
  enConsulting: 'dist/en/consulting/index.html',
  notFound: 'dist/404.html',
};

/**
 * Returns paths to key source files.
 */
export const SOURCE_FILES = {
  motion: 'src/scripts/motion.ts',
  globalCss: 'src/styles/global.css',
  heroAstro: 'src/components/Hero.astro',
  consultingAstro: 'src/components/ConsultingPage.astro',
  projectsAstro: 'src/components/Projects.astro',
  projectsData: 'src/data/projects.ts',
  processAstro: 'src/components/Process.astro',
  indexAstro: 'src/pages/index.astro',
  contactApi: 'api/src/functions/contact.js',
  staticWebAppConfig: 'public/staticwebapp.config.json',
};

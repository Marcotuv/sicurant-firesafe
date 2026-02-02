
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const sidebarPath = path.join(rootDir, 'components', 'Sidebar.tsx');

// --- GUIDA UTENTE ---
// Uso: npm run release [patch|minor|major] (default: patch)
// Esempio: npm run release minor

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const releaseType = args.find(a => !a.startsWith('--')) || 'patch';

console.log(`🚀 Starting ${releaseType} release... ${isDryRun ? '(DRY RUN)' : ''}`);

// 1. Leggi e aggiorna package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion = '';
if (releaseType === 'major') newVersion = `${major + 1}.0.0`;
else if (releaseType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

if (!isDryRun) {
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}
console.log(`✅ Updated package.json from ${currentVersion} to ${newVersion} ${isDryRun ? '[SKIPPED]' : ''}`);

// 2. Aggiorna Sidebar.tsx
let sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
const versionRegex = /v\d+\.\d+\.\d+/;
if (versionRegex.test(sidebarContent)) {
    const newSidebarContent = sidebarContent.replace(versionRegex, `v${newVersion}`);
    if (!isDryRun) {
        fs.writeFileSync(sidebarPath, newSidebarContent);
    }
    console.log(`✅ Updated Sidebar.tsx version display ${isDryRun ? '[SKIPPED]' : ''}`);
} else {
    console.warn(`⚠️  Could not find version string in Sidebar.tsx. Please check manually.`);
}

// 3. Esegui la Build
console.log(`🛠️  Running build verification...`);
try {
    // Build is run even in dry-run to verify it works, unless we want to skip it too. 
    // Usually dry-run implies "no side effects". Build creates dist/ output.
    // Let's run it to be sure.
    execSync(`npm run build`, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ Build successful`);
} catch (error) {
    console.error(`❌ Build failed. Aborting release.`);
    if (!isDryRun) {
        // Revert package.json
        packageJson.version = currentVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }
    process.exit(1);
}

// 4. Git Commit & Push
if (!isDryRun) {
    console.log(`📦 Committing and Pushing to Remote...`);
    try {
        execSync('git add .', { stdio: 'inherit', cwd: rootDir });
        execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
        execSync('git push', { stdio: 'inherit', cwd: rootDir });
        console.log(`🚀 Release v${newVersion} pushed successfully! Deployment should start shortly.`);
    } catch (error) {
        console.error(`❌ Git operations failed:`, error.message);
        process.exit(1);
    }
} else {
    console.log(`📦 [DRY RUN] Skipping git commit and push.`);
    console.log(`🚀 [DRY RUN] Release v${newVersion} completed (simulated).`);
}

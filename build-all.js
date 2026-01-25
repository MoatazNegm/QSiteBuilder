const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function buildAll() {
    console.log('🚀 Starting QuickStor Unified Build...');

    const rootDir = __dirname;
    const backendPublicDir = path.join(rootDir, 'quickstor-backend', 'public');

    // 1. Clean Public Directory
    console.log('Cleaning public directory...');
    fs.emptyDirSync(backendPublicDir);

    // 2. Build Admin Portal -> /adminportal
    console.log('\n🏗️  Building Admin Portal...');
    try {
        execSync('cd quickstor-admin && npm run build -- --base=/adminportal/', { stdio: 'inherit' });
        const adminDist = path.join(rootDir, 'quickstor-admin', 'dist');
        const adminDest = path.join(backendPublicDir, 'adminportal');
        fs.copySync(adminDist, adminDest);
        console.log('✅ Admin Portal built and moved to backend/public/adminportal');
    } catch (e) {
        console.error('❌ Admin Build Failed:', e);
        process.exit(1);
    }

    // 3. Build Staging Site -> /staging
    console.log('\n🏗️  Building Staging Site (VITE_SITE_DOC_ID=quickstor-staging)...');
    try {
        // Set env vars for staging build
        // Windows needs 'set' but cross-platform logic is better handled by just passing env
        // We use cross-env style execution relative to platform
        const cmd = process.platform === 'win32'
            ? 'cd quickstor-frontend && set "VITE_SITE_DOC_ID=quickstor-staging" && npm run build -- --base=/staging/'
            : 'cd quickstor-frontend && VITE_SITE_DOC_ID=quickstor-staging npm run build -- --base=/staging/';

        execSync(cmd, { stdio: 'inherit' });

        const frontendDist = path.join(rootDir, 'quickstor-frontend', 'dist');
        const stagingDest = path.join(backendPublicDir, 'staging');
        fs.copySync(frontendDist, stagingDest);
        console.log('✅ Staging Site built and moved to backend/public/staging');
    } catch (e) {
        console.error('❌ Staging Build Failed:', e);
        process.exit(1);
    }

    // 4. Build Live Site -> / (Root)
    console.log('\n🏗️  Building Live Site (VITE_SITE_DOC_ID=quickstor-live)...');
    try {
        const cmd = process.platform === 'win32'
            ? 'cd quickstor-frontend && set "VITE_SITE_DOC_ID=quickstor-live" && npm run build' // no base needed for root
            : 'cd quickstor-frontend && VITE_SITE_DOC_ID=quickstor-live npm run build';

        execSync(cmd, { stdio: 'inherit' });

        const frontendDist = path.join(rootDir, 'quickstor-frontend', 'dist');
        const liveDest = path.join(backendPublicDir, 'live');
        fs.copySync(frontendDist, liveDest);
        console.log('✅ Live Site built and moved to backend/public/live');
        console.log('✅ Live Site built and moved to backend/public/live');
    } catch (e) {
        console.error('❌ Live Build Failed:', e);
        process.exit(1);
    }

    // 5. Copy Shared Assets (Logo)
    // We expect the logo to be in quickstor-frontend/src/assets/Quickstor logo.png
    // We want it at quickstor-backend/public/logo.png
    console.log('\n📄 Copying Shared Assets...');
    try {
        const logoSrc = path.join(rootDir, 'quickstor-frontend', 'src', 'assets', 'Quickstor logo.png');
        const logoDest = path.join(backendPublicDir, 'logo.png');
        if (fs.existsSync(logoSrc)) {
            fs.copySync(logoSrc, logoDest);
            console.log('✅ Copied logo.png');
        } else {
            console.warn('⚠️  Logo not found at:', logoSrc);
        }
    } catch (e) {
        console.error('❌ Asset Copy Failed:', e);
    }

    console.log('\n✨ Build Complete! All assets ready in quickstor-backend/public');
}

buildAll();

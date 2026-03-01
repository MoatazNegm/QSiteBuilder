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
        const vitePath = path.join(rootDir, 'quickstor-admin', 'node_modules', 'vite', 'bin', 'vite.js');
        execSync(`node "${vitePath}" build --base=/adminportal/`, {
            stdio: 'inherit',
            cwd: path.join(rootDir, 'quickstor-admin')
        });
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
        const vitePath = path.join(rootDir, 'quickstor-frontend', 'node_modules', 'vite', 'bin', 'vite.js');
        execSync(`node "${vitePath}" build --base=/staging/`, {
            stdio: 'inherit',
            cwd: path.join(rootDir, 'quickstor-frontend'),
            env: { ...process.env, VITE_SITE_DOC_ID: 'quickstor-staging' }
        });

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
        const vitePath = path.join(rootDir, 'quickstor-frontend', 'node_modules', 'vite', 'bin', 'vite.js');
        execSync(`node "${vitePath}" build`, {
            stdio: 'inherit',
            cwd: path.join(rootDir, 'quickstor-frontend'),
            env: { ...process.env, VITE_SITE_DOC_ID: 'quickstor-live' }
        });

        const frontendDist = path.join(rootDir, 'quickstor-frontend', 'dist');
        const liveDest = path.join(backendPublicDir, 'live');
        fs.copySync(frontendDist, liveDest);
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

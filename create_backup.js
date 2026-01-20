
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sourceDir = __dirname;
const zipName = `quickstor-full-backup-${Date.now()}.zip`;
const outputPath = path.join(sourceDir, zipName);

const excludes = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store',
    zipName // exclude self
];

// Check if tar exists (Windows 10+ ships with bsdtar)
exec('tar --version', (error, stdout, stderr) => {
    if (!error) {
        console.log('Using system tar to zip...');
        // Create exclusion flags
        const excludeFlags = excludes.map(ex => `--exclude="${ex}"`).join(' ');

        // Command: tar -a -c -f output.zip * (using -a for auto-detect zip from extension)
        // Note: Windows tar might interpret wildcards differently in shell, better to explicitly list dirs or exclude.
        // Actually, tar on windows supports --exclude.

        const cmd = `tar -a -c -f "${zipName}" --exclude "node_modules" --exclude ".git" --exclude "dist" --exclude "build" *`;

        exec(cmd, { cwd: sourceDir }, (err, stdout, stderr) => {
            if (err) {
                console.error('Tar failed:', err);
                console.error('Stderr:', stderr);
            } else {
                console.log(`Successfully created ${zipName}`);
            }
        });
    } else {
        console.error('Tar not found. Please install a zip utility.');
    }
});

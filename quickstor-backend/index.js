import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import multer from 'multer';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- STATIC FILES SERVING (Render Deployment) ---
const PUBLIC_DIR = path.join(__dirname, 'public');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(PUBLIC_DIR, 'uploads');
        // Ensure directory exists
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the public URL
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl });
});

// 1. Admin Portal -> /adminportal
app.use('/adminportal', express.static(path.join(PUBLIC_DIR, 'adminportal')));
app.get('/adminportal/*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'adminportal', 'index.html'));
});

// 2. Staging Site -> /staging
app.use('/staging', express.static(path.join(PUBLIC_DIR, 'staging')));
app.get('/staging/*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'staging', 'index.html'));
});

// Shared Assets (Logo, etc)
app.use('/logo.png', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'logo.png'));
});

// 3. Live Site -> / (Root)
app.use('/', express.static(path.join(PUBLIC_DIR, 'live')));
// Note: Catch-all for live site must come AFTER API routes to avoid intercepting them
// We will place it at the very bottom of the file


// --- Proxy for OpenAI/Compatible APIs (Fixes CORS) ---
app.post('/api/proxy/openai', async (req, res) => {
    try {
        const { url, apiKey, body } = req.body;

        if (!url || !apiKey || !body) {
            console.error('[Proxy] Bad Request - Missing params:', {
                url: url ? 'Present' : 'MISSING',
                apiKey: apiKey ? 'Present' : 'MISSING',
                body: body ? 'Present' : 'MISSING'
            });
            return res.status(400).json({ error: 'Missing url, apiKey, or body' });
        }

        console.log(`[Proxy] Forwarding request to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Proxy] Upstream Error:', response.status, errorText);
            return res.status(response.status).send(errorText);
        }

        // If streaming is requested, pipe the response
        if (body.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Pipe the web stream to the node response
            // Node 18+ fetch returns a Web Stream, we need to handle it
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
            return;
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[Proxy] Internal Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to read data
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty object
        return {};
    }
}

// Helper to write data
async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper to get media assets as Base64
async function getMediaAssets() {
    const media = {};
    const uploadDir = path.join(PUBLIC_DIR, 'uploads');
    console.log(`[Backup] Scanning ${uploadDir} for media assets...`);

    try {
        const files = await fs.readdir(uploadDir);
        console.log(`[Backup] Found ${files.length} files in uploads directory.`);
        for (const file of files) {
            const filePath = path.join(uploadDir, file);
            // Skip directories
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) continue;

            const content = await fs.readFile(filePath, 'base64');
            media[`uploads/${file}`] = content;
            console.log(`[Backup] Bundled: uploads/${file}`);
        }
    } catch (e) {
        console.log('[Backup] No uploads directory found or error reading it.');
    }

    try {
        const logoPath = path.join(PUBLIC_DIR, 'logo.png');
        const logoContent = await fs.readFile(logoPath, 'base64');
        media['logo.png'] = logoContent;
        console.log('[Backup] Bundled: logo.png');
    } catch (e) {
        console.log('[Backup] No logo.png found in public root.');
    }

    return media;
}

// Helper to restore media assets from Base64
async function restoreMediaAssets(media) {
    if (!media || typeof media !== 'object') return;
    const entries = Object.entries(media);
    console.log(`[Restore] Restoring ${entries.length} media assets...`);

    for (const [relPath, content] of entries) {
        const fullPath = path.join(PUBLIC_DIR, relPath);
        const dir = path.dirname(fullPath);

        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, Buffer.from(content, 'base64'));
            console.log(`[Restore] Successfully restored: ${relPath}`);
        } catch (e) {
            console.error(`[Restore] FAILED to restore: ${relPath}`, e);
        }
    }
}

// GET endpoint to fetch ALL data + Media
app.get('/api/data', async (req, res) => {
    try {
        const includeAssets = req.query.assets === 'true';
        console.log(`[GET] Fetching ALL data (Backup${includeAssets ? ' + Assets' : ''})`);

        const allData = await readData();

        if (includeAssets) {
            const assets = await getMediaAssets();
            allData._media = assets;
        }

        res.json(allData);
    } catch (error) {
        console.error('Error reading all data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST endpoint to OVERWRITE ALL data + Media
app.post('/api/data', async (req, res) => {
    try {
        console.log('[POST] Restoring ALL data');
        const newData = req.body;

        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // 1. Restore Media if present
        if (newData._media) {
            console.log('Detected media assets in backup, restoring...');
            await restoreMediaAssets(newData._media);
            delete newData._media; // Don't save media blob into data.json
        }

        // 2. Save JSON data
        await writeData(newData);
        res.json({ success: true, message: 'Full restore completed (Data + Media if present)' });
    } catch (error) {
        console.error('Error restoring data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch a document
app.get('/api/data/:path(*)', async (req, res) => {
    try {
        const docPath = req.params.path;
        console.log(`[GET] Fetching ${docPath}`);

        const allData = await readData();
        const docData = allData[docPath];

        if (docData) {
            res.json(docData);
        } else {
            res.status(404).json({ error: 'Document not found' });
        }
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST endpoint to save a document
app.post('/api/data/:path(*)', async (req, res) => {
    try {
        const docPath = req.params.path;
        const newData = req.body;
        console.log(`[POST] Saving to ${docPath}`);

        const allData = await readData();
        allData[docPath] = newData; // Simple key-value storage using the path as key

        await writeData(allData);
        res.json({ success: true, path: docPath });
    } catch (error) {
        console.error('Error writing data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Initialize data file if it doesn't exist
try {
    await fs.access(DATA_FILE);
} catch {
    await fs.writeFile(DATA_FILE, '{}');
    console.log('Created new data.json file');
}

app.listen(PORT, () => {
    console.log(`QuickStor Backend running at http://localhost:${PORT}`);
});

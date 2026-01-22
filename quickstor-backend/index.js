import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Proxy for OpenAI/Compatible APIs (Fixes CORS) ---
app.post('/api/proxy/openai', async (req, res) => {
    try {
        const { url, apiKey, body } = req.body;

        if (!url || !apiKey || !body) {
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

// GET endpoint to fetch ALL data (for backup)
app.get('/api/data', async (req, res) => {
    try {
        console.log('[GET] Fetching ALL data (Backup)');
        const allData = await readData();
        res.json(allData);
    } catch (error) {
        console.error('Error reading all data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST endpoint to OVERWRITE ALL data (for restore)
app.post('/api/data', async (req, res) => {
    try {
        console.log('[POST] Restoring ALL data');
        const newData = req.body;

        // Basic validation
        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        await writeData(newData);
        res.json({ success: true, message: 'Full restore completed' });
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

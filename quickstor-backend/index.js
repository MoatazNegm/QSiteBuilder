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
app.use(express.json());

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

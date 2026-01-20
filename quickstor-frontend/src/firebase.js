// Adapter for QuickStor Backend (replaces Firebase)

const BACKEND_URL = 'http://localhost:3000/api/data';

// Mock objects
export const app = {};
export const analytics = {};
export const db = {};

export const getFirestore = () => db;

// Helper to get key
const getKey = (pathSegments) => pathSegments.join('/');

export const doc = (db, ...pathSegments) => {
    return {
        id: pathSegments[pathSegments.length - 1],
        path: getKey(pathSegments)
    };
};

export const getDoc = async (docRef) => {
    try {
        const response = await fetch(`${BACKEND_URL}/${docRef.path}`);
        if (!response.ok) {
            if (response.status === 404) {
                return { exists: () => false, data: () => undefined, id: docRef.id };
            }
            throw new Error('Backend error');
        }
        const data = await response.json();
        return {
            exists: () => true,
            data: () => data,
            id: docRef.id
        };
    } catch (e) {
        console.error("Error fetching from backend:", e);
        return { exists: () => false, data: () => undefined, id: docRef.id };
    }
};

export const setDoc = async (docRef, data, options) => {
    try {
        let finalData = data;

        // Handle merge logic if needed (Read first then write)
        if (options && options.merge) {
            const existingSnap = await getDoc(docRef);
            if (existingSnap.exists()) {
                finalData = { ...existingSnap.data(), ...data };
            }
        }

        const response = await fetch(`${BACKEND_URL}/${docRef.path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });

        if (!response.ok) throw new Error('Failed to save to backend');

        return await response.json();
    } catch (e) {
        console.error("Error saving to backend:", e);
        throw e;
    }
};

// Polling implementation for frontend "real-time" updates
export const onSnapshot = (docRef, callback) => {
    let isActive = true;
    let lastJson = null;

    const fetchData = async () => {
        if (!isActive) return;
        try {
            const snap = await getDoc(docRef);
            const currentJson = JSON.stringify(snap.data());

            // Only fire callback if data changed (simple optimization)
            if (currentJson !== lastJson) {
                lastJson = currentJson;
                callback(snap);
            }
        } catch (e) {
            console.error("Polling error:", e);
        }

        // Poll every 2 seconds
        if (isActive) setTimeout(fetchData, 2000);
    };

    fetchData();

    return () => { isActive = false; };
};

export const initializeApp = () => app;
export const getAnalytics = () => analytics;
// Adapter for QuickStor Backend (replaces Firebase)

const BACKEND_URL = '/api/data';

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

// Admin doesn't typically strictly need real-time listener for its own edits, 
// but we can mock it by just returning the data immediately once.
export const onSnapshot = (docRef, callback) => {
    // Initial fetch
    getDoc(docRef).then(snap => callback(snap));

    // No-op unsubscribe for now, or could implement polling
    return () => { };
};

export const initializeApp = () => app;
export const getAnalytics = () => analytics;
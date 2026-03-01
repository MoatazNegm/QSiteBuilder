import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "dummy",
    authDomain: "dummy",
    projectId: "quickstor",
    storageBucket: "dummy",
    messagingSenderId: "dummy",
    appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    const docRef = doc(db, 'sites', 'quickstor-staging');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        console.log("Pages count:", data.pages?.length);
        if (data.pages && data.pages.length > 0) {
            console.log("Home Page elements count:", data.pages[0].elements?.length);
            if (data.pages[0].elements?.length > 0) {
                console.log("First element:", JSON.stringify(data.pages[0].elements[0]).substring(0, 200) + "...");
            }
        }
    } else {
        console.log("Doc not found!");
    }
}
main();

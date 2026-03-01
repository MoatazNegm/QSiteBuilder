import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, 'data.json');
const dataStr = fs.readFileSync(dataFile, 'utf8');
const data = JSON.parse(dataStr);

const stagingSite = data['sites/quickstor-staging'];
if (stagingSite && stagingSite.pages && stagingSite.pages.length > 0) {
    const homePage = stagingSite.pages[0];
    console.log(`Elements on home page: ${homePage.elements ? homePage.elements.length : 0}`);
    if (homePage.elements) {
        homePage.elements.forEach((el, index) => {
            console.log(`\nElement ${index + 1}:`);
            console.log(`  ID: ${el.id}`);
            console.log(`  Name: ${el.name || el.type}`);
            console.log(`  x: ${el.x}, y: ${el.y}, zIndex: ${el.zIndex}`);
            console.log(`  width: ${el.width}, height: ${el.height}`);
            console.log(`  HTML starts with: ${el.html.substring(0, 100).replace(/\n/g, '')}...`);
        });
    }
} else {
    console.log('Staging site or pages not found');
}

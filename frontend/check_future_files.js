const fs = require('fs');
const path = require('path');

const now = Date.now();
const futureFiles = [];

function checkDirectory(dir) {
  if (dir.includes('node_modules') && !dir.includes('react-native') && !dir.includes('safe-area') && !dir.includes('screens') && !dir.includes('razorpay')) {
    // Skip unrelated node_modules to make it fast
    return;
  }
  
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        checkDirectory(fullPath);
      } else {
        if (stat.mtimeMs > now + 2000) { // 2 seconds threshold
          futureFiles.push({
            path: fullPath,
            mtime: new Date(stat.mtimeMs).toISOString()
          });
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

console.log("Searching for files with future timestamps...");
checkDirectory('.');
console.log(`Found ${futureFiles.length} files in the future.`);
if (futureFiles.length > 0) {
  console.log("Top 20 future files:");
  futureFiles.slice(0, 20).forEach(f => {
    console.log(`- ${f.path} (${f.mtime})`);
  });
}

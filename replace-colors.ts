import * as fs from 'fs';

const files = ['src/App.tsx', 'src/index.css'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace #141414 with #4b5563 (gray-600)
  content = content.replace(/#141414/g, '#4b5563');
  
  // Replace rgba(20,20,20, with rgba(75,85,99,
  content = content.replace(/rgba\(20,20,20,/g, 'rgba(75,85,99,');
  
  fs.writeFileSync(file, content);
});

console.log('Colors replaced successfully!');

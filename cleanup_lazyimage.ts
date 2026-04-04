import fs from 'fs';

const appTsxPath = 'src/App.tsx';
let content = fs.readFileSync(appTsxPath, 'utf8');

const match = content.match(/^: React\.ImgHTMLAttributes<HTMLImageElement>\) \{/m);
if (match) {
  const startIndex = match.index!;
  let braceCount = 0;
  let j = startIndex;
  let foundFirstBrace = false;
  
  while (j < content.length) {
    if (content[j] === '{') {
      braceCount++;
      foundFirstBrace = true;
    } else if (content[j] === '}') {
      braceCount--;
    }
    
    if (foundFirstBrace && braceCount === 0) {
      break;
    }
    j++;
  }
  
  if (j < content.length) {
    content = content.slice(0, startIndex) + content.slice(j + 1);
  }
}

fs.writeFileSync(appTsxPath, content);
console.log('Successfully cleaned up LazyImage');

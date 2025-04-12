import { HTMLToJSON } from 'html-to-json-parser';
import { generateMerkleTree } from "@node101/merkle-tree"

let htmlString = `<html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta name="keywords" content="world, item">
                        <title>Document</title>
                    </head>
                    <body>
                        <h1>Hello World</h1>
                        <p>This is a paragraph.</p>
                        <ul>
                            <li data-openseo-id="1">Item 1</li>
                            <li data-openseo-id="2">Item 2</li>
                            <li>Item 3</li>     
                             <li>Item 3</li>     
                        </ul>
                        <div>
                            <p>Another paragraph inside a div.</p>
                            <a href="https://example.com">Link</a>
                        </div>dd
                    </body>
                 </html>`;
    
async function parsedHTML() {
  const cleanedHtmlString = htmlString
  let result = await HTMLToJSON(cleanedHtmlString.trim(), true);
  return result;
}


function extract(obj, result, path = [], childCounters = {}) {
  // Skip if not an object
  if (!obj || typeof obj !== 'object') return;
  
  // Build tag representation with attributes and position
  const currentType = obj.type;
  if (currentType) {
    // Track this element's position among siblings of same type
    if (!childCounters[currentType]) {
      childCounters[currentType] = 1;
    } else {
      childCounters[currentType]++;
    }
    
    let tagRepresentation = `${currentType}:${childCounters[currentType]}`;
    
    // Add attributes to the tag representation if they exist
    if (obj.attributes && Object.keys(obj.attributes).length > 0) {
      const attributeStrings = [];
      for (const [key, value] of Object.entries(obj.attributes)) {
        attributeStrings.push(`${key}=${value}`);
      }
      if (attributeStrings.length > 0) {
        tagRepresentation += `[${attributeStrings.join(',')}]`;
      }
    }
    
    path.push(tagRepresentation);
  }
  
  // Process content of current element
  if (currentType) {
    // Reset child counters for this level's children
    const contentChildCounters = {};
    
    if (Array.isArray(obj.content)) {
      for (const item of obj.content) {
        if (typeof item === 'string') {
          const cleanedValue = item.replaceAll(/[\s\r\n]/g, '');
          if (cleanedValue) {
            // Join the path with '>' to create full hierarchy
            result.push(`${path.join('>')}:${cleanedValue}`);
          }
        } else if (item && typeof item === 'object') {
          extract(item, result, path, contentChildCounters);
        }
      }
    } 
    else if (typeof obj.content === 'string') {
      const cleanedValue = obj.content.replaceAll(/[\s\r\n]/g, '');
      if (cleanedValue) {
        result.push(`${path.join('>')}:${cleanedValue}`);
      }
    }
  }
  
  // Process all other properties for nested elements
  for (const key in obj) {
    if (key !== 'type' && key !== 'content' && key !== 'attributes' && obj[key] && typeof obj[key] === 'object') {
      extract(obj[key], result, path, {});
    }
  }
  
  // Remove current type from path when done with this object
  if (currentType) {
    path.pop();
  }
}

function extractValues(json_object) { 
  if (typeof json_object === 'string') json_object = JSON.parse(json_object)
  
  const result = [];
  extract(json_object, result, [], {});
  return result;
}

function extractKeyWords(json_object) { 
  // extract keywords from the meta tag
}

function generateMerkleTreeFromLeaves(leaves) {
    const merkleTree = generateMerkleTree(leaves);
    return merkleTree;
}



function main() {
    parsedHTML()
      .then((parsed_value) => {
        const leaves =  extractValues(parsed_value);
        console.log("Leaves ", leaves)
        const generatedTree = generateMerkleTreeFromLeaves(leaves);
        console.log('Generated Merkle Tree:', generatedTree);

      })
      .catch((error) => {
        console.error('Error parsing HTML:', error);
    });
}
  
main();

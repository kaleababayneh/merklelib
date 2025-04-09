import { HTMLToJSON } from 'html-to-json-parser';
import { generateMerkleTree } from "@node101/merkle-tree"

let htmlString = `<html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Document</title>
                    </head>
                    <body>
                        <h1>Hello World</h1>
                        <p>This is a paragraph.</p>
                        <ul>
                            <li>Item 1</li>
                            <li>Item 2</li>
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
// function extract(obj, result) {
//   for (const key in obj) {
//     if (obj[key] && typeof obj[key] === 'object') {
//       extract(obj[key], result);  
//     } else {
//       const leafValue =obj[key].replaceAll(/[\s\r\n]/g, '');
//       result.push(leafValue); 
//     }
//   }
// }



// function extractValues(json_object) {
//   console.log("JSON Object ", json_object)
//     json_object = JSON.parse(json_object);  
//     const result = [];
//     extract(json_object, result);  
//     return result;
// }

// ...existing code...
function extract(obj, result) {
  // Skip if not an object
  if (!obj || typeof obj !== 'object') return;
  
  // Process an element with type
  if (obj.type) {
    // Handle content array
    if (Array.isArray(obj.content)) {
      for (const item of obj.content) {
        // Extract text content with type prefix
        if (typeof item === 'string') {
          const cleanedValue = item.replaceAll(/[\s\r\n]/g, '');
          if (cleanedValue) {
            result.push(`${obj.type}:${cleanedValue}`);
          }
        } else if (item && typeof item === 'object') {
          // Process nested elements
          extract(item, result);
        }
      }
    } 
    // Handle direct string content
    else if (typeof obj.content === 'string') {
      const cleanedValue = obj.content.replaceAll(/[\s\r\n]/g, '');
      if (cleanedValue) {
        result.push(`${obj.type}:${cleanedValue}`);
      }
    }
  }
  
  // Process all properties for nested elements
  for (const key in obj) {
    if (key !== 'type' && key !== 'content' && obj[key] && typeof obj[key] === 'object') {
      extract(obj[key], result);
    }
  }
}

function extractValues(json_object) {
  console.log("JSON Object ", json_object);
  const parsed = typeof json_object === 'string' ? JSON.parse(json_object) : json_object;
  
  const result = [];
  extract(parsed, result);
  return result;
}
// ...existing code...

function generateMerkleTreeFromLeaves(leaves) {
    const merkleTree = generateMerkleTree(leaves);
    return merkleTree;
}



function main() {
    parsedHTML()
      .then((parsed_value) => {
        const leaves =  extractValues(parsed_value);
        console.log("Leaves ", leaves)
        //const generatedTree = generateMerkleTreeFromLeaves(leaves);
        //console.log('Generated Merkle Tree:', generatedTree);

      })
      .catch((error) => {
        console.error('Error parsing HTML:', error);
    });
}
  
main();

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
                              <p>Another One</p>
                              <p>Another One</p>
                              <p>Another One</p>
                              <p>Another One</p>
                        </div>

                        <div>
                              <p>Another One</p>
                              <p>Another One</p>
                              <p>Another One</p>
                              <p>Another One</p>
                        </div>

                         <ul>
                            <li data-openseo-id="1">Item 1</li>
                            <li data-openseo-id="2">Item 2</li>
                            <li>Item 3</li>     
                             <li>Item 3</li>     
                        </ul>

                        <div>
                            <p>Another paragraph inside a div.</p>
                            <a href="https://example.com">Link</a>
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
  if (!obj || typeof obj !== 'object') return;

  const currentType = obj.type;
  if (currentType) {

    childCounters[currentType] = (childCounters[currentType] || 0) + 1;
    let tagRepresentation = `${currentType}:${childCounters[currentType]}`;

    const hasDirectTextContent = obj.content && (
      typeof obj.content === 'string' || 
      (Array.isArray(obj.content) && obj.content.some(item => typeof item === 'string' && item.trim()))
    );
    
    if (hasDirectTextContent) {
      tagRepresentation += `:${childCounters[currentType]}`;
    }

    if (obj.attributes && Object.keys(obj.attributes).length > 0) {
      const attributeStrings = Object.entries(obj.attributes).map(
        ([key, value]) => `${key}=${value}`
      );
      tagRepresentation += `[${attributeStrings.join(',')}]`;
    }

    path.push(tagRepresentation);
  }

  if (currentType && obj.content != null) {
    const contents = Array.isArray(obj.content) ? obj.content : [obj.content];
    const contentChildCounters = {};

    for (const item of contents) {
      if (typeof item === 'string') {
        const cleanedValue = item.replaceAll(/[\s\r\n]/g, '');
        if (cleanedValue) {
          const pathCopy = [...path];
          const lastIdx = pathCopy.length - 1;
          if (lastIdx >= 0 && !pathCopy[lastIdx].includes(':')) {
            const parts = pathCopy[lastIdx].split('[');
            const tagType = parts[0];
            const attrs = parts.length > 1 ? `[${parts[1]}` : '';
            pathCopy[lastIdx] = `${tagType}:${childCounters[currentType]}${attrs}`;
          }
          
          result.push(`${pathCopy.join('>')}:${cleanedValue}`);
        }
      } else if (item && typeof item === 'object') {
        extract(item, result, path, contentChildCounters);
      }
    }
  }

  for (const key in obj) {
    if (key !== 'type' && key !== 'content' && key !== 'attributes' && obj[key] && typeof obj[key] === 'object') {
      extract(obj[key], result, path, {});
    }
  }
  
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
  if (typeof json_object === 'string') json_object = JSON.parse(json_object);
  
  if (json_object.content) {
    for (const item of json_object.content) {
      if (item && item.type === 'head' && item.content) {
        for (const headItem of item.content) {
          if (headItem && 
              headItem.type === 'meta' && 
              headItem.attributes && 
              headItem.attributes.name === 'keywords' && 
              headItem.attributes.content) {
            
            return headItem.attributes.content
              .split(',')
              .map(keyword => keyword.trim())
              .filter(keyword => keyword.length > 0);
          }
        }
      }
    }
  }
  
  return [];
}

function generateMerkleTreeFromLeaves(leaves) {
    const merkleTree = generateMerkleTree(leaves);
    return merkleTree;
}


function searchContent(obj, keywords, matchingTags) {
  if (!obj || typeof obj !== 'object') return;
  
  if (obj.type) {
    let foundKeyword = null;
    let textContent = '';
    
    if (Array.isArray(obj.content)) {
      for (const item of obj.content) {
        if (typeof item === 'string') {
          textContent += ' ' + item;
        }
      }
    } else if (typeof obj.content === 'string') {
      textContent = obj.content;
    }
    
    for (const keyword of keywords) {
      if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeyword = keyword;
        break; 
      }
    }
    
    if (foundKeyword) {
      // Just include the parent tag info
      matchingTags.push({
        tag: obj.type,
        keyword: foundKeyword,
        // fullTag: obj.type + (obj.attributes ? JSON.stringify(obj.attributes) : ''),
      });
    }
    
    // Continue searching in child elements
    if (Array.isArray(obj.content)) {
      for (const item of obj.content) {
        if (typeof item === 'object') {
          searchContent(item, keywords, matchingTags);
        }
      }
    }
  }
  
  // Check other properties
  for (const key in obj) {
    if (key !== 'type' && key !== 'content' && obj[key] && typeof obj[key] === 'object') {
      searchContent(obj[key], keywords, matchingTags);
    }
  }
}

function tagsThatIncludeKeywords(json_object, keywords) {

  if (typeof json_object === 'string') json_object = JSON.parse(json_object);
  if (!keywords || keywords.length === 0) return [];

  const matchingTags = [];
  searchContent(json_object, keywords, matchingTags);

  return matchingTags;
}


function main() {
    parsedHTML()
      .then((parsed_value) => {
        const leaves =  extractValues(parsed_value);
        const keywords = extractKeyWords(parsed_value);
        console.log("Keywords ", keywords)
        console.log("Leaves ", leaves)
        console.log("Parsed HTML ", parsed_value)
        const generatedTree = generateMerkleTreeFromLeaves(leaves);
        console.log('Generated Merkle Tree:', generatedTree);

        console.log("Tags that include keywords ", tagsThatIncludeKeywords(parsed_value, keywords))

      })
      .catch((error) => {
        console.error('Error parsing HTML:', error);
    });
}
  
main();

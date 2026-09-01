const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const folders = fs.readdirSync(rootDir).filter(f => fs.statSync(path.join(rootDir, f)).isDirectory() && (f.startsWith('blindpot_') || f.startsWith('bureau_')));

for (const folder of folders) {
    const htmlPath = path.join(rootDir, folder, 'code.html');
    if (!fs.existsSync(htmlPath)) continue;

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Remove script tags from body
    bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Fix inline style comments that break JSX
    bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, '');

    // class -> className
    bodyContent = bodyContent.replace(/\bclass="/g, 'className="');
    
    // for -> htmlFor
    bodyContent = bodyContent.replace(/\bfor="/g, 'htmlFor="');

    // self close img, input, br, hr
    bodyContent = bodyContent.replace(/<(img|input|br|hr)([^>]*?)(?<!\/)>/gi, '<$1$2 />');
    
    // Some SVGs might have invalid props for React, but we'll leave them for now.
    // SVG stroke-width -> strokeWidth etc.
    bodyContent = bodyContent.replace(/stroke-width/g, 'strokeWidth');
    bodyContent = bodyContent.replace(/stroke-linecap/g, 'strokeLinecap');
    bodyContent = bodyContent.replace(/stroke-linejoin/g, 'strokeLinejoin');
    bodyContent = bodyContent.replace(/fill-rule/g, 'fillRule');
    bodyContent = bodyContent.replace(/clip-rule/g, 'clipRule');

    // Add logo to header
    // Look for <a className="...tracking-tighter" href="#">blindpot</a>
    bodyContent = bodyContent.replace(
        /<a className="([^"]*tracking-tighter[^"]*)" href="#">blindpot<\/a>/,
        `<a className="$1 flex items-center gap-2" href="#">\n    <img src="/logo/logo.png" alt="Blindpot" className="h-8 w-auto" />\n    blindpot\n  </a>`
    );

    // If logo not added by the above, try looking for just `>blindpot</a>`
    if (!bodyContent.includes('/logo/logo.png')) {
        bodyContent = bodyContent.replace(
            /<a ([^>]*)>blindpot<\/a>/i,
            `<a $1 className="flex items-center gap-2"><img src="/logo/logo.png" alt="Blindpot" className="h-8 w-auto" />blindpot</a>`
        );
    }
    
    // Basic component structure
    const componentName = folder.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    
    const tsx = `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    <>\n${bodyContent}\n    </>\n  );\n}\n`;

    fs.writeFileSync(path.join(rootDir, folder, 'page.tsx'), tsx, 'utf8');
    console.log(`Converted ${folder}/code.html to ${folder}/page.tsx`);
}

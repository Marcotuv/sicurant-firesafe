const fs = require('fs');
const path = require('path');

// Leggi il markdown
const mdPath = path.join(__dirname, 'analisi_tecnica_sicurant_firesafe.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Leggi il logo e converti in base64
const logoPath = path.join(__dirname, 'public', 'logo.png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

// Crea HTML con stili per la stampa
const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analisi Tecnica SICURANT FireSafe</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }

        .header-logo {
            text-align: center;
            margin-bottom: 20px;
        }

        .header-logo img {
            max-width: 200px;
            height: auto;
        }
        
        h1 {
            color: #dc2626;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 10px;
            page-break-after: avoid;
            text-align: center;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            margin-top: 30px;
            page-break-after: avoid;
        }
        
        h3 {
            color: #059669;
            margin-top: 20px;
            page-break-after: avoid;
        }
        
        h4 {
            color: #7c3aed;
            page-break-after: avoid;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #1f2937;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background-color: #1f2937;
            color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
        }
        
        pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
        }
        
        blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 20px;
            margin-left: 0;
            font-style: italic;
            background-color: #eff6ff;
            padding: 15px 20px;
            border-radius: 0 5px 5px 0;
        }
        
        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 5px 0;
        }
        
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        
        .alert-important {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
        }
        
        .alert-warning {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
        }
        
        .alert-caution {
            background-color: #fecaca;
            border-left: 4px solid #991b1b;
        }
        
        .alert-tip {
            background-color: #d1fae5;
            border-left: 4px solid #059669;
        }
        
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
            a {
                color: #1e40af;
                text-decoration: none;
            }
            
            a[href]:after {
                content: none;
            }
        }
    </style>
</head>
<body>
    <div class="header-logo">
        <img src="${logoBase64}" alt="Sicur.Ant Logo">
    </div>
${convertMarkdownToHTML(mdContent)}
</body>
</html>
`;

// Funzione semplice per convertire markdown in HTML
function convertMarkdownToHTML(md) {
    let html = md;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Alerts
    html = html.replace(/> \[!IMPORTANT\]\n> (.*?)(?=\n\n|\n#|$)/gs, '<div class="alert alert-important"><strong>⚠️ IMPORTANTE:</strong> $1</div>');
    html = html.replace(/> \[!WARNING\]\n> (.*?)(?=\n\n|\n#|$)/gs, '<div class="alert alert-warning"><strong>⚠️ ATTENZIONE:</strong> $1</div>');
    html = html.replace(/> \[!CAUTION\]\n> (.*?)(?=\n\n|\n#|$)/gs, '<div class="alert alert-caution"><strong>🚨 CRITICO:</strong> $1</div>');
    html = html.replace(/> \[!TIP\]\n> (.*?)(?=\n\n|\n#|$)/gs, '<div class="alert alert-tip"><strong>💡 SUGGERIMENTO:</strong> $1</div>');

    // Tables
    html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, function (match, header, rows) {
        const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
        const rowsHtml = rows.trim().split('\n').map(row => {
            const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Checkboxes
    html = html.replace(/- \[ \]/g, '<li>☐');
    html = html.replace(/- \[x\]/g, '<li>✅');
    html = html.replace(/- \[\/\]/g, '<li>🔄');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<div)/g, '$1');
    html = html.replace(/(<\/div>)<\/p>/g, '$1');
    html = html.replace(/<p><hr><\/p>/g, '<hr>');
    html = html.replace(/<p><pre>/g, '<pre>');
    html = html.replace(/<\/pre><\/p>/g, '</pre>');

    return html;
}

// Salva HTML
const htmlPath = path.join(__dirname, 'analisi_tecnica_sicurant_firesafe.html');
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('✅ File HTML generato:', htmlPath);
console.log('📄 Aprire il file HTML nel browser e usare "Stampa > Salva come PDF"');

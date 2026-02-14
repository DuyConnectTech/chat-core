import { marked } from 'marked';
import hljs from 'highlight.js';

// --- Cấu hình Marked + Highlight.js ---
marked.setOptions({
    breaks: true,       // Xuống dòng = <br>
    gfm: true,          // GitHub Flavored Markdown
    highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
});

/**
 * Parse markdown text → HTML với syntax highlighting + copy button
 * @param {string} text - Raw markdown text
 * @returns {string} Parsed HTML
 */
export function renderMarkdown(text) {
    if (!text || typeof text !== 'string') return '';

    // Parse markdown → HTML
    let html = marked.parse(text);

    // Thêm copy button vào mỗi code block
    html = html.replace(
        /<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g,
        (match, attrs, code) => {
            return `
                <div class="code-block-wrapper">
                    <button class="code-copy-btn" onclick="copyCodeBlock(this)" title="Copy code">
                        <i class="fas fa-copy"></i>
                    </button>
                    <pre><code${attrs}>${code}</code></pre>
                </div>
            `;
        }
    );

    return html;
}

/**
 * Check xem text có chứa markdown syntax không
 * Dùng để quyết định render markdown hay plain text
 */
export function hasMarkdown(text) {
    if (!text) return false;
    const patterns = [
        /```[\s\S]*?```/,          // Code blocks
        /\*\*[^*]+\*\*/,           // Bold
        /\*[^*]+\*/,               // Italic
        /^#{1,6}\s/m,              // Headings
        /^\s*[-*+]\s/m,            // Unordered lists
        /^\s*\d+\.\s/m,            // Ordered lists
        /`[^`]+`/,                 // Inline code
        /\[.+\]\(.+\)/,           // Links
    ];
    return patterns.some(p => p.test(text));
}

// Global function cho copy button
window.copyCodeBlock = function (btn) {
    const code = btn.nextElementSibling?.querySelector('code');
    if (!code) return;

    const text = code.innerText;
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i>';
            btn.classList.remove('copied');
        }, 2000);
    });
};

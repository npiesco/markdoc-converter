# Mark My Words Down

**A beautiful Markdown to Word converter with real-time preview**

*Convert Markdown to Microsoft Word entirely in your browser. Zero server communication. Your documents never leave your computer.*

![Privacy](https://img.shields.io/badge/privacy-100%25%20Client%20Side-brightgreen)
![Tech Stack](https://img.shields.io/badge/stack-React%20|%20TypeScript%20|%20Vite%20|%20Tailwind-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What is Mark My Words Down?

Mark My Words Down is a **100% client-side Markdown editor** that runs entirely in your browser with zero server communication. It provides real-time Word document preview and export functionality, converting GitHub Flavored Markdown to properly formatted Microsoft Word documents while preserving all formatting, code blocks, tables, and hyperlinks.

**Your privacy is absolute**: All processing happens locally in your browser. No data is ever transmitted, stored, or tracked. No servers. No APIs. No tracking. Just you and your documents.

## Privacy First

**Everything happens in your browser. Nothing is sent anywhere. Ever.**

- **No servers**: All Markdown parsing and Word conversion runs locally in JavaScript
- **No tracking**: Zero analytics, cookies, localStorage, or third-party services
- **No network calls**: Works completely offline after initial page load
- **No data persistence**: Content exists only in memory and disappears when you close the tab
- **No external dependencies**: All assets bundled locally, no CDN connections
- **Progressive Web App**: Install on any device and use without internet connection

**Your documents are yours alone. We never see them. Nobody does.**

## Features

- **Real-time Preview**: See exactly how your document will look in Word as you type
- **Word-Perfect Formatting**: Matches Microsoft Word 2016+ default styles
- **Code Block Labels**: Syntax-highlighted code blocks with language labels
- **Hyperlink Support**: Clickable links that work in Word documents
- **Table Formatting**: Professional-looking tables with proper borders
- **Dark Mode**: Eye-friendly dark theme for comfortable editing
- **Split View**: Edit and preview side-by-side
- **Export to Word**: One-click .doc file generation
- **GFM Support**: Full GitHub Flavored Markdown compatibility

## Quick Start

### Prerequisites

- **Node.js** 18+ (for development)
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

### Installation

#### Install as PWA (Recommended)

The app works as a Progressive Web App - install it on any device:

**Desktop (Chrome/Edge):**
1. Visit the app URL
2. Click the install icon in the address bar
3. Click "Install"

**Mobile (iOS/Android):**
1. Open in Safari/Chrome
2. Tap Share button
3. Select "Add to Home Screen"

Once installed, the app works completely offline - no internet required!

#### Run Locally for Development

```bash
# Clone the repository
git clone https://github.com/npiesco/markdoc-converter.git
cd markdoc-converter

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`

#### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## Usage

### Basic Markdown Editing

The editor supports all standard Markdown syntax:

# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

- Bullet points
- Another item

1. Numbered lists
2. Second item

[Link text](https://github.com)

> Blockquotes for important notes

| Column 1 | Column 2 |
|----------|----------|
| Data     | More data|

### Code Blocks with Language Labels

Use fenced code blocks with language identifiers:

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```

```python
def greet(name):
    print(f"Hello, {name}!")
```
````

The exported Word document will show language labels above each code block.

### Hyperlinks

Links are automatically converted to clickable hyperlinks in Word:

Visit the [documentation](https://github.com/npiesco/markdoc-converter#readme) for more information.

Check out our [GitHub repository](https://github.com/npiesco/markdoc-converter).

### Exporting to Word

1. Write your Markdown in the editor
2. Click the "Export to Word" button in the toolbar
3. A `.doc` file will be downloaded automatically
4. Open in Microsoft Word to see your formatted document

## How It Works

### Real-time Word Preview

The preview pane shows exactly how your document will appear in Microsoft Word, including:

- **Calibri font family** (Word's default)
- **Proper heading hierarchy** with Word 2016+ colors
- **Page layout simulation** with shadow and borders
- **Code block styling** matching Word's appearance
- **Table borders** in black for professional output

### View Modes

**Split View**: See editor and preview side-by-side

**Editor Only**: Maximize writing space

**Preview Only**: Focus on document layout

### Dark Mode

Toggle dark mode for comfortable editing in low-light environments. The preview maintains Word's white background regardless of theme.

### Export Formatting

Exported Word documents include:

- **Office namespace declarations** for maximum compatibility
- **Word-specific styles** (Calibri, Calibri Light fonts)
- **Conditional comments** for legacy Word versions
- **Proper spacing** between elements
- **Black text** on white background for printing

## Tech Stack

**Core Libraries:**

- **React** 19.2 - UI framework
- **TypeScript** 5.8 - Type safety
- **Vite** 6.2 - Build tool and dev server
- **Tailwind CSS** 3.4 - Utility-first styling
- **Marked** 14.1 - Markdown parser
- **Lucide React** 0.554 - Icon library

**Development:**

- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **@vitejs/plugin-react** - React Fast Refresh

## Project Structure

```
mark-my-words-down/
├── components/
│   ├── Editor.tsx           # Markdown editor component
│   ├── Preview.tsx          # Word preview renderer
│   └── Toolbar.tsx          # App toolbar with controls
├── utils/
│   └── exportUtils.ts       # Word document export logic
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── index.css                # Global styles and Tailwind
├── types.ts                 # TypeScript type definitions
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── tsconfig.json            # TypeScript configuration
```

## License

**MIT License**

Copyright (c) 2025 Mark My Words Down Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contributing

Contributions welcome! Please follow these guidelines:

1. **Fork the repository** - Create your feature branch
2. **Write clean code** - Follow existing code style
3. **Test thoroughly** - Ensure exports work correctly
4. **Update documentation** - Keep README current
5. **Submit a pull request** - Describe your changes

---

**Questions?** Open an [issue](https://github.com/npiesco/markdoc-converter/issues) or submit a pull request.

**Like this project?** Star the repo and share with your team!

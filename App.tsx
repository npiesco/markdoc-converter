
import React, { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { exportToWord } from './utils/exportUtils';
import { ViewMode } from './types';

const DEFAULT_CONTENT = `# Project Proposal

## Executive Summary
This document outlines the strategy for the upcoming **Q4 Launch**. We aim to leverage *innovative technologies* to streamline our workflow.

For more information, check out the [GitHub repository](https://github.com/npiesco/markdoc-converter) or view the [README documentation](https://github.com/npiesco/markdoc-converter#readme).

### Key Objectives
1. Increase efficiency by 25%
2. Reduce deployment time
3. Improve documentation standards

## Technical Requirements
The system needs to handle:
- High concurrency
- Real-time data processing

> "Innovation distinguishes between a leader and a follower."

| Component | Status | Priority |
|-----------|--------|----------|
| Frontend  | Done   | High     |
| Backend   | WIP    | High     |
| Database  | Pending| Medium   |

\`\`\`javascript
function init() {
  console.log("System ready");
}
\`\`\`
`;

const App: React.FC = () => {
  const [content, setContent] = useState<string>(DEFAULT_CONTENT);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Toggle dark mode class on body
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleExport = () => {
    exportToWord(content, "Document");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Toolbar
        onExport={handleExport}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <main className="flex-1 overflow-hidden p-4 gap-4 flex">
        {(viewMode === ViewMode.SPLIT || viewMode === ViewMode.EDITOR) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
            <Editor 
              content={content} 
              onChange={setContent} 
            />
          </div>
        )}
        
        {(viewMode === ViewMode.SPLIT || viewMode === ViewMode.PREVIEW) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
            <Preview content={content} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

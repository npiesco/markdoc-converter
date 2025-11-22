
import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { exportToWord } from './utils/exportUtils';
import { ViewMode } from './types';

const App: React.FC = () => {
  const [content, setContent] = useState<string>('# Loading...');
  
  // Load README.md on component mount
  useEffect(() => {
    fetch('/README.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => {
        console.error('Failed to load README:', error);
        setContent('# Mark My Words Down\n\nWelcome! Start typing your Markdown here...');
      });
  }, []);
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

  const handleExport = async () => {
    await exportToWord(content, "Document");
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

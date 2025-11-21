
import React from 'react';
import { 
  FileText, 
  Download, 
  Columns, 
  Maximize, 
  Minimize,
  Moon,
  Sun
} from 'lucide-react';
import { ViewMode } from '../types';

interface ToolbarProps {
  onExport: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExport,
  viewMode,
  setViewMode,
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
          Mark My Words Down
        </h1>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode(ViewMode.EDITOR)}
          className={`p-2 rounded-md transition-all ${viewMode === ViewMode.EDITOR ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          title="Editor Only"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode(ViewMode.SPLIT)}
          className={`p-2 rounded-md transition-all ${viewMode === ViewMode.SPLIT ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          title="Split View"
        >
          <Columns className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode(ViewMode.PREVIEW)}
          className={`p-2 rounded-md transition-all ${viewMode === ViewMode.PREVIEW ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          title="Preview Only"
        >
          <Minimize className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Export to Word</span>
        </button>
      </div>
    </header>
  );
};

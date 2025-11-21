import React from 'react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, disabled }) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Markdown Input
      </div>
      <textarea
        className="flex-1 w-full h-full p-6 resize-none outline-none font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# Start writing your document here..."
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
};
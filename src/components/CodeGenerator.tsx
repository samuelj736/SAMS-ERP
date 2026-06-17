/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  Info, 
  HelpCircle, 
  Sliders, 
  Code2, 
  ExternalLink 
} from 'lucide-react';
import { LARAVEL_12_BLUEPRINTS, Blueprint } from '../data/phpBlueprints';

export default function CodeGenerator() {
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Dynamic configuration panel
  const [namespace, setNamespace] = useState('App');
  const [useStrict, setUseStrict] = useState(true);

  const activeFile = LARAVEL_12_BLUEPRINTS[activeFileIdx];

  // Dynamically configure codes based on customized rules
  const getAlteredCode = (originalCode: string) => {
    let code = originalCode;
    if (namespace !== 'App') {
      code = code.replace(/namespace App\\/g, `namespace ${namespace}\\`);
    }
    return code;
  };

  const handleCopy = () => {
    const codeToCopy = getAlteredCode(activeFile.code);
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 font-display flex items-center gap-2">
            <Code2 size={20} className="text-amber-500" />
            Laravel 12 + Filament v3 Blueprint Porter
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review and copy production-ready, highly compliant PHP structures tailored exactly to this flower business logic.
          </p>
        </div>

        <div className="flex gap-2 text-xs flex-wrap">
          {/* External project credits */}
          <span className="bg-slate-50 border px-3 py-1.5 rounded-lg text-slate-800 font-bold font-sans">
            Laravel Framework 12.x • Filament Admin v3
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configurations & File Navigation */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Parameter Configs */}
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Sliders size={14} className="text-amber-500" />
              Developer Settings
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Laravel App PSR-4 Namespace</label>
                <input
                  id="code-namespace-input"
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  className="w-full p-2 bg-gray-50 border rounded-lg text-xs font-mono focus:outline- Amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500 font-semibold">Enable strict types file declare</span>
                <input
                  id="code-strict-toggle"
                  type="checkbox"
                  checked={useStrict}
                  onChange={(e) => setUseStrict(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Files collection */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50/50">
              <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Laravel Code Layers</h4>
            </div>

            <nav className="divide-y text-xs">
              {LARAVEL_12_BLUEPRINTS.map((file, idx) => (
                <button
                  id={`btn-code-file-${idx}`}
                  key={idx}
                  onClick={() => {
                    setActiveFileIdx(idx);
                    setCopied(false);
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-50/30 transition-colors cursor-pointer flex items-center gap-2 font-medium ${
                    activeFileIdx === idx 
                      ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 font-bold' 
                      : 'text-gray-600'
                  }`}
                >
                  <FileCode size={16} className={activeFileIdx === idx ? 'text-amber-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-bold">{file.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{file.filename}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dynamic Syntax Highlight Code Box */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl relative">
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 select-none">
            <div className="flex items-center gap-2">
              <Terminal className="text- amber-500 shrink-0" size={18} />
              <div className="text-xs">
                <span className="text-slate-400 block font-normal text-[10px]">Active Buffer File</span>
                <strong className="text-slate-200 font-mono text-xs">{activeFile.filename}</strong>
              </div>
            </div>

            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 border border-slate-700 hover:border-slate-600"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  Code Copied!
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copy File Code
                </>
              )}
            </button>
          </div>

          <pre className="overflow-x-auto text-xs text-slate-300 font-mono max-h-[500px] leading-relaxed pr-2">
            <code>
              {useStrict && "<?php\n\ndeclared(strict_types=1);\n\n"}
              {getAlteredCode(activeFile.code).replace('<?php\n', '')}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

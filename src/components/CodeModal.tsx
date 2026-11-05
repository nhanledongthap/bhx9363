import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Code, Sparkles } from 'lucide-react';
import { downloadStandaloneHtml } from '../utils/exportHtml';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/bachhoaxanh_dashboard.html')
        .then((res) => res.text())
        .then((text) => {
          setHtmlCode(text);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!htmlCode) return;
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (htmlCode) {
      downloadStandaloneHtml(htmlCode);
    } else {
      window.open('/bachhoaxanh_dashboard.html', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-[#005427] to-[#007738] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC700] text-[#005427] font-black flex items-center justify-center shadow-xs">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Mã Nguồn HTML Hoàn Chỉnh (1 File Duy Nhất)
                <span className="text-[11px] font-semibold bg-[#FFC700] text-[#005427] px-2 py-0.5 rounded-full">
                  Standalone
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Tích hợp sẵn Tailwind CSS (CDN) và Chart.js (CDN). Mở trực tiếp trên mọi thiết bị mà không cần cài đặt.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tên file: <b className="font-mono text-slate-900">bachhoaxanh_dashboard.html</b></span>
            <span>·</span>
            <span>Dung lượng: <b className="font-mono text-slate-900">~25 KB</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép vào bộ nhớ!' : 'Sao chép toàn bộ HTML'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-[#007738] text-white hover:bg-[#005427] transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Tải file .html về máy</span>
            </button>

            <a
              href="/bachhoaxanh_dashboard.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở tab mới</span>
            </a>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0d1512] text-emerald-300 font-mono text-xs custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              Đang tải mã nguồn...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed select-all">
              {htmlCode}
            </pre>
          )}
        </div>

        {/* Guide / Footer */}
        <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <b className="text-[#005427]">💡 Hướng dẫn triển khai:</b> Lưu file thành <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-[#005427]">index.html</code> rồi upload lên GitHub Pages, Vercel, Netlify, hoặc mở trực tiếp trên máy tính/điện thoại bằng trình duyệt bất kỳ.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};

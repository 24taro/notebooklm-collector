import React from "react";

const Footer = () => {
  return (
    <footer className="w-full mt-auto py-8 border-t border-gray-200">
      <div className="max-w-3xl mx-auto px-4 text-center space-y-2">
        <div className="flex justify-center gap-6 text-sm">
          <a
            href="https://github.com/sotaroNishioka/notebooklm-collector"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 underline"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-gray-500">
          データはすべてブラウザ内で処理され、外部送信されません
        </p>
      </div>
    </footer>
  );
};

export default Footer;

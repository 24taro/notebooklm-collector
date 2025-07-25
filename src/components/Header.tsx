"use client";

import Link from "next/link";
import type React from "react";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="w-full py-8 border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-normal text-gray-900 hover:text-gray-700"
        >
          {title}
        </Link>
      </div>
    </header>
  );
};

export default Header;

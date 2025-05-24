import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full mt-12 border-t border-gray-200">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-gray-500 text-xs">
        <p>&copy; {new Date().getFullYear()} NotebookLM Collector. All rights reserved.</p>
        {/* <p className="mt-1">A tool by Your Name/Company</p> */}
      </div>
    </footer>
  )
}

export default Footer

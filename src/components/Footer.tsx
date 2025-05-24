import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-docbase-bg-alt text-docbase-text-sub p-4 mt-8 text-center text-sm">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} NotebookLM Collector. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MDXEditor } from '@/components/editor/MDXEditor';
import { MDXPreview } from '@/components/preview/MDXPreview';
import { defaultMDXContent } from '@/lib/default-mdx';

export default function HomePage() {
  const [mdxContent, setMdxContent] = useState(defaultMDXContent);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Editor Panel */}
          <div className="w-full">
            <MDXEditor 
              value={mdxContent}
              onChange={setMdxContent}
            />
          </div>
          
          {/* Preview Panel */}
          <div className="w-full">
            <MDXPreview content={mdxContent} />
          </div>
        </div>
      </main>
    </div>
  );
}
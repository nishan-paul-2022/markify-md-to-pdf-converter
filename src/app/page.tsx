'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MdPreview } from '@/components/md-preview';
import { FileDown, FileText, Layout, Play, Shield, Terminal, Upload, RotateCcw } from 'lucide-react';

const INITIAL_CONTENT = `
# Public Key Infrastructure (PKI)
## Implementation & Web Application Integration

### Introduction
In today's digital world, trust is everything. When you visit a website with HTTPS, send encrypted emails, or connect to a corporate VPN, there's an invisible infrastructure working behind the scenes to ensure that your communication is secure and that you're really talking to who you think you're talking to. This infrastructure is called Public Key Infrastructure, or PKI.

### PKI Architecture
A well-designed PKI isn't a single monolithic system—it's a carefully architected hierarchy that balances security with operational efficiency.

\`\`\`mermaid
graph TD
    RootCA["Root CA (Offline)"] --> IntCA["Intermediate CA (Online)"]
    IntCA --> ServerCert["Server Certificate (HTTPS)"]
    IntCA --> ClientCert["Client Certificate (mTLS)"]
    subgraph "Chain of Trust"
        RootCA
        IntCA
    end
\`\`\`

### The TLS Handshake
When a browser connects to an HTTPS website, a complex handshake occurs:

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    participant CA as PKI Chain

    Client->>Server: ClientHello
    Server->>Client: ServerHello, Certificate
    Note over Client,CA: Client verifies Server Cert
    Client->>Server: Key Exchange
    Server-->>Client: Secure Session (TLS 1.3)
\`\`\`

### Directory Structure Philosophy
A well-organized PKI requires a clear directory structure. Each CA has its own directory:

- \`certs/\`: Stores issued certificates
- \`crl/\`: Contains Certificate Revocation Lists
- \`private/\`: Highly sensitive directory (permissions set to 700)
- \`csr/\`: Certificate Signing Requests

### Implementation Steps
1. **Setting Up Environment**: Install OpenSSL and create directory structures.
2. **Generating Root CA**: Create the 4096-bit RSA trust anchor.
3. **Creating Intermediate CA**: Signed by the Root CA for day-to-day operations.
4. **Issuing Server Certificates**: For securing web services with SANs.
5. **Certificate Revocation**: Managing the lifecycle through CRLs.
`;

export default function Home() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: content,
          metadata: {
            title: "PKI Report",
            author: "Nishan Paul"
          }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pki-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setContent(INITIAL_CONTENT);
  };

  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 shrink-0">
        <div className="max-w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MD to PDF Generator</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".md"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={triggerFileUpload}
              className="gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <Upload className="w-4 h-4" /> Upload MD
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
            <Button 
              onClick={handleDownloadPdf} 
              disabled={isGenerating}
              className="bg-blue-600 text-white hover:bg-blue-700 gap-2 border-none px-6"
            >
              {isGenerating ? (
                <Terminal className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Full Height */}
      <div className="flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Editor Side */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Editor
            </div>
          </div>
          <div className="flex-grow relative overflow-hidden">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none border-none p-6 font-mono text-sm focus-visible:ring-0 bg-slate-950 text-slate-300 selection:bg-blue-500/30 custom-scrollbar dark-editor"
              placeholder="Write your markdown here..."
            />
          </div>
        </div>

        {/* Preview Side */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/20">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" /> Live Preview
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="max-w-4xl mx-auto p-12">
                <MdPreview content={content} />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import UserNav from '@/features/auth/components/user-nav';

import { motion } from 'framer-motion';
import { 
  CheckCircle2,
  Code2,
  FileDown,
  Layers,
  Layout,
  Search,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';

interface LandingContentProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  } | null;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const WorkflowAnimation = () => {
  return (
    <div className="relative mx-auto mt-32 mb-52 max-w-5xl px-6">
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        
        {/* The Central "Core" Beam */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 hidden lg:block" />
        
        {/* Step 1: Input / Parsing */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="group relative p-8 rounded-[3rem] border border-white/5 bg-slate-950/50 backdrop-blur-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-700">
            {/* Background scanline animation */}
            <motion.div 
              animate={{ y: ["0%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-20 bg-gradient-to-b from-blue-500/0 via-blue-500/5 to-blue-500/0 top-[-100%]"
            />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                  <Code2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-tighter">Content Ingestion</h4>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="h-1 w-3 bg-blue-500/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: Search, label: "Parsing Syntax tree", color: "text-blue-400" },
                  { icon: Layers, label: "Resolving assets", color: "text-indigo-400" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-slate-400"
                  >
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    {item.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 2: The Transformation Vortex (Unique Centerpiece) */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
           className="relative flex justify-center py-12 lg:py-0"
        >
           {/* Abstract swirling particles around logo */}
           <div className="relative h-64 w-64 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/5 border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-blue-500/10 border-dotted"
              />
              
              {/* Pulsing Core */}
              <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-white text-slate-950 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <Image src="/images/brand-logo.svg" alt="Core" width={48} height={48} />
                
                {/* Outward spreading "data waves" */}
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                    className="absolute inset-0 rounded-[2.5rem] border border-white/30"
                  />
                ))}
              </div>

           </div>
        </motion.div>

        {/* Step 3: Synthesis / Output */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="relative z-10"
        >
          <div className="group relative p-8 rounded-[3rem] border border-white/5 bg-slate-950/50 backdrop-blur-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-700">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <FileDown className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-tighter">PDF Synthesis</h4>
                  <p className="text-[10px] text-emerald-400 font-black flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> PIXEL PERFECT
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ["0%", "100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, times: [0, 0.8, 1] }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {[
                     { icon: Workflow, label: "Mermaid" },
                     { icon: Sparkles, label: "Style" }
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5">
                        <item.icon className="h-4 w-4 text-slate-400 mb-2" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Extreme ambient backglow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] blur-3xl" />
    </div>
  );
};

export default function LandingContent({ session }: LandingContentProps): React.JSX.Element {
  const handleAuthRedirect = (e: React.MouseEvent, target: string) => {
    if (!session?.user) {
      e.preventDefault();
      void signIn('google', { callbackUrl: target });
    }
  };

  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#020617] font-sans text-slate-100 selection:bg-blue-500/30">
      {/* Background/Ambient Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute inset-0 mix-blend-overlay opacity-[0.02] bg-[url('/noise.png')]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 flex h-24 items-center justify-between border-b border-white px-6 backdrop-blur-2xl lg:px-12"
      >
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-3">
             <Image 
               src="/images/brand-logo.svg" 
               alt="Markify" 
               width={32} 
               height={32} 
               className="transition-transform duration-500"
             />
            <span className="text-2xl font-black tracking-tighter text-white">Markify</span>
          </Link>

          {/* New Header Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link 
              href="/editor" 
              onClick={(e) => handleAuthRedirect(e, '/editor')}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
            >
              <Layout className="h-4 w-4" />
              Workspace
            </Link>
            <Link 
              href="/converter" 
              onClick={(e) => handleAuthRedirect(e, '/converter')}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" />
              Converter
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {session?.user ? (
            <UserNav user={session.user} />
          ) : (
            <Button
              onClick={() => void signIn('google')}
              className="group relative h-12 overflow-hidden rounded-full bg-white px-8 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 hover:bg-white"
            >
              <span className="relative z-10">Sign In</span>
            </Button>
          )}
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-12 text-center lg:pt-40">
          <motion.div initial="initial" animate="animate" variants={stagger} className="flex flex-col items-center">


            <motion.h1
              variants={fadeIn}
              className="mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-6xl font-black leading-[1.1] tracking-tighter text-transparent md:text-8xl"
            >
              <span className="text-red-500">PDF</span> should look as good as <span className="text-blue-500">Markdown</span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="mx-auto mb-12 max-w-4xl text-lg leading-relaxed text-slate-400 md:text-xl"
            >
              The ultimate suite for converting Markdown into high-fidelity, brandable PDFs.
              Powering modern developers with real-time feedback and intelligent tooling.
            </motion.p>
          </motion.div>
        </section>

        {/* Workflow Animation Section */}
        <WorkflowAnimation />

        {/* Feature Cards Section */}
        <section className="mx-auto max-w-7xl px-6 pb-40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {/* Editor Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-1 backdrop-blur-sm transition-all hover:border-blue-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8 lg:p-12">
                <div className="mb-8 flex items-center justify-between">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <Code2 className="h-7 w-7" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Workspace
                  </div>
                </div>

                <h3 className="mb-4 text-3xl font-black text-white">Integrated Editor</h3>
                <p className="mb-10 text-lg leading-relaxed text-slate-400">
                  Advanced workspace featuring real-time side-by-side rendering. Native folder asset support and instant Mermaid diagram generation.
                </p>

                <div className="shadow-2xl relative mb-10 aspect-video overflow-hidden rounded-2xl border border-white/10">
                  <div className="absolute inset-0 animate-pulse bg-blue-500/5" />
                  <Image
                    src="/presentation/page-editor.gif"
                    alt="Editor Demo"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>

                <Link href="/editor" onClick={(e) => handleAuthRedirect(e, '/editor')}>
                  <Button className="group/btn shadow-[0_0_20px_rgba(255,255,255,0.1)] relative h-16 w-full overflow-hidden rounded-2xl bg-white text-lg font-black text-slate-950 transition-all hover:bg-white/90">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Launch Workspace
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-1 translate-y-1 transform bg-blue-500 transition-transform group-hover/btn:translate-y-0" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Converter Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-1 backdrop-blur-sm transition-all hover:border-indigo-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8 lg:p-12">
                <div className="mb-8 flex items-center justify-between">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Pipeline
                  </div>
                </div>

                <h3 className="mb-4 text-3xl font-black text-white">Batch Converter</h3>
                <p className="mb-10 text-lg leading-relaxed text-slate-400">
                  Industrial-grade conversion engine. Process single files or massive zip archives into pixel-perfect PDF documents with one click.
                </p>

                <div className="shadow-2xl relative mb-10 aspect-video overflow-hidden rounded-2xl border border-white/10">
                  <div className="absolute inset-0 animate-pulse bg-indigo-500/5" />
                  <Image
                    src="/presentation/page-converter.gif"
                    alt="Converter Demo"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>

                <Link href="/converter" onClick={(e) => handleAuthRedirect(e, '/converter')}>
                  <Button
                    variant="outline"
                    className="group/btn relative h-16 w-full overflow-hidden rounded-2xl border-white/10 bg-white/5 text-lg font-black text-white transition-all hover:bg-white/10"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Quick Convert
                    </span>
                    <div className="absolute inset-0 -translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent group-hover:translate-x-0" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Super Modern Footer */}
        <footer className="relative border-t border-white/5 bg-slate-950/40 py-20 px-6 backdrop-blur-3xl">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
            <div className="flex flex-col items-center gap-4 md:items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Image src="/images/brand-logo.svg" alt="Markify" width={16} height={16} />
                </div>
                <span className="text-lg font-black tracking-tight text-white/90">MARKIFY</span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                © 2026 MARKIFY. ALL RIGHTS RESERVED.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} className="group relative">
              <div className="absolute -inset-4 opacity-0 blur-2xl transition-opacity bg-blue-500/5 rounded-3xl group-hover:opacity-100" />
              <div className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Made by
                </span>
                <div className="flex items-center gap-3">
                  <Image src="/images/company-logo.svg" alt="KAI" width={24} height={24} />
                  <span className="text-xl font-black text-white">KAI</span>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-8">
              {/* Social icons removed for conciseness as requested */}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

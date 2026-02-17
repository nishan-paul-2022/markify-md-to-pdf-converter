'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import UserNav from '@/features/auth/components/user-nav';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Code2, Sparkles, Zap } from 'lucide-react';

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
        className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 backdrop-blur-xl lg:px-12"
      >
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors group-hover:border-blue-500/50">
            <Image src="/images/brand-logo.svg" alt="Markify" width={24} height={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white/90">MARKIFY</span>
        </Link>

        <div className="flex items-center gap-6">
          {session?.user ? (
            <UserNav user={session.user} />
          ) : (
            <Button
              onClick={() => void signIn('google')}
              variant="outline"
              className="rounded-full border-white/10 bg-white/5 font-bold hover:bg-white/10"
            >
              Sign In
            </Button>
          )}
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-32 text-center lg:pt-40">
          <motion.div initial="initial" animate="animate" variants={stagger} className="flex flex-col items-center">
            <motion.div variants={fadeIn} className="mb-6">
              <span className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400">
                <Sparkles className="h-3 w-3" />
                Next-Gen Markdown Pipeline
              </span>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-6xl font-black leading-[1.1] tracking-tighter text-transparent md:text-8xl"
            >
              Docs should look <br /> <span className="text-blue-500">as good as code.</span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl"
            >
              The ultimate suite for converting Markdown into high-fidelity, brandable PDFs. Powering
              modern developers with real-time feedback and intelligent tooling.
            </motion.p>
          </motion.div>
        </section>

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
                  Advanced workspace with real-time side-by-side rendering. Full folder support for
                  assets, live Mermaid diagrams, and instant styling.
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
                      Launch Workspace{' '}
                      <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
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
                  Industrial-grade conversion engine. Process single files or massive zip archives
                  into pixel-perfect PDFs with one click.
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
                      Quick Convert{' '}
                      <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
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

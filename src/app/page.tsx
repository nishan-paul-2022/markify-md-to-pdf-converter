import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import UserNav from '@/features/auth/components/user-nav';
import { auth, signIn } from '@/lib/auth';

import { Code2, FileDown, FilePlus, Layers, Sparkles, Zap } from 'lucide-react';

/**
 * A visual diagram showing the Markdown-to-PDF pipeline.
 */
function PipelineDiagram(): React.JSX.Element {
  return (
    <div className="relative mx-auto mt-20 mb-32 max-w-5xl px-6">
      <div className="relative z-10 flex flex-col items-center justify-between gap-12 md:flex-row md:gap-0">
        {/* Step 1: Input */}
        <div className="group relative flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl transition-all group-hover:-translate-y-2 group-hover:border-blue-500/30">
            <Code2 className="h-10 w-10 text-blue-400 group-hover:text-blue-300" />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg shadow-blue-500/50">
              1
            </div>
          </div>
          <div className="text-center">
            <h4 className="font-bold text-white">Markdown Files</h4>
            <p className="text-sm text-slate-500">Raw content & structure</p>
          </div>
          {/* Connecting Line (Mobile: Vertical, Desktop: Horizontal) */}
          <div className="absolute top-10 left-full hidden h-px w-24 bg-gradient-to-r from-blue-500/50 to-transparent md:block lg:w-32" />
        </div>

        {/* Step 2: Markify Engine */}
        <div className="group relative flex flex-col items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-white/20 bg-white/5 shadow-inner backdrop-blur-2xl transition-all group-hover:scale-110">
            <div className="absolute inset-0 animate-pulse rounded-[2.5rem] bg-indigo-500/10 blur-xl" />
            <Image
              src="/images/brand-logo.svg"
              alt="Markify Engine"
              width={48}
              height={48}
              className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/50">
              2
            </div>
          </div>
          <div className="text-center">
            <h4 className="font-bold text-white">Markify Engine</h4>
            <p className="text-sm text-slate-500">Live preview & styling</p>
          </div>
          {/* Connecting Line */}
          <div className="absolute top-12 left-full hidden h-px w-24 bg-gradient-to-r from-indigo-500/50 to-transparent md:block lg:w-32" />
        </div>

        {/* Step 3: Output */}
        <div className="group relative flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl transition-all group-hover:-translate-y-2 group-hover:border-emerald-500/30">
            <FileDown className="h-10 w-10 text-emerald-400 group-hover:text-emerald-300" />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/50">
              3
            </div>
          </div>
          <div className="text-center">
            <h4 className="font-bold text-white">Pixel-Perfect PDF</h4>
            <p className="text-sm text-slate-500">Professional deployment</p>
          </div>
        </div>
      </div>

      {/* Background Decorative Gradient for Diagram */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent opacity-50 blur-3xl" />
    </div>
  );
}

export default async function LandingPage(): Promise<React.JSX.Element> {
  const session = await auth();

  return (
    <div className="dark flex min-h-screen flex-col overflow-x-hidden bg-[#020617] font-sans text-slate-100 selection:bg-blue-500/30">
      {/* Background Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[40%] w-[40%] rounded-full bg-slate-800/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 backdrop-blur-xl lg:px-12">
        <Link href="/" className="group/logo flex cursor-pointer items-center gap-2.5">
          <div className="transition-transform group-hover/logo:scale-105">
            <Image src="/images/brand-logo.svg" alt="Markify" width={30} height={30} priority />
          </div>
          <span className="text-lg font-bold tracking-tight text-white/90 transition-colors group-hover:text-white">
            Markify
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#pipeline"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Workflow
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link href="/editor">
                <Button
                  variant="ghost"
                  className="hidden rounded-full font-semibold text-slate-400 transition-all hover:bg-white/5 hover:text-white md:flex"
                >
                  Workspace
                </Button>
              </Link>
              <UserNav user={session.user} />
            </>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn('google');
              }}
            >
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 font-semibold transition-all hover:bg-white/10"
              >
                Sign In
              </Button>
            </form>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-grow">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-24 pb-20 text-center lg:pt-36">
          <div className="animate-in fade-in slide-in-from-bottom-4 mb-10 duration-1000">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[11px] font-bold tracking-[0.2em] text-blue-400 uppercase">
                Powerful Content Conversion
              </span>
            </div>
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-8 mb-8 max-w-4xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-5xl font-black tracking-tighter text-transparent delay-200 duration-1000 sm:text-7xl lg:text-8xl">
            Docs should look <br /> as good as your code.
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-12 mx-auto mb-14 max-w-2xl text-lg leading-relaxed text-slate-400 delay-500 duration-1000 lg:text-xl">
            Markify transforms your Markdown folders into professional PDFs with real-time preview
            and custom branding.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-16 flex flex-col items-center justify-center gap-5 delay-700 duration-1000 sm:flex-row">
            {session?.user ? (
              <Link href="/editor">
                <Button
                  size="lg"
                  className="group relative h-14 overflow-hidden rounded-2xl bg-white px-8 text-base font-bold text-slate-950 transition-all hover:scale-[1.02] hover:bg-slate-100"
                >
                  <span className="relative z-10 flex items-center gap-2">Open Workspace</span>
                </Button>
              </Link>
            ) : (
              <form
                action={async () => {
                  'use server';
                  await signIn('google');
                }}
              >
                <Button
                  size="lg"
                  className="group relative h-14 overflow-hidden rounded-2xl bg-white px-8 text-base font-bold text-slate-950 transition-all hover:scale-[1.02] hover:bg-slate-100"
                >
                  <span className="relative z-10 flex items-center gap-2">Get Started</span>
                </Button>
              </form>
            )}
            <Link href="/converter">
              <Button
                variant="outline"
                size="lg"
                className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 text-base font-bold transition-all hover:border-white/20 hover:bg-white/10"
              >
                Quick Convert
              </Button>
            </Link>
          </div>
        </section>

        {/* Visual Diagram Section */}
        <section id="pipeline" className="mx-auto max-w-6xl py-12">
          <div className="mb-16 text-center">
            <h2 className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase">
              How it works
            </h2>
          </div>
          <PipelineDiagram />
        </section>

        {/* Feature Grid */}
        <section id="features" className="relative border-t border-white/5 bg-slate-950/20 py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-[2rem] border border-white/5 bg-slate-900/40 p-10 transition-all hover:border-blue-500/20 hover:bg-slate-900/60">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Live Feedback</h3>
                <p className="leading-relaxed text-slate-400">
                  Write once, preview instantly. Our render engine updates your PDF view as you type
                  every character.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-[2rem] border border-white/5 bg-slate-900/40 p-10 transition-all hover:border-indigo-500/20 hover:bg-slate-900/60">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Layers className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Full Folder Support</h3>
                <p className="leading-relaxed text-slate-400">
                  Manage complex projects with ease. Upload entire ZIP archives and maintain your
                  folder hierarchy seamlessly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-[2rem] border border-white/5 bg-slate-900/40 p-10 transition-all hover:border-emerald-500/20 hover:bg-slate-900/60">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <FilePlus className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Custom Metadata</h3>
                <p className="leading-relaxed text-slate-400">
                  Add headers, footers, cover pages, and custom logos to make your documents feel
                  uniquely yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase / CTA Section */}
        <section className="mx-auto max-w-7xl px-6 py-32">
          <div className="group shadow-3xl relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10" />

            <div className="relative flex flex-col items-center p-12 text-center lg:p-24">
              <h2 className="mb-8 text-4xl font-black tracking-tight text-white lg:text-6xl">
                Ready to transform <br /> your documentation?
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/editor">
                  <Button
                    size="lg"
                    className="h-14 rounded-2xl bg-white px-10 text-base font-bold text-slate-950 hover:bg-slate-200"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Subtle dashboard-like decorative elements */}
            <div className="absolute -bottom-20 -left-20 opacity-20 transition-transform duration-1000 group-hover:scale-105">
              <div className="h-64 w-64 rounded-3xl border border-white/20 bg-slate-800 shadow-2xl" />
            </div>
            <div className="absolute -top-20 -right-20 opacity-20 transition-transform duration-1000 group-hover:scale-105">
              <div className="h-64 w-64 rounded-3xl border border-white/20 bg-slate-800 shadow-2xl" />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-slate-950/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-3">
            {/* Brand Section */}
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/brand-logo.svg"
                  alt="Markify"
                  width={28}
                  height={28}
                  className="brightness-110"
                />
                <span className="text-xl font-bold tracking-tight text-white/90">Markify</span>
              </div>
            </div>

            {/* Attribution Section (Perfectly Centered) */}
            <div className="flex justify-center">
              <div className="group relative flex flex-col items-center">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md transition-all group-hover:border-white/20 group-hover:bg-white/10">
                  <Image
                    src="/images/company-logo.svg"
                    alt="KAI"
                    width={18}
                    height={18}
                    className="opacity-90"
                  />
                  <span className="text-sm font-black tracking-[0.2em] text-white">KAI</span>
                </div>
              </div>
            </div>

            {/* Copyright Section */}
            <div className="flex flex-col items-center gap-1.5 md:items-end md:justify-end">
              <p className="text-sm font-medium text-slate-400">© 2026 Markify</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                Crafted for Modern Teams
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

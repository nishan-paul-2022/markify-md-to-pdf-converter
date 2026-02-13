import Image from 'next/image';
import Link from 'next/link';

import UserNav from '@/components/auth/user-nav';
import { Button } from '@/components/ui/button';
import { auth, signIn } from '@/lib/auth';

import { ArrowRight, FileText, Layout, Share2, Sparkles } from 'lucide-react';

export default async function LandingPage(): Promise<React.JSX.Element> {
  const session = await auth();

  // Redirection removed to allow logged-in users to access home page

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-blue-600/20 blur-[120px]" />
        <div
          className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-indigo-600/20 blur-[120px]"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/50 px-6 backdrop-blur-md lg:px-12">
        <Link href="/" className="group/logo flex cursor-pointer items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover/logo:scale-110">
            <Image
              src="/brand-logo.svg"
              alt="Markify"
              width={32}
              height={32}
              priority
              className="drop-shadow-xl"
            />
          </div>
          <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-blue-400">
            Markify
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#showcase"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Showcase
          </a>
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link href="/editor">
                <Button
                  variant="ghost"
                  className="hidden rounded-full px-6 text-slate-400 transition-all hover:bg-white/5 hover:text-white md:flex"
                >
                  Go to Editor
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
                className="rounded-full border-white/10 px-6 transition-all hover:bg-white/5"
              >
                Log In
              </Button>
            </form>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow">
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-32 text-center lg:pt-32 lg:pb-48">
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-bold tracking-widest text-blue-400 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transform your writing</span>
          </div>

          <h1 className="mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-black tracking-tighter text-transparent lg:text-8xl">
            Markdown to PDF.
            <br className="hidden md:block" /> Reimagined.
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-400 lg:text-xl">
            Create professional documents, assignments, and reports with Markify. The most powerful
            Markdown editor that feels like a dream.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {session?.user ? (
              <Link href="/editor">
                <Button
                  size="lg"
                  className="group h-14 rounded-2xl bg-white px-8 text-base font-bold text-slate-950 transition-all hover:bg-slate-200"
                >
                  Back to Editor
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                  className="group h-14 rounded-2xl bg-white px-8 text-base font-bold text-slate-950 transition-all hover:bg-slate-200"
                >
                  Continue with Google
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            )}
            <p className="mt-4 text-xs font-medium text-slate-500 sm:mt-0">
              Join 10,000+ creators and students today
            </p>
          </div>
        </section>

        {/* Features Preview */}
        <section
          id="features"
          className="relative border-y border-white/5 bg-slate-900/40 px-6 py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="group rounded-3xl border border-white/5 bg-slate-950/50 p-8 transition-colors hover:border-white/10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-110">
                  <Layout className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Live Preview</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  See your changes instantly with our butter-smooth real-time preview engine.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/5 bg-slate-950/50 p-8 transition-colors hover:border-white/10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 transition-transform group-hover:scale-110">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Rich Metadata</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Support for cover pages, university logos, and professional headers.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/5 bg-slate-950/50 p-8 transition-colors hover:border-white/10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-110">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Instant Export</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Convert to pixel-perfect PDFs in one click. Perfect for submissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="mx-auto max-w-7xl px-6 py-32">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20" />
            <div className="relative p-2 lg:p-4">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[2rem] bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="flex animate-pulse flex-col items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <FileText className="h-8 w-8 text-white/50" />
                  </div>
                  <span className="text-sm font-medium tracking-widest text-slate-500 uppercase">
                    Markify Dashboard Preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 border-t border-white/5 px-6 py-12 md:flex-row">
        <div className="flex items-center gap-3 opacity-50">
          <Image src="/brand-logo.svg" alt="Markify" width={20} height={20} />
          <span className="text-sm font-bold">Markify</span>
        </div>
        <p className="text-xs font-medium text-slate-500">
          © 2026 Markify Labs. Built for speed and beauty.
        </p>
        <div className="flex gap-6 text-xs font-medium text-slate-500">
          <a href="#" className="transition-colors hover:text-white">
            Twitter
          </a>
          <a href="#" className="transition-colors hover:text-white">
            GitHub
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}

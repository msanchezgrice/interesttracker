import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-amber-500" />
          <span className="font-semibold tracking-tight">MakerPulse</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a className="hover:text-amber-400" href="#features">Features</a>
          <a className="hover:text-amber-400" href="#how">How it works</a>
          <a className="hover:text-amber-400" href="#download">Download</a>
          <Link className="hover:text-amber-400" href="/sign-in">Sign in</Link>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Turn your attention into content
            </h1>
            <p className="mt-4 text-neutral-300 text-lg">
              The MakerPulse extension captures your real reading time (allowed sites only), ranks what matters, and drafts posts for X, LinkedIn, Blog, and Shorts.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3" id="download">
              <Link
                className="px-5 py-3 rounded-md bg-amber-500 text-neutral-950 font-medium hover:bg-amber-400"
                href="/downloads/makerpulse-extension.zip"
                prefetch={false}
              >
                Download Chrome Extension
              </Link>
              <a
                className="px-5 py-3 rounded-md border border-neutral-800 hover:border-neutral-700"
                href="#how"
              >
                How it works
              </a>
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              No posting permissions. You control what’s sent. Allowlist-first. Local buffer.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-amber-500/10 rounded-xl blur-xl" />
            <div className="relative rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <Image src="/window.svg" alt="Preview" width={640} height={400} className="opacity-80" />
            </div>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-6">
          {[
            { title: 'Engaged time tracking', desc: 'Counts only focused, active time with idle and visibility gates.' },
            { title: 'Allowlist & privacy', desc: 'Track on approved domains only. Pause anytime. Local buffer by default.' },
            { title: 'Secure ingest', desc: 'Device key auth; server validates and stores minimal event data.' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="font-medium text-amber-400">{f.title}</h3>
              <p className="mt-2 text-neutral-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </section>

        <section id="how" className="max-w-6xl mx-auto px-6 py-14">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Install the extension and open the side panel.</li>
              <li>Sign in on the site, then POST <code className="px-1 py-0.5 bg-neutral-800 rounded">/api/devices/init</code> to get a device key.</li>
              <li>Paste device key and ingest URL, set your allowlist, and unpause.</li>
              <li>Browse allowed sites; click Flush to upload anytime.</li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-neutral-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} MakerPulse</span>
          <a className="hover:text-amber-400" href="/api/health">Status</a>
        </div>
      </footer>
    </div>
  );
}

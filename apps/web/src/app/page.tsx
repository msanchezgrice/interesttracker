import Link from "next/link";
import { ArrowRight, Zap, Brain, TrendingUp, Chrome, Clock, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-500" />
            <span className="font-semibold tracking-tight">MakerPulse</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-md text-sm font-medium border border-neutral-700 hover:border-neutral-600 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Never run out of{" "}
              <span className="text-amber-400">content ideas</span> again
            </h1>
            <p className="mt-6 text-xl text-neutral-400 leading-relaxed">
              MakerPulse tracks your browsing patterns and transforms your natural curiosity into 
              engaging content ideas. Stop staring at blank pages – let your interests guide your content.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md font-medium transition-colors"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a 
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-700 hover:border-neutral-600 rounded-md font-medium transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl" />
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-amber-400" />
                    <span className="font-medium">AI Analysis</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Understands what truly interests you from your browsing patterns
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <span className="font-medium">Smart Ideas</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Generates tweet, thread, and blog ideas with full drafts
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                    <span className="font-medium">High Impact</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Scores ideas by potential reach based on topic trends
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Content creation shouldn't feel like work
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              You consume amazing content every day. You have unique insights. 
              But when it's time to create, the blank page wins. Sound familiar?
            </p>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="space-y-3">
                <div className="text-5xl">😩</div>
                <h3 className="font-semibold">Writer's Block</h3>
                <p className="text-sm text-neutral-400">
                  "What should I post about?" The eternal question that keeps you from sharing your knowledge.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl">🎯</div>
                <h3 className="font-semibold">Missing Opportunities</h3>
                <p className="text-sm text-neutral-400">
                  You read something fascinating but forget to share your unique take on it.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl">⏰</div>
                <h3 className="font-semibold">Time Consuming</h3>
                <p className="text-sm text-neutral-400">
                  Coming up with ideas and drafting content takes hours you don't have.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Your interests become your content
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              Three simple steps to endless content ideas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -left-4 -top-4 text-6xl font-bold text-neutral-800">1</div>
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <Chrome className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Install Extension</h3>
                <p className="text-sm text-neutral-400">
                  Add our Chrome extension and continue browsing normally. It quietly tracks 
                  engagement metrics like time spent and scroll depth.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-4 -top-4 text-6xl font-bold text-neutral-800">2</div>
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <Brain className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analyzes Interests</h3>
                <p className="text-sm text-neutral-400">
                  Our AI understands what truly captures your attention by analyzing your 
                  browsing patterns and extracting key themes.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-4 -top-4 text-6xl font-bold text-neutral-800">3</div>
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <Sparkles className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Get Ready-to-Post Ideas</h3>
                <p className="text-sm text-neutral-400">
                  Receive content ideas with full drafts tailored to different platforms. 
                  Just review, tweak, and post.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built for content creators
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              Every feature designed to make content creation effortless
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
              <Zap className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Multi-Format Drafts</h3>
              <p className="text-neutral-400 mb-4">
                Get ideas formatted for different platforms:
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Twitter posts & threads
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> LinkedIn articles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Blog post outlines
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Video scripts
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
              <TrendingUp className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Engagement Scoring</h3>
              <p className="text-neutral-400 mb-4">
                Every idea comes with insights:
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Potential reach score
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Topic trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Best posting times
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Relevant hashtags
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
              <Clock className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Tracking</h3>
              <p className="text-neutral-400 mb-4">
                Privacy-first attention tracking:
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Only tracks specified domains
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Measures real engagement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Pause anytime
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Your data stays yours
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
              <Brain className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
              <p className="text-neutral-400 mb-4">
                Deep understanding of your interests:
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Theme extraction
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Content categorization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Interest scoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">•</span> Trend detection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Start creating content that matters
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Join creators who never run out of ideas
          </p>
          <div className="mt-8">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md font-medium text-lg transition-colors"
            >
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-neutral-400">
          <p>© 2025 MakerPulse. Turn your curiosity into content.</p>
        </div>
      </footer>
    </div>
  );
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import Image from 'next/image'
import { MorphingText } from '@/components/ui/morphing-text'
import { Particles } from '@/components/ui/particles'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, signInWithGoogle, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/home')
    }
  }, [user, isLoading, router])

  // Show loading while checking auth or if user is logged in (redirecting)
  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Particle Background */}
      <Particles
        className="fixed inset-0"
        quantity={300}
        color="#4285F4"
        size={1.2}
        staticity={40}
        ease={40}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Image src="/logo.png" alt="DSA Grinders" width={40} height={40} className="object-contain" priority />
          </div>
          <span className="text-base md:text-lg font-medium text-gray-900">DSA Grinders</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-4 md:px-5 py-2 md:py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs md:text-sm font-medium rounded-full transition-colors disabled:opacity-50 min-h-[44px]"
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Sign in'}
        </button>
      </nav>

      {/* Hero - Centered */}
      <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-88px)] px-4 md:px-6 -mt-8 md:-mt-16">
        <div className="max-w-3xl mx-auto text-center">

          {/* Logo */}
          <div className="relative w-24 h-24 md:w-36 md:h-36 mx-auto mb-5">
            <Image src="/logo.png" alt="DSA Grinders" width={144} height={144} className="object-contain" priority />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-full shadow-sm mb-6 md:mb-8">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#34A853] rounded-full animate-pulse" />
            <span className="text-xs md:text-sm text-gray-600">Synced with LeetCode</span>
          </div>

          {/* Static Headline - HIERARCHY principle */}
          <h1 className="text-3xl md:text-headline px-2">
            Track progress,
          </h1>

          {/* Morphing Text */}
          <MorphingText
            texts={["together", "daily", "smarter", "faster"]}
            className="h-12 md:h-20 text-gray-400 font-normal text-2xl md:text-4xl"
          />

          {/* Subheadline */}
          <p className="text-base md:text-lg text-gray-600 max-w-lg mx-auto mt-6 md:mt-8 mb-8 md:mb-10 px-4">
            A simple way to stay consistent with your DSA practice.
            Connect your LeetCode, compete with friends.
          </p>

          {/* CTA - EMPHASIS with Google Blue */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-base font-medium rounded-full transition-colors disabled:opacity-50 min-h-[48px]"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Get started'}
            </button>
            <span className="text-xs md:text-sm text-gray-500">Free forever</span>
          </div>

        </div>
      </main>
    </div>
  )
}

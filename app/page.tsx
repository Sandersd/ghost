'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamic import to prevent SSR issues with Three.js
const GhostCanvas = dynamic(() => import('../components/three/GhostWithControls'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 animate-pulse" />
  )
})

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const { scrollYProgress } = useScroll()
  
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setScrollProgress(latest)
    })
    return () => unsubscribe()
  }, [scrollYProgress])
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100])
  
  return (
    <main className="relative min-h-screen">
      {/* Fixed 3D Ghost Canvas Background - with controls at higher z-index */}
      <div className="fixed inset-0 z-0">
        <GhostCanvas scrollProgress={scrollProgress} />
      </div>
      
      {/* Modern Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold gradient-text">Spectre</div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button className="text-white/80 hover:text-white transition-colors duration-300 font-light">Privacy</button>
              <button className="text-white/80 hover:text-white transition-colors duration-300 font-light">Security</button>
              <button className="text-white/80 hover:text-white transition-colors duration-300 font-light">Enterprise</button>
              <button className="text-white/80 hover:text-white transition-colors duration-300 font-light">Support</button>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="text-white/80 hover:text-white transition-colors duration-300 font-light hidden sm:block">Console</button>
              <button className="glass-strong px-6 py-2 rounded-2xl text-sm font-medium text-white hover:scale-105 transition-all duration-300">
                Go Ghost
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Content Overlay */}
      <div className="relative z-[5]">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
          <motion.div 
            style={{ y: heroY }}
            className="text-center space-y-12 px-6 max-w-7xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="space-y-8"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] tracking-tight">
                <span className="gradient-text">Spectre</span>
                <br />
                <span className="text-white/95 font-extralight">AI Privacy</span>
              </h1>
              
              <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed tracking-wide">
                The world's most secure AI infrastructure for <span className="gradient-text font-medium">ghost data</span>
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8"
            >
              <button className="glass-strong glow-purple px-12 py-6 rounded-3xl text-xl font-semibold text-white hover:scale-110 transition-all duration-500 pulse-glow shadow-2xl">
                Secure Your Chats
              </button>
              
              <button className="glass px-12 py-6 rounded-3xl text-xl font-light text-white/95 hover:scale-110 transition-all duration-500 border-white/30 shadow-xl">
                Learn More
              </button>
            </motion.div>
          </motion.div>
          
        </section>
        
        {/* Features Section */}
        <section className="min-h-screen flex items-center justify-center py-32">
          <div className="max-w-8xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-12 leading-tight">
                <span className="gradient-text">Privacy</span> First AI
              </h2>
              <p className="text-2xl text-white/80 max-w-4xl mx-auto font-light leading-relaxed">
                Enterprise-grade AI infrastructure with zero-knowledge architecture
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12">
              {[
                {
                  title: "Zero-Knowledge AI",
                  description: "Advanced AI processing where your data never leaves your infrastructure, ensuring complete privacy",
                  icon: "🔒",
                  gradient: "from-purple-600 to-pink-600"
                },
                {
                  title: "Federated Learning",
                  description: "AI models that learn collectively while keeping your sensitive data completely local and secure",
                  icon: "🧠",
                  gradient: "from-cyan-500 to-blue-600"
                },
                {
                  title: "Homomorphic Encryption",
                  description: "Quantum-resistant encryption that enables AI computation on encrypted data without decryption",
                  icon: "🛡️",
                  gradient: "from-emerald-500 to-teal-600"
                },
                {
                  title: "Edge Computing",
                  description: "AI inference at the edge with military-grade security and millisecond latency",
                  icon: "⚡",
                  gradient: "from-amber-500 to-orange-600"
                },
                {
                  title: "Differential Privacy",
                  description: "Mathematical guarantees that individual data points cannot be reverse-engineered from AI outputs",
                  icon: "📊",
                  gradient: "from-rose-500 to-pink-600"
                },
                {
                  title: "Secure Multi-Party",
                  description: "Collaborative AI training across organizations without exposing sensitive business data",
                  icon: "🤝",
                  gradient: "from-violet-600 to-purple-600"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="glass-strong p-10 rounded-3xl hover:glow-purple transition-all duration-700 hover:scale-105 group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                  <div className="relative z-10">
                    <div className="text-5xl mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-6 text-white">{feature.title}</h3>
                    <p className="text-white/80 leading-relaxed font-light text-lg">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Innovation Showcase */}
        <section className="min-h-screen flex items-center justify-center py-32">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight">
                Enterprise <span className="gradient-text">Trust</span>
              </h2>
              
              <div className="glass-strong p-16 rounded-3xl max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20" />
                <div className="relative z-10">
                  <p className="text-3xl sm:text-4xl text-white/95 leading-relaxed mb-12 font-light">
                    &ldquo;Privacy isn&apos;t just a feature—<br />
                    <span className="gradient-text font-medium">it&apos;s our foundation</span>&rdquo;
                  </p>
                  <div className="w-32 h-px bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 mx-auto" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-20">
                {[
                  { metric: "SOC 2", label: "Type II Certified", suffix: "" },
                  { metric: "GDPR", label: "Compliant", suffix: "" },
                  { metric: "500+", label: "Enterprise Clients", suffix: "" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: index * 0.3 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <div className="text-5xl sm:text-6xl font-black gradient-text mb-4 group-hover:scale-110 transition-transform duration-500">
                      {stat.metric}
                    </div>
                    <div className="text-white/80 text-xl font-light tracking-wide">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Premium Tiers */}
        <section className="min-h-screen flex items-center justify-center py-32">
          <div className="max-w-8xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-12">
                <span className="gradient-text">Privacy</span> Plans
              </h2>
              <p className="text-2xl text-white/80 max-w-4xl mx-auto font-light">
                Enterprise-grade AI privacy for every organization
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {[
                {
                  name: "Secure",
                  price: "$2,500",
                  period: "/month",
                  description: "For growing teams",
                  features: [
                    "Zero-knowledge AI processing",
                    "Edge deployment",
                    "24/7 security monitoring",
                    "SOC 2 compliance",
                    "Up to 50 users"
                  ]
                },
                {
                  name: "Enterprise",
                  price: "$10,000",
                  period: "/month",
                  description: "For large organizations",
                  features: [
                    "Federated learning platform",
                    "Homomorphic encryption",
                    "Dedicated security team",
                    "Custom compliance reporting",
                    "Unlimited users",
                    "Private cloud deployment"
                  ],
                  popular: true
                },
                {
                  name: "Government",
                  price: "Custom",
                  period: "pricing",
                  description: "For public sector",
                  features: [
                    "FedRAMP certified infrastructure",
                    "Air-gapped deployments",
                    "Classified data processing",
                    "Government-grade encryption",
                    "On-site deployment",
                    "Dedicated compliance officer",
                    "24/7 cleared support"
                  ]
                }
              ].map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className={`glass-strong p-12 rounded-3xl relative group hover:scale-105 transition-all duration-700 ${
                    tier.popular ? 'glow-purple scale-105' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-2xl">
                        Most Elite
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-white mb-3">{tier.name}</h3>
                    <p className="text-white/70 font-light mb-6">{tier.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-6xl font-black gradient-text">{tier.price}</span>
                      <span className="text-white/60 ml-3 text-xl">{tier.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-6 mb-12">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-white/90 text-lg">
                        <span className="text-green-400 mr-4 text-xl">✓</span>
                        <span className="font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`w-full py-6 rounded-3xl font-semibold text-xl transition-all duration-500 ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 glow-purple shadow-2xl' 
                        : 'glass border border-white/30 text-white hover:scale-105 hover:border-white/50'
                    }`}
                  >
                    Begin Journey
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section className="min-h-screen flex items-center justify-center py-32">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              <h2 className="text-7xl sm:text-8xl lg:text-9xl font-black leading-[0.85]">
                Ready to
                <br />
                <span className="gradient-text">Secure?</span>
              </h2>
              
              <p className="text-3xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                Join Fortune 500 companies protecting their AI infrastructure
              </p>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
                <button className="glass-strong glow-purple px-16 py-8 rounded-3xl text-2xl font-bold text-white hover:scale-110 transition-all duration-500 pulse-glow shadow-2xl">
                  Start Secure Trial
                </button>
                
                <button className="glass px-16 py-8 rounded-3xl text-2xl font-light text-white/95 hover:scale-110 transition-all duration-500 border-white/30 shadow-xl">
                  Request Demo
                </button>
              </div>
              
              <div className="text-white/60 text-lg font-light tracking-wide pt-8">
                Enterprise trial • No setup fees • Cancel anytime
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Minimal Footer */}
        <footer className="py-24 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-8">
              <h3 className="text-4xl font-bold gradient-text">Spectre AI Privacy</h3>
              <p className="text-white/70 text-xl font-light">Securing the future of artificial intelligence</p>
              
              <div className="flex justify-center space-x-12">
                {['Security', 'Compliance', 'Documentation', 'Support'].map((link) => (
                  <button key={link} className="text-white/70 hover:text-white transition-colors duration-500 text-lg font-light">
                    {link}
                  </button>
                ))}
              </div>
              
              <div className="text-white/50 font-light pt-8">
                © 2024 Spectre AI Privacy. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  contactInfo,
  footerSections,
} from '@/lib/constant';

import {
  Stethoscope,
  ShieldCheck,
  Award,
  Clock3,
  ArrowRight,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-white">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP SECTION */}
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>

                <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  HealthMate
                </span>
              </Link>

              <p className="text-blue-100 leading-relaxed text-base mb-6 max-w-md">
                Your trusted healthcare partner for doctor consultations,
                prescriptions, pharmacy support, and AI-powered care —
                anytime, anywhere.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <ShieldCheck className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-sm text-blue-100">Secure Platform</p>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <Award className="w-5 h-5 text-yellow-400 mb-2" />
                  <p className="text-sm text-blue-100">Certified Doctors</p>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <Clock3 className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-sm text-blue-100">24/7 Support</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-blue-100 text-sm"
                  >
                    <item.icon className="w-4 h-4 text-blue-300" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {footerSections.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-white font-semibold text-lg mb-4">
                      {section.title}
                    </h3>

                    <ul className="space-y-3">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a
                            href={link.href}
                            className="text-blue-200 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group"
                          >
                            <span>{link.text}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <h4 className="text-xl font-semibold mb-2">
                      Need urgent consultation?
                    </h4>
                    <p className="text-blue-200 text-sm">
                      Book an online appointment with top doctors in minutes.
                    </p>
                  </div>

                  <Link href="/signup/patient">
                    <Button className="rounded-full px-6 bg-white text-blue-900 hover:bg-blue-100 font-semibold">
                      Book Consultation
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="py-10 border-b border-white/10">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <div>
              <h4 className="text-xl font-semibold mb-2">
                Stay Updated with HealthMate
              </h4>
              <p className="text-blue-200 text-sm">
                Receive health tips, pharmacy offers, and latest updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 min-w-[280px] rounded-xl border border-blue-700 bg-blue-900/60 px-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <Button className="h-12 rounded-xl px-6 bg-blue-600 hover:bg-blue-500 font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="py-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-blue-200">
            © 2025 HealthMate, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-200">Follow me:</span>

            <div className="flex gap-3">
              {/* Twitter */}
              <a
                href="https://x.com/_abbasansari"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500 transition-colors flex items-center justify-center"
              >
                <Twitter className="w-4 h-4 text-white" />
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/abbas.74x"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-pink-500 transition-colors flex items-center justify-center"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/abbas-ansari"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <Facebook className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
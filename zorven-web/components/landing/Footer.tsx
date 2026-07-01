"use client";

import React from "react";
import { Mail, MapPin } from "lucide-react";
import {
  FooterBackgroundGradient,
  TextHoverEffect,
} from "@/components/ui/hover-footer";

function HoverFooter() {
  const footerLinks = [
    {
      title: "Platform",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contact", href: "#contact" },
        {
          label: "Launch Updates",
          href: "#",
          pulse: true,
        },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#3ca2fa]" />,
      text: "hello@zorven.ai",
      href: "mailto:hello@zorven.ai",
    },
    {
      icon: <MapPin size={18} className="text-[#3ca2fa]" />,
      text: "Built remotely • Available Worldwide",
    },
  ];

  return (
    <footer className="relative h-fit overflow-hidden rounded-3xl bg-[#0F0F11]/10 m-8">
      <div className="relative z-40 mx-auto max-w-7xl p-14">
        <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand */}
          <div className="flex flex-col space-y-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3ca2fa]/10">
                <span className="text-xl font-bold text-[#3ca2fa]">Z</span>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">Zorven</h2>
                <p className="text-xs uppercase tracking-[0.25em] text-[#3ca2fa]">
                  AI Startup Studio
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-neutral-400">
              Turn your startup idea into an investor-ready business with AI.
              Generate market research, branding, MVP planning, landing pages,
              pitch decks, financial strategies, and investor outreach—all from
              a single prompt.
            </p>
          </div>

          {/* Platform */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-6 text-lg font-semibold text-white">
                {section.title}
              </h4>

              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      className="text-neutral-400 transition-colors hover:text-[#3ca2fa]"
                    >
                      {link.label}
                    </a>

                    {link.pulse && (
                      <span className="absolute right-[-12px] top-1 h-2 w-2 animate-pulse rounded-full bg-[#3ca2fa]" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="mb-6 text-lg font-semibold text-white">
              Get in Touch
            </h4>

            <ul className="space-y-5">
              {contactInfo.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  {item.icon}

                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-neutral-400 transition-colors hover:text-[#3ca2fa]"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-neutral-400">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-8 border-t border-transparent" />

        
      </div>

      <div className="hidden h-[30rem] -mb-36 -mt-52 lg:flex">
        <TextHoverEffect text="ZORVEN" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default HoverFooter;
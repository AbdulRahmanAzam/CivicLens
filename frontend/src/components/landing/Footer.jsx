import React from 'react';

const Footer = () => {
  const footerLinks = {
    Platform: [
      { name: 'Features', href: '#features' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Users', href: '#users' },
      { name: 'Tech', href: '#tech' },
    ],
  };

  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="#22C55E" />
                  <circle cx="50" cy="50" r="35" fill="#166534" />
                  <circle cx="50" cy="50" r="25" fill="#F0FDF4" />
                  <circle cx="50" cy="50" r="15" fill="#22C55E" />
                  <rect x="70" y="70" width="25" height="8" rx="4" fill="#22C55E" transform="rotate(45 70 70)" />
                </svg>
              </div>
              <span className="text-xl font-bold">CivicLens</span>
            </div>
            <p className="text-white/60 mb-6 max-w-xs">
              A unified platform for citizens to report urban issues and for administrators to manage city infrastructure.
            </p>
            <div className="space-y-2 text-sm text-white/60">
              <p>support@civiclens.gov</p>
              <p>+1 (555) 0199</p>
              <p>24/7 civic response desk</p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-white/60 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>Issue reporting</li>
              <li>Resolution tracking</li>
              <li>City analytics</li>
              <li>Community feedback</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Coverage</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>Mayor office</li>
              <li>Township heads</li>
              <li>Union councils</li>
              <li>Citizen services</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/60 text-sm">© 2026 CivicLens. All rights reserved.</p>
          <div className="text-white/40 text-xs">
            Built for responsive civic operations · Secure by design
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

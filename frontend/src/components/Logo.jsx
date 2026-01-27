const Logo = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="260" viewBox="0 0 900 260" role="img" aria-label="CivicLens Logo">
            <defs>
                <style>{`
  .primary { fill: var(--color-primary); }
  .secondary { fill: var(--color-secondary); }
  .accent { fill: var(--color-accent); }
  .dark { fill: var(--color-foreground); }
  .muted { fill: rgba(5, 46, 22, 0.6); }
`}</style>


                <linearGradient id="lensGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="var(--secondary)" stop-opacity="1" />
                    <stop offset="1" stop-color="var(--primary)" stop-opacity="1" />
                </linearGradient>

                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.15" />
                </filter>

                <clipPath id="lensClip">
                    <circle cx="130" cy="130" r="70" />
                </clipPath>
            </defs>

            <g transform="translate(30,0)">
                <circle cx="130" cy="130" r="92" fill="url(#lensGrad)" filter="url(#softShadow)" />
                <circle cx="130" cy="130" r="78" fill="#FFFFFF" opacity="0.95" />
                <circle cx="130" cy="130" r="70" fill="#E6F6F6" opacity="0.9" />

                <g clip-path="url(#lensClip)">
                    <rect x="55" y="55" width="150" height="150" fill="#EAF2FF" />
                    <rect x="55" y="160" width="150" height="50" fill="#D7E3FF" />

                    <rect x="70" y="118" width="18" height="62" rx="3" class="primary" opacity="0.85" />
                    <rect x="92" y="100" width="26" height="80" rx="3" class="primary" opacity="0.85" />
                    <rect x="122" y="110" width="20" height="70" rx="3" class="secondary" opacity="0.95" />
                    <rect x="146" y="92" width="30" height="88" rx="3" class="primary" opacity="0.85" />
                    <rect x="180" y="125" width="20" height="55" rx="3" class="secondary" opacity="0.95" />

                    <g fill="#FFFFFF" opacity="0.75">
                        <rect x="75" y="125" width="8" height="6" rx="1" />
                        <rect x="75" y="137" width="8" height="6" rx="1" />
                        <rect x="75" y="149" width="8" height="6" rx="1" />

                        <rect x="98" y="108" width="8" height="6" rx="1" />
                        <rect x="108" y="108" width="8" height="6" rx="1" />
                        <rect x="98" y="120" width="8" height="6" rx="1" />
                        <rect x="108" y="120" width="8" height="6" rx="1" />
                        <rect x="98" y="132" width="8" height="6" rx="1" />
                        <rect x="108" y="132" width="8" height="6" rx="1" />

                        <rect x="127" y="118" width="10" height="6" rx="1" />
                        <rect x="127" y="130" width="10" height="6" rx="1" />
                        <rect x="127" y="142" width="10" height="6" rx="1" />

                        <rect x="152" y="100" width="9" height="6" rx="1" />
                        <rect x="163" y="100" width="9" height="6" rx="1" />
                        <rect x="152" y="112" width="9" height="6" rx="1" />
                        <rect x="163" y="112" width="9" height="6" rx="1" />
                        <rect x="152" y="124" width="9" height="6" rx="1" />
                        <rect x="163" y="124" width="9" height="6" rx="1" />
                    </g>

                    <g transform="translate(130 120)">
                        <path d="M0,-22 C-14,-22 -25,-11 -25,3 C-25,22 0,48 0,48 C0,48 25,22 25,3 C25,-11 14,-22 0,-22 Z"
                            class="secondary" opacity="0.95" />
                        <circle cx="0" cy="2" r="10" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="0" cy="2" r="5" class="primary" />
                    </g>
                </g>

                <path d="M92,86 C108,70 133,62 160,64"
                    fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.55" />

                <g transform="translate(0,0)">
                    <rect x="190" y="185" width="78" height="18" rx="9" fill="var(--dark)" opacity="0.92"
                        transform="rotate(35 190 185)" />
                    <rect x="198" y="187" width="62" height="14" rx="7" fill="var(--primary)" opacity="0.95"
                        transform="rotate(35 198 187)" />
                </g>
            </g>

            <g transform="translate(320,88)">
                <text x="0" y="0" font-size="54" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" class="dark" font-weight="700">
                    Civic<tspan fill="var(--secondary)">Lens</tspan>
                </text>
                <text x="2" y="42" font-size="18" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" class="muted" font-weight="500">
                    Smart City Management • Real-time Issues • Transparent Resolution
                </text>

                <g transform="translate(4,68)">
                    <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                    <circle cx="18" cy="0" r="5" fill="var(--primary)" opacity="0.9" />
                    <circle cx="36" cy="0" r="5" fill="#F59E0B" opacity="0.9" />
                    <text x="54" y="6" font-size="14" font-family="Inter, ui-sans-serif, system-ui" class="muted">
                        Monitor • Prioritize • Act
                    </text>
                </g>
            </g>
        </svg>
    );
};

export default Logo;

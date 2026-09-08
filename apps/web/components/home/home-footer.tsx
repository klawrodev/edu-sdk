import Link from 'next/link';

const links = [
  { href: '/docs/getting-started/installation', label: 'Installation' },
  { href: '/docs/getting-started/quick-start', label: 'Quick Start' },
  { href: '/docs/core', label: 'Core' },
  { href: '/docs/react', label: 'React' },
  { href: '/docs/guides', label: 'Guides' },
];

export function HomeFooter() {
  return (
    <footer className="border-fd-border border-t pt-8 pb-4">
      <nav className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-fd-muted-foreground hover:text-fd-foreground transition-colors hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="text-fd-muted-foreground text-center text-xs">
        Edu SDK — generation and UI for learning products.
      </p>
    </footer>
  );
}

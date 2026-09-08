import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.getPageTree()}
      // Sidebar already has Getting Started / Core / React — don't repeat top-nav links here
      links={[]}
    >
      {children}
    </DocsLayout>
  );
}

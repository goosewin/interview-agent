import type React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ProfileCard } from '@/components/ProfileCard';

export default function HiringManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="absolute right-4 top-4">
              <ProfileCard />
            </div>
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

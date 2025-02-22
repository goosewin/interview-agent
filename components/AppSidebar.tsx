import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Calendar, FileCode, Home, Users } from 'lucide-react';
import Link from 'next/link';

export function AppSidebar() {
  return (
    <Sidebar className="h-screen border-r">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2">
          <span className="text-xl font-bold">AI Interviewer</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/candidates">
                <Users className="mr-2 h-4 w-4" />
                <span>Candidates</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/interviews">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Interviews</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/problems">
                <FileCode className="mr-2 h-4 w-4" />
                <span>Problems</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart2, Eye, SettingsIcon as Functions, Layers, LayoutGrid, Settings, Users, X } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary" />
            <span className="font-semibold">GenerativeAgent</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Tasks
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Functions className="mr-2 h-4 w-4" />
                Functions
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Layers className="mr-2 h-4 w-4" />
                Integrations
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Live preview
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart2 className="mr-2 h-4 w-4" />
                Performance
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b px-4 flex items-center justify-between">
            <h1 className="text-sm font-medium">Voice conversation</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Save conversation
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          {children}
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l">
          <div className="h-14 border-b px-4 flex items-center">
            <h2 className="font-medium">Conversation details</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-4 border-b pb-4">
              <Button variant="secondary" size="sm" className="rounded-full">
                Actions
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Customer
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

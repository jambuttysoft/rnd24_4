"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccountSwitcher } from "@/app/mail/components/account-switcher"
import { ThreadDisplay } from "./thread-display"
import { ThreadList } from "./thread-list"
import { useLocalStorage } from "usehooks-ts"
import SideBar from "./sidebar"
import SearchBar, { isSearchingAtom } from "./search-bar"
import { useAtom } from "jotai"
import AskAI from "./ask-ai"
import LoadMoreButton from "./load-more-button"
import DiagnosticButtons from "./diagnostic-buttons"
import NavigationDiagnosticButton from "./navigation-diagnostic-button"

interface MailProps {
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [done, setDone] = useLocalStorage('normalhuman-done', false)
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  // Диагностическое логирование
  React.useEffect(() => {
    console.log('🔍 DIAGNOSTIC: Mail component mounted', {
      timestamp: new Date().toISOString(),
      component: 'Mail',
      props: { defaultLayout, defaultCollapsed, navCollapsedSize },
      state: { done, isCollapsed }
    })
    
    return () => {
      console.log('🔍 DIAGNOSTIC: Mail component unmounted', {
        timestamp: new Date().toISOString(),
        component: 'Mail'
      })
    }
  }, [])

  React.useEffect(() => {
    console.log('🔍 DIAGNOSTIC: Mail state changed', {
      timestamp: new Date().toISOString(),
      component: 'Mail',
      state: { done, isCollapsed }
    })
  }, [done, isCollapsed])


  return (
    <TooltipProvider delayDuration={0}>
      <DiagnosticButtons />
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
            sizes
          )}`
        }}
        className="items-stretch h-full min-h-screen"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={40}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`
          }}
          onResize={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`
          }}
          className={cn(
            isCollapsed &&
            "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div className="flex flex-col h-full flex-1">
            <div
              className={cn(
                "flex h-[52px] items-center justify-center",
                isCollapsed ? "h-[52px]" : "px-2"
              )}
            >
              <AccountSwitcher isCollapsed={isCollapsed} />
            </div>
            <Separator />
            {!isCollapsed && (
              <div className="px-2 py-2">
                <LoadMoreButton />
              </div>
            )}
            {/* Кнопка в навигационной панели для диагностики */}
            {!isCollapsed && (
              <NavigationDiagnosticButton />
            )}
            <SideBar isCollapsed={isCollapsed} />
            <div className="flex-1"></div>
            <AskAI isCollapsed={isCollapsed} />
          </div>

        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="inbox" value={done ? 'done' : 'inbox'} onValueChange={tab => {
            if (tab === 'done') {
              setDone(true)
            } else {
              setDone(false)
            }
          }}>
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="inbox"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Inbox
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Done
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <SearchBar />
            <TabsContent value="inbox" className="m-0">
              <ThreadList />
            </TabsContent>
            <TabsContent value="done" className="m-0">
              <ThreadList />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <ThreadDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}

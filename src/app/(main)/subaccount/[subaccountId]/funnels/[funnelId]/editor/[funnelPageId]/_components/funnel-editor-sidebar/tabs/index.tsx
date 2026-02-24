import React from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Plus, SettingsIcon, SquareStackIcon } from 'lucide-react'

type Props = {}

const TabList = (props: Props) => {
  const tabs = [
    { value: 'Settings', label: 'Settings', Icon: SettingsIcon },
    { value: 'Components', label: 'Components', Icon: Plus },
    { value: 'Layers', label: 'Layers', Icon: SquareStackIcon },
    { value: 'Media', label: 'Media', Icon: Database },
  ]

  return (
    <TabsList className="flex h-full w-full flex-col items-center justify-start gap-2 rounded-xl bg-transparent p-0">
      {tabs.map(({ value, label, Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="h-12 w-12 rounded-xl border border-transparent bg-transparent p-0 text-muted-foreground transition-all hover:border-border/70 hover:bg-muted/60 hover:text-foreground data-[state=active]:border-border/80 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <Icon size={18} />
          <span className="sr-only">{label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

export default TabList

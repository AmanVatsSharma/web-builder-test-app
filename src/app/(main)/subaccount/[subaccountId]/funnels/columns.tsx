'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FunnelsForSubAccount } from '@/lib/types'
import { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, Pencil } from 'lucide-react'
import Link from 'next/link'

function getFirstFunnelPageId(funnel: FunnelsForSubAccount): string | null {
  const pages = funnel.FunnelPages ?? []
  if (pages.length === 0) return null
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  return sorted[0]?.id ?? null
}

export const columns: ColumnDef<FunnelsForSubAccount>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return (
        <Link
          className="flex gap-2 items-center"
          href={`/subaccount/${row.original.subAccountId}/funnels/${row.original.id}`}
        >
          {row.getValue('name')}
          <ExternalLink size={15} />
        </Link>
      )
    },
  },
  {
    id: 'builder',
    header: 'Website builder',
    cell: ({ row }) => {
      const firstPageId = getFirstFunnelPageId(row.original)
      if (!firstPageId) return <span className="text-muted-foreground text-sm">No pages</span>
      return (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/subaccount/${row.original.subAccountId}/funnels/${row.original.id}/editor/${firstPageId}`}
            className="flex gap-2 items-center"
          >
            <Pencil size={14} />
            Edit
          </Link>
        </Button>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => {
      const date = ` ${row.original.updatedAt.toDateString()} ${row.original.updatedAt.toLocaleTimeString()} `
      return <span className="text-muted-foreground">{date}</span>
    },
  },
  {
    accessorKey: 'published',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.published
      return status ? (
        <Badge variant={'default'}>Live - {row.original.subDomainName}</Badge>
      ) : (
        <Badge variant={'secondary'}>Draft</Badge>
      )
    },
  },
]

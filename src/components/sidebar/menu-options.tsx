'use client'

import {
  Agency,
  AgencySidebarOption,
  SubAccount,
  SubAccountSidebarOption,
} from '@prisma/client'
import React, { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '../ui/sheet'
import { Button } from '../ui/button'
import {
  ChevronsUpDown,
  Compass,
  Menu,
  PlusCircleIcon,
  Workflow,
} from 'lucide-react'
import clsx from 'clsx'
import { AspectRatio } from '../ui/aspect-ratio'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useModal } from '@/providers/modal-provider'
import CustomModal from '../global/custom-modal'
import SubAccountDetails from '../forms/subaccount-details'
import { Separator } from '../ui/separator'
import { icons } from '@/lib/constants'
import { useRouter } from 'next/navigation'

type Props = {
  defaultOpen?: boolean
  type: 'agency' | 'subaccount'
  subAccounts: SubAccount[]
  sidebarOpt: AgencySidebarOption[] | SubAccountSidebarOption[]
  sidebarLogo: string
  details: any
  user: any
  id: string
}

const MenuOptions = ({
  details,
  id,
  type,
  sidebarLogo,
  sidebarOpt,
  subAccounts,
  user,
  defaultOpen,
}: Props) => {
  const { setOpen } = useModal()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  const openState = useMemo(
    () => (defaultOpen ? { open: true } : {}),
    [defaultOpen]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return

  const agencyFunnelsShortcut =
    type === 'agency' && subAccounts.length
      ? {
          href: `/subaccount/${subAccounts[0].id}/funnels`,
          subAccountName: subAccounts[0].name,
        }
      : null

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  return (
    <Sheet
      modal={false}
      {...openState}
    >
      {!defaultOpen && (
        <SheetTrigger
          asChild
          className="absolute left-4 top-4 z-[100] md:!hidden felx"
        >
          <Button
            variant="outline"
            size={'icon'}
          >
            <Menu />
          </Button>
        </SheetTrigger>
      )}

      <SheetContent
        showX={!defaultOpen}
        showOverlay={!defaultOpen}
        side={'left'}
        className={clsx(
          'bg-background/80 backdrop-blur-xl fixed top-0 border-r-[1px] p-6',
          {
            'hidden md:inline-block z-[30] w-[300px]': defaultOpen,
            'inline-block md:hidden z-[100] w-full': !defaultOpen,
          }
        )}
      >
        <div>
          <AspectRatio ratio={16 / 5}>
            <Image
              src={sidebarLogo}
              alt="Sidebar Logo"
              fill
              className="rounded-md object-contain"
            />
          </AspectRatio>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="w-full my-4 flex items-center justify-between py-8"
                variant="ghost"
              >
                <div className="flex items-center text-left gap-2">
                  <Compass />
                  <div className="flex flex-col">
                    {details.name}
                    <span className="text-muted-foreground">
                      {details.address}
                    </span>
                  </div>
                </div>
                <div>
                  <ChevronsUpDown
                    size={16}
                    className="text-muted-foreground"
                  />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 h-80 mt-4 z-[200]">
              <div className="flex h-full flex-col">
                <div className="space-y-3 overflow-y-auto pr-1">
                  {(user?.role === 'AGENCY_OWNER' ||
                    user?.role === 'AGENCY_ADMIN') &&
                    user?.Agency && (
                      <div>
                        <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                          Agency
                        </p>
                        <button
                          type="button"
                          className="my-1 flex w-full items-center gap-4 rounded-md border border-border p-2 text-left text-primary transition-all hover:bg-muted"
                          onClick={() => handleNavigate(`/agency/${user?.Agency?.id}`)}
                        >
                          <div className="relative w-16">
                            <Image
                              src={user?.Agency?.agencyLogo}
                              alt="Agency Logo"
                              fill
                              className="rounded-md object-contain"
                            />
                          </div>
                          <div className="flex flex-col flex-1">
                            {user?.Agency?.name}
                            <span className="text-muted-foreground">
                              {user?.Agency?.address}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  <div>
                    <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                      Accounts
                    </p>
                    {subAccounts.length ? (
                      subAccounts.map((subaccount) => (
                        <button
                          key={subaccount.id}
                          type="button"
                          className="my-1 flex w-full items-center gap-4 rounded-md border border-border p-2 text-left transition-all hover:bg-muted"
                          onClick={() => handleNavigate(`/subaccount/${subaccount.id}`)}
                        >
                          <div className="relative w-16">
                            <Image
                              src={subaccount.subAccountLogo}
                              alt="subaccount Logo"
                              fill
                              className="rounded-md object-contain"
                            />
                          </div>
                          <div className="flex flex-col flex-1">
                            {subaccount.name}
                            <span className="text-muted-foreground">
                              {subaccount.address}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="py-2 px-1 text-sm text-muted-foreground">
                        No Accounts
                      </p>
                    )}
                  </div>
                </div>
                {(user?.role === 'AGENCY_OWNER' ||
                  user?.role === 'AGENCY_ADMIN') && (
                  <div className="mt-3 border-t border-border pt-3">
                    <SheetClose>
                      <Button
                        className="w-full flex gap-2"
                        onClick={() => {
                          setOpen(
                            <CustomModal
                              title="Create A Subaccount"
                              subheading="You can switch between your agency account and the subaccount from the sidebar"
                            >
                              <SubAccountDetails
                                agencyDetails={user?.Agency as Agency}
                                userId={user?.id as string}
                                userName={user?.name}
                              />
                            </CustomModal>
                          )
                        }}
                      >
                        <PlusCircleIcon size={15} />
                        Create Sub Account
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-muted-foreground text-xs mb-2">MENU LINKS</p>
          <Separator className="mb-4" />
          <nav className="relative">
            <div className="space-y-1 py-1">
              {sidebarOpt.map((sidebarOptions) => {
                let val
                const result = icons.find(
                  (icon) => icon.value === sidebarOptions.icon
                )
                if (result) {
                  val = <result.path />
                }
                return (
                  <button
                    key={sidebarOptions.id}
                    type="button"
                    onClick={() => handleNavigate(sidebarOptions.link)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-all hover:bg-muted"
                  >
                    {val}
                    <span>{sidebarOptions.name}</span>
                  </button>
                )
              })}
              {agencyFunnelsShortcut && (
                <button
                  type="button"
                  onClick={() => handleNavigate(agencyFunnelsShortcut.href)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-all hover:bg-muted"
                >
                  <Workflow size={16} />
                  <div className="flex flex-col leading-tight">
                    <span>Funnels</span>
                    <span className="text-[11px] text-muted-foreground">
                      {agencyFunnelsShortcut.subAccountName}
                    </span>
                  </div>
                </button>
              )}
              {!sidebarOpt.length && !agencyFunnelsShortcut && (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No menu links available.
                </p>
              )}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MenuOptions

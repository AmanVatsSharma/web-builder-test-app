'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Image from 'next/image'
import {
  saveActivityLogsNotification,
  updateFunnelProducts,
} from '@/lib/queries'
import { Funnel } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaymentGatewayCode } from '@/lib/payments'
import { GatewayProductOption } from '@/lib/types'

interface FunnelProductsTableProps {
  defaultData: Funnel
  gateway: PaymentGatewayCode
  products: GatewayProductOption[]
}

const FunnelProductsTable: React.FC<FunnelProductsTableProps> = ({
  gateway,
  products,
  defaultData,
}) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [liveProducts, setLiveProducts] = useState<
    { productId: string; recurring: boolean }[] | []
  >(JSON.parse(defaultData.liveProducts || '[]'))

  const handleSaveProducts = async () => {
    setIsLoading(true)
    const payload = liveProducts.map((product) => ({
      ...product,
      gateway,
    }))
    const response = await updateFunnelProducts(
      JSON.stringify(payload),
      defaultData.id
    )
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel products | ${response.name}`,
      subaccountId: defaultData.subAccountId,
    })
    setIsLoading(false)
    router.refresh()
  }

  const handleAddProduct = async (product: GatewayProductOption) => {
    const productIdExists = liveProducts.find(
      (prod) => prod.productId === product.priceId
    )
    productIdExists
      ? setLiveProducts(
          liveProducts.filter(
            (prod) => prod.productId !== product.priceId
          )
        )
      : setLiveProducts([
          ...liveProducts,
          {
            productId: product.priceId,
            recurring: product.recurring,
          },
        ])
  }
  return (
    <>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead>Live</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Input
                  defaultChecked={
                    !!liveProducts.find(
                      (prod) => prod.productId === product.priceId
                    )
                  }
                  onChange={() => handleAddProduct(product)}
                  type="checkbox"
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Image
                  alt="product Image"
                  height={60}
                  width={60}
                  src={product.image}
                />
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.recurring ? 'Recurring' : 'One Time'}</TableCell>
              <TableCell className="text-right">
                {product.currency} {product.unitAmount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        disabled={isLoading}
        onClick={handleSaveProducts}
        className="mt-4"
      >
        Save Products
      </Button>
    </>
  )
}

export default FunnelProductsTable

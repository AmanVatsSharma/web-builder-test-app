import React from 'react'

import { Funnel } from '@prisma/client'
import { db } from '@/lib/db'
import { getSubaccountProductCatalog } from '@/lib/payments/actions'
import { getGatewayDisplayName } from '@/lib/payments'


import FunnelForm from '@/components/forms/funnel-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import FunnelProductsTable from './funnel-products-table'

interface FunnelSettingsProps {
  subaccountId: string
  defaultData: Funnel
}

const FunnelSettings: React.FC<FunnelSettingsProps> = async ({
  subaccountId,
  defaultData,
}) => {
  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })

  if (!subaccountDetails) return

  const productCatalog = await getSubaccountProductCatalog(subaccountId)
  const products = productCatalog.products
  const canLoadProducts = products.length > 0
  const gatewayName = getGatewayDisplayName(productCatalog.gateway)

  return (
    <div className="flex gap-4 flex-col xl:!flex-row">
      <Card className="flex-1 flex-shrink">
        <CardHeader>
          <CardTitle>Funnel Products</CardTitle>
          <CardDescription>
            Select the products and services you wish to sell on this funnel.
            You can sell one time and recurring products too.
          </CardDescription>
          <CardDescription>
            Product source: {gatewayName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <>
            {canLoadProducts ? (
              <FunnelProductsTable
                defaultData={defaultData}
                gateway={productCatalog.gateway}
                products={products}
              />
            ) : (
              `No products found for ${gatewayName}. Add products in your payment provider and reconnect from Launchpad.`
            )}
          </>
        </CardContent>
      </Card>

      <FunnelForm
        subAccountId={subaccountId}
        defaultData={defaultData}
      />
    </div>
  )
}

export default FunnelSettings

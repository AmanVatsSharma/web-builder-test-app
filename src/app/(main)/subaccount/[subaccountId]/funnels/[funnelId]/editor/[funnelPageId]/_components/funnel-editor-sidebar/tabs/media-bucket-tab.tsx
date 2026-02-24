'use client'
import MediaComponent from '@/components/media'
import { getMedia } from '@/lib/queries'
import { GetMediaFiles } from '@/lib/types'
import React, { useEffect, useState } from 'react'

type Props = {
  subaccountId: string
}

const MediaBucketTab = (props: Props) => {
  const [data, setdata] = useState<GetMediaFiles>(null)

  useEffect(() => {
    const fetchData = async () => {
      const response = await getMedia(props.subaccountId)
      setdata(response)
    }
    fetchData()
  }, [props.subaccountId])

  return (
    <div className="h-full overflow-y-auto px-4 pb-20 pt-4">
      <div className="rounded-xl border border-border/70 bg-background/70 p-3">
        <MediaComponent
          data={data}
          subaccountId={props.subaccountId}
        />
      </div>
    </div>
  )
}

export default MediaBucketTab

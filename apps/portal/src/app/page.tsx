import * as React from 'react'

import Main from '@/components/main'
import { redirect } from 'next/navigation'

export default function Home() {
  const user = false

  if (!user) {
    redirect('/login')
  }

  return <Main />
}

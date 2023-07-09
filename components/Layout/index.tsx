import React from 'react'
import { BlurryMoving } from '../ui/BlurryMoving'

interface Props {
  children: React.ReactNode
}
const Layout = ({ children }: Props) => {
  return (
    <div className='p-8'>
      <BlurryMoving />
      {children}
    </div>
  )
}

export default Layout
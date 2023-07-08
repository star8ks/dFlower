import React from 'react'
import Header from './Header'
import { BlurryMoving } from '../ui/BlurryMoving'

interface Props {
  children: React.ReactNode
}
const Layout = ({ children }: Props) => {
  return (
    <div className='p-8'>
      <BlurryMoving />
      <Header />
      {children}
    </div>
  )
}

export default Layout
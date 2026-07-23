import { Card, CardBody } from 'react-bootstrap'

import LogoBox from '@/components/LogoBox'
import type { ChildrenType } from '@/types/component-props'

type AuthShellProps = ChildrenType & {
  title: string
  subtitle?: string
}

const AuthShell = ({ title, subtitle, children }: AuthShellProps) => {
  return (
    <Card className="auth-card hoftrix-auth-card border">
      <CardBody className="p-4 p-md-5">
        <div className="text-center mb-4">
          <LogoBox textLogo={{ height: 32 }} containerClassName="mx-auto d-inline-block" />
        </div>
        <h2 className="fw-bold fs-22 mb-1 text-center text-dark">{title}</h2>
        {subtitle && <p className="text-muted text-center mb-4">{subtitle}</p>}
        {children}
      </CardBody>
    </Card>
  )
}

export default AuthShell

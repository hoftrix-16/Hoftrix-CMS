import { Link } from 'react-router-dom'
import type { LogoBoxProps } from '@/types/component-props'

const LOGO_SRC = '/logo-dark-full.svg'

const LogoBox = ({ containerClassName, textLogo }: LogoBoxProps) => {
  const height = textLogo?.height ?? 32

  return (
    <div className={`logo-box hoftrix-logo-box ${containerClassName ?? ''}`}>
      <Link to="/" className="hoftrix-logo-link d-inline-flex align-items-center">
        <img
          src={LOGO_SRC}
          className={`hoftrix-logo-img ${textLogo?.className ?? ''}`}
          height={height}
          alt="Hoftrix"
        />
      </Link>
    </div>
  )
}

export default LogoBox

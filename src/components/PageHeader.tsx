import IconifyIcon from '@/components/wrappers/IconifyIcon'

type PageHeaderProps = {
  title: string
  subtitle?: string
  icon?: string
  actions?: React.ReactNode
}

const PageHeader = ({ title, subtitle, icon, actions }: PageHeaderProps) => {
  return (
    <div className="crm-page-header hoftrix-page-header">
      <div className="d-flex align-items-start gap-3 min-w-0">
        {icon && (
          <div className="hoftrix-page-header-icon flex-shrink-0">
            <IconifyIcon icon={icon} className="fs-24" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="m-0 text-break">{title}</h3>
          {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="crm-page-actions">{actions}</div>}
    </div>
  )
}

export default PageHeader

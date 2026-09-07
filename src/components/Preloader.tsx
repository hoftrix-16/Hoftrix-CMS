const Preloader = ({ label = 'Loading' }: { label?: string }) => (
  <div className="hoftrix-loader hoftrix-loader-compact" role="status" aria-live="polite" aria-label={label}>
    <div className="hoftrix-loader-spinner" />
  </div>
)

export default Preloader

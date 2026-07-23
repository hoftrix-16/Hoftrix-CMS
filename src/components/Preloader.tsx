const Preloader = ({ label = 'Loading' }: { label?: string }) => (
  <div className="hoftrix-loader" role="status" aria-live="polite" aria-label={label}>
    <div className="hoftrix-loader-card">
      <div className="hoftrix-loader-mark">H</div>
      <div className="hoftrix-loader-spinner" />
      <p className="hoftrix-loader-text">{label}</p>
    </div>
  </div>
)

export default Preloader

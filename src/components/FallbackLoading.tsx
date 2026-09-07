/** Compact fallback used by Suspense boundaries (not a full-page splash). */
const FallbackLoading = () => (
  <div className="hoftrix-page-fallback" role="status" aria-label="Loading">
    <div className="hoftrix-page-fallback-bar" />
  </div>
)

export default FallbackLoading

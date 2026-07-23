import { Navigate } from 'react-router-dom'

/** Legacy welcome page redirected — invoice module lives at /pages/invoices */
const WelcomePage = () => <Navigate to="/pages/invoices" replace />

export default WelcomePage

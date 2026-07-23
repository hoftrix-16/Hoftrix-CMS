import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'

import 'react-toastify/dist/ReactToastify.css'
import '@/assets/scss/app.scss'

const App = () => {
  return (
    <AppProvidersWrapper>
      <AppRouter />
    </AppProvidersWrapper>
  )
}

export default App

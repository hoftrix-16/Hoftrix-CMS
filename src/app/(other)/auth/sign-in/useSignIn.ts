import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'

import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { saveSession } = useAuthContext()
  const [searchParams] = useSearchParams()

  const { showNotification } = useNotificationContext()

  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/')
  }

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    try {
      const res: AxiosResponse<any> = await httpClient.post('/auth/login', {
        email: values.email?.trim(),
        password: values.password,
      })
      if (res.data.token) {
        saveSession({
          ...res.data.user,
          token: res.data.token,
        })
        redirectUser()
        showNotification({ message: 'Successfully logged in. Redirecting....', variant: 'success' })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.response?.data?.error || e.message || 'Something went wrong'
      showNotification({ message: errorMessage, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  })

  return { loading, login, control }
}

export default useSignIn

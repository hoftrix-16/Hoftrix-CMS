import { useState } from 'react'
import TextFormInput from '@/components/form/TextFormInput'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'


const emailSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Please enter your email'),
})


const otpSchema = yup.object({
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .required('Please enter the OTP'),
})


const passwordSchema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Please enter your new password'),

  confirmPassword: yup
    .string()
    .oneOf(
      [yup.ref('password')],
      'Passwords do not match'
    )
    .required('Please confirm your password'),
})


type EmailFields = yup.InferType<typeof emailSchema>
type OtpFields = yup.InferType<typeof otpSchema>
type PasswordFields = yup.InferType<typeof passwordSchema>


const ResetPassForm = () => {
  const [loading, setLoading] = useState(false)

  // 1 = Email
  // 2 = OTP
  // 3 = New Password
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [email, setEmail] = useState('')

  const { showNotification } =
    useNotificationContext()


  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
  } = useForm<EmailFields>({
    resolver: yupResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })


  // =====================================================
  // OTP FORM
  // =====================================================

  const {
    control: otpControl,
    handleSubmit: handleOtpSubmit,
    reset: resetOtpForm,
  } = useForm<OtpFields>({
    resolver: yupResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })


  // =====================================================
  // PASSWORD FORM
  // =====================================================

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: {
      errors: passwordErrors,
    },
  } = useForm<PasswordFields>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })



  const onEmailSubmit = handleEmailSubmit(
    async (values) => {
      setLoading(true)

      try {
        const res = await httpClient.post(
          '/auth/forgot-password',
          {
            email: values.email,
          }
        )

        setEmail(values.email)

        setStep(2)

        showNotification({
          message:
            res.data.message ||
            'OTP sent successfully. Please check your email.',
          variant: 'success',
        })
      } catch (e: any) {
        showNotification({
          message:
            e.response?.data?.message ||
            'Failed to send verification code.',
          variant: 'danger',
        })
      } finally {
        setLoading(false)
      }
    }
  )


  // =====================================================
  // STEP 2
  // VERIFY OTP
  // =====================================================

  const onOtpSubmit = handleOtpSubmit(
    async (values) => {
      setLoading(true)

      try {
        const res = await httpClient.post(
          '/auth/verify-reset-otp',
          {
            email,
            otp: values.otp,
          }
        )

        setStep(3)

        showNotification({
          message:
            res.data.message ||
            'OTP verified successfully.',
          variant: 'success',
        })
      } catch (e: any) {
        showNotification({
          message:
            e.response?.data?.message ||
            'Invalid or expired OTP.',
          variant: 'danger',
        })
      } finally {
        setLoading(false)
      }
    }
  )


  const onPasswordSubmit = handlePasswordSubmit(
    async (values) => {
      setLoading(true)

      try {
        const res = await httpClient.post(
          '/auth/reset-password',
          {
            email,
            password: values.password,
          }
        )

        showNotification({
          message:
            res.data.message ||
            'Password reset successfully.',
          variant: 'success',
        })

        // Redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 1000)
      } catch (e: any) {
        showNotification({
          message:
            e.response?.data?.message ||
            'Failed to reset password.',
          variant: 'danger',
        })
      } finally {
        setLoading(false)
      }
    }
  )


  // =====================================================
  // CHANGE EMAIL
  // =====================================================

  const handleChangeEmail = () => {
    setEmail('')
    resetOtpForm()
    setStep(1)
  }


  // =====================================================
  // STEP 1 UI
  // EMAIL
  // =====================================================

  if (step === 1) {
    return (
      <form
        className="authentication-form"
        onSubmit={onEmailSubmit}
      >
        <TextFormInput
          control={emailControl}
          name="email"
          containerClassName="mb-3"
          label="Email"
          id="email-id"
          placeholder="Enter your email"
        />

        <div className="mb-1 text-center d-grid">
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Sending OTP...'
              : 'Send OTP'}
          </Button>
        </div>
      </form>
    )
  }


  // =====================================================
  // STEP 2 UI
  // OTP
  // =====================================================

  if (step === 2) {
    return (
      <form
        className="authentication-form"
        onSubmit={onOtpSubmit}
      >
        <div className="text-center mb-4">
          <h5 className="mb-2">
            Verify OTP
          </h5>

          <p className="text-muted mb-1">
            We have sent a 6-digit verification
            code to
          </p>

          <strong>
            {email}
          </strong>

          <p className="small text-muted mt-2 mb-0">
            The OTP will expire in 5 minutes.
          </p>
        </div>


        <TextFormInput
          control={otpControl}
          name="otp"
          containerClassName="mb-3"
          label="Verification Code"
          id="otp-id"
          placeholder="Enter 6-digit OTP"
        />


        <div className="mb-3 text-center d-grid">
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Verifying...'
              : 'Verify OTP'}
          </Button>
        </div>


        <div className="text-center">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleChangeEmail}
            disabled={loading}
          >
            Change Email
          </button>
        </div>
      </form>
    )
  }


  // =====================================================
  // STEP 3 UI
  // NEW PASSWORD
  // =====================================================

  return (
    <form
      className="authentication-form"
      onSubmit={onPasswordSubmit}
    >

      {/* Heading */}
      <div className="text-center mb-4">
        <h5 className="mb-2">
          Create New Password
        </h5>

        <p className="text-muted mb-0">
          Enter your new password below.
        </p>
      </div>


      {/* =========================================
          NEW PASSWORD
      ========================================= */}

      <div className="mb-3">

        <label
          htmlFor="password-id"
          className="form-label"
        >
          New Password
        </label>

        <input
          {...registerPassword('password')}
          id="password-id"
          type="password"
          className={`form-control ${
            passwordErrors.password
              ? 'is-invalid'
              : ''
          }`}
          placeholder="Enter new password"
          autoComplete="new-password"
        />

        {passwordErrors.password && (
          <div className="invalid-feedback">
            {passwordErrors.password.message}
          </div>
        )}

      </div>


      {/* =========================================
          CONFIRM PASSWORD
      ========================================= */}

      <div className="mb-3">

        <label
          htmlFor="confirm-password-id"
          className="form-label"
        >
          Confirm Password
        </label>

        <input
          {...registerPassword('confirmPassword')}
          id="confirm-password-id"
          type="password"
          className={`form-control ${
            passwordErrors.confirmPassword
              ? 'is-invalid'
              : ''
          }`}
          placeholder="Confirm your new password"
          autoComplete="new-password"
        />

        {passwordErrors.confirmPassword && (
          <div className="invalid-feedback">
            {
              passwordErrors
                .confirmPassword
                .message
            }
          </div>
        )}

      </div>


      {/* =========================================
          RESET BUTTON
      ========================================= */}

      <div className="mb-1 text-center d-grid">

        <Button
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Resetting...'
            : 'Reset Password'}
        </Button>

      </div>

    </form>
  )
}


export default ResetPassForm
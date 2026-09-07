export type UserType = {
  id: string
  _id?: string
  username?: string
  name?: string
  email: string
  password?: string
  firstName?: string
  lastName?: string
  role: string
  token: string
  phone?: string
  designation?: string
  bio?: string
  skills?: string[]
  permissions?: string[]
  avatar?: string
  cover?: string
  website?: string
  technologies?: string
  projectName?: string
}

export const getUserId = (user?: UserType | null) => user?.id || user?._id || ''

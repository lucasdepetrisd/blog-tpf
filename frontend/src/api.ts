import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface Post {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Profile {
  name: string
  bio: string
  has_photo: boolean
}

export const login = (username: string, password: string) => {
  const form = new URLSearchParams({ username, password })
  return api.post<{ access_token: string }>('/auth/login', form)
}

export const getPosts = () => api.get<Post[]>('/posts')
export const getPost = (id: number) => api.get<Post>(`/posts/${id}`)
export const createPost = (data: { title: string; content: string }) => api.post<Post>('/posts', data)
export const updatePost = (id: number, data: { title: string; content: string }) => api.put<Post>(`/posts/${id}`, data)
export const deletePost = (id: number) => api.delete(`/posts/${id}`)

export interface ChangelogEntry {
  id: number
  version: string
  description: string
  date: string
}

export const getChangelog = () => api.get<ChangelogEntry[]>('/changelog')
export const createChangelogEntry = (data: { version: string; description: string; date: string }) =>
  api.post<ChangelogEntry>('/changelog', data)
export const deleteChangelogEntry = (id: number) => api.delete(`/changelog/${id}`)

export const getProfile = () => api.get<Profile>('/profile')
export const updateProfile = (data: { name: string; bio: string }) => api.put<Profile>('/profile', data)
export const deletePhoto = () => api.delete<Profile>('/profile/photo')

export const uploadPhoto = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<Profile>('/profile/photo', form)
}

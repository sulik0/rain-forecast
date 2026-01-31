import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateId } from '@/lib/utils'

const USERS_KEY = 'rain-alert-users'
const CURRENT_USER_KEY = 'rain-alert-current-user'

export interface UserAccount {
  id: string
  name: string
  password?: string
  createdAt: string
}

export interface AuthResult {
  ok: boolean
  error?: string
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function loadUsers(): UserAccount[] {
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean)
  } catch {
    return []
  }
}

export function useAuth() {
  const [users, setUsers] = useState<UserAccount[]>(() => loadUsers())
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_KEY)
  })

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(CURRENT_USER_KEY, currentUserId)
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return
    const exists = users.some(user => user.id === currentUserId)
    if (!exists) {
      setCurrentUserId(null)
    }
  }, [currentUserId, users])

  const currentUser = useMemo(() => {
    return users.find(user => user.id === currentUserId) ?? null
  }, [users, currentUserId])

  const registerUser = useCallback((name: string, password: string): AuthResult => {
    const trimmed = name.trim()
    if (!trimmed) {
      return { ok: false, error: '请输入用户名' }
    }

    const normalized = normalizeName(trimmed)
    const exists = users.some(user => normalizeName(user.name) === normalized)
    if (exists) {
      return { ok: false, error: '用户名已存在' }
    }

    const cleanedPassword = password.trim()
    const newUser: UserAccount = {
      id: generateId(),
      name: trimmed,
      password: cleanedPassword ? cleanedPassword : undefined,
      createdAt: new Date().toISOString(),
    }

    setUsers(prev => [...prev, newUser])
    setCurrentUserId(newUser.id)

    return { ok: true }
  }, [users])

  const loginUser = useCallback((userId: string, password: string): AuthResult => {
    const user = users.find(item => item.id === userId)
    if (!user) {
      return { ok: false, error: '用户不存在' }
    }

    const cleanedPassword = password.trim()
    if (user.password && user.password !== cleanedPassword) {
      return { ok: false, error: '口令错误' }
    }

    setCurrentUserId(user.id)
    return { ok: true }
  }, [users])

  const logout = useCallback(() => {
    setCurrentUserId(null)
  }, [])

  return {
    users,
    currentUser,
    loginUser,
    registerUser,
    logout,
  }
}

import { useEffect, useMemo, useState } from 'react'
import { CloudRain, LogIn, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import type { UserAccount, AuthResult } from '@/hooks/useAuth'

interface LoginPageProps {
  users: UserAccount[]
  onLogin: (userId: string, password: string) => AuthResult
  onRegister: (name: string, password: string) => AuthResult
}

export function LoginPage({ users, onLogin, onRegister }: LoginPageProps) {
  const { showToast } = useToast()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId])

  const selectedUser = useMemo(() => {
    return users.find(user => user.id === selectedUserId) ?? null
  }, [users, selectedUserId])

  const handleLogin = () => {
    if (!selectedUserId) {
      setLoginError('请选择用户')
      return
    }

    if (selectedUser?.password && !loginPassword.trim()) {
      setLoginError('请输入口令')
      return
    }

    const result = onLogin(selectedUserId, loginPassword)
    if (!result.ok) {
      setLoginError(result.error || '登录失败')
      return
    }

    setLoginError('')
    setLoginPassword('')
    showToast(`欢迎回来，${selectedUser?.name || '用户'}！`, 'success')
  }

  const handleRegister = () => {
    const name = registerName.trim()
    if (!name) {
      setRegisterError('请输入用户名')
      return
    }

    if (registerPassword.trim() && registerPassword !== registerConfirm) {
      setRegisterError('两次口令输入不一致')
      return
    }

    const result = onRegister(name, registerPassword)
    if (!result.ok) {
      setRegisterError(result.error || '创建失败')
      return
    }

    setRegisterError('')
    setRegisterName('')
    setRegisterPassword('')
    setRegisterConfirm('')
    showToast('账号已创建，已自动登录', 'success')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-glow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <CloudRain className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">降雨预警</h1>
                <p className="text-sm text-muted-foreground">多用户配置 · 城市与通知独立保存</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              每位用户都拥有独立的城市列表和微信推送 Token 配置。登录后即可继续管理预警规则。
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="font-medium text-foreground mb-1">个性化城市</p>
              <p>为每位用户保留独立关注列表</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="font-medium text-foreground mb-1">通知互不干扰</p>
              <p>不同 Token 不会覆盖彼此设置</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <LogIn className="w-5 h-5 text-primary-light" />
              <h2 className="text-xl font-semibold text-foreground">用户登录</h2>
            </div>

            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                暂无用户，请先创建新账号。
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">选择用户</label>
                  <select
                    value={selectedUserId}
                    onChange={(event) => {
                      setSelectedUserId(event.target.value)
                      setLoginError('')
                      setLoginPassword('')
                    }}
                    className="input"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser?.password && (
                  <div>
                    <label className="label">登录口令</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => {
                        setLoginPassword(event.target.value)
                        setLoginError('')
                      }}
                      placeholder="输入用户口令"
                      className="input"
                    />
                  </div>
                )}

                {loginError && (
                  <p className="text-sm text-danger">{loginError}</p>
                )}

                <button onClick={handleLogin} className="btn-primary w-full">
                  登录
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">创建新用户</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(event) => {
                    setRegisterName(event.target.value)
                    setRegisterError('')
                  }}
                  placeholder="输入用户名"
                  className="input"
                />
              </div>

              <div>
                <label className="label">登录口令（可选）</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => {
                    setRegisterPassword(event.target.value)
                    setRegisterError('')
                  }}
                  placeholder="设置登录口令"
                  className="input"
                />
              </div>

              {registerPassword && (
                <div>
                  <label className="label">确认口令</label>
                  <input
                    type="password"
                    value={registerConfirm}
                    onChange={(event) => {
                      setRegisterConfirm(event.target.value)
                      setRegisterError('')
                    }}
                    placeholder="再次输入口令"
                    className="input"
                  />
                </div>
              )}

              {registerError && (
                <p className="text-sm text-danger">{registerError}</p>
              )}

              <button onClick={handleRegister} className="btn-secondary w-full">
                创建并登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

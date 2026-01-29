import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取降雨概率等级
export function getRainLevel(probability: number): 'low' | 'medium' | 'high' | 'very-high' {
  if (probability < 30) return 'low'
  if (probability < 50) return 'medium'
  if (probability < 70) return 'high'
  return 'very-high'
}

// 获取等级对应的样式类
export function getRainLevelClass(probability: number): string {
  const level = getRainLevel(probability)
  switch (level) {
    case 'low':
      return 'text-success'
    case 'medium':
      return 'text-primary-light'
    case 'high':
      return 'text-warning'
    case 'very-high':
      return 'text-danger'
  }
}

// 格式化日期
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

// 格式化时间
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

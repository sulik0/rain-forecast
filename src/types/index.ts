// 数据源类型
export type DataSourceType = 'cma' | 'qweather'

// 数据源信息
export interface DataSource {
  id: DataSourceType
  name: string
  description: string
  weight: number
  enabled: boolean
}

// 城市信息
export interface City {
  id: string
  name: string
  code: string // 城市代码，用于API查询
  province: string
}

// 天气数据
export interface WeatherData {
  source: DataSourceType
  city: string
  date: Date
  rainProbability: number
  temperature?: {
    min: number
    max: number
  }
  weather?: string
  updatedAt: Date
}

// 综合预警结果
export interface RainAlert {
  id: string
  city: City
  date: Date
  weightedProbability: number
  sourceData: WeatherData[]
  threshold: number
  triggered: boolean
  createdAt: Date
}

// 通知配置
export interface NotificationConfig {
  enabled: boolean
  wechatPushToken?: string
  threshold: number
  schedules: NotificationSchedule[]
}

// 通知时间表
export interface NotificationSchedule {
  id: string
  time: string // HH:mm 格式
  targetDate: 'today' | 'tomorrow'
  enabled: boolean
  description: string
}

// 应用配置
export interface AppConfig {
  cities: City[]
  dataSources: DataSource[]
  notification: NotificationConfig
}

// 默认数据源配置
export const DEFAULT_DATA_SOURCES: DataSource[] = [
  {
    id: 'cma',
    name: '中国气象局',
    description: '国家官方气象数据源，准确度高',
    weight: 0.6,
    enabled: true,
  },
  {
    id: 'qweather',
    name: '和风天气',
    description: '商业天气API，更新频率高',
    weight: 0.4,
    enabled: true,
  },
]

// 默认通知时间表
export const DEFAULT_SCHEDULES: NotificationSchedule[] = [
  {
    id: 'evening-6',
    time: '18:00',
    targetDate: 'tomorrow',
    enabled: true,
    description: '晚上6点推送明日天气',
  },
  {
    id: 'evening-9',
    time: '21:00',
    targetDate: 'tomorrow',
    enabled: true,
    description: '晚上9点推送明日天气',
  },
  {
    id: 'morning-8',
    time: '08:00',
    targetDate: 'today',
    enabled: true,
    description: '早上8点推送当日天气',
  },
]

// 预设城市列表
export const PRESET_CITIES: City[] = [
  { id: 'beijing', name: '北京', code: '101010100', province: '北京市' },
  { id: 'shanghai', name: '上海', code: '101020100', province: '上海市' },
  { id: 'guangzhou', name: '广州', code: '101280101', province: '广东省' },
  { id: 'shenzhen', name: '深圳', code: '101280601', province: '广东省' },
  { id: 'hangzhou', name: '杭州', code: '101210101', province: '浙江省' },
  { id: 'chengdu', name: '成都', code: '101270101', province: '四川省' },
  { id: 'wuhan', name: '武汉', code: '101200101', province: '湖北省' },
  { id: 'nanjing', name: '南京', code: '101190101', province: '江苏省' },
  { id: 'xian', name: '西安', code: '101110101', province: '陕西省' },
  { id: 'chongqing', name: '重庆', code: '101040100', province: '重庆市' },
]

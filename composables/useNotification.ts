export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration: number
}

export const useNotification = () => {
  const notifications = useState<Notification[]>('notifications', () => [])

  const add = (type: Notification['type'], message: string, duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    notifications.value.push({ id, type, message, duration })

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }

  const remove = (id: string) => {
    const idx = notifications.value.findIndex((n) => n.id === id)
    if (idx !== -1) notifications.value.splice(idx, 1)
  }

  const success = (message: string, duration?: number) => add('success', message, duration)
  const error = (message: string, duration?: number) => add('error', message, duration)
  const info = (message: string, duration?: number) => add('info', message, duration)
  const warning = (message: string, duration?: number) => add('warning', message, duration)

  return { notifications, success, error, info, warning, remove }
}

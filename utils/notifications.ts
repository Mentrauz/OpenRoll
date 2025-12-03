export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      return 'denied';
    }
  }

  return Notification.permission;
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}; 
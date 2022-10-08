self.addEventListener('push', (event) => {
    let notification = event.data.json();
    self.registration.showNotification(
      notification.title, 
      notification.options
    );
  });
  

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow('https://web.dev'));
})
const CACHE_NAME = 'voxclone-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache dynamic assets if needed, for now just network fallback
        return response;
      }).catch(() => {
        // Fallback for offline mode if both cache and network fail
        return new Response('Offline mode');
      });
    })
  );
});

function updateSynthesisInDB(queueId, resultBlob, synthesisTimeMs) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VoiceAppDB');
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['generationQueue'], 'readwrite');
      const store = transaction.objectStore('generationQueue');
      const getRequest = store.get(queueId);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = 'completed';
          item.resultAudioBlob = resultBlob;
          item.synthesisTimeMs = synthesisTimeMs;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (err) => reject(err);
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = (err) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

function markSynthesisFailedInDB(queueId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VoiceAppDB');
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['generationQueue'], 'readwrite');
      const store = transaction.objectStore('generationQueue');
      const getRequest = store.get(queueId);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = 'failed';
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (err) => reject(err);
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = (err) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } else if (event.data.type === 'START_BACKGROUND_SYNTHESIS') {
    const { queueId, text, profileId } = event.data.payload;
    const startTime = Date.now();

    // Perform long running simulated synthesis in service worker background
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const synthesisTimeMs = Date.now() - startTime;
            // Generate simulated speech wav/webm dummy blob
            const dummyBlob = new Blob(['simulated voice output content'], { type: 'audio/webm' });

            await updateSynthesisInDB(queueId, dummyBlob, synthesisTimeMs);

            // Notify active windows
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNTHESIS_COMPLETED',
                payload: { queueId, text }
              });
            });

            // Trigger system notification (works even when tab is in background)
            await self.registration.showNotification('סינתזת קול הושלמה', {
              body: `הטקסט "${text.substring(0, 25)}..." מוכן להשמעה באולפן!`,
              icon: '/icon.png',
              badge: '/icon.png',
              tag: queueId,
              data: { queueId }
            });
            resolve();
          } catch (err) {
            console.error('Background synthesis error:', err);
            await markSynthesisFailedInDB(queueId).catch(console.error);

            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNTHESIS_FAILED',
                payload: { queueId }
              });
            });
            resolve();
          }
        }, 5000); // 5 seconds processing to simulate a longer heavy synthesis job
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

import idb from 'idb';

class IdbController {
  constructor() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    this.dbPromise = undefined;
    this.registerServiceWorker();
  }
  openDataBase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    this.dbPromise = idb.open('restaurant-reviews-app', 1, function(upgradeDb) {
      const store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
    return this.dbPromise;
  }
  registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    const idbController = this;

    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      if (!navigator.serviceWorker.controller) {
        return;
      }
      if (reg.waiting) {
        idbController.swUpdateReady(reg.waiting);
        return;
      }
      if (reg.installing) {
        idbController.trackSwInstall(reg.installing);
        return;
      }
      reg.addEventListener('updatefound', function() {
        idbController.trackSwInstall(reg.installing);
      });
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }
  trackSwInstall(worker) {
    const idbController = this;
    worker.addEventListener('statechange', function() {
      if (worker.state === 'installed') {
        idbController.swUpdateReady(worker);
      }
    });
  }
  swUpdateReady(worker) {
    // TBD - update the user for changes
  }
}
const idbController = new IdbController();
const dbPromise = idbController.openDataBase();
dbPromise.then(function(db) {
  const tx = db.transaction('restaurants', 'readwrite');
  const store = tx.objectStore('restaurants');
  store.put({name: 'test', id: 1});
  return tx.complete
});
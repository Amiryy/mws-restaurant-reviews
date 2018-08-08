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

    this.dbPromise = idb.open('restaurant-reviews-app', 2, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      case 1:
        upgradeDb.createObjectStore('reviews', {
          keyPath: 'id'
        });
      }
    });
    return this.dbPromise;
  }
  storeData(data, storeName) {
    this.dbPromise.then(function(db) {
      if(!db) return;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      data.forEach(item => {
        store.put(item);
      })
    });
  }
  fetchData(storeName) {
    return this.dbPromise.then(function(db) {
      if(!db) return;
      const tx = db.transaction(storeName);
      const store = tx.objectStore(storeName);
      return store.getAll().then(function(data) {
        return data;
      });
    })
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
self.idbController = new IdbController();
self.idbController.openDataBase();
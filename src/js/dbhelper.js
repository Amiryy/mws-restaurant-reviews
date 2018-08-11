
// Common database helper functions.
class DBHelper {
  // Database URL.
  // Change this to restaurants.json file location on your server.
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }
  // Fetch all restaurants.
  static async fetchRestaurants(callback, id = null, isFavorite = null) {
    const storeName = 'restaurants';
    let url = DBHelper.DATABASE_URL + '/restaurants/';
    if (id) url += id;
    if(isFavorite) url += "?is_favorite=true";
    const cachedData = await self.idbController.fetchData(storeName);
    fetch(url).then(response => {
      if(response.status === 200) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    }).then(data => {
      self.idbController.storeData(data, storeName);
      callback(null, data);
    }).catch(error => {
      if(cachedData && cachedData.length > 0) {
        let data = cachedData;
        if(id) {
          data = cachedData.find(r => Number(r.id) === Number(id));
        }
        callback(null, data);
      } else {
        callback(error, null);
      }
    });
  }
  static async fetchReviews(id = null, callback) {
    const storeName = 'reviews';
    let url = DBHelper.DATABASE_URL + '/reviews/';
    if (id) url += `?restaurant_id=${id}`;
    const cachedData = await self.idbController.fetchData(storeName);
    fetch(url).then(response => {
      if(response.status === 200) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    }).then(data => {
      self.idbController.storeData(data, storeName);
      callback(null, data);
    }).catch(error => {
      if(cachedData && cachedData.length > 0) {
        let data = cachedData;
        if(id) {
          data = cachedData.filter(r => Number(r.restaurant_id) === Number(id));
        }
        callback(null, data);
      } else {
        callback(error, null);
      }
    });
  }
  static async postReview (restaurant_id, {name, rating, comments}, callback) {
    const storeName = 'reviews';
    const url = DBHelper.DATABASE_URL + '/reviews/';
    fetch(url, {
      method: 'post',
      headers: new Headers({
        'Accept': 'application/JSON',
        'Content-Type': 'application/JSON'
      }),
      body: JSON.stringify({ restaurant_id, name, rating, comments })
    }).then(response => {
      if(response.status === 200) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    }).then(data => {
      self.idbController.storeData(data, storeName);
      callback(null, data);
    }).catch(error => {
      console.error(error);
      callback(error, null);
    });
  }
  static async setFavoriteRestaurant (id, isFavorite) {
    const storeName = 'restaurants';
    const url = DBHelper.DATABASE_URL + '/restaurants/' + id + '/?is_favorite=' + isFavorite;
    fetch(url, {
      method: 'put',
      headers: new Headers({
        'Accept': 'application/JSON'
      }),
    }).then(response => {
      if(response.status === 200) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    }).then(data => {
      self.idbController.storeData(data, storeName);
    }).catch(error => {
      console.error(error);
    });
  }
  // Fetch a restaurant by its ID.
  static async fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    await DBHelper.fetchRestaurants((error, restaurant) => {
      if (error) {
        callback(error, null);
      } else {
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }, id);
  }

  // Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  static async fetchRestaurantByFilters(cuisine, neighborhood, isFavorite, callback) {
    // Fetch all restaurants
    await DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        callback(null, results);
      }
    }, null, isFavorite);
  }

  // Fetch all neighborhoods with proper error handling.
  static async fetchNeighborhoods(callback) {
    // Fetch all restaurants
    await DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  // Fetch all cuisines with proper error handling.
  static async fetchCuisines(callback) {
    // Fetch all restaurants
    await DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  }

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  // Restaurant image URL.
  static imageUrlForRestaurant(restaurant, deliverThumbnail = false) {
    const photoId = restaurant.photograph || restaurant.id;
    if(deliverThumbnail) return `./img/thumbnails/${photoId}.jpg`;
    return `./img/${photoId}.jpg`;
  }

  // Map marker for a restaurant.
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

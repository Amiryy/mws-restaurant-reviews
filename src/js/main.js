let restaurants,
  neighborhoods,
  cuisines,
  bLazy;
 self.map = undefined;
 self.markers = [];
 let lazyLoaded = false;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  bLazy = new Blazy({
    selector: '.b-lazy',
    success: lazyLoadSuccessFul
  });
  setTimeout(() => revalidateBlazy(bLazy), 500);
  fetchNeighborhoods();
  fetchCuisines();
});

function revalidateBlazy(bLazy) {
  bLazy.revalidate();
}

function lazyLoadSuccessFul(element) {
  setTimeout(function(){
    lazyLoaded = true;
    const parent = element.parentNode;
    parent.className = parent.className.replace('loading', '');
    element.className = element.className.replace('loading', '');
  }, 200);
}
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood, i) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('aria-label', neighborhood);
    option.setAttribute('aria-posinset', i + 1);
    option.setAttribute('aria-setsize', neighborhoods.length);
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine, i)=> {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  const mapContainer = document.getElementById('map-container');
  const map = document.getElementById('map');
  const mapCover = new MapCover(mapContainer, map, addMarkersToMap);
  mapCover.coverMap();
  updateRestaurants();
};
toggleFavorites = () => {
  const fToggle = document.getElementById('favorites-toggle-heart');
  const isFavsChecked = fToggle.getAttribute('aria-checked') === 'true';
  fToggle.setAttribute('aria-checked', "" + !isFavsChecked);
  updateRestaurants(!isFavsChecked);
};
/**
 * Update page and map for current restaurants.
 */
updateRestaurants = (isFavsChecked = false) => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByFilters(cuisine, neighborhood, isFavsChecked, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const image = document.createElement('img');
  const imageContainer = document.createElement('div');
  const imageURL = DBHelper.imageUrlForRestaurant(restaurant, true);
  imageContainer.setAttribute('class', 'container loading');
  image.className = 'restaurant-img';
  if(lazyLoaded) {
    image.src = imageURL;
    image.onload = () => lazyLoadSuccessFul(image)
  } else {
    image.setAttribute('class', 'b-lazy loading');
    image.setAttribute('data-src', imageURL);
  }
  image.setAttribute('alt', `image of ${restaurant.name}`);
  imageContainer.append(image);
  li.append(imageContainer);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `view details about ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
};

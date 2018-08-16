let restaurant, map, reviews = [];
let isReviewFormOpen;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = async () => {
  await fetchRestaurantFromURL((error) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      const mapContainer = document.getElementById('map-container');
      const map = document.getElementById('map');
      const mapCover = new MapCover(
        mapContainer,
        map,
        () => DBHelper.mapMarkerForRestaurant(self.restaurant, self.map)
      );
      mapCover.coverMap();
      fillBreadcrumb();
      createFormToggle();
    }
  });
};

window.addEventListener('online', async e => {
  await syncFavoriteSettings();
  await handleAwaitingReviews();
  localStorage.setItem(FAVORITE_STATE_STORAGE, '[]');
  localStorage.setItem(AWAITING_REVIEWS_STORAGE, '[]');
});
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async (callback) => {
  if (self.restaurant && self.reviews) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    await updateRestaurant(id);
    await updateReviews(id, callback);

    await syncFavoriteSettings();
    await handleAwaitingReviews()
  }
};
updateRestaurant = async (id, callback = () => null) => {
  await DBHelper.fetchRestaurantById(id, (error, restaurant) => {
    self.restaurant = restaurant;
    if (!restaurant) {
      console.error(error);
      return;
    }
    fillRestaurantHTML();
    callback(null)
  });
};
syncFavoriteSettings = async () => {
  const states = JSON.parse(localStorage.getItem(FAVORITE_STATE_STORAGE));
  if(Array.isArray(states)) {
    for (const data of states) {
      const { restaurantId, isFavorite } = JSON.parse(data);
      await DBHelper.setFavoriteRestaurant(restaurantId, isFavorite);
      if(restaurantId === self.restaurant.id) {
        self.restaurant.is_favorite = isFavorite;
      }
    }
    if(states.length) fillRestaurantHTML();
  }
};
handleAwaitingReviews = async () => {
  const awaitingReviews = JSON.parse(localStorage.getItem(AWAITING_REVIEWS_STORAGE));
  if(Array.isArray(awaitingReviews)) {
    for (const review of awaitingReviews) {
      const parsedReview = JSON.parse(review);
      await DBHelper.postReview(parsedReview, postReviewCallback);
    }
  }
};
postReviewCallback = async (error, data) => {
  if(error) {
    console.error(error);
  } else {
    await updateReviews();
    document.getElementById('dropdown-form').reset();
    setRestaurantRating();
  }
};
updateReviews = async (id = self.restaurant.id, callback = () => null) => {
  await DBHelper.fetchReviews(id, (error, reviews) => {
    self.reviews = reviews;
    const storedReviews = JSON.parse(localStorage.getItem(AWAITING_REVIEWS_STORAGE));
    if(Array.isArray(storedReviews)) {
      storedReviews.forEach(review => {
        const {restaurant_id, name, rating, comments} = JSON.parse(review);
        self.reviews.push({ restaurant_id, name, rating, comments, isPending: true})
      })
    }
    if (!reviews) {
      console.error(error);
      return;
    }
    fillReviewsHTML();
    callback(null)
  });
};
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const heart = document.getElementById('favorite-toggle-heart');
  heart.setAttribute('aria-checked', '' + restaurant.is_favorite);
  heart.addEventListener('click', toggleFavorite);
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.onerror = () => image.src = DBHelper.imageUrlForRestaurant(restaurant, true);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', `image of ${restaurant.name}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

toggleFavorite = async (e) => {
  const isChecked = e.target.getAttribute('aria-checked') === 'true';
  e.target.setAttribute('aria-checked', "" + !isChecked);
  if(!navigator.onLine) {
    await DBHelper.storeFavoriteState(self.restaurant.id, !isChecked);
  } else {
    await DBHelper.setFavoriteRestaurant(self.restaurant.id, !isChecked);
  }
};
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('hours-table');
  hours.innerHTML = '';
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('class', 'day-cell');
    row.appendChild(day);

    const time = document.createElement('td');
    operatingHours[key].split(', ').forEach(part => {
      const hoursPart = document.createElement('span');
      hoursPart.innerHTML = part;
      time.appendChild(hoursPart);
    });
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  container.innerHTML = '';
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  title.innerText += ` (${reviews.length})`;

  const ul = document.createElement('ul');
  ul.setAttribute('id', 'reviews-list');
  reviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = `from ${review.name}`;
  li.appendChild(name);

  if(review.isPending){
    const pendingLabel = document.createElement('p');
    pendingLabel.setAttribute('class', 'pending-label');
    pendingLabel.innerHTML = 'Review is pending, awaiting connection';
    li.appendChild(pendingLabel);
  } else {
    const date = document.createElement('p');
    let dateValue = formatDate(new Date(review.createdAt));
    date.innerHTML = `on ${dateValue}`;
    li.appendChild(date);
  }

  const rating = document.createElement('p');
  for (let i = 1; i <= 5; i++) {
    let star = document.createElement('span');
    if(i <= review.rating){
      //Convert rating to stars
      star.innerHTML = '&#9733';
      star.style.color = '#FFD200';
      star.style.textShadow = '1px 1px #7a7a7a';
    } else {
      star.innerHTML = '&#9734';
    }
    rating.appendChild(star);
    rating.setAttribute('aria-label', `rated ${review.rating} of 5`);
  }
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};
handleReviewForm = async e => {
  const name = document.getElementById('user-name').value;
  const rating = document.getElementById('rating-select').value;
  const comments = document.getElementById('user-comment').value;
  const restaurant_id = self.restaurant.id;
  if(name !== '' && comments !== '') {
    e.preventDefault();
    const reviewData = {restaurant_id, name, rating, comments};
    if(!navigator.onLine) {
      await postponeReviewPost(reviewData);
    } else {
      await DBHelper.postReview(reviewData, postReviewCallback)
    }
  }
};

postponeReviewPost = async ({restaurant_id, name, rating, comments}, callback) => {
  document.getElementById('dropdown-form').reset();
  setRestaurantRating();
  self.reviews.push({restaurant_id, name, rating, comments, isPending: true});
  fillReviewsHTML();
  await DBHelper.storeReviewsInStorage({restaurant_id, name, rating, comments}, callback);
};

setRestaurantRating = () => {
  const starsContainer = document.getElementById('stars-container');
  const ratingSelector = document.getElementById('rating-select');
  const currentUserRating = Number(ratingSelector.value);
  const MAX_RATING = 5;
  starsContainer.innerHTML = '';
  for(let i = 1; i <= MAX_RATING; i++) {
    const star = document.createElement('span');
    if(i <= currentUserRating) {
      star.innerHTML = '&#9733';
      star.style.color = '#FFD200';
      star.style.textShadow = '1px 1px #7a7a7a';
    } else {
      star.innerHTML = '&#9734';
    }
    starsContainer.appendChild(star);
  }
};
createFormToggle = () => {
  const header = document.getElementById('form-header');
  const toggleButton = document.createElement('button');
  const dropdownForm = document.getElementById('dropdown-form');
  const sendButton = document.getElementById('review-submit');
  sendButton.addEventListener('click', handleReviewForm);
  setRestaurantRating();
  dropdownForm.style.display = 'flex';
  const formRealHeight = dropdownForm.getBoundingClientRect().height;
  dropdownForm.style.height = '0';
  const animator = new Animator(dropdownForm);
  isReviewFormOpen = false;
  toggleButton.setAttribute('id', 'toggle-arrow');
  toggleButton.innerHTML = '&#x25BC';
  header.appendChild(toggleButton);
  header.addEventListener('click', () => toggleForm(formRealHeight + 40, animator))
};
toggleForm = (formRealHeight = 500, animator) => {
  const toggleButton = document.getElementById('toggle-arrow');
  const toggleClass = toggleButton.getAttribute('class');
  const dropdownForm = document.getElementById('dropdown-form');
  const toggleButtonRotation = toggleClass === 'rotated' ? '' : 'rotated';
  dropdownForm.style.padding = isReviewFormOpen ? '0' : '40px';
  dropdownForm.style.opacity = isReviewFormOpen ? '0' : '1';
  animator.toggleDropdown(0, formRealHeight, 100, isReviewFormOpen);
  toggleButton.setAttribute('class', toggleButtonRotation);
  isReviewFormOpen = !isReviewFormOpen;
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.getElementById('restaurant-name-breadcrumb');
  li.innerHTML = restaurant && restaurant.name || 'Restaurant information';
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

formatDate = (date) => {
  const FULL_YEAR = date.getUTCFullYear();
  const MONTH = ("0" + (date.getUTCMonth() + 1)).slice(-2);
  const DAY = ("0" + date.getUTCDate()).slice(-2);
  const HOURS = ("0" + date.getUTCHours()).slice(-2);
  const MINUTES = ("0" + date.getUTCMinutes()).slice(-2);
  return `${MONTH}/${DAY}/${FULL_YEAR} at ${HOURS}:${MINUTES}`;
};


let restaurant, map, reviews;
let isReviewFormOpen;
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error) => {
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
    }
  });
};

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
    await DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null)
    });
    await DBHelper.fetchReviews(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', `image of ${restaurant.name}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
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
  createFormToggle();
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
  const ul = document.createElement('ul');
  ul.setAttribute('id', 'reviews-list');
  reviews.forEach(review => {
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

  const date = document.createElement('p');
  const dateValue = formatDate(new Date(review.createdAt));
  date.innerHTML = `on ${dateValue}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  for (let i = 1; i < 6; i++) {
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
createFormToggle = () => {
  const header = document.getElementById('form-header');
  const toggleButton = document.createElement('button');
  const dropdownForm = document.getElementById('dropdown-form');
  dropdownForm.style.display = 'flex';
  const formRealHeight = dropdownForm.getBoundingClientRect().height;
  dropdownForm.style.height = 0;
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
  const toggleButtonRotation = toggleClass === 'rotated' ? '' : 'rotated';
  animator.toggleDropdown(0, formRealHeight, 100, isReviewFormOpen);
  toggleButton.setAttribute('class', toggleButtonRotation);
  isReviewFormOpen = !isReviewFormOpen;
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.getElementById('restaurant-name-breadcrumb');
  li.innerHTML = restaurant.name;
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

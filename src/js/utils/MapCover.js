class MapCover {
  constructor(container, map, addMarkersCallback = () => null) {
    this.container = container;
    this.map = map;
    this.addMarkers = addMarkersCallback;
  }
  coverMap() {
    const cover = document.createElement('div');
    const unCoverButton = document.createElement('button');
    unCoverButton.onclick = () => this.uncoverMap();
    unCoverButton.innerText = 'View Map';
    unCoverButton.className = 'un-cover-button';
    this.container.className = this.container.className + ' covered';
    this.map.className = this.map.className + ' covered';
    cover.className = 'map-cover';
    cover.appendChild(unCoverButton);
    this.container.appendChild(cover);
  }
  uncoverMap() {
    this.map.className = this.map.className.replace('covered', '');
    this.container.className = this.container.className.replace('covered', '');
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    self.map = new google.maps.Map(this.map, {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    this.addMarkers();
  }
}
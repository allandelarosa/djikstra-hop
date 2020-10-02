let service;
let location_data;

function initMap() {
  // Create the map.
  const pyrmont = { lat: -33.866, lng: 151.196 };
  const map = new google.maps.Map(document.getElementById("map"), {
    center: pyrmont,
    zoom: 17,
  });
  // Create the places service.
  service = new google.maps.places.PlacesService(map);
  let getNextPage;
  const moreButton = document.getElementById("more");

  moreButton.onclick = function () {
    moreButton.disabled = true;

    if (getNextPage) {
      getNextPage();
    }
  };
  // Perform a nearby search.
  service.nearbySearch(
    { location: pyrmont, radius: 500, type: "store" },
    (results, status, pagination) => {
      if (status !== "OK") return;
      console.log(results);
      createMarkers(results, map);
      location_data = []
      for (let data of results){
        location_data.push({"name": data.name, "lat": data.geometry.location.lat(), "lng": data.geometry.location.lng()})
      }
      moreButton.disabled = !pagination.hasNextPage;
      console.log(location_data)
      let options = {
          MAX_DISTANCE: 4
        }

        let instance = new DjikstraHop(0, 0, options, location_data)
        let answer = instance.solve()
        console.log(answer)
        for(let point of answer.path){
          let marker = new google.maps.Marker({
            map: map,
            position: point
          });
        } 
        let flightPlanCoordinates = answer.path
        let flightPath = new google.maps.Polyline({
          path: flightPlanCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });

        flightPath.setMap(map)
      if (pagination.hasNextPage) {
        getNextPage = pagination.nextPage;
      }
    }
  );
}

function createMarkers(places, map) {
  const bounds = new google.maps.LatLngBounds();
  const placesList = document.getElementById("places");

  for (let i = 0, place; (place = places[i]); i++) {
    const image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25),
    };
    new google.maps.Marker({
      map,
      icon: image,
      title: place.name,
      position: place.geometry.location,
    });
    let request = {
    placeId: place.place_id,
    fields: ['name', 'formatted_address', 'geometry', 'rating',
        'website', 'photos']
    };

    /* Only fetch the details of a place when the user clicks on a marker.
    * If we fetch the details for all place results as soon as we get
    * the search response, we will hit API rate limits. */
    service.getDetails(request, (placeResult, status) => {
      const li = document.createElement("li");
      if (placeResult) {
    li.innerHTML = '<div><strong>' + placeResult.name +
            '</strong><br>' + 'Rating: ' + placeResult.rating + '<br>' + placeResult.formatted_address + '</div>';
      } else {
        li.innerHTML = ""
      }
    if (placeResult.photos != null) {
    let firstPhoto = placeResult.photos[0];
    let photo = document.createElement('img');
    photo.classList.add('hero');
    photo.src = firstPhoto.getUrl();
    li.appendChild(photo);
}
    placesList.appendChild(li);
    });
    
    bounds.extend(place.geometry.location);
  }
  map.fitBounds(bounds);
}

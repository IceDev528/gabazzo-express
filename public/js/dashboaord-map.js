var user = <%= JSON.stringify(user) %>;

		mapboxgl.accessToken = 'pk.eyJ1IjoiZWpzdHlseiIsImEiOiJjazJuZjBoNWIwcG84M2J4NW5icHVsYWJ2In0.NADiMyMrSjAnQNuNn_XgCA';

		var map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			center:  user.coordinates,
			zoom: 4
		});

		// code from the next step will go here!

		// add markers to map


		// create a HTML element for each feature
		var el = document.createElement('div');
		el.className = 'marker';

		// make a marker for each feature and add to the map
		new mapboxgl.Marker(el)
			.setLngLat([<%- user.coordinates %>])
			.setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
				.setHTML('<h3>' + "<%= user.title %>" + '</h3><p>' + "<%= user.about %>" + '</p>'))
			.addTo(map);
		map.addControl(new mapboxgl.NavigationControl());
		map.addControl(new mapboxgl.FullscreenControl());

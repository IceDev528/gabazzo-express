function initMap() {

    var emailString = '<ul class="footer_buttons"><li><a class="btn btn-gbz-success" href="#findMessageSeller" data-toggle="modal">Message</a></li><li><a class="btn btn-gbz-success" href="../members/company-profile.html">View More</a></li></ul>';

    var locations = [

        { hovertitle: 'A & M Fencing Corp', logo: '<img src="../images/company-profile-pic/a_and_m_fence_corp.png" alt="" />', title: 'A & M Fencing Corp', latlng: { lat: 42.1335382, lng: -88.00640591 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 3114 S. 61st Ave 60804</h6>' },

        { hovertitle: 'Osceola Fence', logo: '<img src="../images/company-profile-pic/osceola-fence-corporation.png" alt="" />', title: 'Osceola Fence', latlng: { lat: 41.918751, lng: -87.7278747 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 3939 W. Dickens Ave. 60647</h6>', addresss: '<h6 class="address_text mb-0"><b>Monir Hossain:</b> 3114 S. 61st Ave 60804</h6>' },

        { hovertitle: 'Sandoval Fences Corp', logo: '<img src="../images/company-profile-pic/sandoval-fences-corp.png" alt="" />', title: 'Sandoval Fences Corp', latlng: { lat: 41.896591, lng: -87.7476872 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 855 N. Cicero Ave 60651</h6>', addresss: '<h6 class="address_text mb-0"><b>Monir Hossain:</b> 3114 S. 61st Ave 60804</h6>' },

        { hovertitle: 'Suburban Fence Inc', logo: '<img src="../images/company-profile-pic/suburban-fence.jpg" alt="" />', title: 'Suburban Fence Inc', latlng: { lat: 41.8352897, lng: -87.7702966 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 5757 W Ogden Ave Ste 1 60804</h6>', addresss: '<h6 class="address_text mb-0"><b>Monir Hossain:</b> 3114 S. 61st Ave 60804</h6>' },

        { hovertitle: 'Top Line Fence', logo: '<img src="../images/company-profile-pic/top-line-fence.jpg" alt="" />', title: 'Top Line Fence', latlng: { lat: 41.9198805, lng: -87.7486237 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 2130 N Cicero Ave, 60639</h6>', addresss: '<h6 class="address_text mb-0"><b>Monir Hossain:</b> 3114 S. 61st Ave 60804</h6>' },

    ];
    var mapCenter = { lat: 41.8339042, lng: -88.0121586 };

    var map = new google.maps.Map(document.getElementById('services-page-large-map'), {
        zoom: 10,
        center: mapCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles:
            [
                {
                    "featureType": "water",
                    "stylers": [
                        {
                            "saturation": 43
                        },
                        {
                            "lightness": -11
                        },
                        {
                            "hue": "#0088ff"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "hue": "#ff0000"
                        },
                        {
                            "saturation": -100
                        },
                        {
                            "lightness": 99
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#808080"
                        },
                        {
                            "lightness": 54
                        }
                    ]
                },
                {
                    "featureType": "landscape.man_made",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ece2d9"
                        }
                    ]
                },
                {
                    "featureType": "poi.park",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ccdca1"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "color": "#767676"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "landscape.natural",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#b8cb93"
                        }
                    ]
                },
                {
                    "featureType": "poi.park",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.sports_complex",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.medical",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.business",
                    "stylers": [
                        {
                            "visibility": "simplified"
                        }
                    ]
                }
            ]
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i, contentString;

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: locations[i].latlng,
            map: map,
            title: locations[i].hovertitle,
        });

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                contentString =
                    '<div id="mapInfoBoxContent">' +
                    '<div id="firstHeading" class="logo_wrapper">' + locations[i].logo + '</div>' +
                    '<h4 class="company_title">' + locations[i].title + '</h4>' +
                    '<div id="bodyContent">' +
                    '<p class="mb-0">' + locations[i].info.replace(/\n/g, "<br />") + '</p>' +
                    '<p>' + locations[i].address + '</p>' +
                    '<p>' + emailString + '</p>' +
                    '</div>' +
                    '</div>';
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }










    //This Map For Mobile View
    var emailString = '<ul class="footer_buttons"><li><a class="btn btn-gbz-success" href="#findMessageSeller" data-toggle="modal">Message</a></li><li><a class="btn btn-gbz-success" href="../members/company-profile.html">View More</a></li></ul>';

    var locations = [

        { hovertitle: 'A & M Fencing Corp', logo: '<img src="../images/company-profile-pic/a_and_m_fence_corp.png" alt="" />', title: 'A & M Fencing Corp', latlng: { lat: 42.1335382, lng: -88.00640591 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 3114 S. 61st Ave 60804</h6>' },

        { hovertitle: 'Osceola Fence', logo: '<img src="../images/company-profile-pic/osceola-fence-corporation.png" alt="" />', title: 'Osceola Fence', latlng: { lat: 41.918751, lng: -87.7278747 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 3939 W. Dickens Ave. 60647</h6>' },

        { hovertitle: 'Sandoval Fences Corp', logo: '<img src="../images/company-profile-pic/sandoval-fences-corp.png" alt="" />', title: 'Sandoval Fences Corp', latlng: { lat: 41.896591, lng: -87.7476872 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 855 N. Cicero Ave 60651</h6>' },

        { hovertitle: 'Suburban Fence Inc', logo: '<img src="../images/company-profile-pic/suburban-fence.jpg" alt="" />', title: 'Suburban Fence Inc', latlng: { lat: 41.8352897, lng: -87.7702966 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 5757 W Ogden Ave Ste 1 60804</h6>' },

        { hovertitle: 'Top Line Fence', logo: '<img src="../images/company-profile-pic/top-line-fence.jpg" alt="" />', title: 'Top Line Fence', latlng: { lat: 41.9198805, lng: -87.7486237 }, info: '<h5 class="review_star"><i class="fa fa-star" aria-hidden="true"></i><span class="star">5.0</span> <span class="amount">(36 Reviews)</span></h5>  <h6 class="hour">8AM - 5PM</h6> ', address: '<h6 class="address_text mb-0"><b>Address:</b> 2130 N Cicero Ave, 60639</h6>' },

    ];
    var mapCenter = { lat: 41.8339042, lng: -88.0121586 };

    var map = new google.maps.Map(document.getElementById('services-page-large-map-mobile'), {
        zoom: 10,
        center: mapCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles:
            [
                {
                    "featureType": "water",
                    "stylers": [
                        {
                            "saturation": 43
                        },
                        {
                            "lightness": -11
                        },
                        {
                            "hue": "#0088ff"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "hue": "#ff0000"
                        },
                        {
                            "saturation": -100
                        },
                        {
                            "lightness": 99
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#808080"
                        },
                        {
                            "lightness": 54
                        }
                    ]
                },
                {
                    "featureType": "landscape.man_made",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ece2d9"
                        }
                    ]
                },
                {
                    "featureType": "poi.park",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ccdca1"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "color": "#767676"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "landscape.natural",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#b8cb93"
                        }
                    ]
                },
                {
                    "featureType": "poi.park",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.sports_complex",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.medical",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "poi.business",
                    "stylers": [
                        {
                            "visibility": "simplified"
                        }
                    ]
                }
            ]
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i, contentString;

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: locations[i].latlng,
            map: map,
        });

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                contentString =
                    '<div id="mapInfoBoxContent">' +
                    '<div id="firstHeading" class="logo_wrapper">' + locations[i].logo + '</div>' +
                    '<h4 class="company_title">' + locations[i].title + '</h4>' +
                    '<div id="bodyContent">' +
                    '<p class="mb-0">' + locations[i].info.replace(/\n/g, "<br />") + '</p>' +
                    '<p>' + locations[i].address + '</p>' +
                    '<p>' + emailString + '</p>' +
                    '</div>' +
                    '</div>';
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }


}
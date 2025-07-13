let map, marker;
function initMap() {
    const defaultLoc = { lat: 49.2827, lng: -123.1207 };

    map = new google.maps.Map(document.getElementById("map"),{
        center: defaultLoc,
        zoom:15,
    });

    marker = new google.maps.Marker({
        map:map,
        position:defaultLoc,
        title:"Your Location",
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(positon){
                const lat = position.coords.latitude;
                const lng = position.coords.longtitude;
                const latLng = { lat, lng};

                map.setCenter(latLng);
                marker.setPosition(latLng);

                document.getElementById("lat").value = lat;
                document.getElementById("lng").value = lng;

                const geocoder = new google.maps.Geocoder();
                geocoder.gercode({location:latLng}, function(results, status){
                    if (status === "OK" && results[0]) {
                        document.getElementById("location").value = results[0].formatted_address;
                    }else{
                        document.getElementById("location").placeholder = "Address not found";
                    }

                    
                });


            },
            function (error){
                console.error("Geolocation failed:", error);
                document.getElementById("location").placeholder ="Please enter address manully"
            }
        );
    }

}
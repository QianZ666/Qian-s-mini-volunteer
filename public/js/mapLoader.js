
let map;
let marker;

// 通用地图初始化函数
function initMap() {
  const defaultLocation = { lat: 49.2827, lng: -123.1207 };
  const mapElement = document.getElementById("map");

  if (!mapElement) {
    console.warn("No map element found, skipping map initialization.");
    return;
  }

  map = new google.maps.Map(mapElement, {
    center: defaultLocation,
    zoom: 13,
  });

  // 判断页面类型（通过 body 或页面中是否存在某些元素）
  if (document.getElementById("location")) {
    // 是 createPost 页面
    initCreatePostMap(map);
  } else {
    // 是主页面
    initMainPageMap(map);
  }
}

// 主页面地图功能
function initMainPageMap(map) {
  // 尝试定位用户
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.setCenter(userLocation);
        new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "You are here!",
        });
      },
      () => handleLocationError(true, map.getCenter())
    );
  } else {
    handleLocationError(false, map.getCenter());
  }

  // 加载帖子
  fetch('/api/posts')
    .then(res => res.json())
    .then(posts => {
      posts.forEach(post => {
        console.log('Posts form backend:', posts);
        const marker = new google.maps.Marker({
          position: post.coords,
          map: map,
          title: post.title,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div>
              <h3>${post.title}</h3>
              <p><strong>location:</strong> ${post.location}</p>
              <p>${post.description}</p>
              <p><a href="/post/${post._id}">Check Detailed Info</a></p>
            </div>
          `
        });

        marker.addListener('click', () => infoWindow.open(map, marker));
      });
    })
    .catch(err => console.error('Failed to load posts:', err));
}

// createPost 页面地图功能
function initCreatePostMap(map) {
  marker = new google.maps.Marker({
    map: map,
    position: map.getCenter(),
    title: "Your Location",
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latLng = { lat, lng };

        map.setCenter(latLng);
        marker.setPosition(latLng);

        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;

        fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
          .then(res => res.json())
          .then(data => {
            if (data.results && data.results[0]) {
              document.getElementById("location").value = data.results[0].formatted_address;
            } else {
              document.getElementById("location").placeholder = "Address not found";
            }
          })
          .catch(err => {
            console.error("Reverse geocoding failed:", err);
            document.getElementById("location").placeholder = "Enter manually";
          });
      },
      function (error) {
        console.error("Geolocation failed:", error);
        document.getElementById("location").placeholder = "Please enter address manually";
      }
    );
  }
}

// 地图定位失败提示
function handleLocationError(browserHasGeolocation, pos) {
  new google.maps.InfoWindow({
    content: browserHasGeolocation
      ? "Geolocation failed. Showing default location (Vancouver)."
      : "Your browser doesn't support geolocation.",
    position: pos,
  }).open(map);
}

// 把 initMap 挂到 window，供 Google Maps 调用
window.initMap = initMap;

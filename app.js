if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service_worker.js")
            .then(reg => console.log("Message received successfully.", reg))
            .catch(err => console.log("Message couldn't be received.", err));
    });
}

const map = L.map('map').setView([50.0647, 19.9450], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let savedMessages = JSON.parse(localStorage.getItem("receivedMessages")) || [];

function renderMessages() {
    savedMessages.forEach(message => {
        const marker = L.marker([message.lat, message.lng]).addTo(map);
        marker.bindPopup(`<b>Soapstone Message</b><br>Check the distance to view.`);
    });
}

const urlParams = new URLSearchParams(window.location.search);
const newLat = urlParams.get('lat');
const newLng = urlParams.get('lng');

if (newLat && newLng) {
    const newMessage = { lat: parseFloat(newLat), lng: parseFloat(newLng) };
    if (!savedMessages.some(m => m.lat === newMessage.lat && m.lng === newMessage.lng)) {
        savedMessages.push(newMessage);
        localStorage.setItem("receivedMessages", JSON.stringify(savedMessages));
        alert("A message was placed in your world.");
    }
}

renderMessages();

let userCoords = null;
navigator.geolocation.watchPosition(pos => {
    userCoords = pos.coords;
});

document.getElementById("shareBtn").addEventListener("click", () => {
    if (userCoords && navigator.share) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${userCoords.latitude}&lng=${userCoords.longitude}`;
        navigator.share({
            title: "Soapstone Message",
            text: "Find my message in the world",
            url: shareUrl
        });
    }
});

let pendingCoords = null;

document.getElementById("photoBtn").addEventListener("click", () => {
    if (!userCoords) {
        alert("Missing location permission or there is other issue related to getting your current location");
        return;
    }

    pendingCoords = {
        lat: userCoords.latitude,
        lng: userCoords.longitude
    };

    // alert(`Photo location saved: ${pendingCoords.lat}, ${pendingCoords.lng}`);
    document.getElementById("photoInput").click();
});

document.getElementById("photoInput").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file || !pendingCoords) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const marker = L.marker([pendingCoords.lat, pendingCoords.lng]).addTo(map);

        marker.bindPopup(`
            <div class="photo-popup">
                <img src="${reader.result}">
            </div>
        `, {
            maxWidth: 600,
            closeButton: false
        });

        marker.on("popupopen", () => {
            const popupImage = marker.getPopup().getElement().querySelector(".photo-popup img");

            popupImage.addEventListener("load", () => {
                marker.getPopup().update();
            });
            
            if (popupImage.complete) {
                marker.getPopup().update();
            }

            popupImage.addEventListener("click", () => {
                marker.closePopup();
            });
        });

        marker.openPopup();

        map.setView([pendingCoords.lat, pendingCoords.lng], 16);
        // alert("Photo marker with image added to map.");

        pendingCoords = null;
        event.target.value = "";
    };

    reader.readAsDataURL(file);
});


document.getElementById("audioBtn").addEventListener("click", () => {
    alert("Audio button works.");
    document.getElementById("audioInput").click();
});
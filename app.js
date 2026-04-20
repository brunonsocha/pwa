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
let messageToShare = null;


function normalizeCoord(coord) {
    return Number(coord).toFixed(6);
}

function createLocationId(lat, lng) {
    return `${normalizeCoord(lat)},${normalizeCoord(lng)}`;
}

function saveMessages() {
    localStorage.setItem("receivedMessages", JSON.stringify(savedMessages));
}

function addMessageToStorage(message) {
    if (savedMessages.some(savedMessage => savedMessage.id === message.id)) {
        alert("This pin is already saved.");
        return false;
    }
    savedMessages.push(message);
    saveMessages();
    return true;
}

function addMessageMarker(message) {
    const marker = L.marker([message.lat, message.lng]).addTo(map);

    marker.on("click", () => {
        messageToShare = message;

        if (!message.content) {
            marker.bindPopup("Message location selected.");
            marker.openPopup();
            return;
        }

        const distance = getDistanceToMessage(message);

        if (distance === null || distance > PHOTO_VIEW_DISTANCE_METERS) {
            marker.bindPopup("Move closer to view this photo.");
            marker.openPopup();
            return;
        }

        marker.bindPopup(`
            <div class="photo-popup">
                <img src="${message.content}">
            </div>
        `, {
            maxWidth: 600,
            closeButton: false
        });

        marker.openPopup();

        const popupImage = marker.getPopup().getElement().querySelector(".photo-popup img");

        popupImage.addEventListener("load", () => {
            marker.getPopup().update();
        });

        if (popupImage.complete) {
            marker.getPopup().update();
        }

        marker.getPopup().getElement().addEventListener("click", () => {
            marker.closePopup();
        });
    });

    return marker;
}

function renderMessages() {
    savedMessages.forEach(message => {
        addMessageMarker(message);
    });
}

const urlParams = new URLSearchParams(window.location.search);
const newLat = urlParams.get('lat');
const newLng = urlParams.get('lng');

if (newLat && newLng) {
    const sharedMessage = {
        id: createLocationId(newLat, newLng),
        lat: normalizeCoord(newLat),
        lng: normalizeCoord(newLng),
    };

    if (addMessageToStorage(sharedMessage)) {
        alert("A message was placed in your world.");
    }
}

renderMessages();

/////////////////////////////////////////////////////////////////////////////

document.getElementById("shareBtn").addEventListener("click", () => {
    if (!messageToShare) {
        alert("Select a pin first.");
        return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${messageToShare.lat}&lng=${messageToShare.lng}`;

    if (!navigator.share) {
        alert(shareUrl);
        return;
    }

    navigator.share({
        title: "Soapstone Message",
        text: "Find my message in the world",
        url: shareUrl
    });
});

/////////////////////////////////////////////////////////////////////////////

let userCoords = null;
navigator.geolocation.watchPosition(pos => {
    userCoords = pos.coords;
});

/////////////////////////////////////////////////////////////////////////////

const PHOTO_VIEW_DISTANCE_METERS = 10;

function getDistanceToMessage(message) {
    if (!userCoords) {
        return null;
    }

    return map.distance(
        [userCoords.latitude, userCoords.longitude],
        [message.lat, message.lng]
    );
}

/////////////////////////////////////////////////////////////////////////////

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
        const newMessage = {
            id: createLocationId(pendingCoords.lat, pendingCoords.lng),
            lat: normalizeCoord(pendingCoords.lat),
            lng: normalizeCoord(pendingCoords.lng),
            content: reader.result
        };

        if (!addMessageToStorage(newMessage)) {
            pendingCoords = null;
            event.target.value = "";
            return;
        }

        const marker = addMessageMarker(newMessage);

        messageToShare = newMessage;
        map.setView([newMessage.lat, newMessage.lng], 16);
        marker.fire("click");

        pendingCoords = null;
        event.target.value = "";
    };


    reader.readAsDataURL(file);
});

/////////////////////////////////////////////////////////////////////////////

// document.getElementById("audioBtn").addEventListener("click", () => {
//     alert("Audio button works.");
//     document.getElementById("audioInput").click();
// });

/////////////////////////////////////////////////////////////////////////////

const SOS_VIBRATION_PATTERN = [
    150, 100, 150, 100, 150,
    100,
    500, 100, 500, 100, 500,
    100,
    150, 100, 150, 100, 150
];

document.getElementById("SOSBtn").addEventListener("click", () => {
    if (!("vibrate" in navigator)) {
        alert("This feature (vibration) is not supported in this browser or device.");
        return;
    }

    navigator.vibrate(SOS_VIBRATION_PATTERN);
});

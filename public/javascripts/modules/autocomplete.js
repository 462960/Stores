function autocomplete(input, latInput, lngInput){
if(!input) return; // Skip this fn from running if there is no input
const dropdown = new google.maps.places.Autocomplete(input);
dropdown.addListener('place_changed', () => {
	const place = dropdown.getPlace();
	console.log(place);
	latInput.value = place.geometry.location.lat();
	lngInput.value = place.geometry.location.lng();
	// If someone hits Enter, nothing happens
	input.on('keydown', (e) => {
		if(e.keyCode == 13) e.preventDefault();
	})
})
}

export default autocomplete;



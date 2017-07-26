const axios = require('axios');
const dompurify = require('dompurify');

function searchResultsHTML(search){
  return search.map(store => {
  	return `
  	<a href="/store/${store.slug}" class="search__result">
     <strong>${store.name}</strong>
  	</a>      
  	`;
  }).join('');
};


function typeAhead(search) {
if(!search) return;
const searchInput = search.querySelector('input[name="search"]');
const searchResults = search.querySelector('.search__results');
searchInput.on('input', function(){
	// If there is no value, quit it
	if(!this.value){
		searchResults.style.display = 'none';
		return; // stop!
	};
	// If there is value, display it
	searchResults.style.display = 'block';
	searchResults.innerHTML = '';
	axios
	.get(`/api/search/?q=${this.value}`)
	.then(res => {
		if(res.data.length){
			const html = dompurify.sanitize(searchResultsHTML(res.data));
			searchResults.innerHTML = html;
			return;
		}
		// Say something if there is no result
		searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">Nothing for ${this.value} found</div>`)
	})
	.catch(err => {
		console.error(err);
	});
});

searchInput.on('keyup', (e) => {
if(![38,40,13].includes(e.keyCode)) return;
const activeClass = 'search__result--active';
const current = search.querySelector(`.${activeClass}`);
const items = search.querySelectorAll('.search__result');
let next;

if(e.keyCode === 40 && current){
	next = current.nextElementSibling || items[0];
} else if (e.keyCode === 40){
	next = items[0];
} else if (e.keyCode === 38 && current) {
	next = current.previousElementSibling || items[items.length - 1];
} else if (e.keyCode === 38) {
	next = items[items.length - 1];
} else if (e.keyCode === 13 && current.href) {
	window.location = current.href;
	return;
}
console.log(next);
if(current){
	current.classList.remove(activeClass);
}
next.classList.add(activeClass);
});

};

export default typeAhead;
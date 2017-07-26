const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next){
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto){
			next(null, true);
		} else {
			next({message: 'This file type isn\'t allowed!'}, false);
		}
	}
}

exports.homePage = (req,res) => {
	res.render('index');
};

exports.addStore = (req,res) => {
	res.render('editStore', {title: 'add store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
	// Check if there is no file to resize
	if(!req.file){
		next(); // Skip to the next middleware
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// Now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// Once we have written photo to file system, keep going
	next();
}

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
	const store = await (new Store(req.body)).save();
	req.flash('success', `Store ${store.name} successfully created!`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStore = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 3;                      // Limits stores displayed per page
	const skip = (page * limit) - limit;
	// 1. Query our DB for the list of all stores
	const storesPromise = Store                   // .find() and .findOne() are MongoDB methods
	.find().populate('reviews')
	.skip(skip)                                   // .skip() and .limit() are MongoDB methods
	.limit(limit)
	.sort({created: 'desc'});

	const countPromise = Store.count();          // .count()  MongoDB method

	const [stores, count] = await Promise.all([storesPromise, countPromise]);
	const pages = Math.ceil(count / limit);
	if(!stores.length && skip){
		req.flash('info', `You asked for page ${page} which does not exist. So, you are redirected to ${pages}`);
		res.redirect(`/stores/page/${pages}`);
		return;
	};
	res.render('stores', {title: 'Stores', stores, pages, page, count});
};

const confirmOwner = ( store, user) => {
	if(!store.author.equals(user._id)){
		throw Error('You must own the store to edit it');
		//req.flash('error', 'You must own the store to edit it');
	}
};

exports.editStore = async (req, res) => {
// 1. Find the store given ID
const store = await Store.findOne({_id: req.params.id});
// 2 Confirm the owner of the store 
confirmOwner(store, req.user);
// 3. Render out edit form to update store
res.render('editStore', {title: `Edit ${store.name}`, store} )
};

exports.updateStore = async (req, res) => {
	// Set the location data to be a point
	req.body.location.type = 'Point';
	//  Find and update store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
    	new: true,          // Returns a new store instead of old one
    	runValidators: true // Enforces validator 
    }).exec();
    req.flash('success', `The store ${store.name} successfully updated <a href="/stores/${store.slug}">Visit store </a>`)
	// 2. Redirect to store
	res.redirect(`/stores/${store._id}/edit`);	
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');
  if(!store) return	next();
  res.render('store', {store, title: store.name}); 
};

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag;
	const tagQuery = tag || {$exists: true};
	const tagsPromise = Store.getTagsList();
	const storePromise = Store.find({tags: tagQuery}).populate('reviews');
	const [tags, stores] = await Promise.all([tagsPromise, storePromise]);
	//res.json(result);	
	res.render('tag', {tags, title: 'Tags', tag, stores})
};

exports.searchStores = async (req, res) => {
 const stores = await Store
 // First find store that match
 .find({
 	$text: {
 		$search: req.query.q
 	}
 }, {
 	score: {$meta: 'textScore'}
 })
 // Then sort them
 .sort({
 	score: {$meta: 'textScore'}
 })
 // Limit to only 5 results
 .limit(5);
res.json(stores);
};

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
    	location: {
    		$near: {
    			$geometry: {
    				type: 'Point',
    				coordinates
    			},
    			$maxDistance: 10000 // 10km
    		}
    	}
    };
	const stores = await Store.find(q).select('slug name description location photo').limit(10);
   res.json(stores);
};

exports.mapPage = (req, res) => {
	res.render('map', {title: 'map'});
}

exports.heartStore = async (req, res) => {
 const hearts = req.user.hearts.map(obj => obj.toString());
 const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
 const user = await User
              .findByIdAndUpdate(req.user._id,
              	{[operator]: {hearts: req.params.id}},
              	{new: true}
              	);
 res.json(user);
};

exports.heartedStores = async (req, res) => {
	const storesHearted = await Store.find(
		{_id: {$in: req.user.hearts} });
  res.render('hearted', {title: 'Hearted stores', storesHearted});
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    //res.json(stores);
    res.render('topStores', {stores, title: 'Top stores!'});
};

exports.githubRedirect = (req, res) => {
	res.redirect('http://calendar.skepton.ru/');
};






const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
      type: String,
      trim: true,
      required: 'Please, enter the store name'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
             type: Number,
             required: 'You must supply coordinates'
		}],
		address: {
			type: String,
			required: 'You must supply address'
		}
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an author'
	}
}, {
	toJSON: {virtuals: true},
	toObject: {virtuals: true}
});

// Define our indexes
storeSchema.index({
	name: 'text',
	description: 'text'
});

storeSchema.index({
	location: '2dsphere'
});

storeSchema.pre('save', async function(next){
	if(!this.isModified('name')){
		next(); // skip it
		return; // stop the function
	}

	this.slug = slug(this.name);
	// Find another store with the same name
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({slug: slugRegEx});
	if(storesWithSlug.length){
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
});

storeSchema.statics.getTagsList = function(){
	return this.aggregate([
		{$unwind: '$tags'},
		{ $group: {_id: '$tags', count: {$sum: 1} }},
		{$sort: {count: -1}}
		]);
	};

	storeSchema.statics.getTopStores = function(){
		return this.aggregate([
             // Lookup stores and populate their reviews
             {$lookup: {
             	from: 'reviews',
             	localField: '_id',
             	foreignField: 'store',
             	as: 'Cool_reviews'
             }},
             // Filter for only items to have 2 or more reviews
             {$match: {'Cool_reviews.1': {$exists: true}}}, // .1 means "Have the second member of an array"
             // Add the average review field by using $project
             {$project: {
             	photo: '$$ROOT.photo',
             	name: '$$ROOT.name',
             	slug: '$$ROOT.slug',
             	Cool_reviews: '$$ROOT.Cool_reviews',
             	averageRating: {$avg: '$Cool_reviews.rating'}
             }},
             // Sort it by our new field, highest reviews first 
             {$sort: {averageRating: 1}},
             // Limit to at most 10
             {$limit: 10}
			]);
	};

	//find reviews where the stores _id property === reviews store property
	storeSchema.virtual('reviews',{
        ref: 'Review',        // What model to link?
        localField: '_id',    // Which field of the store?
        foreignField: 'store' // Which field on the review?
	});

	// Episode 39, 21:00 explanation why we did auto-populate 
	
	/*storeSchema.pre('find', autopopulate);
	storeSchema.pre('findOne', autopopulate);*/


module.expots = mongoose.model('Store', storeSchema);
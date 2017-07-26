const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
	res.render('login', {title: 'Login Form'});
};

exports.registerForm  = (req, res) => {
	res.render('register', {title: 'Register'});
};

exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply your name').notEmpty();
	req.checkBody('email', 'You must supply valid email, you know!').notEmpty().isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extention: false,
		gmail_remove_subaddress: false
	});
	req.checkBody('password', 'Password can not be blank!').notEmpty();
	req.checkBody('password-confirm', 'Password confirmation can not be blank!').notEmpty();
	req.checkBody('password-confirm', 'Ooops, your password does not match!').equals(req.body.password);

	const errors = req.validationErrors();
	if(errors){
		req.flash('error', errors.map(err => err.msg));
		res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
		return;
	}
	next();
};

exports.register = async (req, res, next) => {
 const user = new User({email: req.body.email, name: req.body.name});
 const register = promisify(User.register, User);
 await register(user, req.body.password);
 next();
};

exports.account = (req, res) => {
	res.render('account', {title: 'Edit your account'});
};

exports.updateAccount = async (req, res) => {
const updates = {
	name: req.body.name,
	email: req.body.email
};

const user = await User.findOneAndUpdate(
      {_id: req.user._id},
      { $set: updates},
      { new: true, runValidators: true, context: 'query'}
	);
req.flash('success', 'Account successfully updated!')
res.redirect('back');
};

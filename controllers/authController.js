const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
       failureRedirect: '/login',
       failureFlash: 'Failed login!',
       successRedirect: '/',
       successFlash: 'You are logged in!'
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You\'ve been logged out');
	res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
	// First check if user is authenticated
	if(req.isAuthenticated()) {
		next();
		return;
	}
	req.flash('error', 'You must be logged in!');
	res.redirect('/login');
};

exports.forgot = async (req, res) => {
// 1. See if the user with that Email exists
const user = await User.findOne({email: req.body.email});
if(!user){
	req.flash('error', 'There is no such a user!');
	return res.redirect('/login');
};
// 2. Set reset token and expiry on their account
user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
user.resetPasswordExpires = Date.now() + 3600000;
await user.save();
// 3. Send them Email with token
const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
await mail.send({
	user,
	subject: 'Password reset form',
	resetURL,
	filename: 'password-reset'
})
req.flash('success', `Your have been emailed a password reset link`);
// 4. Redirect to login page
res.redirect('/login');
};

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {$gt: Date.now()}
	});
	if(!user){
		req.flash('error', 'Token has expired');
		return res.redirect('/login');
	};
	res.render('reset', {title: 'Password reset'});
};

exports.confirmedPasswords = (req, res, next) => {
	// ['confirm-password'] in brackets because of dash
if(req.body.password === req.body['confirm-password']){
	next();
	return;
}
req.flash('error', 'Passwords do not match!');
res.redirect('back');
};

exports.update = async (req, res) => {
   const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {$gt: Date.now()}
	});
   if(!user){
		req.flash('error', 'Token has expired');
		return res.redirect('/login');
	};
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const updatedUser = await user.save();
	await req.login(updatedUser);
	req.flash('success', 'Your pass has been successfully reset! ');
	res.redirect('/');
};








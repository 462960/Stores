const express = require('express');
const router = express.Router();
const app = express();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
//router.get('/', (req, res) => {
  //res.send('Hey! It works cool!');
  //const vlad = {name: 'Vlad', experience: true};
  //res.json(vlad);
//   res.render('hello',{
//   	title: "I like it!"
//   }
//   	);
// });

router.get('/panama/:dod/:blood/:pom', (req,res) => {
	const reverse = [...req.params.dod].reverse().join('');
	res.send(reverse);
})

// Actual routers
router.get('/', catchErrors(storeController.getStore));
router.get('/stores', catchErrors(storeController.getStore));
router.get('/stores/page/:page', catchErrors(storeController.getStore));
router.get('/add',
    authController.isLoggedIn, 
	storeController.addStore);

router.post('/add/:id', 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.updateStore)
	);

router.post('/add', 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.createStore)
	);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. Register user
// 3. Log them in
router.post('/register', 
	userController.validateRegister,
	userController.register,
	authController.login
);

router.get('/logout',authController.logout);
router.get('/account',
    authController.isLoggedIn, 
	userController.account);

router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));

router.post('/account/reset/:token', 
	authController.confirmedPasswords, 
	catchErrors(authController.update)
);

router.get('/map', storeController.mapPage);
router.get('/hearts', 
	authController.isLoggedIn, 
	catchErrors(storeController.heartedStores)
);
router.post('/reviews/:id', 
	authController.isLoggedIn, 
	catchErrors(reviewController.addReview)
);

router.get('/top', storeController.getTopStores);
router.get('/github', storeController.githubRedirect);

/*
API
*/
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));


module.exports = router;


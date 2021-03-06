var express = require('express');
var router = express.Router();
var indico = require('indico.io');
indico.apiKey =  'c1c0c885dc176f7ff49d1bdee14a81e8';



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/tags', function(req, res, next) {

	res.header('Content-Type', 'application/json');

	indico.textTags(req.body.texts)
	  .then(function(data) {
	  	console.log(data);
	  	res.send(data);
	  })
	  .catch(function(err) {
	  	console.log("indico failed: ", err);
	  });

});


router.post('/facial', function(req, res, next) {
	res.header('Content-Type', 'application/json');

	var photos = req.body.photos.map(function(obj) {
		return obj.picture;
	});

	console.log(photos.length);
	indico.fer(photos)
	  .then(function(data){
	  	console.log(data.length);
	  	res.send(data);
	  })
	  .catch(function(err) {
	  	console.log("indico failed: ", err);
	  });
});

router.post('/positivity', function(req, res, next) {
	res.header('Content-Type', 'application/json');

	indico.sentimentHQ(req.body.posts)
	  .then(function(data){
	  	res.send(data);
	  })
	  .catch(function(err) {
	  	console.log("indico failed: ", err);
	  });
});

router.post('/emotion', function(req, res, next) {
	res.header('Content-Type', 'application/json');

	indico.emotion(req.body.posts)
	  .then(function(data){
	  	res.send(data);
	  })
	  .catch(function(err) {
	  	console.log("indico failed: ", err);
	  });
});

router.post('/people', function(req, res, next) {
	res.header('Content-Type', 'application/json');

	indico.people(req.body.posts)
	  console.log(req.body.posts)
	  .then(function(data){
	  	res.send(data);
	  })
	  .catch(function(err) {
	  	console.log("indico failed: ", err);
	  });
});

module.exports = router;

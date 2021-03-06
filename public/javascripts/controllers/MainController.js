
var globaltest=[];
google.load('visualization', '1', {packages:['corechart']});

angular.module('MainController', ['IndicoService']).controller('MainController', ['$scope', '$timeout', '$window', 'IndicoService', function($scope, $timeout, $window, IndicoService) {

	var that = this;

	$window.fbAsyncInit = function() {
		FB.init({
		  appId      : '312149629136084',
		  status	 : true,
		  cookie	 : true,
		  xfbml      : true,
		  version    : 'v2.7'
		});

		FB.Event.subscribe('auth.authResponseChange', that.loginChange);
	};

	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {return;}
		js = d.createElement(s); js.id = id;	
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	this.loginChange = function(res) {
		console.log("login: ", res);
		if(res.status === 'connected') {
			console.log("already logged in");
			$timeout(function(){
				$scope.loggedIn = true;
			});
			that.getUser();
		}
	};

	this.loginFacebook = function() {
		console.log("logging in");
		FB.login(function(response) {
			if(response.status == 'connected') {
				$timeout(function(){
					$scope.loggedIn = true;
				});
				that.getUser();
				console.log("log in successful");
			}
			else {
				console.log("log in failed");
			}
		}, {scope: 'public_profile,user_friends,user_about_me,user_birthday,user_education_history,user_events,user_hometown,user_likes,user_location,user_photos,user_posts,user_relationships,user_relationship_details,user_religion_politics,user_tagged_places,user_videos,user_website,user_work_history'});
	};

	this.logoutFacebook = function(){
 		var cookies = document.cookie.split(";");
	    for (var i = 0; i < cookies.length; i++) {
	    	var cookie = cookies[i];
	    	var eqPos = cookie.indexOf("=");
	    	var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
	    	document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	    }

		FB.logout(function(response){
			console.log(response);

			$timeout(function(){
				$scope.loggedIn = false;
			});
		});
	}


	this.getUser = function() {
		FB.api('/me', function(response) {
			$timeout(function(){
				$scope.user.name = response.name;
				$scope.user.id = response.id;
			});
		});
	};

	this.getPhotos = function() {
		var photoUrls = $scope.photos = [];
		FB.api('/me/photos?type=tagged', function(response) {
			var photos = response.data;
			var facialRecognition = false;
			photos.forEach(function(photo, i) {
				FB.api("/" + photo.id, {fields: "picture,link"}, function (response) {
			    	photoUrls.push({picture: response.picture, link: response.link});

					if(photoUrls.length == photos.length) {
						that.getFacialRecognition(photoUrls);
						that.getPhotoTags(photoUrls);
					}	
				});
			});
		});

	};

	function CountFreq(arr) {
	    var a = [], b = [], prev;

	    arr.sort();
	    for ( var i = 0; i < arr.length; i++ ) {
	        if ( arr[i] !== prev ) {
	            a.push(arr[i]);
	            b.push(1);
	        } else {
	            b[b.length-1]++;
	        }
	        prev = arr[i];
	    }

	    return [a,b];
	}

	this.getPhotoTags = function(photoUrls){
		 IndicoService.getPhotoTags(photoUrls).then(function(res){
		 	var ClarifaiResults = res.data.results;
		 	var ClarifaiArr = [];

		 	for(var i=0; i<ClarifaiResults.length; i++){
		 		ClarifaiArr = ClarifaiArr.concat(ClarifaiResults[i].result.tag.classes);
		 	}

		 	var ClarifaiObj = {};
		 	for(var i = 0; i < ClarifaiArr.length; i++) {
		 		if(!ClarifaiObj[ClarifaiArr[i]]) ClarifaiObj[ClarifaiArr[i]] = 1;
		 		else ClarifaiObj[ClarifaiArr[i]]++;
		 	}

		 	var ClarifaiObjArr = [];
		 	for(var key in ClarifaiObj) {
		 		var obj = {};
		 		obj[key] = ClarifaiObj[key];
		 		ClarifaiObjArr.push(obj);
		 	}

		 	ClarifaiObjArr.sort(function(a, b) {
		 		return b[Object.keys(b)[0]] - a[Object.keys(a)[0]];
		 	});

		 	ClarifaiObjArr = ClarifaiObjArr.slice(0, 20).map(function(obj){
		 		return Object.keys(obj)[0];
		 	});


		 	$timeout(function(){
		 		$scope.imageTags = ClarifaiObjArr;

				$scope.showphotos = true;
		 	});
		 }, function(err){
			console.log(err);
		});
	}



	this.getFacialRecognition = function(photoUrls) {
		console.log(photoUrls.length);
		IndicoService.getPhotos(photoUrls).then(function(res){
			var photoEmotions = res.data;


			var photos = $scope.photos;
			for(var i = 0; i < photos.length; i++) {

				photoEmotions[i]["matchedEmotion"] = Object.keys(photoEmotions[i])[0];
				for(emotion in photoEmotions[i]) {
					if(photoEmotions[i][emotion] > photoEmotions[i][photoEmotions[i].matchedEmotion]) {

						photoEmotions[i].matchedEmotion = emotion;
					}
				}

				if(photoEmotions[i][photoEmotions[i].matchedEmotion] > 0.4){
					photoEmotions[i].url = photos[i].picture;
					photoEmotions[i].link = photos[i].link;
					photoEmotions[i].exists = true;
				}
			};
			$timeout(function(){
				$scope.photoEmotions = photoEmotions;
			});
		}, function(err){
			console.log(err);
		});
	};

	this.getPositivity = function() {
		FB.api('/me/posts?limit=1000', function(response) {
			var posts = response.data.filter(function(post) {
				if(post.message) return true;
				return false;
			}).map(function(post) {
				return post.message;
			});

			IndicoService.getPositivity(posts).then(function(res) {
				var mostIndex = 0;
				var leastIndex = 0;
				var sum = 0;

				for(var i = 1; i < res.data.length; i++) {
					sum += res.data[i];
					if(res.data[i] > res.data[mostIndex]) {
						mostIndex = i;
					}
					if(res.data[i] < res.data[leastIndex]) {
						leastIndex = i;
					}
				}
				$timeout(function(){
					$scope.positivity.most = posts[mostIndex];
					$scope.positivity.least = posts[leastIndex];
					$scope.positivity.average = Math.round(sum/res.data.length * 100);
				});
			}, function(err) {
				console.log(err);
			});
		
		});	
	};

	this.getEmotions= function() {
		FB.api('/me/posts?limit=1000', function(response) {
			var posts = response.data.filter(function(post) {
				if(post.message) return true;
				return false;
			}).map(function(post) {
				return post.message;
			});
			console.log(response);
			IndicoService.getEmotions(posts).then(function(res) {
				var angerIndex = 0;
				var surpriseIndex = 0;
				var sadIndex = 0;
				var fearIndex = 0;
				var joyIndex = 0;

				for(var i = 1; i < res.data.length; i++) {
					if(res.data[i].anger > res.data[angerIndex].anger) {
						angerIndex = i;
					}
					if(res.data[i].surprise > res.data[surpriseIndex].surprise) {
						surpriseIndex = i;
					}
					if(res.data[i].sad > res.data[sadIndex].sad) {
						sadIndex = i;
					}
					if(res.data[i].fear > res.data[fearIndex].fear) {
						fearIndex = i;
					}
					if(res.data[i].joy > res.data[joyIndex].joy) {
						joyIndex = i;
					}
				}
				$timeout(function(){
					$scope.emotion.anger = posts[angerIndex];
					$scope.emotion.surprise = posts[surpriseIndex];
					$scope.emotion.sad = posts[sadIndex];
					$scope.emotion.fear = posts[fearIndex];
					$scope.emotion.joy = posts[joyIndex];
				});
			}, function(err) {
				console.log(err);
			});
		
		});	
	};

	// this.getFeed = function(){
	// 	FB.api('/me/posts?limit=1000', function(response) {
	// 		var posts = response.data.filter(function(post) {
	// 			if(post.message) return true;
	// 			return false;
	// 		}).map(function(post) {
	// 			return post.message;
	// 		});
	// 	});
	// };

	this.getTags = function() {
		FB.api('/me/posts?limit=1000', function(response) {
			var posts = response.data.filter(function(post) {
				if(post.message) return true;
				return false;
			}).map(function(post) {
				return post.message;
			});

			FB.api('/me/likes', function(response) {
				var likes = response.data.map(function(like) {
					return like.name;
				});
				var texts = posts.concat(likes);
				console.log(texts);
				IndicoService.getTags(texts).then(function(res) {
					$timeout(function(){
						var tags = [];

						res.data.forEach(function(obj) {
							for(var category in obj) {
								var tag = {};
								tag[category] = obj[category];
								
								var exists = false;
								tags.forEach(function(tag) {
									if(tag.hasOwnProperty(category)) {
										exists = true;
									}
								});

								if(!exists) {
									tags.push(tag);
								}
								else {
									tags[category] += obj[category];
								}
							}
						});
						tags.sort(function(a, b) {
							return b[Object.keys(b)[0]] - a[Object.keys(a)[0]]; 
						});
						tags = tags.slice(0, 5);
						console.log(tags);

						var options = {
							'title': 'Activities and Interests',
							legend: {position: 'none'},
							'width':500,
							'height':300,
							hAxis:  { textPosition: 'none' }
						};

						var data = new google.visualization.DataTable();
						data.addColumn('string', 'Activity');
						data.addColumn('number', 'Interest');

						for(var j=0; j<5; j++){
							var a = tags[j];
							data.addRow([Object.keys(a)[0], a[Object.keys(a)[0]]]);
						}								     

					    var chart = new google.visualization.BarChart(document.getElementById('InterestsChart'));

					     chart.draw(data,options);
					});
				}, function(err) {
					console.log(err);
				});
			});

		
		});	

	};

	this.getPopularity = function(){

		function doasync (data1, fn){
			fn(data1);
		}

		console.log($scope.user.id +'/albums');
		FB.api('/me/albums', {fields: ['id', 'type'], limit: 500}, function(response) {
			if (response && !response.error) {
				var albumid;
		        console.log(response);
				for(var i=0; i<response.data.length; i++){
					if (response.data[i].type == "profile"){
						albumid = response.data[i].id;
						break;
					}
				}

				FB.api("/"+albumid+"/photos", {fields: ['id', 'created_time', 'source'], limit:5000}, function(response2){
					if(response2 && !response2.error){
						var profileinfo = response2.data;
						var profilearr=[];
						var datesCreated = [];
						var likes = [];

						for(var i=0; i<profileinfo.length; i++){

							datesCreated[i]=profileinfo[i].created_time;

							profilearr[datesCreated[i]]=profileinfo[i].id;

							doasync(i, function(key){
								FB.api("/"+profileinfo[key].id+"/likes", {limit:500}, function(response3){

									likes[key] = response3.data.length;


									var options = {
										'title': 'Popularity over time',
										legend: {position: 'none'},
										'width':500,
										'height':300,
										vAxis:  { textPosition: 'none' }
									};

									var data = new google.visualization.DataTable();
									data.addColumn('date', 'date');
      								data.addColumn('number', 'popularity');

									for(var j=0; j<profileinfo.length; j++){

										data.addRow([new Date(datesCreated[j]), likes[j]]);
									}								     

								    var chart = new google.visualization.LineChart(document.getElementById('chartdiv'));

								    chart.draw(data,options);
								    
								});
							});					

							// profilearr.datesCreated[i]=profileinfo[i].id;

							// console.log("all data: " + profilearr);
							
						}

							console.log("profilearr: ");
							console.log(profilearr);



						console.log(response2);
					}
					else{
						console.log(response2.error);
					}
				} );
		    }
		    else{
		    	console.log(response.error);
		    }
		  
		});
	};

	this.getInfo = function(){
		FB.api(
		    "/"+$scope.user.id,{fields: 'website'},
		    function (response) {
		      if (response && !response.error) {
		        console.log(response);
		      }
		      else{
		      	console.log(response.error);
		      }
		    }
		);
	}

	this.getFriendLikes = function() {
		FB.api('/me/posts?limit=1000', function(response) {
			console.log(response);
			var postIds = response.data.map(function(post){
				return post.id;
			});

			var friends = $scope.friends;
			console.log(postIds);
			postIds.forEach(function(postId, i) {
				FB.api('/' + postId + '/likes', function(response){
					response.data.forEach(function(friend, i){
						console.log("adding friends", i);
						if(!friends[friend.name]) friends[friend.name] = 1;
						else friends[friend.name]++;

						if(i == response.data.length - 1) {
							console.log(friends);
							var friendsArr = [];
							for(var friend in friends) {
								console.log(friend);
								var obj = {};
								obj[friend] = friends[friend];
								friendsArr.push(obj);
							}

							friendsArr.sort(function(a, b) {
								return b[Object.keys(b)[0]] - a[Object.keys(a)[0]];
							});
							friendsArr = friendsArr.slice(0, 5);

							$timeout(function() {
								$scope.friends = friendsArr;

								$scope.showfriends = true;		
							});
						}
					});
				});
			});
		});
	};

	this.generate = function(){
		that.getPositivity();
		that.getEmotions();
		that.getTags();
		that.getPopularity();
		that.getInfo();

		$scope.showposts = true;
	}

	$scope.loggedIn = false;
	$scope.showposts = false;
	$scope.showphotos = false;
	$scope.showfriends = false;

	$scope.user = {};
	$scope.tags = [];
	$scope.photos = [];
	$scope.photoEmotions = [];
	$scope.positivity = {};
	$scope.emotion = {};
	$scope.imageTags = [];
	$scope.friends = {};
}]);
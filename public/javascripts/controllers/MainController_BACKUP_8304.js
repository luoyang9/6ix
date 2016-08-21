<<<<<<< HEAD
<<<<<<< HEAD
var globaltest=[];
google.load('visualization', '1', {packages:['corechart']});

google.setOnLoadCallback(function() {
  angular.bootstrap(document.body, ['6ixApp']);
});

angular.module('MainController', []).controller('MainController', ['$scope', '$window', function($scope, $window) {
=======
angular.module('MainController', ['IndicoService']).controller('MainController', ['$scope', '$window', 'IndicoService', function($scope, $window, IndicoService) {
>>>>>>> 3cadb80de24e770d987f762c8d90ec17657f892e
=======
angular.module('MainController', ['IndicoService']).controller('MainController', ['$scope', '$window', 'IndicoService', function($scope, $window, IndicoService) {
>>>>>>> refs/remotes/origin/master

	var that = this;

	$window.fbAsyncInit = function() {
		FB.init({
		  appId      : '312149629136084',
		  status	 : true,
		  cookie	 : true,
		  xfbml      : true,
		  version    : 'v2.7'
		});

		FB.Event.subscribe('auth.authResponseChange', that.statusChange);
	};

	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {return;}
		js = d.createElement(s); js.id = id;	
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	this.statusChange = function(res) {
		console.log("status changed")
		if(res.status === 'connected') {
			console.log("already logged in");
			$scope.$apply(function() {
				$scope.loggedIn = true;
			});
			that.getUser();
		}
	};

	this.loginFacebook = function() {
		console.log("logging in");
		FB.login(function(response) {
			if(response.status == 'connected') {
				that.loggedIn = true;
				that.getUser();
				console.log("log in successful");
			}
			else {
				console.log("log in failed");
			}
		}, {scope: 'public_profile,user_friends,user_about_me,user_birthday,user_education_history,user_events,user_hometown,user_likes,user_location,user_photos,user_posts,user_relationships,user_relationship_details,user_religion_politics,user_tagged_places,user_videos,user_website,user_work_history'});
	};

	this.logoutFacebook = function(){
		FB.logout(function(response){
			that.loggedIn = false;
			console.log("loggedout successful");
		});
	}

	this.getUser = function() {
		FB.api('/me', function(response) {
			$scope.$apply(function() {
				$scope.user.name = response.name;
				$scope.user.id = response.id;
			});
		});
	};

	this.getTags = function(text) {
		FB.api('/' + $scope.user.id + '/posts', function(response) {
			$scope.$apply(function() {
				$scope.tags = response;
			});
		});	
		/*
		IndicoService.getTags(text).then(function(res) {
			console.log(res);
		}, function(err) {
			console.log(err);
		});*/
	};

	this.getPopularity = function(){

		function doasync (data1, fn){
			fn(data1);
		}

		console.log($scope.user.id +'/albums');
		FB.api("/"+$scope.user.id +'/albums', {fields: ['id', 'type'], limit: 500}, function(response) {
			if (response && !response.error) {
				var albumid;
		        console.log(response);
				for(var i=0; i<response.data.length; i++){
					if (response.data[i].type == "profile"){
						albumid = response.data[i].id;
						console.log(albumid);
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

									console.log("length: " + profileinfo.length);

									var data = new google.visualization.DataTable();
									data.addColumn('date', 'date');
      								data.addColumn('number', 'popularity');

									for(var j=0; j<profileinfo.length; j++){

										console.log(new Date(datesCreated[j]) + " " + likes[j]);
										data.addRow([new Date(datesCreated[j]), likes[j]]);
									}								     

									console.log(data);

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

	$scope.loggedIn = false;
	$scope.user = {};
	$scope.tags = {};
}]);
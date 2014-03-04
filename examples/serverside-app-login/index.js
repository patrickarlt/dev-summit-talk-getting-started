var Hapi = require('hapi'); // Hapi is a framework build building APIs
var request = require('request'); // request is a generic module for making http requests

var config = {
  clientId: "XXX", // from an app on developers.arcgis.com
  clientSecret: "XXX" // from an app on developers.arcgis.com
};


// this function gets a token from ArcGIS Online and then passes the token to a callback
function getToken(callback){
  request({
    method: "post",
    url: "https://www.arcgis.com/sharing/oauth2/token",
    json: true,
    form: {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials"
    }
  }, function(error, response, body){
    callback(error, body.access_token);
  });
}

// querys the demographic data from ArcGIS Online given a lat/lng, a token and passes the result to a callback
function queryDemographicData(lat, lng, token, callback){
  request({
    method: "post",
    url: "http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich",
    form: {
      f: "json",
      studyareas: JSON.stringify([
        {
          geometry: {
            x: lng,
            y: lat
          }
        }
      ]),
      dataCollections: JSON.stringify(["KeyUSFacts"]),
      token: token
    },
    json: true
  }, function(error, response, body){
    callback(error, body);
  });
}

// gets demographic data for a lat/lng pair and passes it to a callback
function getDemographicsFor(lat, lng, callback){
  getToken(function(error, token){
    queryDemographicData(lat, lng, token, function(error, data){
      callback(error, data);
    });
  });
}

// Create a server with a host and port
var server = Hapi.createServer('localhost', 3000);

// Add a route to get demographic data
server.route({
  method: 'GET',
  path: '/demographics',
  handler: function (request, reply) {
    var lat = request.query.lat; // get the lat from the query string
    var lng = request.query.lng; // get the lng from the query string

    // get some demographic data
    getDemographicsFor(lat, lng, function(error, data){
      reply(error || data); // reply to the request with our data
    });
  }
});

// Start the server
console.log("Hapi listening on http://localhost:3000");
server.start();
var Hapi = require('hapi');
var request = require('request');
var config = {
  clientId: "XXX",
  clientSecret: "XXX"
};

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
    var lat = request.query.lat;
    var lng = request.query.lng;
    getDemographicsFor(lat, lng, function(error, data){
      reply(error || data);
    });
  }
});

// Start the server
server.start();
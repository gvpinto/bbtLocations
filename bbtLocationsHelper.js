'use strict';

module.change_code = 1;

var requestPromise = require('request-promise');
var _ = require('lodash');
var Promise = require('bluebird');

var googleMapsGeoCodeEndPoint = 'https://maps.googleapis.com/maps/api/geocode/json';
var googleMapsNearbyEndPoint = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
var googleMapsPlaceDetailsEndPoint = 'https://maps.googleapis.com/maps/api/place/details/json';

function BBTLocationsHelper(bbtLocationsObj) {

    this.bbtLocationsObj = bbtLocationsObj || {
            first: true,
            last: false,
            zipcode: '',
            started: false,
            currentLocation: 0,
            locationList: [],
            lastLocation: {}
        };

}


BBTLocationsHelper.prototype.getLocations = function (zipcode) {

    var that = this;

    return this.getLatLong(zipcode)
        .then(function (geoLocation) {
            return that.getLocationList(geoLocation)
        });

};

/**
 * Get Latitude and Longitude of a given Zip Code
 * @param zipcode
 * @returns {*}  Promise
 */
BBTLocationsHelper.prototype.getLatLong = function(zipcode) {

    var options = {

        method: 'GET',
        uri: googleMapsGeoCodeEndPoint,
        json: true,
        qs: {
            address: zipcode,
            key: 'AIzaSyBHu2TBDEA2O24nvWwZm5dv9i_D1hccHpc'
        }
    };

    return requestPromise(options)
        .then(function(respObj) {

            var value = {
                status: respObj.status,
                geoLocation: {
                    lat: respObj.results[0].geometry.location.lat,
                    lng: respObj.results[0].geometry.location.lng
                }
            }


            return value;
        })
        .catch(function(err) {

            return {
                status: 'ERR',
                geoLocation: {
                    lat: 0,
                    lng: 0
                }
            }
        });


}


BBTLocationsHelper.prototype.getLocationList = function (location) {

    var that = this;

    var options = {
        method: 'GET',
        uri: googleMapsNearbyEndPoint,
        json: true,
        qs: {
            key: 'AIzaSyDQQkmM7tVJ9VvuysbJsEVRgyOu0jxbP-U',
            location: '' + location.geoLocation.lat + ',' + location.geoLocation.lng,
            radius: '8000',
            type: 'bank',
            name: 'BB&T'
        }
    };

    return requestPromise(options)
        .then(function (respObj) {
            var obj = {};
            obj.status = respObj.status;
            obj.locations = [];

            if (!_.isEmpty(respObj.results)) {
                for (var i = 0; i < respObj.results.length; i++) {
                    obj.locations.push({
                        name: respObj.results[i].name,
                        placeId: respObj.results[i].place_id,
                        address: respObj.results[i].vicinity
                    })
                }
            }
            // obj = _.filter(obj, {name: 'BB&T'});
            obj.locations = _.filter(obj.locations, {name: 'BB&T'});
            that.bbtLocationsObj.locationList = obj.locations;
            console.log('---> Return Location List from getLocationList()')
            console.log(that.bbtLocationsObj.locationList);
            return obj;
        });

};

BBTLocationsHelper.prototype.getLocationDetails = function(placeId) {

    console.log('---> Start Get Location Details');
    var that = this;

    var options = {
        method: 'GET',
        uri: googleMapsPlaceDetailsEndPoint,
        json: true,
        qs: {
            key: 'AIzaSyDQQkmM7tVJ9VvuysbJsEVRgyOu0jxbP-U',
            placeid: placeId
        }
    };

    return requestPromise(options)

        .then(function(respObj) {
            console.log('---> Call to Get Location Details Successful');

            return {
                status: respObj.status,
                locationDetails: {
                    address: respObj.result.formatted_address,
                    phone: respObj.result.formatted_phone_number
                }
            }

        })
        .catch(function(err) {

            return {
                status: 'ERR',
                locationDetails: {
                    address: '',
                    phone: ''
                }
            }
        });
}

BBTLocationsHelper.prototype.getNextLocation = function() {
    console.log('---> Get Next Location');
    var that = this;
    if (this.bbtLocationsObj.currentLocation < (this.bbtLocationsObj.locationList.length - 1)) {
        console.log('--->Perform Next');
        if (this.bbtLocationsObj.started) {
            this.bbtLocationsObj.currentLocation++;
        } else {
            this.bbtLocationsObj.started = true;
        }
        this.bbtLocationsObj.first = false;
        console.log('---> Current Location: ' + this.bbtLocationsObj.currentLocation);
        var locationInfo = this.bbtLocationsObj.locationList[this.bbtLocationsObj.currentLocation];
        return this.getLocationDetails(locationInfo.placeId)
            .then(function (respObj) {
                that.bbtLocationsObj.lastLocation = respObj.locationDetails;
                return that.bbtLocationsObj.lastLocation;
            });

    } else {
        console.log('---> At Last');
        this.bbtLocationsObj.last = true;
        return new Promise(function (resolve) {
            resolve(that.bbtLocationsObj.lastLocation);
        });
    }

}

BBTLocationsHelper.prototype.getPreviousLocation = function() {
    console.log('---> Get Next Location');

    var that = this;

    if (this.bbtLocationsObj.currentLocation > 0) {
        this.bbtLocationsObj.currentLocation--;
        this.bbtLocationsObj.last = false;
        var locationInfo = this.bbtLocationsObj.locationList[this.bbtLocationsObj.currentLocation];
        return this.getLocationDetails(locationInfo.placeId)
            .then(function (respObj) {
                that.bbtLocationsObj.lastLocation = respObj.locationDetails;
                return that.bbtLocationsObj.lastLocation;
            });
    } else {
        this.bbtLocationsObj.first = true;
        return new Promise(function (resolve) {
            resolve(that.bbtLocationsObj.lastLocation);
        });
    }
}

function callLocationDetails(currentLocation) {

    console.log('callLocationDetails');
    var that = this;
    console.log('---> currentLocation: ' + currentLocation);

    if (currentLocation !== undefined && currentLocation > -1) {
        this.bbtLocationsObj.currentLocation = currentLocation;
    } else {
        this.bbtLocationsObj.currentLocation = 0;
    }

    // if (increment) {
    //     this.bbtLocationsObj.currentLocation++;
    // } else {
    //     if (increment !== undefined) {
    //         this.bbtLocationsObj.currentLocation--;
    //     } else {
    //         console.log('---> currentLocation untouched');
    //     }
    //
    // }

    if (currentLocation === 0) {
        this.bbtLocationsObj.first = true;
        this.bbtLocationsObj.last = false;
    } else if(currentLocation === (this.bbtLocationsObj.locationList.length - 1)) {
        this.bbtLocationsObj.first = false;
        this.bbtLocationsObj.last = true;
    } else {
        this.bbtLocationsObj.first = false;
        this.bbtLocationsObj.last = false;
    }

    var locationInfo = this.bbtLocationsObj.locationList[that.bbtLocationsObj.currentLocation];

    return this.getLocationDetails(locationInfo.placeId)
        .then(function (respObj) {
            that.bbtLocationsObj.lastLocation = respObj.locationDetails;
            return that.bbtLocationsObj.lastLocation;
        });

}

BBTLocationsHelper.prototype.getLocationDetailsAtIndex = function(value) {

    console.log('---> Get first or last Location');
;
    if (value === undefined) {
        value = 'repeat';
    }

    var that = this;

    if (value === 'first') {
        console.log('---> In First');
        return callLocationDetails.call(this, 0); // Omitted the increment parameter

    } else if (value === 'last') {
        console.log('---> In last');
        return callLocationDetails.call(this, (this.bbtLocationsObj.locationList.length - 1)); // Omitted the increment parameter

    } else {
        console.log('---> In repeat');
        return callLocationDetails.call(this, this.bbtLocationsObj.currentLocation); // Omitted the increment parameter

    }

}

module.exports =  BBTLocationsHelper;
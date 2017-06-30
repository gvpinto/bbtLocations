'use strict';

var chai = require('chai');

// var chaiAsPromised = require('chai-as-promised');
//
// chai.use(chaiAsPromised);

var expect = chai.expect;

var BBTLocationHelper = require('../bbtLocationsHelper');


chai.config.includeStack = true; // turn on stack trace

describe('BBTLocationHelper', function () {

    var zipcode = '27613';

    describe('#getLocations', function () {

        var bbtLocationHelper = new BBTLocationHelper();

        context('Individual Tests', function () {

            it('returns a valid latitude and longitude', function (done) {

                zipcode = '27613';
                var promise = bbtLocationHelper.getLatLong(zipcode);

                promise.then(function (respObj) {
                    expect(respObj.status).to.equal('OK');
                    expect(respObj.geoLocation.lat).to.equal(35.9049831);
                    expect(respObj.geoLocation.lng).to.equal(-78.7088295);
                    done();
                });


            });

            it('returns valid locations', function (done) {

                var location = {
                    status: 'OK',
                    geoLocation: {
                        lat : 35.9015482,
                        lng : -78.68046509999999
                    }
                }

                var promise = bbtLocationHelper.getLocationList(location);

                promise.then(function (respObj) {
                    expect(respObj.status).to.equal('OK');
                    done();
                });

            });

        });


        context('Combined Test', function () {

            var bbtLocationHelper = new BBTLocationHelper();

            it('Get a list of locations', function (done) {
                zipcode = '27613';
                var promise = bbtLocationHelper.getLocations(zipcode);
                promise.then(function (respObj) {
                    expect(respObj.status).to.equal('OK');
                    done();
                });

            });

            it('Get Place Details', function(done) {
                var placeId = 'ChIJBYLA6376rIkRB7fHO5f6j8M';
                var promise = bbtLocationHelper.getLocationDetails(placeId);
                promise.then(function(respObj) {
                    expect(respObj.status).to.equal('OK');
                    done();
                })
            })

        });

        context('Test Start and Next functions', function() {

            it('Find Start and Next', function (done) {

                var bbtLocationHelper = new BBTLocationHelper();

                var location = {
                    status: 'OK',
                    geoLocation: {
                        lat : 35.9015482,
                        lng : -78.68046509999999
                    }
                }

                var promise = bbtLocationHelper.getLocationList(location);

                promise.then(function (respObj) {
                    console.log('---> Successful call to getLocationList()')
                    expect(respObj.status).to.equal('OK');
                    // return bbtLocationHelper.getNextLocation();

                    bbtLocationHelper.getNextLocation()
                        .then(function (locationDetails) {
                            console.log('---> Successful call to getNextLocation()')
                            console.log(locationDetails);
                            return;
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                        .then(function() {
                            bbtLocationHelper.getNextLocation()
                                .then(function (locationDetails) {
                                    console.log('---> Successful call to getNextLocation()')
                                    console.log(locationDetails);
                                    return;
                                })
                        })
                    // .then(function (locationDetails) {
                    //     console.log('---> Successful call to getNextLocation()')
                    //     console.log(locationDetails);
                    //     done();
                    // });

                });

            });


        })

    });
});
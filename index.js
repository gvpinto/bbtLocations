'use strict';

module.change_code = 1;

var bbt = require('alexa-app');

var _ = require('lodash');


var bbtLocationService = new bbt.app('bbtLocations');
var BBTLocationsHelper = require('./bbtLocationsHelper');
var BBT_LOCATIONS_SESSION_KEY = 'BBTLocations';

var formResponse = function(bbtLocationsObj, locationDetails, next) {
    console.log('---> Form a response');
    console.log(bbtLocationsObj);
    console.log(locationDetails);
    var address = 'The address at location ' + (bbtLocationsObj.currentLocation + 1) + ' is, ' + locationDetails.address.replace(', USA', '') + '. ';
    var phone = 'The phone number at this location is, ' + locationDetails.phone + '. ';

    var navigate = '';
    if (next) {
        navigate = 'To continue, say go next, or repeat';
    } else {
        navigate = 'To continue, say go previous, or repeat';
    }

    return address + phone + navigate;
}

bbtLocationService.launch(function (request, response) {
    var prompt = 'Welcome to b b and t Branch and ATM location finder. For usage say, find branch locations at zip code.';
    console.log('---> Session Details - Launch');
    console.log(request.getSession().details);
    response.say(prompt).shouldEndSession(false);
});

bbtLocationService.intent('AMAZON.HelpIntent', {}, function (request, response) {
    var help = 'Welcome to b b and t Branch and ATM location finder. For usage say, find branch locations at zip code. ' +
        'You can also say stop or cancel to exit.';
    response.say(help).shouldEndSession(false);

});

/**
 * Get BB&T Locations Session Object
 * @param Http request
 */
var getBbtLocationsSessionObj = function(request) {

    console.log('---> Getting Session Obj');

    var session = request.getSession();
    console.log('---> Session Details');
    console.log(session.details);
    var bbtLocationsObj = session.get(BBT_LOCATIONS_SESSION_KEY);

    if (bbtLocationsObj === undefined) {
        console.log('---> Creating a new Helper Object');
        bbtLocationsObj = {
            first: true,
            last: false,
            zipcode: '',
            started:false,
            currentLocation: 0,
            locationList: [],
            lastLocation: {}
        };
    }

    console.log('---> Returning the helper object from Session');
    var bbtLocationsHelper = new BBTLocationsHelper(bbtLocationsObj);
    console.log('---> Current State of Locations Obj');
    console.log(bbtLocationsObj);
    console.log('---> List Properties');
    listProperties(bbtLocationsHelper);
    return bbtLocationsHelper;
}

var setBbtLocationsSessionObj = function(request, bbtLocationsHelper) {
    console.log('---> Setting Session Obj');
    var session = request.getSession();
    session.set(BBT_LOCATIONS_SESSION_KEY, bbtLocationsHelper.bbtLocationsObj);

}

/**
 * defining findLocationsIntent
 */
bbtLocationService.intent('findLocationsIntent', {
    'slots': {
        'ZIPCODE': 'ZIPCODES'
    },
    'utterances': [
        '{search|find|locate} {|for} {|branch|branches|ATM\'s|ATM} {|locations} at {|zip code} {-|ZIPCODE}',
    ]
}, function (request, response) {
    console.log('---> Intent Fired with Zipcode');
    var zipcode = request.slot('ZIPCODE');
    console.log(zipcode);

    var bbtLocationsHelper = getBbtLocationsSessionObj(request);

    if (_.isEmpty(zipcode)) {
        console.log('---> Zip Code is Empty');
        response.say('I didn\'t hear a Zip Code to search on.').shouldEndSession(false).send();
        return true;
    } else {
        console.log('---> Calling getLocations on helper');
        bbtLocationsHelper.getLocations(zipcode)
            .then(function(respObj) {
                console.log('---> Response Successful');
                console.log(respObj);
                if (respObj.status === 'OK') {
                    bbtLocationsHelper.bbtLocationsObj.zipcode = zipcode;
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);
                    var locations = respObj.locations;
                    response.say('I found ' + (_.isEmpty(locations) ? 'no' : (locations.length)) + ' locations at this zip code. Would you like me to read out the first one?' ).shouldEndSession(false).send();
                } else {
                    response.say('Something went wrong while search for locations at ' + zipcode ).shouldEndSession(false).send();
                }
            })
            .catch(function(err) {
                response.say('Something went wrong while search for locations at ' + zipcode ).shouldEndSession(false).send();
            });
        return false;
    }
});


bbtLocationService.intent('locationNavigation', {
    'slots': {
            "WHATNEXT": "NEXTSTEPS"
        }
    ,
    'utterances': [
        '{start|yes|go} {|to} {-|WHATNEXT}  {|location|address}'
    ]

}, function (request, response) {

    console.log('---> Next');

    var slot = request.slot('WHATNEXT');
    var bbtLocationsHelper = getBbtLocationsSessionObj(request);
    var bbtLocationsObj = bbtLocationsHelper.bbtLocationsObj;

    console.log('---> Slot Value is: ' + slot);

    if (_.isEmpty(slot)) {

        console.log('---> Slot Empty');
        if (bbtLocationsObj.currentLocation === 0 && !bbtLocationsObj.started) {
            bbtLocationsHelper.getNextLocation()
                .then(function (locationDetails) {
                    console.log('---> Successful call to getNextLocation()');
                    console.log(locationDetails);
                    // Update Session Obj
                    // bbtLocationsHelper.bbtLocationsObj.started = true;
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);

                    var prompt = formResponse(bbtLocationsObj, locationDetails, true);

                    response.say(prompt).shouldEndSession(false).send();
                })
                .catch(function(err) {
                    console.log('*** Error ***');
                    response.say('Unexpected Error Occurred').shouldEndSession(false).send()
                });
            return false;
        } else {
            response.say('Please say, go next or go previous, to hear the next or previous location details').shouldEndSession(false);
            return true;
        }

    } else {
        console.log('In Else');
        // Next
        if (slot.toLowerCase() === 'next') {

            console.log('---> Slot is Next');

            bbtLocationsHelper.getNextLocation()
                .then(function (locationDetails) {

                    console.log('---> Successful call to getNextLocation()');
                    console.log(locationDetails);
                    // Update Session Obj
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);
                    if (bbtLocationsHelper.bbtLocationsObj.last) {
                        response.say('You are already at the last location. Say, go previous, to hear the previous location details again').shouldEndSession(false).send();
                    } else {

                        var prompt = formResponse(bbtLocationsHelper.bbtLocationsObj, locationDetails, true);
                        response.say(prompt).shouldEndSession(false).send();
                    }

                })
                .catch(function () {
                    console.log('*** Error ***');
                    response.say('Unexpected Error Occurred').shouldEndSession(false).send();
                });

        } else if (slot.toLowerCase() === 'previous') {
            // Previous
            console.log('---> Slot is Previous');
            bbtLocationsHelper.getPreviousLocation()

                .then(function (locationDetails) {
                    console.log('---> Successful call to getPreviousLocation()');
                    console.log(locationDetails);

                    // Update Session Obj
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);
                    if (bbtLocationsHelper.bbtLocationsObj.first) {
                        response.say('You are already at the first location. Say, go next, to hear the next location details again').shouldEndSession(false).send();
                    } else {
                        var prompt = formResponse(bbtLocationsHelper.bbtLocationsObj, locationDetails, false);
                        response.say(prompt).shouldEndSession(false).send();
                    }

                })
                .catch(function () {
                    console.log('Error');
                    response.say('Unexpected Error Occurred').shouldEndSession(false).send();
                });

        } else if (slot.toLowerCase() === 'first' || slot.toLowerCase() === '1st') {
            // First
            console.log('---> Slot is First');
            bbtLocationsHelper.getLocationDetailsAtIndex('first')
                .then(function (locationDetails) {
                    console.log('---> Successful call to getFirst()');
                    // Update Session Obj
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);

                    var prompt = formResponse(bbtLocationsHelper.bbtLocationsObj, locationDetails, true);
                    response.say(prompt).shouldEndSession(false).send();

                })
                .catch(function () {
                    console.log('Error');
                    response.say('I am unable to fulfil your request. Please try to start again').shouldEndSession(false).send();
                });

        } else if (slot.toLowerCase() === 'last') {

            console.log('---> Slot is Last');
            bbtLocationsHelper.getLocationDetailsAtIndex('last')
                .then(function (locationDetails) {
                    console.log('---> Successful call to getLast()');
                    // Update Session Obj
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);

                    var prompt = formResponse(bbtLocationsHelper.bbtLocationsObj, locationDetails, false);
                    response.say(prompt).shouldEndSession(false).send();

                })
                .catch(function () {
                    console.log('Error');
                    response.say('I am unable to fulfil your request. Please try to start again').shouldEndSession(false).send();
                });


        } else if (slot.toLowerCase() === 'repeat') {

            console.log('---> Slot is repeat');
            bbtLocationsHelper.getLocationDetailsAtIndex('repeat')
                .then(function (locationDetails) {
                    console.log('---> Successful call to getLast()');
                    // Update Session Obj
                    setBbtLocationsSessionObj(request, bbtLocationsHelper);

                    var prompt = formResponse(bbtLocationsHelper.bbtLocationsObj, locationDetails, true);
                    response.say(prompt).shouldEndSession(false).send();

                })
                .catch(function () {
                    console.log('Error');
                    response.say('I am unable to fulfil your request. Please try to start again').shouldEndSession(false).send();
                });

        } else {
            console.log('Failed to navigate. Slot value is: ' + slot.toLowerCase())
        }

        return false;
    }

});

var cancelIntentFunction = function (request, response) {
    response.say('Goodbye!').shouldEndSession(true);
}

bbtLocationService.intent('AMAZON.CancelIntent', {}, cancelIntentFunction);
bbtLocationService.intent('AMAZON.StopIntent', {}, cancelIntentFunction);

function listProperties(obj) {
    var propList = "";
    for(var propName in obj) {
        if(typeof(obj[propName]) != "undefined") {
            propList += (propName + ", ");
        }
    }
    console.log(propList);
}
module.exports = bbtLocationService;
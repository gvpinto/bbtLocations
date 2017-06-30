'use strict';


function printNameAgain() {
    console.log(this.name);
}

function Person(name) {
    this.name = name;
    this.printName = function() {
        console.log(this.name);
        printNameAgain.call(this);
    }
}

var person = new Person('Glenn');
person.printName();
//================================================
var increment;
if (increment) {
    console.log('Increment is true');
} else {
    if (increment !== undefined) {
        console.log('Increment is false');
    } else {
        console.log('Increment is undefined');
    }

}

//=================================================
var currentLocation = undefined;
if (currentLocation !== undefined && currentLocation > -1) {
    console.log('Current Location: ' + currentLocation);
} else {
    console.log('Failed to assign the current location');
}
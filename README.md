# JSMapr

JSMapr is a JavaScript mapping library for modifying a JavaScript object in place. This can be especially useful for API mediation.

## Usage Example

```js
var myObj = {
    "fName": "Fred",
    "lName": "Smith",
    "addresses": [
        {
            "addr": "177 Pine St",
            "city": "San Jose",
            "state": "CA",
            "zip": 95120,
            "addressType": "HOME"
        },
        {
            "addr": "10 S Almaden Blvd",
            "city": "San Jose",
            "state": "CA",
            "zip": 95113,
            "addressType": "WORK"
        }
    ],
    "username": "fsmith",
    "child": "Ryan"
};

var myMap = [
    // change field names
    JSMapr.MOVE("/lName", "/lastName"),
    JSMapr.MOVE("/fName", "/firstName"),
    JSMapr.MOVE("/child", "/children"),
    // change children to an array
    JSMapr.MAKEARRAY("/children"),
    // force zips to be strings and change street address name
    JSMapr.MAPEACH("/addresses",
      [
        JSMapr.TOSTRING("/zip"),
        JSMapr.MOVE("/addr", "/streetAddress")
      ]
    )
];

var mapr = new JSMapr();
mapr.setMapCommands(myMap);
myObj = mapr.map(myObj);

// myObj = {
//   "firstName": "Fred",
//   "lastName": "Smith",
//   "addresses": [
//       {
//           "streetAddress": "177 Pine St",
//           "city": "San Jose",
//           "state": "CA",
//           "zip": "95120",
//           "addressType": "HOME"
//       },
//       {
//           "streetAddress": "10 S Almaden Blvd",
//           "city": "San Jose",
//           "state": "CA",
//           "zip": "95113",
//           "addressType": "WORK"
//       }
//   ],
//   "username": "fsmith",
//   "children": [ "Ryan" ]
// }
```

## Functions

### setLocSeparator - set the location separator
By default, ```/``` is the separator. Locations are specified like ```/address/city```. In case there are slashes in the object's keys, the location separator can be changed using this function. Location separator must be a single character.

Usage:

```js
mapr.setLocSeparator("|");
```

### setLoggingFunction - set the function for debug logging
By default, there is no logging function, and logging will not be done. The log function should take a single parameter: the string to log.

Usage:

```js
mapr.setLoggingFunction(function(str) { console.log(str); });
```

### setMapCommands - set the mapping command(s)
Set the command or array of commands to be run on the object that is mapped.

Usage:

```js
mapr.setMapCommands( JSMapr.ADD("/copyrightYear", 2015) );
```
or

```js
mapr.setMapCommands([
    JSMapr.ADD("/copyrightYear", 2015),
    JSMapr.DEL("/metadata")
]);
```

### map - run the map command(s) against the object
Runs the map commands against the provided object. Return value is the modified object.

Usage:

```js
myObj = mapr.map(myObj);
```

## Map Commands (more details to be added)

### JSMapr.ADD(loc, elemToAdd)
Add a specified object/value at a specific location.

### JSMapr.DEL(loc)
Delete an element/subtree at a specific location.

### JSMapr.COPY(srcLoc, destLoc)
Copy the element/subtree at destLoc to srcLoc.

### JSMapr.MOVE(srcLoc, destLoc)
Move the element/subtree at destLoc to srcLoc.

### JSMapr.TOSTRING(loc)
Modify the element at the specified location by running .toString() on it.

### JSMapr.STRINGIFY(loc)
Stringify the element/object at the specified location.

### JSMapr.MAKEARRAY(loc)
If not an array already, convert the specified location to an array. If there is no element there, make it an empty array. If there is a value/object, make it a single element array. If it is already an array, do nothing.

### JSMapr.MAP1(loc, map)
Perform a mapping operation at the specified location.

### JSMapr.MAPEACH(loc, map)
If the specified location is an array, run the mapping operation on each of its elements.

### JSMapr.FUNC1(loc, fn, parms)
Run a function with optional parameters at the specified location, replacing that location with the return value of the function.

### JSMapr.FUNCEACH(loc, fn, parms)
If the specified location is an array, run the function with optional parameters on each of its elements, replacing each element with the return value of the function.

### JSMapr.SORTARRAY(loc, fn)
If the specified location is an array, use the supplied (sort function)[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/)sort to sort the elements of the array.

### JSMapr.EXEC(fn, parms)
Run the specified function on the entire object, replacing the object with the return value of the function.

### JSMapr.LOCSEPARATOR(sep)
Change the location separator for operations going forward.

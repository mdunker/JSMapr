// https://github.com/mikedunker/JSMapr
// License: MIT
// Version: 0.0.1
(function () {

	var sep = "/";
	var mapCommands = [];
	var logFunc = null;

	function log() {
		if (isFunction(logFunc)) {
			var str = "";
			for (i = 0, len=arguments.length; i < len; i++) {
				var arg = arguments[i];
				if (isObjectOrArray(arg)) {
					str += JSON.stringify(arg) + " ";
				}
				else {
					str += arg.toString() + " ";
				}
			}
			logFunc(str);
		}
	}

	function isString(v) {
		return (v && v.constructor === String);
	}

	function isArray(v) {
		return (v && v.constructor === Array);
	}

	function isObject(v) {
		return (v && v.constructor !== Array && v === Object(v));
	}

	function isObjectOrArray(v) {
		return isArray(v) || isObject(v);
	}

	function isFunction(v) {
		return (v && Object.prototype.toString.call(v) == '[object Function]');
	}

	JSMapr = function(newSep) {
		if (isString(newSep)) {
			sep = newSep;
		}
	};

	JSMapr.prototype.setMapCommands = function(newCommands) {
		if (isArray(newCommands)) {
		  mapCommands = newCommands;
		} else if (isObject(newCommands) && isString(newCommands.op)) {
			// looks like a single mapping object, wrap in array
			mapCommands = [ newCommands ];
		}
	};

	JSMapr.prototype.setLocSeparator = function(newSep) {
		if (isString(newSep)) {
			sep = newSep;
		}
	};

	JSMapr.prototype.setLoggingFunc = function(newLogFunc) {
		if (isFunction(newLogFunc)) {
			logFunc = newLogFunc;
		}
	};

	function isLocValid(loc) {
		// root is ok
		if (loc === "/") return true;

		var locArray = loc.split(sep);

		// first element after split should be empty
		if (locArray[0] !== "") return false;

		for (var i=1, aryLen = locArray.length; i < aryLen; i++) {
			// each location part must have some length
			if ((locArray[i]).length == 0) return false;
		}
		return true;
	}

	function isSubLoc(parent, child) {
		if (parent == child.substring(0,parent.length) &&
			child[parent.length] === "/") {
			return true;
		}
		return false;
	}

	function getObjectAtLoc(srcObj, loc) {

		if (loc === "/") {
			// object at root is srcObj
			return srcObj;
		}

		// split into parts
		var locArray = loc.split(sep);

		// save last part for end
		var p = locArray.pop();

		// navigate to location
		var navObj = srcObj;
		for (var i=1, j; navObj && (j=locArray[i]); i++) {
			navObj = (j in navObj ? navObj[j] : undefined);
		}

		return navObj && p ? (navObj[p]) : undefined;
	}

	function getTypeofLoc(srcObj, loc) {
		var val = getObjectAtLoc(srcObj, loc);

		// check null and array first, typeof them === 'object'
		if (val === null) return "null";
		else if (isArray(val)) return "array";
		else return typeof val; // string, number, boolean, object
	}

	function setObjectAtLoc(srcObj, loc, newObj) {

		if (loc === "/") {
			// replacing root with newObj
			return newObj;
		}

		// split into parts
		var locArray = loc.split(sep);

		// save last part for end
		var p = locArray.pop();

		// navigate to location
		var navObj = srcObj;
		for (var i=1, j; navObj && (j=locArray[i]); i++) {
			navObj = (j in navObj ? navObj[j] : navObj[j]={});
		}

		// set the object
		if (navObj && p) {
			navObj[p] = newObj;
		}

		return srcObj;
	}

	function deleteObjectAtLoc(srcObj, loc) {

		if (loc === "/") {
			// deleting root not supported
			return false;
		}

		// split into parts
		var locArray = loc.split(sep);

		// save last part for end
		var p = locArray.pop();

		// navigate to location
		var navObj = srcObj;
		for (var i=1, j; navObj && (j=locArray[i]); i++) {
			navObj = (j in navObj ? navObj[j] : undefined);
		}

		// delete the object
		if (navObj && p && navObj[p] !== undefined) {
			delete navObj[p];
			return true;
		}

		return false;
	}

	function opAdd(srcObj, loc, elemToAdd) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		return setObjectAtLoc(srcObj, loc, elemToAdd);
	}

	function opDel(srcObj, loc) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		deleteObjectAtLoc(srcObj, loc);
		return srcObj;
	}

	function opCopy(srcObj, srcLoc, destLoc) {
		// if not valid locations, abort
		if (!isLocValid(srcLoc) || !isLocValid(destLoc)) return srcObj;
		// if the same location, nothing to do
		if (srcLoc == destLoc) return srcObj;
		// if destLoc is child of srcLoc, can't do that copy
		if (isSubLoc(srcLoc, destLoc)) return srcObj;

		var val = getObjectAtLoc(srcObj, srcLoc);
		if (val !== undefined) {
			if (destLoc === "/") {
			  // can't copy to root (must have a name)
			  return srcObj;
			}
			srcObj = setObjectAtLoc(srcObj, destLoc, val);
		}
		return srcObj;
	}

	function opMove(srcObj, srcLoc, destLoc) {
		// if not valid locations, abort
		if (!isLocValid(srcLoc) || !isLocValid(destLoc)) return srcObj;
		// if the same location, nothing to do
		if (srcLoc == destLoc) return srcObj;
		// if destLoc is child of srcLoc, can't do that move
		if (isSubLoc(srcLoc, destLoc)) return srcObj;

		var val = getObjectAtLoc(srcObj, srcLoc);
		if (val !== undefined) {
			if (srcLoc === "/") {
				// wrapping root
				var newRoot = {};
				srcObj = setObjectAtLoc(newRoot, destLoc, val);
				return srcObj;
			}
			else if (destLoc === "/") {
			  // moving this to root, validate that this is an object or array
			  if (isObjectOrArray(val)) {
				// replace srcObj with val
				return val;
			  }	else {
				// not valid to move to root
				return srcObj;
			  }
			}
			deleteObjectAtLoc(srcObj, srcLoc);
			srcObj = setObjectAtLoc(srcObj, destLoc, val);
		}
		return srcObj;
	}

	function opToString(srcObj, loc) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);
		if (val !== undefined) {
			val = val.toString();
			srcObj = setObjectAtLoc(srcObj, loc, val);
		}
		return srcObj;
	}

	function opStringify(srcObj, loc) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);
		if (val !== undefined) {
			val = JSON.stringify(val);
			srcObj = setObjectAtLoc(srcObj, loc, val);
		}
		return srcObj;
	}

	function opMakeArray(srcObj, loc) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);
		if (val === undefined || val === null) {
			// nothing there, or null, create empty array
			srcObj = setObjectAtLoc(srcObj, loc, []);
		} else if (isArray(val)) {
			// already an array, do nothing
		} else if (val === Object(val)) {
			// this is an object, wrap it in an array
			srcObj = setObjectAtLoc(srcObj, loc, [ val ]);
		} else {
			// something else -- wrap it in array
			srcObj = setObjectAtLoc(srcObj, loc, [ val ]);
		}
		return srcObj;
	}

	function opMap1(srcObj, loc, opMap) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;
		if (!isObjectOrArray(opMap)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);
		if (val !== undefined) {
			// if opMap is not an array, make it a single element array
			if (!isArray(opMap)) {
				opMap = [ opMap ];
			}
			val = doMap(val, opMap);
			srcObj = setObjectAtLoc(srcObj, loc, val);
		}
		return srcObj;
	}

	function opMapEach(srcObj, loc, opMap) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;
		if (!isObjectOrArray(opMap)) return srcObj;

		var ary = getObjectAtLoc(srcObj, loc);

		// ary should be an array
		if (isArray(ary)) {
			// if opMap is not an array, make it a single element array
			if (!isArray(opMap)) {
				opMap = [ opMap ];
			}
			for (var i = 0, aryLen=ary.length; i < aryLen; i++) {
				var val = ary[i];
				if (val !== undefined) {
					ary[i] = doMap(val, opMap);
				}
			}
			srcObj = setObjectAtLoc(srcObj, loc, ary);
		}
		return srcObj;
	}

	function opFunc1(srcObj, loc, fn, parms) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);
		if (val !== undefined) {
			val = fn(val, parms);
			srcObj = setObjectAtLoc(srcObj, loc, val);
		}
		return srcObj;
	}

	function opFuncEach(srcObj, loc, fn, parms) {
		// if not valid location, abort
		if (!isLocValid(loc)) return srcObj;

		var ary = getObjectAtLoc(srcObj, loc);

		// ary should be an array
		if (ary !== undefined && ary.constructor === Array) {
			for (var i = 0, aryLen=ary.length; i < aryLen; i++) {
				var val = ary[i];
				ary[i] = fn(val, parms);
			}
			srcObj = setObjectAtLoc(srcObj, loc, ary);
		}
		return srcObj;
	}

	// returns new srcObj because executed function could change its reference
	function opExec(srcObj, fn, parms) {
		return fn(srcObj, parms);
	}

	function opIf(srcObj, condition, trueMap, falseMap) {
		if (!isObjectOrArray(trueMap)) return srcObj;
		if (falseMap && !isObjectOrArray(falseMap)) return srcObj;

		if (condition === true)
		{
			// if trueMap is not an array, make it a single element array
			if (!isArray(trueMap)) {
				trueMap = [ trueMap ];
			}
			srcObj = doMap(srcObj, trueMap);
		}
		else if (falseMap && condition === false) {
			if (!isArray(falseMap)) {
				falseMap = [ falseMap ];
			}
			srcObj = doMap(srcObj, falseMap);
		}
		return srcObj;
	}

	function opIfExists(srcObj, loc, trueMap, falseMap) {
		if (!isLocValid(loc)) return srcObj;
		return opIf(srcObj, getObjectAtLoc(srcObj, loc) !== undefined, trueMap, falseMap);
	}

	function opIfEqual(srcObj, loc, val, trueMap, falseMap) {
		if (!isLocValid(loc)) return srcObj;
		return opIf(srcObj, getObjectAtLoc(srcObj, loc) === val, trueMap, falseMap);
	}

	function opIfType(srcObj, loc, typeStr, trueMap, falseMap) {
		if (!isLocValid(loc)) return srcObj;
		if (!isString(typeStr)) return srcObj;

		var locType = getTypeofLoc(srcObj, loc);
		var typeArray = typeStr.split(' ');
		var wasFound = false;
		for (var i = 0, aLen = typeArray.length; i < aLen; i++) {
			if (locType === typeArray[i]) {
				wasFound = true;
				break;
			}
		}

		return opIf(srcObj, wasFound, trueMap, falseMap);
	}

	function opIfFunc(srcObj, loc, fn, parms, trueMap, falseMap) {
		if (!isLocValid(loc)) return srcObj;

		var val = getObjectAtLoc(srcObj, loc);

		return opIf(srcObj, fn(val, parms) === true, trueMap, falseMap);
	}

	function doMap(srcObj, map) {
		// if map is not an array (probably a single map object), make it a single element array
		if (!isArray(map)) {
			map = [ map ];
		}
		for (var i = 0, mapLen = map.length; i < mapLen; i++) {
			var mapObj = (map)[i];
			switch (mapObj.op) {
				case "ADD":
					log("Op: setting object at", mapObj.loc);
					srcObj = opAdd(srcObj, mapObj.loc, mapObj.elemToAdd);
					log("Updated:", srcObj);
					break;
				case "DEL":
					log("Op: deleting", mapObj.loc);
					srcObj = opDel(srcObj, mapObj.loc);
					log("Updated:", srcObj);
					break;
				case "COPY":
					log("Op: copying", mapObj.srcLoc, "to", mapObj.destLoc);
					srcObj = opCopy(srcObj, mapObj.srcLoc, mapObj.destLoc);
					log("Updated:", srcObj);
					break;
				case "MOVE":
					log("Op: moving", mapObj.srcLoc, "to", mapObj.destLoc);
					srcObj = opMove(srcObj, mapObj.srcLoc, mapObj.destLoc);
					log("Updated:", srcObj);
					break;
				case "TOSTRING":
					log("making", mapObj.loc, "a string");
					srcObj = opToString(srcObj, mapObj.loc);
					log("Updated:", srcObj);
					break;
				case "STRINGIFY":
					log("Op: stringifying", mapObj.loc);
					srcObj = opStringify(srcObj, mapObj.loc);
					log("Updated:", srcObj);
					break;
				case "MAKEARRAY":
					log("Op: making", mapObj.loc, "an array");
					srcObj = opMakeArray(srcObj, mapObj.loc);
					log("Updated:", srcObj);
					break;
				case "MAP1":
					log("Op: mapping", mapObj.loc);
					srcObj = opMap1(srcObj, mapObj.loc, mapObj.map);
					log("Updated:", srcObj);
					break;
				case "MAPEACH":
					log("Op: mapping each of", mapObj.loc);
					srcObj = opMapEach(srcObj, mapObj.loc, mapObj.map);
					log("Updated:", srcObj);
					break;
				case "FUNC1":
					log("Op: calling function on", mapObj.loc);
					srcObj = opFunc1(srcObj, mapObj.loc, mapObj.fn, mapObj.parms);
					log("Updated:", srcObj);
					break;
				case "FUNCEACH":
					log("Op: calling function on each of", mapObj.loc);
					srcObj = opFuncEach(srcObj, mapObj.loc, mapObj.fn, mapObj.parms);
					log("Updated:", srcObj);
					break;
				case "EXEC":
					log("Op: execing function on object");
					srcObj = opExec(srcObj, mapObj.fn, mapObj.parms);
					log("Updated:", srcObj);
					break;
				case "LOCSEPARATOR":
					log("Op: changing loc separator to", mapObj.sep);
					sep = mapObj.sep;
					break;
				case "IF":
					log("Op: if condition");
					srcObj = opIf(srcObj, mapObj.condition, mapObj.trueMap, mapObj.falseMap);
					log("Updated:", srcObj);
					break;
				case "IFEXISTS":
					log("Op: if exists", mapObj.loc);
					srcObj = opIfExists(srcObj, mapObj.loc, mapObj.trueMap, mapObj.falseMap);
					log("Updated:", srcObj);
					break;
				case "IFEQUAL":
					log("Op: if loc", mapObj.loc, "equal to", mapObj.val);
					srcObj = opIfEqual(srcObj, mapObj.loc, mapObj.val, mapObj.trueMap, mapObj.falseMap);
					log("Updated:", srcObj);
					break;
				case "IFTYPE":
					log("Op: if loc", mapObj.loc, "has type of:", mapObj.typeStr);
					srcObj = opIfType(srcObj, mapObj.loc, mapObj.typeStr, mapObj.trueMap, mapObj.falseMap);
					log("Updated:", srcObj);
					break;
				case "IFFUNC":
					log("Op: if func returns true for loc", mapObj.loc);
					srcObj = opIfFunc(srcObj, mapObj.loc, mapObj.fn, mapObj.parms, mapObj.trueMap, mapObj.falseMap);
					log("Updated:", srcObj);
					break;
			}
		}
		return srcObj;
	}

	JSMapr.prototype.map = function(srcObj) {
		return doMap(srcObj, mapCommands);
	};

}());

JSMapr.ADD = function(loc, elemToAdd) {
	return { "op": "ADD", "loc": loc, "elemToAdd": elemToAdd };
};

JSMapr.DEL = function(loc) {
	return { "op": "DEL", "loc": loc };
};

JSMapr.COPY = function(srcLoc, destLoc) {
	return { "op": "COPY", "srcLoc": srcLoc, "destLoc": destLoc };
};

JSMapr.MOVE = function(srcLoc, destLoc) {
	return { "op": "MOVE", "srcLoc": srcLoc, "destLoc": destLoc };
};

JSMapr.TOSTRING = function(loc) {
	return { "op": "TOSTRING", "loc": loc };
};

JSMapr.STRINGIFY = function(loc) {
	return { "op": "STRINGIFY", "loc": loc };
};

JSMapr.MAKEARRAY = function(loc) {
	return { "op": "MAKEARRAY", "loc": loc };
};

JSMapr.MAP1 = function(loc, map) {
	return { "op": "MAP1", "loc": loc, "map": map };
};

JSMapr.MAPEACH = function(loc, map) {
	return { "op": "MAPEACH", "loc": loc, "map": map };
};

JSMapr.FUNC1 = function(loc, fn, parms) {
	return { "op": "FUNC1", "loc": loc, "fn": fn, "parms": parms };
};

JSMapr.FUNCEACH = function(loc, fn, parms) {
	return { "op": "FUNCEACH", "loc": loc, "fn": fn, "parms": parms };
};

JSMapr.EXEC = function(fn, parms) {
	return { "op": "EXEC", "fn": fn, "parms": parms };
};

JSMapr.IF = function(condition, trueMap, falseMap) {
	return { "op": "IF", "condition": condition, "trueMap": trueMap, "falseMap": falseMap };
};

JSMapr.IFEXISTS = function(loc, trueMap, falseMap) {
	return { "op": "IFEXISTS", "loc": loc, "trueMap": trueMap, "falseMap": falseMap };
};

JSMapr.IFEQUAL = function(loc, val, trueMap, falseMap) {
	return { "op": "IFEQUAL", "loc": loc, "val": val, "trueMap": trueMap, "falseMap": falseMap };
};

JSMapr.IFTYPE = function(loc, typeStr, trueMap, falseMap) {
	return { "op": "IFTYPE", "loc": loc, "typeStr": typeStr, "trueMap": trueMap, "falseMap": falseMap };
};

JSMapr.IFFUNC = function(loc, fn, parms, trueMap, falseMap) {
	return { "op": "IFFUNC", "loc": loc, "fn": fn, "parms": parms, "trueMap": trueMap, "falseMap": falseMap };
};

JSMapr.LOCSEPARATOR = function(sep) {
	return { "op": "LOCSEPARATOR", "sep": sep };
};

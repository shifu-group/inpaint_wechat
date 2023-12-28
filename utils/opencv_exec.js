(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            return (root.cv = factory());
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof window === 'object') {
        // Browser globals
        root.cv = factory();
    } else if (typeof importScripts === 'function') {
        // Web worker
        root.cv = factory();
    } else {
        // Other shells, e.g. d8
        root.cv = factory();
    }
}(this, function () {
    const IsWechat = true;
    var cv = (function () {
        var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
        return (function (cv) {
            cv = cv || {};

            // IsWechat
            var wasmBinaryFile;
            if (IsWechat) {
                wasmBinaryFile = global.wasm_url
            } else {
                wasmBinaryFile = window.wasm_url;
            }

            var Module = typeof cv !== "undefined" ? cv : {};
            var moduleOverrides = {};
            var key;
            for (key in Module) {
                if (Module.hasOwnProperty(key)) {
                    moduleOverrides[key] = Module[key]
                }
            }
            var arguments_ = [];
            var thisProgram = "./this.program";
            var quit_ = function (status, toThrow) {
                throw toThrow
            };
            var ENVIRONMENT_IS_WEB = false;
            var ENVIRONMENT_IS_WORKER = false;
            var ENVIRONMENT_IS_NODE = false;
            var ENVIRONMENT_HAS_NODE = false;
            var ENVIRONMENT_IS_SHELL = false;
            ENVIRONMENT_IS_WEB = typeof window === "object";
            ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
            ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
            ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
            ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
            var scriptDirectory = "";
            function locateFile(path) {
                if (Module["locateFile"]) {
                    return Module["locateFile"](path, scriptDirectory)
                }
                return scriptDirectory + path
            }
            var read_, readAsync, readBinary, setWindowTitle;
            if (ENVIRONMENT_IS_NODE) {
                scriptDirectory = __dirname + "/";
                var nodeFS;
                var nodePath;
                read_ = function shell_read(filename, binary) {
                    var ret;
                    ret = tryParseAsDataURI(filename);
                    if (!ret) {
                        if (!nodeFS)
                            nodeFS = require("fs");
                        if (!nodePath)
                            nodePath = require("path");
                        filename = nodePath["normalize"](filename);
                        ret = nodeFS["readFileSync"](filename)
                    }
                    return binary ? ret : ret.toString()
                }
                    ;
                readBinary = function readBinary(filename) {
                    var ret = read_(filename, true);
                    if (!ret.buffer) {
                        ret = new Uint8Array(ret)
                    }
                    assert(ret.buffer);
                    return ret
                }
                    ;
                if (process["argv"].length > 1) {
                    thisProgram = process["argv"][1].replace(/\\/g, "/")
                }
                arguments_ = process["argv"].slice(2);
                process["on"]("uncaughtException", function (ex) {
                    if (!(ex instanceof ExitStatus)) {
                        throw ex
                    }
                });
                process["on"]("unhandledRejection", abort);
                quit_ = function (status) {
                    process["exit"](status)
                }
                    ;
                Module["inspect"] = function () {
                    return "[Emscripten Module object]"
                }
            } else if (!IsWechat && ENVIRONMENT_IS_SHELL) {
                if (typeof read != "undefined") {
                    read_ = function shell_read(f) {
                        var data = tryParseAsDataURI(f);
                        if (data) {
                            return intArrayToString(data)
                        }
                        return read(f)
                    }
                }
                readBinary = function readBinary(f) {
                    var data;
                    data = tryParseAsDataURI(f);
                    if (data) {
                        return data
                    }
                    if (typeof readbuffer === "function") {
                        return new Uint8Array(readbuffer(f))
                    }
                    data = read(f, "binary");
                    assert(typeof data === "object");
                    return data
                }
                    ;
                if (typeof scriptArgs != "undefined") {
                    arguments_ = scriptArgs
                } else if (typeof arguments != "undefined") {
                    arguments_ = arguments
                }
                if (typeof quit === "function") {
                    quit_ = function (status) {
                        quit(status)
                    }
                }
                if (typeof print !== "undefined") {
                    if (typeof console === "undefined")
                        console = {};
                    console.log = print;
                    console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
                }
                // } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            } else if (IsWechat || ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {

                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = self.location.href
                } else if (!IsWechat && document.currentScript) {
                    scriptDirectory = document.currentScript.src
                }
                if (_scriptDir) {
                    scriptDirectory = _scriptDir
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
                } else {
                    scriptDirectory = ""
                }
                read_ = function shell_read(url) {
                    try {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.send(null);
                        return xhr.responseText
                    } catch (err) {
                        var data = tryParseAsDataURI(url);
                        if (data) {
                            return intArrayToString(data)
                        }
                        throw err
                    }
                }
                    ;
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = function readBinary(url) {
                        try {
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            xhr.responseType = "arraybuffer";
                            xhr.send(null);
                            return new Uint8Array(xhr.response)
                        } catch (err) {
                            var data = tryParseAsDataURI(url);
                            if (data) {
                                return data
                            }
                            throw err
                        }
                    }
                }
                readAsync = function readAsync(url, onload, onerror) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function xhr_onload() {
                        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                            onload(xhr.response);
                            return
                        }
                        var data = tryParseAsDataURI(url);
                        if (data) {
                            onload(data.buffer);
                            return
                        }
                        onerror()
                    }
                        ;
                    xhr.onerror = onerror;
                    xhr.send(null)
                }
                    ;
                setWindowTitle = function (title) {
                    document.title = title
                }
            } else { }

            var out = Module["print"] || console.log.bind(console);
            var err = Module["printErr"] || console.warn.bind(console);
            for (key in moduleOverrides) {
                if (moduleOverrides.hasOwnProperty(key)) {
                    Module[key] = moduleOverrides[key]
                }
            }
            moduleOverrides = null;
            if (Module["arguments"])
                arguments_ = Module["arguments"];
            if (Module["thisProgram"])
                thisProgram = Module["thisProgram"];
            if (Module["quit"])
                quit_ = Module["quit"];
            var STACK_ALIGN = 16;
            function dynamicAlloc(size) {
                var ret = HEAP32[DYNAMICTOP_PTR >> 2];
                var end = ret + size + 15 & -16;
                if (end > _emscripten_get_heap_size()) {
                    abort()
                }
                HEAP32[DYNAMICTOP_PTR >> 2] = end;
                return ret
            }
            function getNativeTypeSize(type) {
                switch (type) {
                    case "i1":
                    case "i8":
                        return 1;
                    case "i16":
                        return 2;
                    case "i32":
                        return 4;
                    case "i64":
                        return 8;
                    case "float":
                        return 4;
                    case "double":
                        return 8;
                    default:
                        {
                            if (type[type.length - 1] === "*") {
                                return 4
                            } else if (type[0] === "i") {
                                var bits = parseInt(type.substr(1));
                                assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                                return bits / 8
                            } else {
                                return 0
                            }
                        }
                }
            }
            function warnOnce(text) {
                if (!warnOnce.shown)
                    warnOnce.shown = {};
                if (!warnOnce.shown[text]) {
                    warnOnce.shown[text] = 1;
                    err(text)
                }
            }
            function convertJsFunctionToWasm(func, sig) {
                var typeSection = [1, 0, 1, 96];
                var sigRet = sig.slice(0, 1);
                var sigParam = sig.slice(1);
                var typeCodes = {
                    "i": 127,
                    "j": 126,
                    "f": 125,
                    "d": 124
                };
                typeSection.push(sigParam.length);
                for (var i = 0; i < sigParam.length; ++i) {
                    typeSection.push(typeCodes[sigParam[i]])
                }
                if (sigRet == "v") {
                    typeSection.push(0)
                } else {
                    typeSection = typeSection.concat([1, typeCodes[sigRet]])
                }
                typeSection[1] = typeSection.length - 2;
                var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
                var module = new WXWebAssembly.Module(bytes);
                var instance = new WXWebAssembly.Instance(module, {
                    e: {
                        f: func
                    }
                });
                var wrappedFunc = instance.exports.f;
                return wrappedFunc
            }
            function addFunctionWasm(func, sig) {
                var table = wasmTable;
                var ret = table.length;
                try {
                    table.grow(1)
                } catch (err) {
                    if (!err instanceof RangeError) {
                        throw err
                    }
                    throw "Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH."
                }
                try {
                    table.set(ret, func)
                } catch (err) {
                    if (!err instanceof TypeError) {
                        throw err
                    }
                    assert(typeof sig !== "undefined", "Missing signature argument to addFunction");
                    var wrapped = convertJsFunctionToWasm(func, sig);
                    table.set(ret, wrapped)
                }
                return ret
            }
            function removeFunctionWasm(index) { }
            var funcWrappers = {};
            function dynCall(sig, ptr, args) {
                if (args && args.length) {
                    return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
                } else {
                    return Module["dynCall_" + sig].call(null, ptr)
                }
            }
            var tempRet0 = 0;
            var setTempRet0 = function (value) {
                tempRet0 = value
            };
            var wasmBinary;
            if (Module["wasmBinary"])
                wasmBinary = Module["wasmBinary"];
            var noExitRuntime;
            if (Module["noExitRuntime"])
                noExitRuntime = Module["noExitRuntime"];
            if (typeof WXWebAssembly !== "object") {
                err("no native wasm support detected")
            }
            function setValue(ptr, value, type, noSafe) {
                type = type || "i8";
                if (type.charAt(type.length - 1) === "*")
                    type = "i32";
                switch (type) {
                    case "i1":
                        HEAP8[ptr >> 0] = value;
                        break;
                    case "i8":
                        HEAP8[ptr >> 0] = value;
                        break;
                    case "i16":
                        HEAP16[ptr >> 1] = value;
                        break;
                    case "i32":
                        HEAP32[ptr >> 2] = value;
                        break;
                    case "i64":
                        tempI64 = [value >>> 0, (tempDouble = value,
                            +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                            HEAP32[ptr >> 2] = tempI64[0],
                            HEAP32[ptr + 4 >> 2] = tempI64[1];
                        break;
                    case "float":
                        HEAPF32[ptr >> 2] = value;
                        break;
                    case "double":
                        HEAPF64[ptr >> 3] = value;
                        break;
                    default:
                        abort("invalid type for setValue: " + type)
                }
            }
            var wasmMemory;
            var wasmTable = new WXWebAssembly.Table({
                "initial": 8039,
                "maximum": 8039 + 0,
                "element": "anyfunc"
            });
            var ABORT = false;
            var EXITSTATUS = 0;
            function assert(condition, text) {
                if (!condition) {
                    abort("Assertion failed: " + text)
                }
            }
            function getCFunc(ident) {
                var func = Module["_" + ident];
                assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
                return func
            }
            function ccall(ident, returnType, argTypes, args, opts) {
                var toC = {
                    "string": function (str) {
                        var ret = 0;
                        if (str !== null && str !== undefined && str !== 0) {
                            var len = (str.length << 2) + 1;
                            ret = stackAlloc(len);
                            stringToUTF8(str, ret, len)
                        }
                        return ret
                    },
                    "array": function (arr) {
                        var ret = stackAlloc(arr.length);
                        writeArrayToMemory(arr, ret);
                        return ret
                    }
                };
                function convertReturnValue(ret) {
                    if (returnType === "string")
                        return UTF8ToString(ret);
                    if (returnType === "boolean")
                        return Boolean(ret);
                    return ret
                }
                var func = getCFunc(ident);
                var cArgs = [];
                var stack = 0;
                if (args) {
                    for (var i = 0; i < args.length; i++) {
                        var converter = toC[argTypes[i]];
                        if (converter) {
                            if (stack === 0)
                                stack = stackSave();
                            cArgs[i] = converter(args[i])
                        } else {
                            cArgs[i] = args[i]
                        }
                    }
                }
                var ret = func.apply(null, cArgs);
                ret = convertReturnValue(ret);
                if (stack !== 0)
                    stackRestore(stack);
                return ret
            }
            var ALLOC_NONE = 3;
            function allocate(slab, types, allocator, ptr) {
                var zeroinit, size;
                if (typeof slab === "number") {
                    zeroinit = true;
                    size = slab
                } else {
                    zeroinit = false;
                    size = slab.length
                }
                var singleType = typeof types === "string" ? types : null;
                var ret;
                if (allocator == ALLOC_NONE) {
                    ret = ptr
                } else {
                    ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
                }
                if (zeroinit) {
                    var stop;
                    ptr = ret;
                    assert((ret & 3) == 0);
                    stop = ret + (size & ~3);
                    for (; ptr < stop; ptr += 4) {
                        HEAP32[ptr >> 2] = 0
                    }
                    stop = ret + size;
                    while (ptr < stop) {
                        HEAP8[ptr++ >> 0] = 0
                    }
                    return ret
                }
                if (singleType === "i8") {
                    if (slab.subarray || slab.slice) {
                        HEAPU8.set(slab, ret)
                    } else {
                        HEAPU8.set(new Uint8Array(slab), ret)
                    }
                    return ret
                }
                var i = 0, type, typeSize, previousType;
                while (i < size) {
                    var curr = slab[i];
                    type = singleType || types[i];
                    if (type === 0) {
                        i++;
                        continue
                    }
                    if (type == "i64")
                        type = "i32";
                    setValue(ret + i, curr, type);
                    if (previousType !== type) {
                        typeSize = getNativeTypeSize(type);
                        previousType = type
                    }
                    i += typeSize
                }
                return ret
            }
            function getMemory(size) {
                if (!runtimeInitialized)
                    return dynamicAlloc(size);
                return _malloc(size)
            }
            var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
            function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
                var endIdx = idx + maxBytesToRead;
                var endPtr = idx;
                while (u8Array[endPtr] && !(endPtr >= endIdx))
                    ++endPtr;
                if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
                    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
                } else {
                    var str = "";
                    while (idx < endPtr) {
                        var u0 = u8Array[idx++];
                        if (!(u0 & 128)) {
                            str += String.fromCharCode(u0);
                            continue
                        }
                        var u1 = u8Array[idx++] & 63;
                        if ((u0 & 224) == 192) {
                            str += String.fromCharCode((u0 & 31) << 6 | u1);
                            continue
                        }
                        var u2 = u8Array[idx++] & 63;
                        if ((u0 & 240) == 224) {
                            u0 = (u0 & 15) << 12 | u1 << 6 | u2
                        } else {
                            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
                        }
                        if (u0 < 65536) {
                            str += String.fromCharCode(u0)
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                        }
                    }
                }
                return str
            }
            function UTF8ToString(ptr, maxBytesToRead) {
                return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
            }
            function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
                if (!(maxBytesToWrite > 0))
                    return 0;
                var startIdx = outIdx;
                var endIdx = outIdx + maxBytesToWrite - 1;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) {
                        var u1 = str.charCodeAt(++i);
                        u = 65536 + ((u & 1023) << 10) | u1 & 1023
                    }
                    if (u <= 127) {
                        if (outIdx >= endIdx)
                            break;
                        outU8Array[outIdx++] = u
                    } else if (u <= 2047) {
                        if (outIdx + 1 >= endIdx)
                            break;
                        outU8Array[outIdx++] = 192 | u >> 6;
                        outU8Array[outIdx++] = 128 | u & 63
                    } else if (u <= 65535) {
                        if (outIdx + 2 >= endIdx)
                            break;
                        outU8Array[outIdx++] = 224 | u >> 12;
                        outU8Array[outIdx++] = 128 | u >> 6 & 63;
                        outU8Array[outIdx++] = 128 | u & 63
                    } else {
                        if (outIdx + 3 >= endIdx)
                            break;
                        outU8Array[outIdx++] = 240 | u >> 18;
                        outU8Array[outIdx++] = 128 | u >> 12 & 63;
                        outU8Array[outIdx++] = 128 | u >> 6 & 63;
                        outU8Array[outIdx++] = 128 | u & 63
                    }
                }
                outU8Array[outIdx] = 0;
                return outIdx - startIdx
            }
            function stringToUTF8(str, outPtr, maxBytesToWrite) {
                return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
            }
            function lengthBytesUTF8(str) {
                var len = 0;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343)
                        u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
                    if (u <= 127)
                        ++len;
                    else if (u <= 2047)
                        len += 2;
                    else if (u <= 65535)
                        len += 3;
                    else
                        len += 4
                }
                return len
            }
            var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
            function writeArrayToMemory(array, buffer) {
                HEAP8.set(array, buffer)
            }
            function writeAsciiToMemory(str, buffer, dontAddNull) {
                for (var i = 0; i < str.length; ++i) {
                    HEAP8[buffer++ >> 0] = str.charCodeAt(i)
                }
                if (!dontAddNull)
                    HEAP8[buffer >> 0] = 0
            }
            var PAGE_SIZE = 16384;
            var WASM_PAGE_SIZE = 65536;
            function alignUp(x, multiple) {
                if (x % multiple > 0) {
                    x += multiple - x % multiple
                }
                return x
            }
            var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
            function updateGlobalBufferAndViews(buf) {
                buffer = buf;
                Module["HEAP8"] = HEAP8 = new Int8Array(buf);
                Module["HEAP16"] = HEAP16 = new Int16Array(buf);
                Module["HEAP32"] = HEAP32 = new Int32Array(buf);
                Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
                Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
                Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
                Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
                Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
            }
            var STACK_BASE = 6518496
                , DYNAMIC_BASE = 6518496
                , DYNAMICTOP_PTR = 1275456;
            var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 134217728;
            if (Module["wasmMemory"]) {
                wasmMemory = Module["wasmMemory"]
            } else {
                wasmMemory = new WXWebAssembly.Memory({
                    "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
                    "maximum": 1073741824 / WASM_PAGE_SIZE
                })
            }
            if (wasmMemory) {
                buffer = wasmMemory.buffer
            }
            INITIAL_TOTAL_MEMORY = buffer.byteLength;
            updateGlobalBufferAndViews(buffer);
            HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
            function callRuntimeCallbacks(callbacks) {
                while (callbacks.length > 0) {
                    var callback = callbacks.shift();
                    if (typeof callback == "function") {
                        callback();
                        continue
                    }
                    var func = callback.func;
                    if (typeof func === "number") {
                        if (callback.arg === undefined) {
                            Module["dynCall_v"](func)
                        } else {
                            Module["dynCall_vi"](func, callback.arg)
                        }
                    } else {
                        func(callback.arg === undefined ? null : callback.arg)
                    }
                }
            }
            var __ATPRERUN__ = [];
            var __ATINIT__ = [];
            var __ATMAIN__ = [];
            var __ATEXIT__ = [];
            var __ATPOSTRUN__ = [];
            var runtimeInitialized = false;
            var runtimeExited = false;
            function preRun() {
                if (Module["preRun"]) {
                    if (typeof Module["preRun"] == "function")
                        Module["preRun"] = [Module["preRun"]];
                    while (Module["preRun"].length) {
                        addOnPreRun(Module["preRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPRERUN__)
            }
            function initRuntime() {
                runtimeInitialized = true;
                if (!Module["noFSInit"] && !FS.init.initialized)
                    FS.init();
                TTY.init();
                callRuntimeCallbacks(__ATINIT__)
            }
            function preMain() {
                FS.ignorePermissions = false;
                callRuntimeCallbacks(__ATMAIN__)
            }
            function exitRuntime() {
                runtimeExited = true
            }
            function postRun() {
                if (Module["postRun"]) {
                    if (typeof Module["postRun"] == "function")
                        Module["postRun"] = [Module["postRun"]];
                    while (Module["postRun"].length) {
                        addOnPostRun(Module["postRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPOSTRUN__)
            }
            function addOnPreRun(cb) {
                __ATPRERUN__.unshift(cb)
            }
            function addOnPostRun(cb) {
                __ATPOSTRUN__.unshift(cb)
            }
            var Math_abs = Math.abs;
            var Math_ceil = Math.ceil;
            var Math_floor = Math.floor;
            var Math_min = Math.min;
            var runDependencies = 0;
            var runDependencyWatcher = null;
            var dependenciesFulfilled = null;
            function getUniqueRunDependency(id) {
                return id
            }
            function addRunDependency(id) {
                runDependencies++;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
            }
            function removeRunDependency(id) {
                runDependencies--;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
                if (runDependencies == 0) {
                    if (runDependencyWatcher !== null) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null
                    }
                    if (dependenciesFulfilled) {
                        var callback = dependenciesFulfilled;
                        dependenciesFulfilled = null;
                        callback()
                    }
                }
            }
            Module["preloadedImages"] = {};
            Module["preloadedAudios"] = {};
            function abort(what) {
                if (Module["onAbort"]) {
                    Module["onAbort"](what)
                }
                what += "";
                out(what);
                err(what);
                ABORT = true;
                EXITSTATUS = 1;
                throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info."
            }
            var dataURIPrefix = "data:application/octet-stream;base64,";
            function isDataURI(filename) {
                return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
            }

            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile)
            }
            function getBinary() {
                try {
                    if (wasmBinary) {
                        return new Uint8Array(wasmBinary)
                    }
                    var binary = tryParseAsDataURI(wasmBinaryFile);
                    if (binary) {
                        return binary
                    }
                    if (readBinary) {
                        return readBinary(wasmBinaryFile)
                    } else {
                        throw "both async and sync fetching of the wasm failed"
                    }
                } catch (err) {
                    abort(err)
                }
            }
            function getBinaryPromise() {
                if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
                    return fetch(wasmBinaryFile, {
                        credentials: "same-origin"
                    }).then(function (response) {
                        if (!response["ok"]) {
                            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                        }
                        return response["arrayBuffer"]()
                    }).catch(function () {
                        return getBinary()
                    })
                }
                return new Promise(function (resolve, reject) {
                    resolve(getBinary())
                }
                )
            }
            function createWasm() {
                var info = {
                    "env": asmLibraryArg,
                    "wasi_unstable": asmLibraryArg
                };
                function receiveInstance(instance, module) {
                    var exports = instance.exports;
                    Module["asm"] = exports;
                    removeRunDependency("wasm-instantiate")
                }
                addRunDependency("wasm-instantiate");
                function receiveInstantiatedSource(output) {
                    receiveInstance(output["instance"])
                }
                function instantiateArrayBuffer(receiver) {
                    return getBinaryPromise().then(function (binary) {
                        return WXWebAssembly.instantiate(binary, info)
                    }).then(receiver, function (reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }
                function instantiateAsync() {
                    if (IsWechat) {
                        var result = WXWebAssembly.instantiate(wasmBinaryFile, info)
                        return result.then(receiveInstantiatedSource, function (reason) {
                            err("wasm streaming compile failed: " + reason);
                            err("falling back to ArrayBuffer instantiation");
                            instantiateArrayBuffer(receiveInstantiatedSource)
                        })

                    } else {
                        if (!wasmBinary && typeof WXWebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                            fetch(wasmBinaryFile, {
                                credentials: "same-origin"
                            }).then(function (response) {
                                var result = WXWebAssembly.instantiateStreaming(response, info);

                                return result.then(receiveInstantiatedSource, function (reason) {
                                    err("wasm streaming compile failed: " + reason);
                                    err("falling back to ArrayBuffer instantiation");
                                    instantiateArrayBuffer(receiveInstantiatedSource)
                                })
                            })
                        } else {
                            return instantiateArrayBuffer(receiveInstantiatedSource)
                        }

                    }


                }
                if (Module["instantiateWasm"]) {
                    try {
                        var exports = Module["instantiateWasm"](info, receiveInstance);
                        return exports
                    } catch (e) {
                        err("Module.instantiateWasm callback failed with error: " + e);
                        return false
                    }
                }
                instantiateAsync();
                return {}
            }
            var tempDouble;
            var tempI64;
            __ATINIT__.push({
                func: function () {
                    ___wasm_call_ctors()
                }
            });
            function _emscripten_set_main_loop_timing(mode, value) {
                Browser.mainLoop.timingMode = mode;
                Browser.mainLoop.timingValue = value;
                if (!Browser.mainLoop.func) {
                    return 1
                }
                if (mode == 0) {
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
                        var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
                        setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
                    }
                        ;
                    Browser.mainLoop.method = "timeout"
                } else if (mode == 1) {
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
                        Browser.requestAnimationFrame(Browser.mainLoop.runner)
                    }
                        ;
                    Browser.mainLoop.method = "rAF"
                } else if (mode == 2) {
                    if (typeof setImmediate === "undefined") {
                        var setImmediates = [];
                        var emscriptenMainLoopMessageId = "setimmediate";
                        var Browser_setImmediate_messageHandler = function (event) {
                            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                                event.stopPropagation();
                                setImmediates.shift()()
                            }
                        };
                        addEventListener("message", Browser_setImmediate_messageHandler, true);
                        setImmediate = function Browser_emulated_setImmediate(func) {
                            setImmediates.push(func);
                            if (ENVIRONMENT_IS_WORKER) {
                                if (Module["setImmediates"] === undefined)
                                    Module["setImmediates"] = [];
                                Module["setImmediates"].push(func);
                                postMessage({
                                    target: emscriptenMainLoopMessageId
                                })
                            } else
                                postMessage(emscriptenMainLoopMessageId, "*")
                        }
                    }
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
                        setImmediate(Browser.mainLoop.runner)
                    }
                        ;
                    Browser.mainLoop.method = "immediate"
                }
                return 0
            }
            function _emscripten_get_now() {
                abort()
            }
            function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
                noExitRuntime = true;
                assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
                Browser.mainLoop.func = func;
                Browser.mainLoop.arg = arg;
                var browserIterationFunc;
                if (typeof arg !== "undefined") {
                    browserIterationFunc = function () {
                        Module["dynCall_vi"](func, arg)
                    }
                } else {
                    browserIterationFunc = function () {
                        Module["dynCall_v"](func)
                    }
                }
                var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
                Browser.mainLoop.runner = function Browser_mainLoop_runner() {
                    if (ABORT)
                        return;
                    if (Browser.mainLoop.queue.length > 0) {
                        var start = Date.now();
                        var blocker = Browser.mainLoop.queue.shift();
                        blocker.func(blocker.arg);
                        if (Browser.mainLoop.remainingBlockers) {
                            var remaining = Browser.mainLoop.remainingBlockers;
                            var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                            if (blocker.counted) {
                                Browser.mainLoop.remainingBlockers = next
                            } else {
                                next = next + .5;
                                Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                            }
                        }
                        console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
                        Browser.mainLoop.updateStatus();
                        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
                            return;
                        setTimeout(Browser.mainLoop.runner, 0);
                        return
                    }
                    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
                        return;
                    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
                    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
                        Browser.mainLoop.scheduler();
                        return
                    } else if (Browser.mainLoop.timingMode == 0) {
                        Browser.mainLoop.tickStartTime = _emscripten_get_now()
                    }
                    if (Browser.mainLoop.method === "timeout" && Module.ctx) {
                        err("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
                        Browser.mainLoop.method = ""
                    }
                    Browser.mainLoop.runIter(browserIterationFunc);
                    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
                        return;
                    if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData)
                        SDL.audio.queueNewAudioData();
                    Browser.mainLoop.scheduler()
                }
                    ;
                if (!noSetTiming) {
                    if (fps && fps > 0)
                        _emscripten_set_main_loop_timing(0, 1e3 / fps);
                    else
                        _emscripten_set_main_loop_timing(1, 1);
                    Browser.mainLoop.scheduler()
                }
                if (simulateInfiniteLoop) {
                    throw "SimulateInfiniteLoop"
                }
            }
            var Browser = {
                mainLoop: {
                    scheduler: null,
                    method: "",
                    currentlyRunningMainloop: 0,
                    func: null,
                    arg: 0,
                    timingMode: 0,
                    timingValue: 0,
                    currentFrameNumber: 0,
                    queue: [],
                    pause: function () {
                        Browser.mainLoop.scheduler = null;
                        Browser.mainLoop.currentlyRunningMainloop++
                    },
                    resume: function () {
                        Browser.mainLoop.currentlyRunningMainloop++;
                        var timingMode = Browser.mainLoop.timingMode;
                        var timingValue = Browser.mainLoop.timingValue;
                        var func = Browser.mainLoop.func;
                        Browser.mainLoop.func = null;
                        _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
                        _emscripten_set_main_loop_timing(timingMode, timingValue);
                        Browser.mainLoop.scheduler()
                    },
                    updateStatus: function () {
                        if (Module["setStatus"]) {
                            var message = Module["statusMessage"] || "Please wait...";
                            var remaining = Browser.mainLoop.remainingBlockers;
                            var expected = Browser.mainLoop.expectedBlockers;
                            if (remaining) {
                                if (remaining < expected) {
                                    Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                                } else {
                                    Module["setStatus"](message)
                                }
                            } else {
                                Module["setStatus"]("")
                            }
                        }
                    },
                    runIter: function (func) {
                        if (ABORT)
                            return;
                        if (Module["preMainLoop"]) {
                            var preRet = Module["preMainLoop"]();
                            if (preRet === false) {
                                return
                            }
                        }
                        try {
                            func()
                        } catch (e) {
                            if (e instanceof ExitStatus) {
                                return
                            } else {
                                if (e && typeof e === "object" && e.stack)
                                    err("exception thrown: " + [e, e.stack]);
                                throw e
                            }
                        }
                        if (Module["postMainLoop"])
                            Module["postMainLoop"]()
                    }
                },
                isFullscreen: false,
                pointerLock: false,
                moduleContextCreatedCallbacks: [],
                workers: [],
                init: function () {
                    if (!Module["preloadPlugins"])
                        Module["preloadPlugins"] = [];
                    if (Browser.initted)
                        return;
                    Browser.initted = true;
                    try {
                        new Blob;
                        Browser.hasBlobConstructor = true
                    } catch (e) {
                        Browser.hasBlobConstructor = false;
                        console.log("warning: no blob constructor, cannot create blobs with mimetypes")
                    }
                    Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
                    Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
                    if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
                        console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
                        Module.noImageDecoding = true
                    }
                    var imagePlugin = {};
                    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
                        return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
                    }
                        ;
                    imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
                        var b = null;
                        if (Browser.hasBlobConstructor) {
                            try {
                                b = new Blob([byteArray], {
                                    type: Browser.getMimetype(name)
                                });
                                if (b.size !== byteArray.length) {
                                    b = new Blob([new Uint8Array(byteArray).buffer], {
                                        type: Browser.getMimetype(name)
                                    })
                                }
                            } catch (e) {
                                warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
                            }
                        }
                        if (!b) {
                            var bb = new Browser.BlobBuilder;
                            bb.append(new Uint8Array(byteArray).buffer);
                            b = bb.getBlob()
                        }
                        var url = Browser.URLObject.createObjectURL(b);
                        var img = new Image;
                        img.onload = function img_onload() {
                            assert(img.complete, "Image " + name + " could not be decoded");
                            var canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            Module["preloadedImages"][name] = canvas;
                            Browser.URLObject.revokeObjectURL(url);
                            if (onload)
                                onload(byteArray)
                        }
                            ;
                        img.onerror = function img_onerror(event) {
                            console.log("Image " + url + " could not be decoded");
                            if (onerror)
                                onerror()
                        }
                            ;
                        img.src = url
                    }
                        ;
                    Module["preloadPlugins"].push(imagePlugin);
                    var audioPlugin = {};
                    audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
                        return !Module.noAudioDecoding && name.substr(-4) in {
                            ".ogg": 1,
                            ".wav": 1,
                            ".mp3": 1
                        }
                    }
                        ;
                    audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
                        var done = false;
                        function finish(audio) {
                            if (done)
                                return;
                            done = true;
                            Module["preloadedAudios"][name] = audio;
                            if (onload)
                                onload(byteArray)
                        }
                        function fail() {
                            if (done)
                                return;
                            done = true;
                            Module["preloadedAudios"][name] = new Audio;
                            if (onerror)
                                onerror()
                        }
                        if (Browser.hasBlobConstructor) {
                            try {
                                var b = new Blob([byteArray], {
                                    type: Browser.getMimetype(name)
                                })
                            } catch (e) {
                                return fail()
                            }
                            var url = Browser.URLObject.createObjectURL(b);
                            var audio = new Audio;
                            audio.addEventListener("canplaythrough", function () {
                                finish(audio)
                            }, false);
                            audio.onerror = function audio_onerror(event) {
                                if (done)
                                    return;
                                console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
                                function encode64(data) {
                                    var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                                    var PAD = "=";
                                    var ret = "";
                                    var leftchar = 0;
                                    var leftbits = 0;
                                    for (var i = 0; i < data.length; i++) {
                                        leftchar = leftchar << 8 | data[i];
                                        leftbits += 8;
                                        while (leftbits >= 6) {
                                            var curr = leftchar >> leftbits - 6 & 63;
                                            leftbits -= 6;
                                            ret += BASE[curr]
                                        }
                                    }
                                    if (leftbits == 2) {
                                        ret += BASE[(leftchar & 3) << 4];
                                        ret += PAD + PAD
                                    } else if (leftbits == 4) {
                                        ret += BASE[(leftchar & 15) << 2];
                                        ret += PAD
                                    }
                                    return ret
                                }
                                audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                                finish(audio)
                            }
                                ;
                            audio.src = url;
                            Browser.safeSetTimeout(function () {
                                finish(audio)
                            }, 1e4)
                        } else {
                            return fail()
                        }
                    }
                        ;
                    Module["preloadPlugins"].push(audioPlugin);
                    function pointerLockChange() {
                        Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
                    }
                    var canvas = Module["canvas"];
                    if (canvas) {
                        canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function () { }
                            ;
                        canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function () { }
                            ;
                        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
                        document.addEventListener("pointerlockchange", pointerLockChange, false);
                        document.addEventListener("mozpointerlockchange", pointerLockChange, false);
                        document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
                        document.addEventListener("mspointerlockchange", pointerLockChange, false);
                        if (Module["elementPointerLock"]) {
                            canvas.addEventListener("click", function (ev) {
                                if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                                    Module["canvas"].requestPointerLock();
                                    ev.preventDefault()
                                }
                            }, false)
                        }
                    }
                },
                createContext: function (canvas, useWebGL, setInModule, webGLContextAttributes) {
                    if (useWebGL && Module.ctx && canvas == Module.canvas)
                        return Module.ctx;
                    var ctx;
                    var contextHandle;
                    if (useWebGL) {
                        var contextAttributes = {
                            antialias: false,
                            alpha: false,
                            majorVersion: 1
                        };
                        if (webGLContextAttributes) {
                            for (var attribute in webGLContextAttributes) {
                                contextAttributes[attribute] = webGLContextAttributes[attribute]
                            }
                        }
                        if (typeof GL !== "undefined") {
                            contextHandle = GL.createContext(canvas, contextAttributes);
                            if (contextHandle) {
                                ctx = GL.getContext(contextHandle).GLctx
                            }
                        }
                    } else {
                        ctx = canvas.getContext("2d")
                    }
                    if (!ctx)
                        return null;
                    if (setInModule) {
                        if (!useWebGL)
                            assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
                        Module.ctx = ctx;
                        if (useWebGL)
                            GL.makeContextCurrent(contextHandle);
                        Module.useWebGL = useWebGL;
                        Browser.moduleContextCreatedCallbacks.forEach(function (callback) {
                            callback()
                        });
                        Browser.init()
                    }
                    return ctx
                },
                destroyContext: function (canvas, useWebGL, setInModule) { },
                fullscreenHandlersInstalled: false,
                lockPointer: undefined,
                resizeCanvas: undefined,
                requestFullscreen: function (lockPointer, resizeCanvas, vrDevice) {
                    Browser.lockPointer = lockPointer;
                    Browser.resizeCanvas = resizeCanvas;
                    Browser.vrDevice = vrDevice;
                    if (typeof Browser.lockPointer === "undefined")
                        Browser.lockPointer = true;
                    if (typeof Browser.resizeCanvas === "undefined")
                        Browser.resizeCanvas = false;
                    if (typeof Browser.vrDevice === "undefined")
                        Browser.vrDevice = null;
                    var canvas = Module["canvas"];
                    function fullscreenChange() {
                        Browser.isFullscreen = false;
                        var canvasContainer = canvas.parentNode;
                        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                            canvas.exitFullscreen = Browser.exitFullscreen;
                            if (Browser.lockPointer)
                                canvas.requestPointerLock();
                            Browser.isFullscreen = true;
                            if (Browser.resizeCanvas) {
                                Browser.setFullscreenCanvasSize()
                            } else {
                                Browser.updateCanvasDimensions(canvas)
                            }
                        } else {
                            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                            canvasContainer.parentNode.removeChild(canvasContainer);
                            if (Browser.resizeCanvas) {
                                Browser.setWindowedCanvasSize()
                            } else {
                                Browser.updateCanvasDimensions(canvas)
                            }
                        }
                        if (Module["onFullScreen"])
                            Module["onFullScreen"](Browser.isFullscreen);
                        if (Module["onFullscreen"])
                            Module["onFullscreen"](Browser.isFullscreen)
                    }
                    if (!Browser.fullscreenHandlersInstalled) {
                        Browser.fullscreenHandlersInstalled = true;
                        document.addEventListener("fullscreenchange", fullscreenChange, false);
                        document.addEventListener("mozfullscreenchange", fullscreenChange, false);
                        document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
                        document.addEventListener("MSFullscreenChange", fullscreenChange, false)
                    }
                    var canvasContainer = document.createElement("div");
                    canvas.parentNode.insertBefore(canvasContainer, canvas);
                    canvasContainer.appendChild(canvas);
                    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function () {
                        canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"])
                    }
                        : null) || (canvasContainer["webkitRequestFullScreen"] ? function () {
                            canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"])
                        }
                            : null);
                    if (vrDevice) {
                        canvasContainer.requestFullscreen({
                            vrDisplay: vrDevice
                        })
                    } else {
                        canvasContainer.requestFullscreen()
                    }
                },
                requestFullScreen: function (lockPointer, resizeCanvas, vrDevice) {
                    err("Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.");
                    Browser.requestFullScreen = function (lockPointer, resizeCanvas, vrDevice) {
                        return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
                    }
                        ;
                    return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
                },
                exitFullscreen: function () {
                    if (!Browser.isFullscreen) {
                        return false
                    }
                    var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function () { }
                        ;
                    CFS.apply(document, []);
                    return true
                },
                nextRAF: 0,
                fakeRequestAnimationFrame: function (func) {
                    var now = Date.now();
                    if (Browser.nextRAF === 0) {
                        Browser.nextRAF = now + 1e3 / 60
                    } else {
                        while (now + 2 >= Browser.nextRAF) {
                            Browser.nextRAF += 1e3 / 60
                        }
                    }
                    var delay = Math.max(Browser.nextRAF - now, 0);
                    setTimeout(func, delay)
                },
                requestAnimationFrame: function (func) {
                    if (typeof requestAnimationFrame === "function") {
                        requestAnimationFrame(func);
                        return
                    }
                    var RAF = Browser.fakeRequestAnimationFrame;
                    RAF(func)
                },
                safeCallback: function (func) {
                    return function () {
                        if (!ABORT)
                            return func.apply(null, arguments)
                    }
                },
                allowAsyncCallbacks: true,
                queuedAsyncCallbacks: [],
                pauseAsyncCallbacks: function () {
                    Browser.allowAsyncCallbacks = false
                },
                resumeAsyncCallbacks: function () {
                    Browser.allowAsyncCallbacks = true;
                    if (Browser.queuedAsyncCallbacks.length > 0) {
                        var callbacks = Browser.queuedAsyncCallbacks;
                        Browser.queuedAsyncCallbacks = [];
                        callbacks.forEach(function (func) {
                            func()
                        })
                    }
                },
                safeRequestAnimationFrame: function (func) {
                    return Browser.requestAnimationFrame(function () {
                        if (ABORT)
                            return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        } else {
                            Browser.queuedAsyncCallbacks.push(func)
                        }
                    })
                },
                safeSetTimeout: function (func, timeout) {
                    noExitRuntime = true;
                    return setTimeout(function () {
                        if (ABORT)
                            return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        } else {
                            Browser.queuedAsyncCallbacks.push(func)
                        }
                    }, timeout)
                },
                safeSetInterval: function (func, timeout) {
                    noExitRuntime = true;
                    return setInterval(function () {
                        if (ABORT)
                            return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        }
                    }, timeout)
                },
                getMimetype: function (name) {
                    return {
                        "jpg": "image/jpeg",
                        "jpeg": "image/jpeg",
                        "png": "image/png",
                        "bmp": "image/bmp",
                        "ogg": "audio/ogg",
                        "wav": "audio/wav",
                        "mp3": "audio/mpeg"
                    }[name.substr(name.lastIndexOf(".") + 1)]
                },
                getUserMedia: function (func) {
                    if (!window.getUserMedia) {
                        window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
                    }
                    window.getUserMedia(func)
                },
                getMovementX: function (event) {
                    return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
                },
                getMovementY: function (event) {
                    return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
                },
                getMouseWheelDelta: function (event) {
                    var delta = 0;
                    switch (event.type) {
                        case "DOMMouseScroll":
                            delta = event.detail / 3;
                            break;
                        case "mousewheel":
                            delta = event.wheelDelta / 120;
                            break;
                        case "wheel":
                            delta = event.deltaY;
                            switch (event.deltaMode) {
                                case 0:
                                    delta /= 100;
                                    break;
                                case 1:
                                    delta /= 3;
                                    break;
                                case 2:
                                    delta *= 80;
                                    break;
                                default:
                                    throw "unrecognized mouse wheel delta mode: " + event.deltaMode
                            }
                            break;
                        default:
                            throw "unrecognized mouse wheel event: " + event.type
                    }
                    return delta
                },
                mouseX: 0,
                mouseY: 0,
                mouseMovementX: 0,
                mouseMovementY: 0,
                touches: {},
                lastTouches: {},
                calculateMouseEvent: function (event) {
                    if (Browser.pointerLock) {
                        if (event.type != "mousemove" && "mozMovementX" in event) {
                            Browser.mouseMovementX = Browser.mouseMovementY = 0
                        } else {
                            Browser.mouseMovementX = Browser.getMovementX(event);
                            Browser.mouseMovementY = Browser.getMovementY(event)
                        }
                        if (typeof SDL != "undefined") {
                            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
                        } else {
                            Browser.mouseX += Browser.mouseMovementX;
                            Browser.mouseY += Browser.mouseMovementY
                        }
                    } else {
                        var rect = Module["canvas"].getBoundingClientRect();
                        var cw = Module["canvas"].width;
                        var ch = Module["canvas"].height;
                        var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
                        var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
                        if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                            var touch = event.touch;
                            if (touch === undefined) {
                                return
                            }
                            var adjustedX = touch.pageX - (scrollX + rect.left);
                            var adjustedY = touch.pageY - (scrollY + rect.top);
                            adjustedX = adjustedX * (cw / rect.width);
                            adjustedY = adjustedY * (ch / rect.height);
                            var coords = {
                                x: adjustedX,
                                y: adjustedY
                            };
                            if (event.type === "touchstart") {
                                Browser.lastTouches[touch.identifier] = coords;
                                Browser.touches[touch.identifier] = coords
                            } else if (event.type === "touchend" || event.type === "touchmove") {
                                var last = Browser.touches[touch.identifier];
                                if (!last)
                                    last = coords;
                                Browser.lastTouches[touch.identifier] = last;
                                Browser.touches[touch.identifier] = coords
                            }
                            return
                        }
                        var x = event.pageX - (scrollX + rect.left);
                        var y = event.pageY - (scrollY + rect.top);
                        x = x * (cw / rect.width);
                        y = y * (ch / rect.height);
                        Browser.mouseMovementX = x - Browser.mouseX;
                        Browser.mouseMovementY = y - Browser.mouseY;
                        Browser.mouseX = x;
                        Browser.mouseY = y
                    }
                },
                asyncLoad: function (url, onload, onerror, noRunDep) {
                    var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
                    readAsync(url, function (arrayBuffer) {
                        assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
                        onload(new Uint8Array(arrayBuffer));
                        if (dep)
                            removeRunDependency(dep)
                    }, function (event) {
                        if (onerror) {
                            onerror()
                        } else {
                            throw 'Loading data file "' + url + '" failed.'
                        }
                    });
                    if (dep)
                        addRunDependency(dep)
                },
                resizeListeners: [],
                updateResizeListeners: function () {
                    var canvas = Module["canvas"];
                    Browser.resizeListeners.forEach(function (listener) {
                        listener(canvas.width, canvas.height)
                    })
                },
                setCanvasSize: function (width, height, noUpdates) {
                    var canvas = Module["canvas"];
                    Browser.updateCanvasDimensions(canvas, width, height);
                    if (!noUpdates)
                        Browser.updateResizeListeners()
                },
                windowedWidth: 0,
                windowedHeight: 0,
                setFullscreenCanvasSize: function () {
                    if (typeof SDL != "undefined") {
                        var flags = HEAPU32[SDL.screen >> 2];
                        flags = flags | 8388608;
                        HEAP32[SDL.screen >> 2] = flags
                    }
                    Browser.updateCanvasDimensions(Module["canvas"]);
                    Browser.updateResizeListeners()
                },
                setWindowedCanvasSize: function () {
                    if (typeof SDL != "undefined") {
                        var flags = HEAPU32[SDL.screen >> 2];
                        flags = flags & ~8388608;
                        HEAP32[SDL.screen >> 2] = flags
                    }
                    Browser.updateCanvasDimensions(Module["canvas"]);
                    Browser.updateResizeListeners()
                },
                updateCanvasDimensions: function (canvas, wNative, hNative) {
                    if (wNative && hNative) {
                        canvas.widthNative = wNative;
                        canvas.heightNative = hNative
                    } else {
                        wNative = canvas.widthNative;
                        hNative = canvas.heightNative
                    }
                    var w = wNative;
                    var h = hNative;
                    if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
                        if (w / h < Module["forcedAspectRatio"]) {
                            w = Math.round(h * Module["forcedAspectRatio"])
                        } else {
                            h = Math.round(w / Module["forcedAspectRatio"])
                        }
                    }
                    if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
                        var factor = Math.min(screen.width / w, screen.height / h);
                        w = Math.round(w * factor);
                        h = Math.round(h * factor)
                    }
                    if (Browser.resizeCanvas) {
                        if (canvas.width != w)
                            canvas.width = w;
                        if (canvas.height != h)
                            canvas.height = h;
                        if (typeof canvas.style != "undefined") {
                            canvas.style.removeProperty("width");
                            canvas.style.removeProperty("height")
                        }
                    } else {
                        if (canvas.width != wNative)
                            canvas.width = wNative;
                        if (canvas.height != hNative)
                            canvas.height = hNative;
                        if (typeof canvas.style != "undefined") {
                            if (w != wNative || h != hNative) {
                                canvas.style.setProperty("width", w + "px", "important");
                                canvas.style.setProperty("height", h + "px", "important")
                            } else {
                                canvas.style.removeProperty("width");
                                canvas.style.removeProperty("height")
                            }
                        }
                    }
                },
                wgetRequests: {},
                nextWgetRequestHandle: 0,
                getNextWgetRequestHandle: function () {
                    var handle = Browser.nextWgetRequestHandle;
                    Browser.nextWgetRequestHandle++;
                    return handle
                }
            };
            function demangle(func) {
                var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
                assert(__cxa_demangle_func);
                try {
                    var s = func;
                    if (s.startsWith("__Z"))
                        s = s.substr(1);
                    var len = lengthBytesUTF8(s) + 1;
                    var buf = _malloc(len);
                    stringToUTF8(s, buf, len);
                    var status = _malloc(4);
                    var ret = __cxa_demangle_func(buf, 0, 0, status);
                    if (HEAP32[status >> 2] === 0 && ret) {
                        return UTF8ToString(ret)
                    }
                } catch (e) { } finally {
                    if (buf)
                        _free(buf);
                    if (status)
                        _free(status);
                    if (ret)
                        _free(ret)
                }
                return func
            }
            function demangleAll(text) {
                var regex = /\b_Z[\w\d_]+/g;
                return text.replace(regex, function (x) {
                    var y = demangle(x);
                    return x === y ? x : y + " [" + x + "]"
                })
            }
            function jsStackTrace() {
                var err = new Error;
                if (!err.stack) {
                    try {
                        throw new Error(0)
                    } catch (e) {
                        err = e
                    }
                    if (!err.stack) {
                        return "(no stack trace available)"
                    }
                }
                return err.stack.toString()
            }
            function stackTrace() {
                var js = jsStackTrace();
                if (Module["extraStackTrace"])
                    js += "\n" + Module["extraStackTrace"]();
                return demangleAll(js)
            }
            function ___cxa_allocate_exception(size) {
                return _malloc(size)
            }
            function _atexit(func, arg) {
                __ATEXIT__.unshift({
                    func: func,
                    arg: arg
                })
            }
            function ___cxa_atexit() {
                return _atexit.apply(null, arguments)
            }
            var ___exception_infos = {};
            var ___exception_last = 0;
            function ___cxa_throw(ptr, type, destructor) {
                ___exception_infos[ptr] = {
                    ptr: ptr,
                    adjusted: [ptr],
                    type: type,
                    destructor: destructor,
                    refcount: 0,
                    caught: false,
                    rethrown: false
                };
                ___exception_last = ptr;
                if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
                    __ZSt18uncaught_exceptionv.uncaught_exceptions = 1
                } else {
                    __ZSt18uncaught_exceptionv.uncaught_exceptions++
                }
                throw ptr
            }
            function ___lock() { }
            function ___setErrNo(value) {
                if (Module["___errno_location"])
                    HEAP32[Module["___errno_location"]() >> 2] = value;
                return value
            }
            function ___map_file(pathname, size) {
                ___setErrNo(63);
                return -1
            }
            var PATH = {
                splitPath: function (filename) {
                    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                    return splitPathRe.exec(filename).slice(1)
                },
                normalizeArray: function (parts, allowAboveRoot) {
                    var up = 0;
                    for (var i = parts.length - 1; i >= 0; i--) {
                        var last = parts[i];
                        if (last === ".") {
                            parts.splice(i, 1)
                        } else if (last === "..") {
                            parts.splice(i, 1);
                            up++
                        } else if (up) {
                            parts.splice(i, 1);
                            up--
                        }
                    }
                    if (allowAboveRoot) {
                        for (; up; up--) {
                            parts.unshift("..")
                        }
                    }
                    return parts
                },
                normalize: function (path) {
                    var isAbsolute = path.charAt(0) === "/"
                        , trailingSlash = path.substr(-1) === "/";
                    path = PATH.normalizeArray(path.split("/").filter(function (p) {
                        return !!p
                    }), !isAbsolute).join("/");
                    if (!path && !isAbsolute) {
                        path = "."
                    }
                    if (path && trailingSlash) {
                        path += "/"
                    }
                    return (isAbsolute ? "/" : "") + path
                },
                dirname: function (path) {
                    var result = PATH.splitPath(path)
                        , root = result[0]
                        , dir = result[1];
                    if (!root && !dir) {
                        return "."
                    }
                    if (dir) {
                        dir = dir.substr(0, dir.length - 1)
                    }
                    return root + dir
                },
                basename: function (path) {
                    if (path === "/")
                        return "/";
                    var lastSlash = path.lastIndexOf("/");
                    if (lastSlash === -1)
                        return path;
                    return path.substr(lastSlash + 1)
                },
                extname: function (path) {
                    return PATH.splitPath(path)[3]
                },
                join: function () {
                    var paths = Array.prototype.slice.call(arguments, 0);
                    return PATH.normalize(paths.join("/"))
                },
                join2: function (l, r) {
                    return PATH.normalize(l + "/" + r)
                }
            };
            var PATH_FS = {
                resolve: function () {
                    var resolvedPath = ""
                        , resolvedAbsolute = false;
                    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                        var path = i >= 0 ? arguments[i] : FS.cwd();
                        if (typeof path !== "string") {
                            throw new TypeError("Arguments to path.resolve must be strings")
                        } else if (!path) {
                            return ""
                        }
                        resolvedPath = path + "/" + resolvedPath;
                        resolvedAbsolute = path.charAt(0) === "/"
                    }
                    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function (p) {
                        return !!p
                    }), !resolvedAbsolute).join("/");
                    return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
                },
                relative: function (from, to) {
                    from = PATH_FS.resolve(from).substr(1);
                    to = PATH_FS.resolve(to).substr(1);
                    function trim(arr) {
                        var start = 0;
                        for (; start < arr.length; start++) {
                            if (arr[start] !== "")
                                break
                        }
                        var end = arr.length - 1;
                        for (; end >= 0; end--) {
                            if (arr[end] !== "")
                                break
                        }
                        if (start > end)
                            return [];
                        return arr.slice(start, end - start + 1)
                    }
                    var fromParts = trim(from.split("/"));
                    var toParts = trim(to.split("/"));
                    var length = Math.min(fromParts.length, toParts.length);
                    var samePartsLength = length;
                    for (var i = 0; i < length; i++) {
                        if (fromParts[i] !== toParts[i]) {
                            samePartsLength = i;
                            break
                        }
                    }
                    var outputParts = [];
                    for (var i = samePartsLength; i < fromParts.length; i++) {
                        outputParts.push("..")
                    }
                    outputParts = outputParts.concat(toParts.slice(samePartsLength));
                    return outputParts.join("/")
                }
            };
            var TTY = {
                ttys: [],
                init: function () { },
                shutdown: function () { },
                register: function (dev, ops) {
                    TTY.ttys[dev] = {
                        input: [],
                        output: [],
                        ops: ops
                    };
                    FS.registerDevice(dev, TTY.stream_ops)
                },
                stream_ops: {
                    open: function (stream) {
                        var tty = TTY.ttys[stream.node.rdev];
                        if (!tty) {
                            throw new FS.ErrnoError(43)
                        }
                        stream.tty = tty;
                        stream.seekable = false
                    },
                    close: function (stream) {
                        stream.tty.ops.flush(stream.tty)
                    },
                    flush: function (stream) {
                        stream.tty.ops.flush(stream.tty)
                    },
                    read: function (stream, buffer, offset, length, pos) {
                        if (!stream.tty || !stream.tty.ops.get_char) {
                            throw new FS.ErrnoError(60)
                        }
                        var bytesRead = 0;
                        for (var i = 0; i < length; i++) {
                            var result;
                            try {
                                result = stream.tty.ops.get_char(stream.tty)
                            } catch (e) {
                                throw new FS.ErrnoError(29)
                            }
                            if (result === undefined && bytesRead === 0) {
                                throw new FS.ErrnoError(6)
                            }
                            if (result === null || result === undefined)
                                break;
                            bytesRead++;
                            buffer[offset + i] = result
                        }
                        if (bytesRead) {
                            stream.node.timestamp = Date.now()
                        }
                        return bytesRead
                    },
                    write: function (stream, buffer, offset, length, pos) {
                        if (!stream.tty || !stream.tty.ops.put_char) {
                            throw new FS.ErrnoError(60)
                        }
                        try {
                            for (var i = 0; i < length; i++) {
                                stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                            }
                        } catch (e) {
                            throw new FS.ErrnoError(29)
                        }
                        if (length) {
                            stream.node.timestamp = Date.now()
                        }
                        return i
                    }
                },
                default_tty_ops: {
                    get_char: function (tty) {
                        if (!tty.input.length) {
                            var result = null;
                            if (ENVIRONMENT_IS_NODE) {
                                var BUFSIZE = 256;
                                var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                                var bytesRead = 0;
                                try {
                                    bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                                } catch (e) {
                                    if (e.toString().indexOf("EOF") != -1)
                                        bytesRead = 0;
                                    else
                                        throw e
                                }
                                if (bytesRead > 0) {
                                    result = buf.slice(0, bytesRead).toString("utf-8")
                                } else {
                                    result = null
                                }
                            } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                                result = window.prompt("Input: ");
                                if (result !== null) {
                                    result += "\n"
                                }
                            } else if (typeof readline == "function") {
                                result = readline();
                                if (result !== null) {
                                    result += "\n"
                                }
                            }
                            if (!result) {
                                return null
                            }
                            tty.input = intArrayFromString(result, true)
                        }
                        return tty.input.shift()
                    },
                    put_char: function (tty, val) {
                        if (val === null || val === 10) {
                            out(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        } else {
                            if (val != 0)
                                tty.output.push(val)
                        }
                    },
                    flush: function (tty) {
                        if (tty.output && tty.output.length > 0) {
                            out(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        }
                    }
                },
                default_tty1_ops: {
                    put_char: function (tty, val) {
                        if (val === null || val === 10) {
                            err(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        } else {
                            if (val != 0)
                                tty.output.push(val)
                        }
                    },
                    flush: function (tty) {
                        if (tty.output && tty.output.length > 0) {
                            err(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        }
                    }
                }
            };
            var MEMFS = {
                ops_table: null,
                mount: function (mount) {
                    return MEMFS.createNode(null, "/", 16384 | 511, 0)
                },
                createNode: function (parent, name, mode, dev) {
                    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                        throw new FS.ErrnoError(63)
                    }
                    if (!MEMFS.ops_table) {
                        MEMFS.ops_table = {
                            dir: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr,
                                    lookup: MEMFS.node_ops.lookup,
                                    mknod: MEMFS.node_ops.mknod,
                                    rename: MEMFS.node_ops.rename,
                                    unlink: MEMFS.node_ops.unlink,
                                    rmdir: MEMFS.node_ops.rmdir,
                                    readdir: MEMFS.node_ops.readdir,
                                    symlink: MEMFS.node_ops.symlink
                                },
                                stream: {
                                    llseek: MEMFS.stream_ops.llseek
                                }
                            },
                            file: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr
                                },
                                stream: {
                                    llseek: MEMFS.stream_ops.llseek,
                                    read: MEMFS.stream_ops.read,
                                    write: MEMFS.stream_ops.write,
                                    allocate: MEMFS.stream_ops.allocate,
                                    mmap: MEMFS.stream_ops.mmap,
                                    msync: MEMFS.stream_ops.msync
                                }
                            },
                            link: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr,
                                    readlink: MEMFS.node_ops.readlink
                                },
                                stream: {}
                            },
                            chrdev: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr
                                },
                                stream: FS.chrdev_stream_ops
                            }
                        }
                    }
                    var node = FS.createNode(parent, name, mode, dev);
                    if (FS.isDir(node.mode)) {
                        node.node_ops = MEMFS.ops_table.dir.node;
                        node.stream_ops = MEMFS.ops_table.dir.stream;
                        node.contents = {}
                    } else if (FS.isFile(node.mode)) {
                        node.node_ops = MEMFS.ops_table.file.node;
                        node.stream_ops = MEMFS.ops_table.file.stream;
                        node.usedBytes = 0;
                        node.contents = null
                    } else if (FS.isLink(node.mode)) {
                        node.node_ops = MEMFS.ops_table.link.node;
                        node.stream_ops = MEMFS.ops_table.link.stream
                    } else if (FS.isChrdev(node.mode)) {
                        node.node_ops = MEMFS.ops_table.chrdev.node;
                        node.stream_ops = MEMFS.ops_table.chrdev.stream
                    }
                    node.timestamp = Date.now();
                    if (parent) {
                        parent.contents[name] = node
                    }
                    return node
                },
                getFileDataAsRegularArray: function (node) {
                    if (node.contents && node.contents.subarray) {
                        var arr = [];
                        for (var i = 0; i < node.usedBytes; ++i)
                            arr.push(node.contents[i]);
                        return arr
                    }
                    return node.contents
                },
                getFileDataAsTypedArray: function (node) {
                    if (!node.contents)
                        return new Uint8Array;
                    if (node.contents.subarray)
                        return node.contents.subarray(0, node.usedBytes);
                    return new Uint8Array(node.contents)
                },
                expandFileStorage: function (node, newCapacity) {
                    var prevCapacity = node.contents ? node.contents.length : 0;
                    if (prevCapacity >= newCapacity)
                        return;
                    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
                    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
                    if (prevCapacity != 0)
                        newCapacity = Math.max(newCapacity, 256);
                    var oldContents = node.contents;
                    node.contents = new Uint8Array(newCapacity);
                    if (node.usedBytes > 0)
                        node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
                    return
                },
                resizeFileStorage: function (node, newSize) {
                    if (node.usedBytes == newSize)
                        return;
                    if (newSize == 0) {
                        node.contents = null;
                        node.usedBytes = 0;
                        return
                    }
                    if (!node.contents || node.contents.subarray) {
                        var oldContents = node.contents;
                        node.contents = new Uint8Array(new ArrayBuffer(newSize));
                        if (oldContents) {
                            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
                        }
                        node.usedBytes = newSize;
                        return
                    }
                    if (!node.contents)
                        node.contents = [];
                    if (node.contents.length > newSize)
                        node.contents.length = newSize;
                    else
                        while (node.contents.length < newSize)
                            node.contents.push(0);
                    node.usedBytes = newSize
                },
                node_ops: {
                    getattr: function (node) {
                        var attr = {};
                        attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                        attr.ino = node.id;
                        attr.mode = node.mode;
                        attr.nlink = 1;
                        attr.uid = 0;
                        attr.gid = 0;
                        attr.rdev = node.rdev;
                        if (FS.isDir(node.mode)) {
                            attr.size = 4096
                        } else if (FS.isFile(node.mode)) {
                            attr.size = node.usedBytes
                        } else if (FS.isLink(node.mode)) {
                            attr.size = node.link.length
                        } else {
                            attr.size = 0
                        }
                        attr.atime = new Date(node.timestamp);
                        attr.mtime = new Date(node.timestamp);
                        attr.ctime = new Date(node.timestamp);
                        attr.blksize = 4096;
                        attr.blocks = Math.ceil(attr.size / attr.blksize);
                        return attr
                    },
                    setattr: function (node, attr) {
                        if (attr.mode !== undefined) {
                            node.mode = attr.mode
                        }
                        if (attr.timestamp !== undefined) {
                            node.timestamp = attr.timestamp
                        }
                        if (attr.size !== undefined) {
                            MEMFS.resizeFileStorage(node, attr.size)
                        }
                    },
                    lookup: function (parent, name) {
                        throw FS.genericErrors[44]
                    },
                    mknod: function (parent, name, mode, dev) {
                        return MEMFS.createNode(parent, name, mode, dev)
                    },
                    rename: function (old_node, new_dir, new_name) {
                        if (FS.isDir(old_node.mode)) {
                            var new_node;
                            try {
                                new_node = FS.lookupNode(new_dir, new_name)
                            } catch (e) { }
                            if (new_node) {
                                for (var i in new_node.contents) {
                                    throw new FS.ErrnoError(55)
                                }
                            }
                        }
                        delete old_node.parent.contents[old_node.name];
                        old_node.name = new_name;
                        new_dir.contents[new_name] = old_node;
                        old_node.parent = new_dir
                    },
                    unlink: function (parent, name) {
                        delete parent.contents[name]
                    },
                    rmdir: function (parent, name) {
                        var node = FS.lookupNode(parent, name);
                        for (var i in node.contents) {
                            throw new FS.ErrnoError(55)
                        }
                        delete parent.contents[name]
                    },
                    readdir: function (node) {
                        var entries = [".", ".."];
                        for (var key in node.contents) {
                            if (!node.contents.hasOwnProperty(key)) {
                                continue
                            }
                            entries.push(key)
                        }
                        return entries
                    },
                    symlink: function (parent, newname, oldpath) {
                        var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                        node.link = oldpath;
                        return node
                    },
                    readlink: function (node) {
                        if (!FS.isLink(node.mode)) {
                            throw new FS.ErrnoError(28)
                        }
                        return node.link
                    }
                },
                stream_ops: {
                    read: function (stream, buffer, offset, length, position) {
                        var contents = stream.node.contents;
                        if (position >= stream.node.usedBytes)
                            return 0;
                        var size = Math.min(stream.node.usedBytes - position, length);
                        if (size > 8 && contents.subarray) {
                            buffer.set(contents.subarray(position, position + size), offset)
                        } else {
                            for (var i = 0; i < size; i++)
                                buffer[offset + i] = contents[position + i]
                        }
                        return size
                    },
                    write: function (stream, buffer, offset, length, position, canOwn) {
                        canOwn = false;
                        if (!length)
                            return 0;
                        var node = stream.node;
                        node.timestamp = Date.now();
                        if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                            if (canOwn) {
                                node.contents = buffer.subarray(offset, offset + length);
                                node.usedBytes = length;
                                return length
                            } else if (node.usedBytes === 0 && position === 0) {
                                node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                                node.usedBytes = length;
                                return length
                            } else if (position + length <= node.usedBytes) {
                                node.contents.set(buffer.subarray(offset, offset + length), position);
                                return length
                            }
                        }
                        MEMFS.expandFileStorage(node, position + length);
                        if (node.contents.subarray && buffer.subarray)
                            node.contents.set(buffer.subarray(offset, offset + length), position);
                        else {
                            for (var i = 0; i < length; i++) {
                                node.contents[position + i] = buffer[offset + i]
                            }
                        }
                        node.usedBytes = Math.max(node.usedBytes, position + length);
                        return length
                    },
                    llseek: function (stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                position += stream.node.usedBytes
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(28)
                        }
                        return position
                    },
                    allocate: function (stream, offset, length) {
                        MEMFS.expandFileStorage(stream.node, offset + length);
                        stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
                    },
                    mmap: function (stream, buffer, offset, length, position, prot, flags) {
                        if (!FS.isFile(stream.node.mode)) {
                            throw new FS.ErrnoError(43)
                        }
                        var ptr;
                        var allocated;
                        var contents = stream.node.contents;
                        if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                            allocated = false;
                            ptr = contents.byteOffset
                        } else {
                            if (position > 0 || position + length < stream.node.usedBytes) {
                                if (contents.subarray) {
                                    contents = contents.subarray(position, position + length)
                                } else {
                                    contents = Array.prototype.slice.call(contents, position, position + length)
                                }
                            }
                            allocated = true;
                            var fromHeap = buffer.buffer == HEAP8.buffer;
                            ptr = _malloc(length);
                            if (!ptr) {
                                throw new FS.ErrnoError(48)
                            }
                            (fromHeap ? HEAP8 : buffer).set(contents, ptr)
                        }
                        return {
                            ptr: ptr,
                            allocated: allocated
                        }
                    },
                    msync: function (stream, buffer, offset, length, mmapFlags) {
                        if (!FS.isFile(stream.node.mode)) {
                            throw new FS.ErrnoError(43)
                        }
                        if (mmapFlags & 2) {
                            return 0
                        }
                        var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                        return 0
                    }
                }
            };
            var IDBFS = {
                dbs: {},
                indexedDB: function () {
                    if (typeof indexedDB !== "undefined")
                        return indexedDB;
                    var ret = null;
                    if (typeof window === "object")
                        ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
                    assert(ret, "IDBFS used, but indexedDB not supported");
                    return ret
                },
                DB_VERSION: 21,
                DB_STORE_NAME: "FILE_DATA",
                mount: function (mount) {
                    return MEMFS.mount.apply(null, arguments)
                },
                syncfs: function (mount, populate, callback) {
                    IDBFS.getLocalSet(mount, function (err, local) {
                        if (err)
                            return callback(err);
                        IDBFS.getRemoteSet(mount, function (err, remote) {
                            if (err)
                                return callback(err);
                            var src = populate ? remote : local;
                            var dst = populate ? local : remote;
                            IDBFS.reconcile(src, dst, callback)
                        })
                    })
                },
                getDB: function (name, callback) {
                    var db = IDBFS.dbs[name];
                    if (db) {
                        return callback(null, db)
                    }
                    var req;
                    try {
                        req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
                    } catch (e) {
                        return callback(e)
                    }
                    if (!req) {
                        return callback("Unable to connect to IndexedDB")
                    }
                    req.onupgradeneeded = function (e) {
                        var db = e.target.result;
                        var transaction = e.target.transaction;
                        var fileStore;
                        if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
                        } else {
                            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
                        }
                        if (!fileStore.indexNames.contains("timestamp")) {
                            fileStore.createIndex("timestamp", "timestamp", {
                                unique: false
                            })
                        }
                    }
                        ;
                    req.onsuccess = function () {
                        db = req.result;
                        IDBFS.dbs[name] = db;
                        callback(null, db)
                    }
                        ;
                    req.onerror = function (e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                getLocalSet: function (mount, callback) {
                    var entries = {};
                    function isRealDir(p) {
                        return p !== "." && p !== ".."
                    }
                    function toAbsolute(root) {
                        return function (p) {
                            return PATH.join2(root, p)
                        }
                    }
                    var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
                    while (check.length) {
                        var path = check.pop();
                        var stat;
                        try {
                            stat = FS.stat(path)
                        } catch (e) {
                            return callback(e)
                        }
                        if (FS.isDir(stat.mode)) {
                            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
                        }
                        entries[path] = {
                            timestamp: stat.mtime
                        }
                    }
                    return callback(null, {
                        type: "local",
                        entries: entries
                    })
                },
                getRemoteSet: function (mount, callback) {
                    var entries = {};
                    IDBFS.getDB(mount.mountpoint, function (err, db) {
                        if (err)
                            return callback(err);
                        try {
                            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                            transaction.onerror = function (e) {
                                callback(this.error);
                                e.preventDefault()
                            }
                                ;
                            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                            var index = store.index("timestamp");
                            index.openKeyCursor().onsuccess = function (event) {
                                var cursor = event.target.result;
                                if (!cursor) {
                                    return callback(null, {
                                        type: "remote",
                                        db: db,
                                        entries: entries
                                    })
                                }
                                entries[cursor.primaryKey] = {
                                    timestamp: cursor.key
                                };
                                cursor.continue()
                            }
                        } catch (e) {
                            return callback(e)
                        }
                    })
                },
                loadLocalEntry: function (path, callback) {
                    var stat, node;
                    try {
                        var lookup = FS.lookupPath(path);
                        node = lookup.node;
                        stat = FS.stat(path)
                    } catch (e) {
                        return callback(e)
                    }
                    if (FS.isDir(stat.mode)) {
                        return callback(null, {
                            timestamp: stat.mtime,
                            mode: stat.mode
                        })
                    } else if (FS.isFile(stat.mode)) {
                        node.contents = MEMFS.getFileDataAsTypedArray(node);
                        return callback(null, {
                            timestamp: stat.mtime,
                            mode: stat.mode,
                            contents: node.contents
                        })
                    } else {
                        return callback(new Error("node type not supported"))
                    }
                },
                storeLocalEntry: function (path, entry, callback) {
                    try {
                        if (FS.isDir(entry.mode)) {
                            FS.mkdir(path, entry.mode)
                        } else if (FS.isFile(entry.mode)) {
                            FS.writeFile(path, entry.contents, {
                                canOwn: true
                            })
                        } else {
                            return callback(new Error("node type not supported"))
                        }
                        FS.chmod(path, entry.mode);
                        FS.utime(path, entry.timestamp, entry.timestamp)
                    } catch (e) {
                        return callback(e)
                    }
                    callback(null)
                },
                removeLocalEntry: function (path, callback) {
                    try {
                        var lookup = FS.lookupPath(path);
                        var stat = FS.stat(path);
                        if (FS.isDir(stat.mode)) {
                            FS.rmdir(path)
                        } else if (FS.isFile(stat.mode)) {
                            FS.unlink(path)
                        }
                    } catch (e) {
                        return callback(e)
                    }
                    callback(null)
                },
                loadRemoteEntry: function (store, path, callback) {
                    var req = store.get(path);
                    req.onsuccess = function (event) {
                        callback(null, event.target.result)
                    }
                        ;
                    req.onerror = function (e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                storeRemoteEntry: function (store, path, entry, callback) {
                    var req = store.put(entry, path);
                    req.onsuccess = function () {
                        callback(null)
                    }
                        ;
                    req.onerror = function (e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                removeRemoteEntry: function (store, path, callback) {
                    var req = store.delete(path);
                    req.onsuccess = function () {
                        callback(null)
                    }
                        ;
                    req.onerror = function (e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                reconcile: function (src, dst, callback) {
                    var total = 0;
                    var create = [];
                    Object.keys(src.entries).forEach(function (key) {
                        var e = src.entries[key];
                        var e2 = dst.entries[key];
                        if (!e2 || e.timestamp > e2.timestamp) {
                            create.push(key);
                            total++
                        }
                    });
                    var remove = [];
                    Object.keys(dst.entries).forEach(function (key) {
                        var e = dst.entries[key];
                        var e2 = src.entries[key];
                        if (!e2) {
                            remove.push(key);
                            total++
                        }
                    });
                    if (!total) {
                        return callback(null)
                    }
                    var errored = false;
                    var db = src.type === "remote" ? src.db : dst.db;
                    var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
                    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                    function done(err) {
                        if (err && !errored) {
                            errored = true;
                            return callback(err)
                        }
                    }
                    transaction.onerror = function (e) {
                        done(this.error);
                        e.preventDefault()
                    }
                        ;
                    transaction.oncomplete = function (e) {
                        if (!errored) {
                            callback(null)
                        }
                    }
                        ;
                    create.sort().forEach(function (path) {
                        if (dst.type === "local") {
                            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                                if (err)
                                    return done(err);
                                IDBFS.storeLocalEntry(path, entry, done)
                            })
                        } else {
                            IDBFS.loadLocalEntry(path, function (err, entry) {
                                if (err)
                                    return done(err);
                                IDBFS.storeRemoteEntry(store, path, entry, done)
                            })
                        }
                    });
                    remove.sort().reverse().forEach(function (path) {
                        if (dst.type === "local") {
                            IDBFS.removeLocalEntry(path, done)
                        } else {
                            IDBFS.removeRemoteEntry(store, path, done)
                        }
                    })
                }
            };
            var ERRNO_CODES = {
                EPERM: 63,
                ENOENT: 44,
                ESRCH: 71,
                EINTR: 27,
                EIO: 29,
                ENXIO: 60,
                E2BIG: 1,
                ENOEXEC: 45,
                EBADF: 8,
                ECHILD: 12,
                EAGAIN: 6,
                EWOULDBLOCK: 6,
                ENOMEM: 48,
                EACCES: 2,
                EFAULT: 21,
                ENOTBLK: 105,
                EBUSY: 10,
                EEXIST: 20,
                EXDEV: 75,
                ENODEV: 43,
                ENOTDIR: 54,
                EISDIR: 31,
                EINVAL: 28,
                ENFILE: 41,
                EMFILE: 33,
                ENOTTY: 59,
                ETXTBSY: 74,
                EFBIG: 22,
                ENOSPC: 51,
                ESPIPE: 70,
                EROFS: 69,
                EMLINK: 34,
                EPIPE: 64,
                EDOM: 18,
                ERANGE: 68,
                ENOMSG: 49,
                EIDRM: 24,
                ECHRNG: 106,
                EL2NSYNC: 156,
                EL3HLT: 107,
                EL3RST: 108,
                ELNRNG: 109,
                EUNATCH: 110,
                ENOCSI: 111,
                EL2HLT: 112,
                EDEADLK: 16,
                ENOLCK: 46,
                EBADE: 113,
                EBADR: 114,
                EXFULL: 115,
                ENOANO: 104,
                EBADRQC: 103,
                EBADSLT: 102,
                EDEADLOCK: 16,
                EBFONT: 101,
                ENOSTR: 100,
                ENODATA: 116,
                ETIME: 117,
                ENOSR: 118,
                ENONET: 119,
                ENOPKG: 120,
                EREMOTE: 121,
                ENOLINK: 47,
                EADV: 122,
                ESRMNT: 123,
                ECOMM: 124,
                EPROTO: 65,
                EMULTIHOP: 36,
                EDOTDOT: 125,
                EBADMSG: 9,
                ENOTUNIQ: 126,
                EBADFD: 127,
                EREMCHG: 128,
                ELIBACC: 129,
                ELIBBAD: 130,
                ELIBSCN: 131,
                ELIBMAX: 132,
                ELIBEXEC: 133,
                ENOSYS: 52,
                ENOTEMPTY: 55,
                ENAMETOOLONG: 37,
                ELOOP: 32,
                EOPNOTSUPP: 138,
                EPFNOSUPPORT: 139,
                ECONNRESET: 15,
                ENOBUFS: 42,
                EAFNOSUPPORT: 5,
                EPROTOTYPE: 67,
                ENOTSOCK: 57,
                ENOPROTOOPT: 50,
                ESHUTDOWN: 140,
                ECONNREFUSED: 14,
                EADDRINUSE: 3,
                ECONNABORTED: 13,
                ENETUNREACH: 40,
                ENETDOWN: 38,
                ETIMEDOUT: 73,
                EHOSTDOWN: 142,
                EHOSTUNREACH: 23,
                EINPROGRESS: 26,
                EALREADY: 7,
                EDESTADDRREQ: 17,
                EMSGSIZE: 35,
                EPROTONOSUPPORT: 66,
                ESOCKTNOSUPPORT: 137,
                EADDRNOTAVAIL: 4,
                ENETRESET: 39,
                EISCONN: 30,
                ENOTCONN: 53,
                ETOOMANYREFS: 141,
                EUSERS: 136,
                EDQUOT: 19,
                ESTALE: 72,
                ENOTSUP: 138,
                ENOMEDIUM: 148,
                EILSEQ: 25,
                EOVERFLOW: 61,
                ECANCELED: 11,
                ENOTRECOVERABLE: 56,
                EOWNERDEAD: 62,
                ESTRPIPE: 135
            };
            var NODEFS = {
                isWindows: false,
                staticInit: function () {
                    NODEFS.isWindows = !!process.platform.match(/^win/);
                    var flags = process["binding"]("constants");
                    if (flags["fs"]) {
                        flags = flags["fs"]
                    }
                    NODEFS.flagsForNodeMap = {
                        1024: flags["O_APPEND"],
                        64: flags["O_CREAT"],
                        128: flags["O_EXCL"],
                        0: flags["O_RDONLY"],
                        2: flags["O_RDWR"],
                        4096: flags["O_SYNC"],
                        512: flags["O_TRUNC"],
                        1: flags["O_WRONLY"]
                    }
                },
                bufferFrom: function (arrayBuffer) {
                    return Buffer["alloc"] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
                },
                convertNodeCode: function (e) {
                    var code = e.code;
                    assert(code in ERRNO_CODES);
                    return ERRNO_CODES[code]
                },
                mount: function (mount) {
                    assert(ENVIRONMENT_HAS_NODE);
                    return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
                },
                createNode: function (parent, name, mode, dev) {
                    if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
                        throw new FS.ErrnoError(28)
                    }
                    var node = FS.createNode(parent, name, mode);
                    node.node_ops = NODEFS.node_ops;
                    node.stream_ops = NODEFS.stream_ops;
                    return node
                },
                getMode: function (path) {
                    var stat;
                    try {
                        stat = fs.lstatSync(path);
                        if (NODEFS.isWindows) {
                            stat.mode = stat.mode | (stat.mode & 292) >> 2
                        }
                    } catch (e) {
                        if (!e.code)
                            throw e;
                        throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                    }
                    return stat.mode
                },
                realPath: function (node) {
                    var parts = [];
                    while (node.parent !== node) {
                        parts.push(node.name);
                        node = node.parent
                    }
                    parts.push(node.mount.opts.root);
                    parts.reverse();
                    return PATH.join.apply(null, parts)
                },
                flagsForNode: function (flags) {
                    flags &= ~2097152;
                    flags &= ~2048;
                    flags &= ~32768;
                    flags &= ~524288;
                    var newFlags = 0;
                    for (var k in NODEFS.flagsForNodeMap) {
                        if (flags & k) {
                            newFlags |= NODEFS.flagsForNodeMap[k];
                            flags ^= k
                        }
                    }
                    if (!flags) {
                        return newFlags
                    } else {
                        throw new FS.ErrnoError(28)
                    }
                },
                node_ops: {
                    getattr: function (node) {
                        var path = NODEFS.realPath(node);
                        var stat;
                        try {
                            stat = fs.lstatSync(path)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                        if (NODEFS.isWindows && !stat.blksize) {
                            stat.blksize = 4096
                        }
                        if (NODEFS.isWindows && !stat.blocks) {
                            stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
                        }
                        return {
                            dev: stat.dev,
                            ino: stat.ino,
                            mode: stat.mode,
                            nlink: stat.nlink,
                            uid: stat.uid,
                            gid: stat.gid,
                            rdev: stat.rdev,
                            size: stat.size,
                            atime: stat.atime,
                            mtime: stat.mtime,
                            ctime: stat.ctime,
                            blksize: stat.blksize,
                            blocks: stat.blocks
                        }
                    },
                    setattr: function (node, attr) {
                        var path = NODEFS.realPath(node);
                        try {
                            if (attr.mode !== undefined) {
                                fs.chmodSync(path, attr.mode);
                                node.mode = attr.mode
                            }
                            if (attr.timestamp !== undefined) {
                                var date = new Date(attr.timestamp);
                                fs.utimesSync(path, date, date)
                            }
                            if (attr.size !== undefined) {
                                fs.truncateSync(path, attr.size)
                            }
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    lookup: function (parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        var mode = NODEFS.getMode(path);
                        return NODEFS.createNode(parent, name, mode)
                    },
                    mknod: function (parent, name, mode, dev) {
                        var node = NODEFS.createNode(parent, name, mode, dev);
                        var path = NODEFS.realPath(node);
                        try {
                            if (FS.isDir(node.mode)) {
                                fs.mkdirSync(path, node.mode)
                            } else {
                                fs.writeFileSync(path, "", {
                                    mode: node.mode
                                })
                            }
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                        return node
                    },
                    rename: function (oldNode, newDir, newName) {
                        var oldPath = NODEFS.realPath(oldNode);
                        var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
                        try {
                            fs.renameSync(oldPath, newPath)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    unlink: function (parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        try {
                            fs.unlinkSync(path)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    rmdir: function (parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        try {
                            fs.rmdirSync(path)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    readdir: function (node) {
                        var path = NODEFS.realPath(node);
                        try {
                            return fs.readdirSync(path)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    symlink: function (parent, newName, oldPath) {
                        var newPath = PATH.join2(NODEFS.realPath(parent), newName);
                        try {
                            fs.symlinkSync(oldPath, newPath)
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    readlink: function (node) {
                        var path = NODEFS.realPath(node);
                        try {
                            path = fs.readlinkSync(path);
                            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                            return path
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    }
                },
                stream_ops: {
                    open: function (stream) {
                        var path = NODEFS.realPath(stream.node);
                        try {
                            if (FS.isFile(stream.node.mode)) {
                                stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
                            }
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    close: function (stream) {
                        try {
                            if (FS.isFile(stream.node.mode) && stream.nfd) {
                                fs.closeSync(stream.nfd)
                            }
                        } catch (e) {
                            if (!e.code)
                                throw e;
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    read: function (stream, buffer, offset, length, position) {
                        if (length === 0)
                            return 0;
                        try {
                            return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                        } catch (e) {
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    write: function (stream, buffer, offset, length, position) {
                        try {
                            return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                        } catch (e) {
                            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                        }
                    },
                    llseek: function (stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                try {
                                    var stat = fs.fstatSync(stream.nfd);
                                    position += stat.size
                                } catch (e) {
                                    throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                                }
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(28)
                        }
                        return position
                    }
                }
            };
            var WORKERFS = {
                DIR_MODE: 16895,
                FILE_MODE: 33279,
                reader: null,
                mount: function (mount) {
                    assert(ENVIRONMENT_IS_WORKER);
                    if (!WORKERFS.reader)
                        WORKERFS.reader = new FileReaderSync;
                    var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
                    var createdParents = {};
                    function ensureParent(path) {
                        var parts = path.split("/");
                        var parent = root;
                        for (var i = 0; i < parts.length - 1; i++) {
                            var curr = parts.slice(0, i + 1).join("/");
                            if (!createdParents[curr]) {
                                createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                            }
                            parent = createdParents[curr]
                        }
                        return parent
                    }
                    function base(path) {
                        var parts = path.split("/");
                        return parts[parts.length - 1]
                    }
                    Array.prototype.forEach.call(mount.opts["files"] || [], function (file) {
                        WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
                    });
                    (mount.opts["blobs"] || []).forEach(function (obj) {
                        WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
                    });
                    (mount.opts["packages"] || []).forEach(function (pack) {
                        pack["metadata"].files.forEach(function (file) {
                            var name = file.filename.substr(1);
                            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
                        })
                    });
                    return root
                },
                createNode: function (parent, name, mode, dev, contents, mtime) {
                    var node = FS.createNode(parent, name, mode);
                    node.mode = mode;
                    node.node_ops = WORKERFS.node_ops;
                    node.stream_ops = WORKERFS.stream_ops;
                    node.timestamp = (mtime || new Date).getTime();
                    assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
                    if (mode === WORKERFS.FILE_MODE) {
                        node.size = contents.size;
                        node.contents = contents
                    } else {
                        node.size = 4096;
                        node.contents = {}
                    }
                    if (parent) {
                        parent.contents[name] = node
                    }
                    return node
                },
                node_ops: {
                    getattr: function (node) {
                        return {
                            dev: 1,
                            ino: undefined,
                            mode: node.mode,
                            nlink: 1,
                            uid: 0,
                            gid: 0,
                            rdev: undefined,
                            size: node.size,
                            atime: new Date(node.timestamp),
                            mtime: new Date(node.timestamp),
                            ctime: new Date(node.timestamp),
                            blksize: 4096,
                            blocks: Math.ceil(node.size / 4096)
                        }
                    },
                    setattr: function (node, attr) {
                        if (attr.mode !== undefined) {
                            node.mode = attr.mode
                        }
                        if (attr.timestamp !== undefined) {
                            node.timestamp = attr.timestamp
                        }
                    },
                    lookup: function (parent, name) {
                        throw new FS.ErrnoError(44)
                    },
                    mknod: function (parent, name, mode, dev) {
                        throw new FS.ErrnoError(63)
                    },
                    rename: function (oldNode, newDir, newName) {
                        throw new FS.ErrnoError(63)
                    },
                    unlink: function (parent, name) {
                        throw new FS.ErrnoError(63)
                    },
                    rmdir: function (parent, name) {
                        throw new FS.ErrnoError(63)
                    },
                    readdir: function (node) {
                        var entries = [".", ".."];
                        for (var key in node.contents) {
                            if (!node.contents.hasOwnProperty(key)) {
                                continue
                            }
                            entries.push(key)
                        }
                        return entries
                    },
                    symlink: function (parent, newName, oldPath) {
                        throw new FS.ErrnoError(63)
                    },
                    readlink: function (node) {
                        throw new FS.ErrnoError(63)
                    }
                },
                stream_ops: {
                    read: function (stream, buffer, offset, length, position) {
                        if (position >= stream.node.size)
                            return 0;
                        var chunk = stream.node.contents.slice(position, position + length);
                        var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
                        buffer.set(new Uint8Array(ab), offset);
                        return chunk.size
                    },
                    write: function (stream, buffer, offset, length, position) {
                        throw new FS.ErrnoError(29)
                    },
                    llseek: function (stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                position += stream.node.size
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(28)
                        }
                        return position
                    }
                }
            };
            var FS = {
                root: null,
                mounts: [],
                devices: {},
                streams: [],
                nextInode: 1,
                nameTable: null,
                currentPath: "/",
                initialized: false,
                ignorePermissions: true,
                trackingDelegate: {},
                tracking: {
                    openFlags: {
                        READ: 1,
                        WRITE: 2
                    }
                },
                ErrnoError: null,
                genericErrors: {},
                filesystems: null,
                syncFSRequests: 0,
                handleFSError: function (e) {
                    if (!(e instanceof FS.ErrnoError))
                        throw e + " : " + stackTrace();
                    return ___setErrNo(e.errno)
                },
                lookupPath: function (path, opts) {
                    path = PATH_FS.resolve(FS.cwd(), path);
                    opts = opts || {};
                    if (!path)
                        return {
                            path: "",
                            node: null
                        };
                    var defaults = {
                        follow_mount: true,
                        recurse_count: 0
                    };
                    for (var key in defaults) {
                        if (opts[key] === undefined) {
                            opts[key] = defaults[key]
                        }
                    }
                    if (opts.recurse_count > 8) {
                        throw new FS.ErrnoError(32)
                    }
                    var parts = PATH.normalizeArray(path.split("/").filter(function (p) {
                        return !!p
                    }), false);
                    var current = FS.root;
                    var current_path = "/";
                    for (var i = 0; i < parts.length; i++) {
                        var islast = i === parts.length - 1;
                        if (islast && opts.parent) {
                            break
                        }
                        current = FS.lookupNode(current, parts[i]);
                        current_path = PATH.join2(current_path, parts[i]);
                        if (FS.isMountpoint(current)) {
                            if (!islast || islast && opts.follow_mount) {
                                current = current.mounted.root
                            }
                        }
                        if (!islast || opts.follow) {
                            var count = 0;
                            while (FS.isLink(current.mode)) {
                                var link = FS.readlink(current_path);
                                current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                                var lookup = FS.lookupPath(current_path, {
                                    recurse_count: opts.recurse_count
                                });
                                current = lookup.node;
                                if (count++ > 40) {
                                    throw new FS.ErrnoError(32)
                                }
                            }
                        }
                    }
                    return {
                        path: current_path,
                        node: current
                    }
                },
                getPath: function (node) {
                    var path;
                    while (true) {
                        if (FS.isRoot(node)) {
                            var mount = node.mount.mountpoint;
                            if (!path)
                                return mount;
                            return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
                        }
                        path = path ? node.name + "/" + path : node.name;
                        node = node.parent
                    }
                },
                hashName: function (parentid, name) {
                    var hash = 0;
                    for (var i = 0; i < name.length; i++) {
                        hash = (hash << 5) - hash + name.charCodeAt(i) | 0
                    }
                    return (parentid + hash >>> 0) % FS.nameTable.length
                },
                hashAddNode: function (node) {
                    var hash = FS.hashName(node.parent.id, node.name);
                    node.name_next = FS.nameTable[hash];
                    FS.nameTable[hash] = node
                },
                hashRemoveNode: function (node) {
                    var hash = FS.hashName(node.parent.id, node.name);
                    if (FS.nameTable[hash] === node) {
                        FS.nameTable[hash] = node.name_next
                    } else {
                        var current = FS.nameTable[hash];
                        while (current) {
                            if (current.name_next === node) {
                                current.name_next = node.name_next;
                                break
                            }
                            current = current.name_next
                        }
                    }
                },
                lookupNode: function (parent, name) {
                    var err = FS.mayLookup(parent);
                    if (err) {
                        throw new FS.ErrnoError(err, parent)
                    }
                    var hash = FS.hashName(parent.id, name);
                    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                        var nodeName = node.name;
                        if (node.parent.id === parent.id && nodeName === name) {
                            return node
                        }
                    }
                    return FS.lookup(parent, name)
                },
                createNode: function (parent, name, mode, rdev) {
                    if (!FS.FSNode) {
                        FS.FSNode = function (parent, name, mode, rdev) {
                            if (!parent) {
                                parent = this
                            }
                            this.parent = parent;
                            this.mount = parent.mount;
                            this.mounted = null;
                            this.id = FS.nextInode++;
                            this.name = name;
                            this.mode = mode;
                            this.node_ops = {};
                            this.stream_ops = {};
                            this.rdev = rdev
                        }
                            ;
                        FS.FSNode.prototype = {};
                        var readMode = 292 | 73;
                        var writeMode = 146;
                        Object.defineProperties(FS.FSNode.prototype, {
                            read: {
                                get: function () {
                                    return (this.mode & readMode) === readMode
                                },
                                set: function (val) {
                                    val ? this.mode |= readMode : this.mode &= ~readMode
                                }
                            },
                            write: {
                                get: function () {
                                    return (this.mode & writeMode) === writeMode
                                },
                                set: function (val) {
                                    val ? this.mode |= writeMode : this.mode &= ~writeMode
                                }
                            },
                            isFolder: {
                                get: function () {
                                    return FS.isDir(this.mode)
                                }
                            },
                            isDevice: {
                                get: function () {
                                    return FS.isChrdev(this.mode)
                                }
                            }
                        })
                    }
                    var node = new FS.FSNode(parent, name, mode, rdev);
                    FS.hashAddNode(node);
                    return node
                },
                destroyNode: function (node) {
                    FS.hashRemoveNode(node)
                },
                isRoot: function (node) {
                    return node === node.parent
                },
                isMountpoint: function (node) {
                    return !!node.mounted
                },
                isFile: function (mode) {
                    return (mode & 61440) === 32768
                },
                isDir: function (mode) {
                    return (mode & 61440) === 16384
                },
                isLink: function (mode) {
                    return (mode & 61440) === 40960
                },
                isChrdev: function (mode) {
                    return (mode & 61440) === 8192
                },
                isBlkdev: function (mode) {
                    return (mode & 61440) === 24576
                },
                isFIFO: function (mode) {
                    return (mode & 61440) === 4096
                },
                isSocket: function (mode) {
                    return (mode & 49152) === 49152
                },
                flagModes: {
                    "r": 0,
                    "rs": 1052672,
                    "r+": 2,
                    "w": 577,
                    "wx": 705,
                    "xw": 705,
                    "w+": 578,
                    "wx+": 706,
                    "xw+": 706,
                    "a": 1089,
                    "ax": 1217,
                    "xa": 1217,
                    "a+": 1090,
                    "ax+": 1218,
                    "xa+": 1218
                },
                modeStringToFlags: function (str) {
                    var flags = FS.flagModes[str];
                    if (typeof flags === "undefined") {
                        throw new Error("Unknown file open mode: " + str)
                    }
                    return flags
                },
                flagsToPermissionString: function (flag) {
                    var perms = ["r", "w", "rw"][flag & 3];
                    if (flag & 512) {
                        perms += "w"
                    }
                    return perms
                },
                nodePermissions: function (node, perms) {
                    if (FS.ignorePermissions) {
                        return 0
                    }
                    if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
                        return 2
                    } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
                        return 2
                    } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
                        return 2
                    }
                    return 0
                },
                mayLookup: function (dir) {
                    var err = FS.nodePermissions(dir, "x");
                    if (err)
                        return err;
                    if (!dir.node_ops.lookup)
                        return 2;
                    return 0
                },
                mayCreate: function (dir, name) {
                    try {
                        var node = FS.lookupNode(dir, name);
                        return 20
                    } catch (e) { }
                    return FS.nodePermissions(dir, "wx")
                },
                mayDelete: function (dir, name, isdir) {
                    var node;
                    try {
                        node = FS.lookupNode(dir, name)
                    } catch (e) {
                        return e.errno
                    }
                    var err = FS.nodePermissions(dir, "wx");
                    if (err) {
                        return err
                    }
                    if (isdir) {
                        if (!FS.isDir(node.mode)) {
                            return 54
                        }
                        if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                            return 10
                        }
                    } else {
                        if (FS.isDir(node.mode)) {
                            return 31
                        }
                    }
                    return 0
                },
                mayOpen: function (node, flags) {
                    if (!node) {
                        return 44
                    }
                    if (FS.isLink(node.mode)) {
                        return 32
                    } else if (FS.isDir(node.mode)) {
                        if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                            return 31
                        }
                    }
                    return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
                },
                MAX_OPEN_FDS: 4096,
                nextfd: function (fd_start, fd_end) {
                    fd_start = fd_start || 0;
                    fd_end = fd_end || FS.MAX_OPEN_FDS;
                    for (var fd = fd_start; fd <= fd_end; fd++) {
                        if (!FS.streams[fd]) {
                            return fd
                        }
                    }
                    throw new FS.ErrnoError(33)
                },
                getStream: function (fd) {
                    return FS.streams[fd]
                },
                createStream: function (stream, fd_start, fd_end) {
                    if (!FS.FSStream) {
                        FS.FSStream = function () { }
                            ;
                        FS.FSStream.prototype = {};
                        Object.defineProperties(FS.FSStream.prototype, {
                            object: {
                                get: function () {
                                    return this.node
                                },
                                set: function (val) {
                                    this.node = val
                                }
                            },
                            isRead: {
                                get: function () {
                                    return (this.flags & 2097155) !== 1
                                }
                            },
                            isWrite: {
                                get: function () {
                                    return (this.flags & 2097155) !== 0
                                }
                            },
                            isAppend: {
                                get: function () {
                                    return this.flags & 1024
                                }
                            }
                        })
                    }
                    var newStream = new FS.FSStream;
                    for (var p in stream) {
                        newStream[p] = stream[p]
                    }
                    stream = newStream;
                    var fd = FS.nextfd(fd_start, fd_end);
                    stream.fd = fd;
                    FS.streams[fd] = stream;
                    return stream
                },
                closeStream: function (fd) {
                    FS.streams[fd] = null
                },
                chrdev_stream_ops: {
                    open: function (stream) {
                        var device = FS.getDevice(stream.node.rdev);
                        stream.stream_ops = device.stream_ops;
                        if (stream.stream_ops.open) {
                            stream.stream_ops.open(stream)
                        }
                    },
                    llseek: function () {
                        throw new FS.ErrnoError(70)
                    }
                },
                major: function (dev) {
                    return dev >> 8
                },
                minor: function (dev) {
                    return dev & 255
                },
                makedev: function (ma, mi) {
                    return ma << 8 | mi
                },
                registerDevice: function (dev, ops) {
                    FS.devices[dev] = {
                        stream_ops: ops
                    }
                },
                getDevice: function (dev) {
                    return FS.devices[dev]
                },
                getMounts: function (mount) {
                    var mounts = [];
                    var check = [mount];
                    while (check.length) {
                        var m = check.pop();
                        mounts.push(m);
                        check.push.apply(check, m.mounts)
                    }
                    return mounts
                },
                syncfs: function (populate, callback) {
                    if (typeof populate === "function") {
                        callback = populate;
                        populate = false
                    }
                    FS.syncFSRequests++;
                    if (FS.syncFSRequests > 1) {
                        console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
                    }
                    var mounts = FS.getMounts(FS.root.mount);
                    var completed = 0;
                    function doCallback(err) {
                        FS.syncFSRequests--;
                        return callback(err)
                    }
                    function done(err) {
                        if (err) {
                            if (!done.errored) {
                                done.errored = true;
                                return doCallback(err)
                            }
                            return
                        }
                        if (++completed >= mounts.length) {
                            doCallback(null)
                        }
                    }
                    mounts.forEach(function (mount) {
                        if (!mount.type.syncfs) {
                            return done(null)
                        }
                        mount.type.syncfs(mount, populate, done)
                    })
                },
                mount: function (type, opts, mountpoint) {
                    var root = mountpoint === "/";
                    var pseudo = !mountpoint;
                    var node;
                    if (root && FS.root) {
                        throw new FS.ErrnoError(10)
                    } else if (!root && !pseudo) {
                        var lookup = FS.lookupPath(mountpoint, {
                            follow_mount: false
                        });
                        mountpoint = lookup.path;
                        node = lookup.node;
                        if (FS.isMountpoint(node)) {
                            throw new FS.ErrnoError(10)
                        }
                        if (!FS.isDir(node.mode)) {
                            throw new FS.ErrnoError(54)
                        }
                    }
                    var mount = {
                        type: type,
                        opts: opts,
                        mountpoint: mountpoint,
                        mounts: []
                    };
                    var mountRoot = type.mount(mount);
                    mountRoot.mount = mount;
                    mount.root = mountRoot;
                    if (root) {
                        FS.root = mountRoot
                    } else if (node) {
                        node.mounted = mount;
                        if (node.mount) {
                            node.mount.mounts.push(mount)
                        }
                    }
                    return mountRoot
                },
                unmount: function (mountpoint) {
                    var lookup = FS.lookupPath(mountpoint, {
                        follow_mount: false
                    });
                    if (!FS.isMountpoint(lookup.node)) {
                        throw new FS.ErrnoError(28)
                    }
                    var node = lookup.node;
                    var mount = node.mounted;
                    var mounts = FS.getMounts(mount);
                    Object.keys(FS.nameTable).forEach(function (hash) {
                        var current = FS.nameTable[hash];
                        while (current) {
                            var next = current.name_next;
                            if (mounts.indexOf(current.mount) !== -1) {
                                FS.destroyNode(current)
                            }
                            current = next
                        }
                    });
                    node.mounted = null;
                    var idx = node.mount.mounts.indexOf(mount);
                    node.mount.mounts.splice(idx, 1)
                },
                lookup: function (parent, name) {
                    return parent.node_ops.lookup(parent, name)
                },
                mknod: function (path, mode, dev) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    if (!name || name === "." || name === "..") {
                        throw new FS.ErrnoError(28)
                    }
                    var err = FS.mayCreate(parent, name);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.mknod) {
                        throw new FS.ErrnoError(63)
                    }
                    return parent.node_ops.mknod(parent, name, mode, dev)
                },
                create: function (path, mode) {
                    mode = mode !== undefined ? mode : 438;
                    mode &= 4095;
                    mode |= 32768;
                    return FS.mknod(path, mode, 0)
                },
                mkdir: function (path, mode) {
                    mode = mode !== undefined ? mode : 511;
                    mode &= 511 | 512;
                    mode |= 16384;
                    return FS.mknod(path, mode, 0)
                },
                mkdirTree: function (path, mode) {
                    var dirs = path.split("/");
                    var d = "";
                    for (var i = 0; i < dirs.length; ++i) {
                        if (!dirs[i])
                            continue;
                        d += "/" + dirs[i];
                        try {
                            FS.mkdir(d, mode)
                        } catch (e) {
                            if (e.errno != 20)
                                throw e
                        }
                    }
                },
                mkdev: function (path, mode, dev) {
                    if (typeof dev === "undefined") {
                        dev = mode;
                        mode = 438
                    }
                    mode |= 8192;
                    return FS.mknod(path, mode, dev)
                },
                symlink: function (oldpath, newpath) {
                    if (!PATH_FS.resolve(oldpath)) {
                        throw new FS.ErrnoError(44)
                    }
                    var lookup = FS.lookupPath(newpath, {
                        parent: true
                    });
                    var parent = lookup.node;
                    if (!parent) {
                        throw new FS.ErrnoError(44)
                    }
                    var newname = PATH.basename(newpath);
                    var err = FS.mayCreate(parent, newname);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.symlink) {
                        throw new FS.ErrnoError(63)
                    }
                    return parent.node_ops.symlink(parent, newname, oldpath)
                },
                rename: function (old_path, new_path) {
                    var old_dirname = PATH.dirname(old_path);
                    var new_dirname = PATH.dirname(new_path);
                    var old_name = PATH.basename(old_path);
                    var new_name = PATH.basename(new_path);
                    var lookup, old_dir, new_dir;
                    try {
                        lookup = FS.lookupPath(old_path, {
                            parent: true
                        });
                        old_dir = lookup.node;
                        lookup = FS.lookupPath(new_path, {
                            parent: true
                        });
                        new_dir = lookup.node
                    } catch (e) {
                        throw new FS.ErrnoError(10)
                    }
                    if (!old_dir || !new_dir)
                        throw new FS.ErrnoError(44);
                    if (old_dir.mount !== new_dir.mount) {
                        throw new FS.ErrnoError(75)
                    }
                    var old_node = FS.lookupNode(old_dir, old_name);
                    var relative = PATH_FS.relative(old_path, new_dirname);
                    if (relative.charAt(0) !== ".") {
                        throw new FS.ErrnoError(28)
                    }
                    relative = PATH_FS.relative(new_path, old_dirname);
                    if (relative.charAt(0) !== ".") {
                        throw new FS.ErrnoError(55)
                    }
                    var new_node;
                    try {
                        new_node = FS.lookupNode(new_dir, new_name)
                    } catch (e) { }
                    if (old_node === new_node) {
                        return
                    }
                    var isdir = FS.isDir(old_node.mode);
                    var err = FS.mayDelete(old_dir, old_name, isdir);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!old_dir.node_ops.rename) {
                        throw new FS.ErrnoError(63)
                    }
                    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
                        throw new FS.ErrnoError(10)
                    }
                    if (new_dir !== old_dir) {
                        err = FS.nodePermissions(old_dir, "w");
                        if (err) {
                            throw new FS.ErrnoError(err)
                        }
                    }
                    try {
                        if (FS.trackingDelegate["willMovePath"]) {
                            FS.trackingDelegate["willMovePath"](old_path, new_path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                    }
                    FS.hashRemoveNode(old_node);
                    try {
                        old_dir.node_ops.rename(old_node, new_dir, new_name)
                    } catch (e) {
                        throw e
                    } finally {
                        FS.hashAddNode(old_node)
                    }
                    try {
                        if (FS.trackingDelegate["onMovePath"])
                            FS.trackingDelegate["onMovePath"](old_path, new_path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                    }
                },
                rmdir: function (path) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    var node = FS.lookupNode(parent, name);
                    var err = FS.mayDelete(parent, name, true);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.rmdir) {
                        throw new FS.ErrnoError(63)
                    }
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(10)
                    }
                    try {
                        if (FS.trackingDelegate["willDeletePath"]) {
                            FS.trackingDelegate["willDeletePath"](path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                    parent.node_ops.rmdir(parent, name);
                    FS.destroyNode(node);
                    try {
                        if (FS.trackingDelegate["onDeletePath"])
                            FS.trackingDelegate["onDeletePath"](path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                },
                readdir: function (path) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    var node = lookup.node;
                    if (!node.node_ops.readdir) {
                        throw new FS.ErrnoError(54)
                    }
                    return node.node_ops.readdir(node)
                },
                unlink: function (path) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    var node = FS.lookupNode(parent, name);
                    var err = FS.mayDelete(parent, name, false);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.unlink) {
                        throw new FS.ErrnoError(63)
                    }
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(10)
                    }
                    try {
                        if (FS.trackingDelegate["willDeletePath"]) {
                            FS.trackingDelegate["willDeletePath"](path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                    parent.node_ops.unlink(parent, name);
                    FS.destroyNode(node);
                    try {
                        if (FS.trackingDelegate["onDeletePath"])
                            FS.trackingDelegate["onDeletePath"](path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                },
                readlink: function (path) {
                    var lookup = FS.lookupPath(path);
                    var link = lookup.node;
                    if (!link) {
                        throw new FS.ErrnoError(44)
                    }
                    if (!link.node_ops.readlink) {
                        throw new FS.ErrnoError(28)
                    }
                    return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
                },
                stat: function (path, dontFollow) {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontFollow
                    });
                    var node = lookup.node;
                    if (!node) {
                        throw new FS.ErrnoError(44)
                    }
                    if (!node.node_ops.getattr) {
                        throw new FS.ErrnoError(63)
                    }
                    return node.node_ops.getattr(node)
                },
                lstat: function (path) {
                    return FS.stat(path, true)
                },
                chmod: function (path, mode, dontFollow) {
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontFollow
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(63)
                    }
                    node.node_ops.setattr(node, {
                        mode: mode & 4095 | node.mode & ~4095,
                        timestamp: Date.now()
                    })
                },
                lchmod: function (path, mode) {
                    FS.chmod(path, mode, true)
                },
                fchmod: function (fd, mode) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(8)
                    }
                    FS.chmod(stream.node, mode)
                },
                chown: function (path, uid, gid, dontFollow) {
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontFollow
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(63)
                    }
                    node.node_ops.setattr(node, {
                        timestamp: Date.now()
                    })
                },
                lchown: function (path, uid, gid) {
                    FS.chown(path, uid, gid, true)
                },
                fchown: function (fd, uid, gid) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(8)
                    }
                    FS.chown(stream.node, uid, gid)
                },
                truncate: function (path, len) {
                    if (len < 0) {
                        throw new FS.ErrnoError(28)
                    }
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: true
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(63)
                    }
                    if (FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(31)
                    }
                    if (!FS.isFile(node.mode)) {
                        throw new FS.ErrnoError(28)
                    }
                    var err = FS.nodePermissions(node, "w");
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    node.node_ops.setattr(node, {
                        size: len,
                        timestamp: Date.now()
                    })
                },
                ftruncate: function (fd, len) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(8)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(28)
                    }
                    FS.truncate(stream.node, len)
                },
                utime: function (path, atime, mtime) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    var node = lookup.node;
                    node.node_ops.setattr(node, {
                        timestamp: Math.max(atime, mtime)
                    })
                },
                open: function (path, flags, mode, fd_start, fd_end) {
                    if (path === "") {
                        throw new FS.ErrnoError(44)
                    }
                    flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
                    mode = typeof mode === "undefined" ? 438 : mode;
                    if (flags & 64) {
                        mode = mode & 4095 | 32768
                    } else {
                        mode = 0
                    }
                    var node;
                    if (typeof path === "object") {
                        node = path
                    } else {
                        path = PATH.normalize(path);
                        try {
                            var lookup = FS.lookupPath(path, {
                                follow: !(flags & 131072)
                            });
                            node = lookup.node
                        } catch (e) { }
                    }
                    var created = false;
                    if (flags & 64) {
                        if (node) {
                            if (flags & 128) {
                                throw new FS.ErrnoError(20)
                            }
                        } else {
                            node = FS.mknod(path, mode, 0);
                            created = true
                        }
                    }
                    if (!node) {
                        throw new FS.ErrnoError(44)
                    }
                    if (FS.isChrdev(node.mode)) {
                        flags &= ~512
                    }
                    if (flags & 65536 && !FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(54)
                    }
                    if (!created) {
                        var err = FS.mayOpen(node, flags);
                        if (err) {
                            throw new FS.ErrnoError(err)
                        }
                    }
                    if (flags & 512) {
                        FS.truncate(node, 0)
                    }
                    flags &= ~(128 | 512);
                    var stream = FS.createStream({
                        node: node,
                        path: FS.getPath(node),
                        flags: flags,
                        seekable: true,
                        position: 0,
                        stream_ops: node.stream_ops,
                        ungotten: [],
                        error: false
                    }, fd_start, fd_end);
                    if (stream.stream_ops.open) {
                        stream.stream_ops.open(stream)
                    }
                    if (Module["logReadFiles"] && !(flags & 1)) {
                        if (!FS.readFiles)
                            FS.readFiles = {};
                        if (!(path in FS.readFiles)) {
                            FS.readFiles[path] = 1;
                            console.log("FS.trackingDelegate error on read file: " + path)
                        }
                    }
                    try {
                        if (FS.trackingDelegate["onOpenFile"]) {
                            var trackingFlags = 0;
                            if ((flags & 2097155) !== 1) {
                                trackingFlags |= FS.tracking.openFlags.READ
                            }
                            if ((flags & 2097155) !== 0) {
                                trackingFlags |= FS.tracking.openFlags.WRITE
                            }
                            FS.trackingDelegate["onOpenFile"](path, trackingFlags)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
                    }
                    return stream
                },
                close: function (stream) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(8)
                    }
                    if (stream.getdents)
                        stream.getdents = null;
                    try {
                        if (stream.stream_ops.close) {
                            stream.stream_ops.close(stream)
                        }
                    } catch (e) {
                        throw e
                    } finally {
                        FS.closeStream(stream.fd)
                    }
                    stream.fd = null
                },
                isClosed: function (stream) {
                    return stream.fd === null
                },
                llseek: function (stream, offset, whence) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(8)
                    }
                    if (!stream.seekable || !stream.stream_ops.llseek) {
                        throw new FS.ErrnoError(70)
                    }
                    if (whence != 0 && whence != 1 && whence != 2) {
                        throw new FS.ErrnoError(28)
                    }
                    stream.position = stream.stream_ops.llseek(stream, offset, whence);
                    stream.ungotten = [];
                    return stream.position
                },
                read: function (stream, buffer, offset, length, position) {
                    if (length < 0 || position < 0) {
                        throw new FS.ErrnoError(28)
                    }
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(8)
                    }
                    if ((stream.flags & 2097155) === 1) {
                        throw new FS.ErrnoError(8)
                    }
                    if (FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(31)
                    }
                    if (!stream.stream_ops.read) {
                        throw new FS.ErrnoError(28)
                    }
                    var seeking = typeof position !== "undefined";
                    if (!seeking) {
                        position = stream.position
                    } else if (!stream.seekable) {
                        throw new FS.ErrnoError(70)
                    }
                    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
                    if (!seeking)
                        stream.position += bytesRead;
                    return bytesRead
                },
                write: function (stream, buffer, offset, length, position, canOwn) {
                    if (length < 0 || position < 0) {
                        throw new FS.ErrnoError(28)
                    }
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(8)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(8)
                    }
                    if (FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(31)
                    }
                    if (!stream.stream_ops.write) {
                        throw new FS.ErrnoError(28)
                    }
                    if (stream.flags & 1024) {
                        FS.llseek(stream, 0, 2)
                    }
                    var seeking = typeof position !== "undefined";
                    if (!seeking) {
                        position = stream.position
                    } else if (!stream.seekable) {
                        throw new FS.ErrnoError(70)
                    }
                    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
                    if (!seeking)
                        stream.position += bytesWritten;
                    try {
                        if (stream.path && FS.trackingDelegate["onWriteToFile"])
                            FS.trackingDelegate["onWriteToFile"](stream.path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
                    }
                    return bytesWritten
                },
                allocate: function (stream, offset, length) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(8)
                    }
                    if (offset < 0 || length <= 0) {
                        throw new FS.ErrnoError(28)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(8)
                    }
                    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(43)
                    }
                    if (!stream.stream_ops.allocate) {
                        throw new FS.ErrnoError(138)
                    }
                    stream.stream_ops.allocate(stream, offset, length)
                },
                mmap: function (stream, buffer, offset, length, position, prot, flags) {
                    if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
                        throw new FS.ErrnoError(2)
                    }
                    if ((stream.flags & 2097155) === 1) {
                        throw new FS.ErrnoError(2)
                    }
                    if (!stream.stream_ops.mmap) {
                        throw new FS.ErrnoError(43)
                    }
                    return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
                },
                msync: function (stream, buffer, offset, length, mmapFlags) {
                    if (!stream || !stream.stream_ops.msync) {
                        return 0
                    }
                    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
                },
                munmap: function (stream) {
                    return 0
                },
                ioctl: function (stream, cmd, arg) {
                    if (!stream.stream_ops.ioctl) {
                        throw new FS.ErrnoError(59)
                    }
                    return stream.stream_ops.ioctl(stream, cmd, arg)
                },
                readFile: function (path, opts) {
                    opts = opts || {};
                    opts.flags = opts.flags || "r";
                    opts.encoding = opts.encoding || "binary";
                    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                        throw new Error('Invalid encoding type "' + opts.encoding + '"')
                    }
                    var ret;
                    var stream = FS.open(path, opts.flags);
                    var stat = FS.stat(path);
                    var length = stat.size;
                    var buf = new Uint8Array(length);
                    FS.read(stream, buf, 0, length, 0);
                    if (opts.encoding === "utf8") {
                        ret = UTF8ArrayToString(buf, 0)
                    } else if (opts.encoding === "binary") {
                        ret = buf
                    }
                    FS.close(stream);
                    return ret
                },
                writeFile: function (path, data, opts) {
                    opts = opts || {};
                    opts.flags = opts.flags || "w";
                    var stream = FS.open(path, opts.flags, opts.mode);
                    if (typeof data === "string") {
                        var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                        var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                        FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
                    } else if (ArrayBuffer.isView(data)) {
                        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
                    } else {
                        throw new Error("Unsupported data type")
                    }
                    FS.close(stream)
                },
                cwd: function () {
                    return FS.currentPath
                },
                chdir: function (path) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    if (lookup.node === null) {
                        throw new FS.ErrnoError(44)
                    }
                    if (!FS.isDir(lookup.node.mode)) {
                        throw new FS.ErrnoError(54)
                    }
                    var err = FS.nodePermissions(lookup.node, "x");
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    FS.currentPath = lookup.path
                },
                createDefaultDirectories: function () {
                    FS.mkdir("/tmp");
                    FS.mkdir("/home");
                    FS.mkdir("/home/web_user")
                },
                createDefaultDevices: function () {
                    FS.mkdir("/dev");
                    FS.registerDevice(FS.makedev(1, 3), {
                        read: function () {
                            return 0
                        },
                        write: function (stream, buffer, offset, length, pos) {
                            return length
                        }
                    });
                    FS.mkdev("/dev/null", FS.makedev(1, 3));
                    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
                    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
                    FS.mkdev("/dev/tty", FS.makedev(5, 0));
                    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
                    var random_device;
                    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                        var randomBuffer = new Uint8Array(1);
                        random_device = function () {
                            crypto.getRandomValues(randomBuffer);
                            return randomBuffer[0]
                        }
                    } else if (ENVIRONMENT_IS_NODE) {
                        try {
                            var crypto_module = require("crypto");
                            random_device = function () {
                                return crypto_module["randomBytes"](1)[0]
                            }
                        } catch (e) { }
                    } else { }
                    if (!random_device) {
                        random_device = function () {
                            abort("random_device")
                        }
                    }
                    FS.createDevice("/dev", "random", random_device);
                    FS.createDevice("/dev", "urandom", random_device);
                    FS.mkdir("/dev/shm");
                    FS.mkdir("/dev/shm/tmp")
                },
                createSpecialDirectories: function () {
                    FS.mkdir("/proc");
                    FS.mkdir("/proc/self");
                    FS.mkdir("/proc/self/fd");
                    FS.mount({
                        mount: function () {
                            var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                            node.node_ops = {
                                lookup: function (parent, name) {
                                    var fd = +name;
                                    var stream = FS.getStream(fd);
                                    if (!stream)
                                        throw new FS.ErrnoError(8);
                                    var ret = {
                                        parent: null,
                                        mount: {
                                            mountpoint: "fake"
                                        },
                                        node_ops: {
                                            readlink: function () {
                                                return stream.path
                                            }
                                        }
                                    };
                                    ret.parent = ret;
                                    return ret
                                }
                            };
                            return node
                        }
                    }, {}, "/proc/self/fd")
                },
                createStandardStreams: function () {
                    if (Module["stdin"]) {
                        FS.createDevice("/dev", "stdin", Module["stdin"])
                    } else {
                        FS.symlink("/dev/tty", "/dev/stdin")
                    }
                    if (Module["stdout"]) {
                        FS.createDevice("/dev", "stdout", null, Module["stdout"])
                    } else {
                        FS.symlink("/dev/tty", "/dev/stdout")
                    }
                    if (Module["stderr"]) {
                        FS.createDevice("/dev", "stderr", null, Module["stderr"])
                    } else {
                        FS.symlink("/dev/tty1", "/dev/stderr")
                    }
                    var stdin = FS.open("/dev/stdin", "r");
                    var stdout = FS.open("/dev/stdout", "w");
                    var stderr = FS.open("/dev/stderr", "w")
                },
                ensureErrnoError: function () {
                    if (FS.ErrnoError)
                        return;
                    FS.ErrnoError = function ErrnoError(errno, node) {
                        this.node = node;
                        this.setErrno = function (errno) {
                            this.errno = errno
                        }
                            ;
                        this.setErrno(errno);
                        this.message = "FS error"
                    }
                        ;
                    FS.ErrnoError.prototype = new Error;
                    FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                    [44].forEach(function (code) {
                        FS.genericErrors[code] = new FS.ErrnoError(code);
                        FS.genericErrors[code].stack = "<generic error, no stack>"
                    })
                },
                staticInit: function () {
                    FS.ensureErrnoError();
                    FS.nameTable = new Array(4096);
                    FS.mount(MEMFS, {}, "/");
                    FS.createDefaultDirectories();
                    FS.createDefaultDevices();
                    FS.createSpecialDirectories();
                    FS.filesystems = {
                        "MEMFS": MEMFS,
                        "IDBFS": IDBFS,
                        "NODEFS": NODEFS,
                        "WORKERFS": WORKERFS
                    }
                },
                init: function (input, output, error) {
                    FS.init.initialized = true;
                    FS.ensureErrnoError();
                    Module["stdin"] = input || Module["stdin"];
                    Module["stdout"] = output || Module["stdout"];
                    Module["stderr"] = error || Module["stderr"];
                    FS.createStandardStreams()
                },
                quit: function () {
                    FS.init.initialized = false;
                    var fflush = Module["_fflush"];
                    if (fflush)
                        fflush(0);
                    for (var i = 0; i < FS.streams.length; i++) {
                        var stream = FS.streams[i];
                        if (!stream) {
                            continue
                        }
                        FS.close(stream)
                    }
                },
                getMode: function (canRead, canWrite) {
                    var mode = 0;
                    if (canRead)
                        mode |= 292 | 73;
                    if (canWrite)
                        mode |= 146;
                    return mode
                },
                joinPath: function (parts, forceRelative) {
                    var path = PATH.join.apply(null, parts);
                    if (forceRelative && path[0] == "/")
                        path = path.substr(1);
                    return path
                },
                absolutePath: function (relative, base) {
                    return PATH_FS.resolve(base, relative)
                },
                standardizePath: function (path) {
                    return PATH.normalize(path)
                },
                findObject: function (path, dontResolveLastLink) {
                    var ret = FS.analyzePath(path, dontResolveLastLink);
                    if (ret.exists) {
                        return ret.object
                    } else {
                        ___setErrNo(ret.error);
                        return null
                    }
                },
                analyzePath: function (path, dontResolveLastLink) {
                    try {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontResolveLastLink
                        });
                        path = lookup.path
                    } catch (e) { }
                    var ret = {
                        isRoot: false,
                        exists: false,
                        error: 0,
                        name: null,
                        path: null,
                        object: null,
                        parentExists: false,
                        parentPath: null,
                        parentObject: null
                    };
                    try {
                        var lookup = FS.lookupPath(path, {
                            parent: true
                        });
                        ret.parentExists = true;
                        ret.parentPath = lookup.path;
                        ret.parentObject = lookup.node;
                        ret.name = PATH.basename(path);
                        lookup = FS.lookupPath(path, {
                            follow: !dontResolveLastLink
                        });
                        ret.exists = true;
                        ret.path = lookup.path;
                        ret.object = lookup.node;
                        ret.name = lookup.node.name;
                        ret.isRoot = lookup.path === "/"
                    } catch (e) {
                        ret.error = e.errno
                    }
                    return ret
                },
                createFolder: function (parent, name, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(canRead, canWrite);
                    return FS.mkdir(path, mode)
                },
                createPath: function (parent, path, canRead, canWrite) {
                    parent = typeof parent === "string" ? parent : FS.getPath(parent);
                    var parts = path.split("/").reverse();
                    while (parts.length) {
                        var part = parts.pop();
                        if (!part)
                            continue;
                        var current = PATH.join2(parent, part);
                        try {
                            FS.mkdir(current)
                        } catch (e) { }
                        parent = current
                    }
                    return current
                },
                createFile: function (parent, name, properties, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(canRead, canWrite);
                    return FS.create(path, mode)
                },
                createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
                    var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
                    var mode = FS.getMode(canRead, canWrite);
                    var node = FS.create(path, mode);
                    if (data) {
                        if (typeof data === "string") {
                            var arr = new Array(data.length);
                            for (var i = 0, len = data.length; i < len; ++i)
                                arr[i] = data.charCodeAt(i);
                            data = arr
                        }
                        FS.chmod(node, mode | 146);
                        var stream = FS.open(node, "w");
                        FS.write(stream, data, 0, data.length, 0, canOwn);
                        FS.close(stream);
                        FS.chmod(node, mode)
                    }
                    return node
                },
                createDevice: function (parent, name, input, output) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(!!input, !!output);
                    if (!FS.createDevice.major)
                        FS.createDevice.major = 64;
                    var dev = FS.makedev(FS.createDevice.major++, 0);
                    FS.registerDevice(dev, {
                        open: function (stream) {
                            stream.seekable = false
                        },
                        close: function (stream) {
                            if (output && output.buffer && output.buffer.length) {
                                output(10)
                            }
                        },
                        read: function (stream, buffer, offset, length, pos) {
                            var bytesRead = 0;
                            for (var i = 0; i < length; i++) {
                                var result;
                                try {
                                    result = input()
                                } catch (e) {
                                    throw new FS.ErrnoError(29)
                                }
                                if (result === undefined && bytesRead === 0) {
                                    throw new FS.ErrnoError(6)
                                }
                                if (result === null || result === undefined)
                                    break;
                                bytesRead++;
                                buffer[offset + i] = result
                            }
                            if (bytesRead) {
                                stream.node.timestamp = Date.now()
                            }
                            return bytesRead
                        },
                        write: function (stream, buffer, offset, length, pos) {
                            for (var i = 0; i < length; i++) {
                                try {
                                    output(buffer[offset + i])
                                } catch (e) {
                                    throw new FS.ErrnoError(29)
                                }
                            }
                            if (length) {
                                stream.node.timestamp = Date.now()
                            }
                            return i
                        }
                    });
                    return FS.mkdev(path, mode, dev)
                },
                createLink: function (parent, name, target, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    return FS.symlink(target, path)
                },
                forceLoadFile: function (obj) {
                    if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
                        return true;
                    var success = true;
                    if (typeof XMLHttpRequest !== "undefined") {
                        throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
                    } else if (read_) {
                        try {
                            obj.contents = intArrayFromString(read_(obj.url), true);
                            obj.usedBytes = obj.contents.length
                        } catch (e) {
                            success = false
                        }
                    } else {
                        throw new Error("Cannot load without read() or XMLHttpRequest.")
                    }
                    if (!success)
                        ___setErrNo(29);
                    return success
                },
                createLazyFile: function (parent, name, url, canRead, canWrite) {
                    function LazyUint8Array() {
                        this.lengthKnown = false;
                        this.chunks = []
                    }
                    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                        if (idx > this.length - 1 || idx < 0) {
                            return undefined
                        }
                        var chunkOffset = idx % this.chunkSize;
                        var chunkNum = idx / this.chunkSize | 0;
                        return this.getter(chunkNum)[chunkOffset]
                    }
                        ;
                    LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                        this.getter = getter
                    }
                        ;
                    LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                        var xhr = new XMLHttpRequest;
                        xhr.open("HEAD", url, false);
                        xhr.send(null);
                        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                            throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                        var datalength = Number(xhr.getResponseHeader("Content-length"));
                        var header;
                        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                        var chunkSize = 1024 * 1024;
                        if (!hasByteServing)
                            chunkSize = datalength;
                        var doXHR = function (from, to) {
                            if (from > to)
                                throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                            if (to > datalength - 1)
                                throw new Error("only " + datalength + " bytes available! programmer error!");
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            if (datalength !== chunkSize)
                                xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                            if (typeof Uint8Array != "undefined")
                                xhr.responseType = "arraybuffer";
                            if (xhr.overrideMimeType) {
                                xhr.overrideMimeType("text/plain; charset=x-user-defined")
                            }
                            xhr.send(null);
                            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                                throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                            if (xhr.response !== undefined) {
                                return new Uint8Array(xhr.response || [])
                            } else {
                                return intArrayFromString(xhr.responseText || "", true)
                            }
                        };
                        var lazyArray = this;
                        lazyArray.setDataGetter(function (chunkNum) {
                            var start = chunkNum * chunkSize;
                            var end = (chunkNum + 1) * chunkSize - 1;
                            end = Math.min(end, datalength - 1);
                            if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                                lazyArray.chunks[chunkNum] = doXHR(start, end)
                            }
                            if (typeof lazyArray.chunks[chunkNum] === "undefined")
                                throw new Error("doXHR failed!");
                            return lazyArray.chunks[chunkNum]
                        });
                        if (usesGzip || !datalength) {
                            chunkSize = datalength = 1;
                            datalength = this.getter(0).length;
                            chunkSize = datalength;
                            console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
                        }
                        this._length = datalength;
                        this._chunkSize = chunkSize;
                        this.lengthKnown = true
                    }
                        ;
                    if (typeof XMLHttpRequest !== "undefined") {
                        if (!ENVIRONMENT_IS_WORKER)
                            throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                        var lazyArray = new LazyUint8Array;
                        Object.defineProperties(lazyArray, {
                            length: {
                                get: function () {
                                    if (!this.lengthKnown) {
                                        this.cacheLength()
                                    }
                                    return this._length
                                }
                            },
                            chunkSize: {
                                get: function () {
                                    if (!this.lengthKnown) {
                                        this.cacheLength()
                                    }
                                    return this._chunkSize
                                }
                            }
                        });
                        var properties = {
                            isDevice: false,
                            contents: lazyArray
                        }
                    } else {
                        var properties = {
                            isDevice: false,
                            url: url
                        }
                    }
                    var node = FS.createFile(parent, name, properties, canRead, canWrite);
                    if (properties.contents) {
                        node.contents = properties.contents
                    } else if (properties.url) {
                        node.contents = null;
                        node.url = properties.url
                    }
                    Object.defineProperties(node, {
                        usedBytes: {
                            get: function () {
                                return this.contents.length
                            }
                        }
                    });
                    var stream_ops = {};
                    var keys = Object.keys(node.stream_ops);
                    keys.forEach(function (key) {
                        var fn = node.stream_ops[key];
                        stream_ops[key] = function forceLoadLazyFile() {
                            if (!FS.forceLoadFile(node)) {
                                throw new FS.ErrnoError(29)
                            }
                            return fn.apply(null, arguments)
                        }
                    });
                    stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
                        if (!FS.forceLoadFile(node)) {
                            throw new FS.ErrnoError(29)
                        }
                        var contents = stream.node.contents;
                        if (position >= contents.length)
                            return 0;
                        var size = Math.min(contents.length - position, length);
                        if (contents.slice) {
                            for (var i = 0; i < size; i++) {
                                buffer[offset + i] = contents[position + i]
                            }
                        } else {
                            for (var i = 0; i < size; i++) {
                                buffer[offset + i] = contents.get(position + i)
                            }
                        }
                        return size
                    }
                        ;
                    node.stream_ops = stream_ops;
                    return node
                },
                createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
                    Browser.init();
                    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
                    var dep = getUniqueRunDependency("cp " + fullname);
                    function processData(byteArray) {
                        function finish(byteArray) {
                            if (preFinish)
                                preFinish();
                            if (!dontCreateFile) {
                                FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                            }
                            if (onload)
                                onload();
                            removeRunDependency(dep)
                        }
                        var handled = false;
                        Module["preloadPlugins"].forEach(function (plugin) {
                            if (handled)
                                return;
                            if (plugin["canHandle"](fullname)) {
                                plugin["handle"](byteArray, fullname, finish, function () {
                                    if (onerror)
                                        onerror();
                                    removeRunDependency(dep)
                                });
                                handled = true
                            }
                        });
                        if (!handled)
                            finish(byteArray)
                    }
                    addRunDependency(dep);
                    if (typeof url == "string") {
                        Browser.asyncLoad(url, function (byteArray) {
                            processData(byteArray)
                        }, onerror)
                    } else {
                        processData(url)
                    }
                },
                indexedDB: function () {
                    return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
                },
                DB_NAME: function () {
                    return "EM_FS_" + window.location.pathname
                },
                DB_VERSION: 20,
                DB_STORE_NAME: "FILE_DATA",
                saveFilesToDB: function (paths, onload, onerror) {
                    onload = onload || function () { }
                        ;
                    onerror = onerror || function () { }
                        ;
                    var indexedDB = FS.indexedDB();
                    try {
                        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                    } catch (e) {
                        return onerror(e)
                    }
                    openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
                        console.log("creating db");
                        var db = openRequest.result;
                        db.createObjectStore(FS.DB_STORE_NAME)
                    }
                        ;
                    openRequest.onsuccess = function openRequest_onsuccess() {
                        var db = openRequest.result;
                        var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                        var files = transaction.objectStore(FS.DB_STORE_NAME);
                        var ok = 0
                            , fail = 0
                            , total = paths.length;
                        function finish() {
                            if (fail == 0)
                                onload();
                            else
                                onerror()
                        }
                        paths.forEach(function (path) {
                            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                            putRequest.onsuccess = function putRequest_onsuccess() {
                                ok++;
                                if (ok + fail == total)
                                    finish()
                            }
                                ;
                            putRequest.onerror = function putRequest_onerror() {
                                fail++;
                                if (ok + fail == total)
                                    finish()
                            }
                        });
                        transaction.onerror = onerror
                    }
                        ;
                    openRequest.onerror = onerror
                },
                loadFilesFromDB: function (paths, onload, onerror) {
                    onload = onload || function () { }
                        ;
                    onerror = onerror || function () { }
                        ;
                    var indexedDB = FS.indexedDB();
                    try {
                        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                    } catch (e) {
                        return onerror(e)
                    }
                    openRequest.onupgradeneeded = onerror;
                    openRequest.onsuccess = function openRequest_onsuccess() {
                        var db = openRequest.result;
                        try {
                            var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
                        } catch (e) {
                            onerror(e);
                            return
                        }
                        var files = transaction.objectStore(FS.DB_STORE_NAME);
                        var ok = 0
                            , fail = 0
                            , total = paths.length;
                        function finish() {
                            if (fail == 0)
                                onload();
                            else
                                onerror()
                        }
                        paths.forEach(function (path) {
                            var getRequest = files.get(path);
                            getRequest.onsuccess = function getRequest_onsuccess() {
                                if (FS.analyzePath(path).exists) {
                                    FS.unlink(path)
                                }
                                FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                                ok++;
                                if (ok + fail == total)
                                    finish()
                            }
                                ;
                            getRequest.onerror = function getRequest_onerror() {
                                fail++;
                                if (ok + fail == total)
                                    finish()
                            }
                        });
                        transaction.onerror = onerror
                    }
                        ;
                    openRequest.onerror = onerror
                }
            };
            var SYSCALLS = {
                DEFAULT_POLLMASK: 5,
                mappings: {},
                umask: 511,
                calculateAt: function (dirfd, path) {
                    if (path[0] !== "/") {
                        var dir;
                        if (dirfd === -100) {
                            dir = FS.cwd()
                        } else {
                            var dirstream = FS.getStream(dirfd);
                            if (!dirstream)
                                throw new FS.ErrnoError(8);
                            dir = dirstream.path
                        }
                        path = PATH.join2(dir, path)
                    }
                    return path
                },
                doStat: function (func, path, buf) {
                    try {
                        var stat = func(path)
                    } catch (e) {
                        if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                            return -54
                        }
                        throw e
                    }
                    HEAP32[buf >> 2] = stat.dev;
                    HEAP32[buf + 4 >> 2] = 0;
                    HEAP32[buf + 8 >> 2] = stat.ino;
                    HEAP32[buf + 12 >> 2] = stat.mode;
                    HEAP32[buf + 16 >> 2] = stat.nlink;
                    HEAP32[buf + 20 >> 2] = stat.uid;
                    HEAP32[buf + 24 >> 2] = stat.gid;
                    HEAP32[buf + 28 >> 2] = stat.rdev;
                    HEAP32[buf + 32 >> 2] = 0;
                    tempI64 = [stat.size >>> 0, (tempDouble = stat.size,
                        +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                        HEAP32[buf + 40 >> 2] = tempI64[0],
                        HEAP32[buf + 44 >> 2] = tempI64[1];
                    HEAP32[buf + 48 >> 2] = 4096;
                    HEAP32[buf + 52 >> 2] = stat.blocks;
                    HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
                    HEAP32[buf + 60 >> 2] = 0;
                    HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
                    HEAP32[buf + 68 >> 2] = 0;
                    HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
                    HEAP32[buf + 76 >> 2] = 0;
                    tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino,
                        +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                        HEAP32[buf + 80 >> 2] = tempI64[0],
                        HEAP32[buf + 84 >> 2] = tempI64[1];
                    return 0
                },
                doMsync: function (addr, stream, len, flags) {
                    var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
                    FS.msync(stream, buffer, 0, len, flags)
                },
                doMkdir: function (path, mode) {
                    path = PATH.normalize(path);
                    if (path[path.length - 1] === "/")
                        path = path.substr(0, path.length - 1);
                    FS.mkdir(path, mode, 0);
                    return 0
                },
                doMknod: function (path, mode, dev) {
                    switch (mode & 61440) {
                        case 32768:
                        case 8192:
                        case 24576:
                        case 4096:
                        case 49152:
                            break;
                        default:
                            return -28
                    }
                    FS.mknod(path, mode, dev);
                    return 0
                },
                doReadlink: function (path, buf, bufsize) {
                    if (bufsize <= 0)
                        return -28;
                    var ret = FS.readlink(path);
                    var len = Math.min(bufsize, lengthBytesUTF8(ret));
                    var endChar = HEAP8[buf + len];
                    stringToUTF8(ret, buf, bufsize + 1);
                    HEAP8[buf + len] = endChar;
                    return len
                },
                doAccess: function (path, amode) {
                    if (amode & ~7) {
                        return -28
                    }
                    var node;
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    node = lookup.node;
                    if (!node) {
                        return -44
                    }
                    var perms = "";
                    if (amode & 4)
                        perms += "r";
                    if (amode & 2)
                        perms += "w";
                    if (amode & 1)
                        perms += "x";
                    if (perms && FS.nodePermissions(node, perms)) {
                        return -2
                    }
                    return 0
                },
                doDup: function (path, flags, suggestFD) {
                    var suggest = FS.getStream(suggestFD);
                    if (suggest)
                        FS.close(suggest);
                    return FS.open(path, flags, 0, suggestFD, suggestFD).fd
                },
                doReadv: function (stream, iov, iovcnt, offset) {
                    var ret = 0;
                    for (var i = 0; i < iovcnt; i++) {
                        var ptr = HEAP32[iov + i * 8 >> 2];
                        var len = HEAP32[iov + (i * 8 + 4) >> 2];
                        var curr = FS.read(stream, HEAP8, ptr, len, offset);
                        if (curr < 0)
                            return -1;
                        ret += curr;
                        if (curr < len)
                            break
                    }
                    return ret
                },
                doWritev: function (stream, iov, iovcnt, offset) {
                    var ret = 0;
                    for (var i = 0; i < iovcnt; i++) {
                        var ptr = HEAP32[iov + i * 8 >> 2];
                        var len = HEAP32[iov + (i * 8 + 4) >> 2];
                        var curr = FS.write(stream, HEAP8, ptr, len, offset);
                        if (curr < 0)
                            return -1;
                        ret += curr
                    }
                    return ret
                },
                varargs: 0,
                get: function (varargs) {
                    SYSCALLS.varargs += 4;
                    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                    return ret
                },
                getStr: function () {
                    var ret = UTF8ToString(SYSCALLS.get());
                    return ret
                },
                getStreamFromFD: function (fd) {
                    if (fd === undefined)
                        fd = SYSCALLS.get();
                    var stream = FS.getStream(fd);
                    if (!stream)
                        throw new FS.ErrnoError(8);
                    return stream
                },
                get64: function () {
                    var low = SYSCALLS.get()
                        , high = SYSCALLS.get();
                    return low
                },
                getZero: function () {
                    SYSCALLS.get()
                }
            };
            function ___syscall221(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD()
                        , cmd = SYSCALLS.get();
                    switch (cmd) {
                        case 0:
                            {
                                var arg = SYSCALLS.get();
                                if (arg < 0) {
                                    return -28
                                }
                                var newStream;
                                newStream = FS.open(stream.path, stream.flags, 0, arg);
                                return newStream.fd
                            }
                        case 1:
                        case 2:
                            return 0;
                        case 3:
                            return stream.flags;
                        case 4:
                            {
                                var arg = SYSCALLS.get();
                                stream.flags |= arg;
                                return 0
                            }
                        case 12:
                            {
                                var arg = SYSCALLS.get();
                                var offset = 0;
                                HEAP16[arg + offset >> 1] = 2;
                                return 0
                            }
                        case 13:
                        case 14:
                            return 0;
                        case 16:
                        case 8:
                            return -28;
                        case 9:
                            ___setErrNo(28);
                            return -1;
                        default:
                            {
                                return -28
                            }
                    }
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function ___syscall3(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD()
                        , buf = SYSCALLS.get()
                        , count = SYSCALLS.get();
                    return FS.read(stream, HEAP8, buf, count)
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function ___syscall4(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD()
                        , buf = SYSCALLS.get()
                        , count = SYSCALLS.get();
                    return FS.write(stream, HEAP8, buf, count)
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function ___syscall5(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var pathname = SYSCALLS.getStr()
                        , flags = SYSCALLS.get()
                        , mode = SYSCALLS.get();
                    var stream = FS.open(pathname, flags, mode);
                    return stream.fd
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function ___syscall54(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD()
                        , op = SYSCALLS.get();
                    switch (op) {
                        case 21509:
                        case 21505:
                            {
                                if (!stream.tty)
                                    return -59;
                                return 0
                            }
                        case 21510:
                        case 21511:
                        case 21512:
                        case 21506:
                        case 21507:
                        case 21508:
                            {
                                if (!stream.tty)
                                    return -59;
                                return 0
                            }
                        case 21519:
                            {
                                if (!stream.tty)
                                    return -59;
                                var argp = SYSCALLS.get();
                                HEAP32[argp >> 2] = 0;
                                return 0
                            }
                        case 21520:
                            {
                                if (!stream.tty)
                                    return -59;
                                return -28
                            }
                        case 21531:
                            {
                                var argp = SYSCALLS.get();
                                return FS.ioctl(stream, op, argp)
                            }
                        case 21523:
                            {
                                if (!stream.tty)
                                    return -59;
                                return 0
                            }
                        case 21524:
                            {
                                if (!stream.tty)
                                    return -59;
                                return 0
                            }
                        default:
                            abort("bad ioctl syscall " + op)
                    }
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function __emscripten_syscall_munmap(addr, len) {
                if (addr === -1 || len === 0) {
                    return -28
                }
                var info = SYSCALLS.mappings[addr];
                if (!info)
                    return 0;
                if (len === info.len) {
                    var stream = FS.getStream(info.fd);
                    SYSCALLS.doMsync(addr, stream, len, info.flags);
                    FS.munmap(stream);
                    SYSCALLS.mappings[addr] = null;
                    if (info.allocated) {
                        _free(info.malloc)
                    }
                }
                return 0
            }
            function ___syscall91(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var addr = SYSCALLS.get()
                        , len = SYSCALLS.get();
                    return __emscripten_syscall_munmap(addr, len)
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return -e.errno
                }
            }
            function ___unlock() { }
            var tupleRegistrations = {};
            function runDestructors(destructors) {
                while (destructors.length) {
                    var ptr = destructors.pop();
                    var del = destructors.pop();
                    del(ptr)
                }
            }
            function simpleReadValueFromPointer(pointer) {
                return this["fromWireType"](HEAPU32[pointer >> 2])
            }
            var awaitingDependencies = {};
            var registeredTypes = {};
            var typeDependencies = {};
            var char_0 = 48;
            var char_9 = 57;
            function makeLegalFunctionName(name) {
                if (undefined === name) {
                    return "_unknown"
                }
                name = name.replace(/[^a-zA-Z0-9_]/g, "$");
                var f = name.charCodeAt(0);
                if (f >= char_0 && f <= char_9) {
                    return "_" + name
                } else {
                    return name
                }
            }
            function createNamedFunction(name, body) {
                name = makeLegalFunctionName(name);
                if (IsWechat) {
                    var f1 = function (body) {
                        return function () {
                            "use strict";
                            return body.apply(this, arguments);
                        }
                    }
                    return f1(body)
                } else {
                    return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body)
                }

            }
            function extendError(baseErrorType, errorName) {
                var errorClass = createNamedFunction(errorName, function (message) {
                    this.name = errorName;
                    this.message = message;
                    var stack = new Error(message).stack;
                    if (stack !== undefined) {
                        this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
                    }
                });

                errorClass.prototype = Object.create(baseErrorType.prototype);
                errorClass.prototype.constructor = errorClass;
                errorClass.prototype.toString = function () {
                    if (this.message === undefined) {
                        return this.name
                    } else {
                        return this.name + ": " + this.message
                    }
                }
                    ;
                return errorClass
            }
            var InternalError = undefined;
            function throwInternalError(message) {
                throw new InternalError(message)
            }
            function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
                myTypes.forEach(function (type) {
                    typeDependencies[type] = dependentTypes
                });
                function onComplete(typeConverters) {
                    var myTypeConverters = getTypeConverters(typeConverters);
                    if (myTypeConverters.length !== myTypes.length) {
                        throwInternalError("Mismatched type converter count")
                    }
                    for (var i = 0; i < myTypes.length; ++i) {
                        registerType(myTypes[i], myTypeConverters[i])
                    }
                }
                var typeConverters = new Array(dependentTypes.length);
                var unregisteredTypes = [];
                var registered = 0;
                dependentTypes.forEach(function (dt, i) {
                    if (registeredTypes.hasOwnProperty(dt)) {
                        typeConverters[i] = registeredTypes[dt]
                    } else {
                        unregisteredTypes.push(dt);
                        if (!awaitingDependencies.hasOwnProperty(dt)) {
                            awaitingDependencies[dt] = []
                        }
                        awaitingDependencies[dt].push(function () {
                            typeConverters[i] = registeredTypes[dt];
                            ++registered;
                            if (registered === unregisteredTypes.length) {
                                onComplete(typeConverters)
                            }
                        })
                    }
                });
                if (0 === unregisteredTypes.length) {
                    onComplete(typeConverters)
                }
            }
            function __embind_finalize_value_array(rawTupleType) {
                var reg = tupleRegistrations[rawTupleType];
                delete tupleRegistrations[rawTupleType];
                var elements = reg.elements;
                var elementsLength = elements.length;
                var elementTypes = elements.map(function (elt) {
                    return elt.getterReturnType
                }).concat(elements.map(function (elt) {
                    return elt.setterArgumentType
                }));
                var rawConstructor = reg.rawConstructor;
                var rawDestructor = reg.rawDestructor;
                whenDependentTypesAreResolved([rawTupleType], elementTypes, function (elementTypes) {
                    elements.forEach(function (elt, i) {
                        var getterReturnType = elementTypes[i];
                        var getter = elt.getter;
                        var getterContext = elt.getterContext;
                        var setterArgumentType = elementTypes[i + elementsLength];
                        var setter = elt.setter;
                        var setterContext = elt.setterContext;
                        elt.read = function (ptr) {
                            return getterReturnType["fromWireType"](getter(getterContext, ptr))
                        }
                            ;
                        elt.write = function (ptr, o) {
                            var destructors = [];
                            setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                            runDestructors(destructors)
                        }
                    });
                    return [{
                        name: reg.name,
                        "fromWireType": function (ptr) {
                            var rv = new Array(elementsLength);
                            for (var i = 0; i < elementsLength; ++i) {
                                rv[i] = elements[i].read(ptr)
                            }
                            rawDestructor(ptr);
                            return rv
                        },
                        "toWireType": function (destructors, o) {
                            if (elementsLength !== o.length) {
                                throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length)
                            }
                            var ptr = rawConstructor();
                            for (var i = 0; i < elementsLength; ++i) {
                                elements[i].write(ptr, o[i])
                            }
                            if (destructors !== null) {
                                destructors.push(rawDestructor, ptr)
                            }
                            return ptr
                        },
                        "argPackAdvance": 8,
                        "readValueFromPointer": simpleReadValueFromPointer,
                        destructorFunction: rawDestructor
                    }]
                })
            }
            var structRegistrations = {};
            function __embind_finalize_value_object(structType) {
                var reg = structRegistrations[structType];
                delete structRegistrations[structType];
                var rawConstructor = reg.rawConstructor;
                var rawDestructor = reg.rawDestructor;
                var fieldRecords = reg.fields;
                var fieldTypes = fieldRecords.map(function (field) {
                    return field.getterReturnType
                }).concat(fieldRecords.map(function (field) {
                    return field.setterArgumentType
                }));
                whenDependentTypesAreResolved([structType], fieldTypes, function (fieldTypes) {
                    var fields = {};
                    fieldRecords.forEach(function (field, i) {
                        var fieldName = field.fieldName;
                        var getterReturnType = fieldTypes[i];
                        var getter = field.getter;
                        var getterContext = field.getterContext;
                        var setterArgumentType = fieldTypes[i + fieldRecords.length];
                        var setter = field.setter;
                        var setterContext = field.setterContext;
                        fields[fieldName] = {
                            read: function (ptr) {
                                return getterReturnType["fromWireType"](getter(getterContext, ptr))
                            },
                            write: function (ptr, o) {
                                var destructors = [];
                                setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                                runDestructors(destructors)
                            }
                        }
                    });
                    return [{
                        name: reg.name,
                        "fromWireType": function (ptr) {
                            var rv = {};
                            for (var i in fields) {
                                rv[i] = fields[i].read(ptr)
                            }
                            rawDestructor(ptr);
                            return rv
                        },
                        "toWireType": function (destructors, o) {
                            for (var fieldName in fields) {
                                if (!(fieldName in o)) {
                                    throw new TypeError("Missing field")
                                }
                            }
                            var ptr = rawConstructor();
                            for (fieldName in fields) {
                                fields[fieldName].write(ptr, o[fieldName])
                            }
                            if (destructors !== null) {
                                destructors.push(rawDestructor, ptr)
                            }
                            return ptr
                        },
                        "argPackAdvance": 8,
                        "readValueFromPointer": simpleReadValueFromPointer,
                        destructorFunction: rawDestructor
                    }]
                })
            }
            function getShiftFromSize(size) {
                switch (size) {
                    case 1:
                        return 0;
                    case 2:
                        return 1;
                    case 4:
                        return 2;
                    case 8:
                        return 3;
                    default:
                        throw new TypeError("Unknown type size: " + size)
                }
            }
            function embind_init_charCodes() {
                var codes = new Array(256);
                for (var i = 0; i < 256; ++i) {
                    codes[i] = String.fromCharCode(i)
                }
                embind_charCodes = codes
            }
            var embind_charCodes = undefined;
            function readLatin1String(ptr) {
                var ret = "";
                var c = ptr;
                while (HEAPU8[c]) {
                    ret += embind_charCodes[HEAPU8[c++]]
                }
                return ret
            }
            var BindingError = undefined;
            function throwBindingError(message) {
                throw new BindingError(message)
            }
            function registerType(rawType, registeredInstance, options) {
                options = options || {};
                if (!("argPackAdvance" in registeredInstance)) {
                    throw new TypeError("registerType registeredInstance requires argPackAdvance")
                }
                var name = registeredInstance.name;
                if (!rawType) {
                    throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
                }
                if (registeredTypes.hasOwnProperty(rawType)) {
                    if (options.ignoreDuplicateRegistrations) {
                        return
                    } else {
                        throwBindingError("Cannot register type '" + name + "' twice")
                    }
                }
                registeredTypes[rawType] = registeredInstance;
                delete typeDependencies[rawType];
                if (awaitingDependencies.hasOwnProperty(rawType)) {
                    var callbacks = awaitingDependencies[rawType];
                    delete awaitingDependencies[rawType];
                    callbacks.forEach(function (cb) {
                        cb()
                    })
                }
            }
            function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
                var shift = getShiftFromSize(size);
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (wt) {
                        return !!wt
                    },
                    "toWireType": function (destructors, o) {
                        return o ? trueValue : falseValue
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": function (pointer) {
                        var heap;
                        if (size === 1) {
                            heap = HEAP8
                        } else if (size === 2) {
                            heap = HEAP16
                        } else if (size === 4) {
                            heap = HEAP32
                        } else {
                            throw new TypeError("Unknown boolean type size: " + name)
                        }
                        return this["fromWireType"](heap[pointer >> shift])
                    },
                    destructorFunction: null
                })
            }
            function ClassHandle_isAliasOf(other) {
                if (!(this instanceof ClassHandle)) {
                    return false
                }
                if (!(other instanceof ClassHandle)) {
                    return false
                }
                var leftClass = this.$$.ptrType.registeredClass;
                var left = this.$$.ptr;
                var rightClass = other.$$.ptrType.registeredClass;
                var right = other.$$.ptr;
                while (leftClass.baseClass) {
                    left = leftClass.upcast(left);
                    leftClass = leftClass.baseClass
                }
                while (rightClass.baseClass) {
                    right = rightClass.upcast(right);
                    rightClass = rightClass.baseClass
                }
                return leftClass === rightClass && left === right
            }
            function shallowCopyInternalPointer(o) {
                return {
                    count: o.count,
                    deleteScheduled: o.deleteScheduled,
                    preservePointerOnDelete: o.preservePointerOnDelete,
                    ptr: o.ptr,
                    ptrType: o.ptrType,
                    smartPtr: o.smartPtr,
                    smartPtrType: o.smartPtrType
                }
            }
            function throwInstanceAlreadyDeleted(obj) {
                function getInstanceTypeName(handle) {
                    return handle.$$.ptrType.registeredClass.name
                }
                throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
            }
            var finalizationGroup = false;
            function detachFinalizer(handle) { }
            function runDestructor($$) {
                if ($$.smartPtr) {
                    $$.smartPtrType.rawDestructor($$.smartPtr)
                } else {
                    $$.ptrType.registeredClass.rawDestructor($$.ptr)
                }
            }
            function releaseClassHandle($$) {
                $$.count.value -= 1;
                var toDelete = 0 === $$.count.value;
                if (toDelete) {
                    runDestructor($$)
                }
            }
            function attachFinalizer(handle) {
                if ("undefined" === typeof FinalizationGroup) {
                    attachFinalizer = function (handle) {
                        return handle
                    }
                        ;
                    return handle
                }
                finalizationGroup = new FinalizationGroup(function (iter) {
                    for (var result = iter.next(); !result.done; result = iter.next()) {
                        var $$ = result.value;
                        if (!$$.ptr) {
                            console.warn("object already deleted: " + $$.ptr)
                        } else {
                            releaseClassHandle($$)
                        }
                    }
                }
                );
                attachFinalizer = function (handle) {
                    finalizationGroup.register(handle, handle.$$, handle.$$);
                    return handle
                }
                    ;
                detachFinalizer = function (handle) {
                    finalizationGroup.unregister(handle.$$)
                }
                    ;
                return attachFinalizer(handle)
            }
            function ClassHandle_clone() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.preservePointerOnDelete) {
                    this.$$.count.value += 1;
                    return this
                } else {
                    var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
                        $$: {
                            value: shallowCopyInternalPointer(this.$$)
                        }
                    }));
                    clone.$$.count.value += 1;
                    clone.$$.deleteScheduled = false;
                    return clone
                }
            }
            function ClassHandle_delete() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                    throwBindingError("Object already scheduled for deletion")
                }
                detachFinalizer(this);
                releaseClassHandle(this.$$);
                if (!this.$$.preservePointerOnDelete) {
                    this.$$.smartPtr = undefined;
                    this.$$.ptr = undefined
                }
            }
            function ClassHandle_isDeleted() {
                return !this.$$.ptr
            }
            var delayFunction = undefined;
            var deletionQueue = [];
            function flushPendingDeletes() {
                while (deletionQueue.length) {
                    var obj = deletionQueue.pop();
                    obj.$$.deleteScheduled = false;
                    obj["delete"]()
                }
            }
            function ClassHandle_deleteLater() {
                if (!this.$$.ptr) {
                    throwInstanceAlreadyDeleted(this)
                }
                if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                    throwBindingError("Object already scheduled for deletion")
                }
                deletionQueue.push(this);
                if (deletionQueue.length === 1 && delayFunction) {
                    delayFunction(flushPendingDeletes)
                }
                this.$$.deleteScheduled = true;
                return this
            }
            function init_ClassHandle() {
                ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
                ClassHandle.prototype["clone"] = ClassHandle_clone;
                ClassHandle.prototype["delete"] = ClassHandle_delete;
                ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
                ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
            }
            function ClassHandle() { }
            var registeredPointers = {};
            function ensureOverloadTable(proto, methodName, humanName) {
                if (undefined === proto[methodName].overloadTable) {
                    var prevFunc = proto[methodName];
                    proto[methodName] = function () {
                        if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                            throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
                        }
                        return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
                    }
                        ;
                    proto[methodName].overloadTable = [];
                    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
                }
            }
            function exposePublicSymbol(name, value, numArguments) {
                if (Module.hasOwnProperty(name)) {
                    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
                        throwBindingError("Cannot register public name '" + name + "' twice")
                    }
                    ensureOverloadTable(Module, name, name);
                    if (Module.hasOwnProperty(numArguments)) {
                        throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
                    }
                    Module[name].overloadTable[numArguments] = value
                } else {
                    Module[name] = value;
                    if (undefined !== numArguments) {
                        Module[name].numArguments = numArguments
                    }
                }
            }
            function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
                this.name = name;
                this.constructor = constructor;
                this.instancePrototype = instancePrototype;
                this.rawDestructor = rawDestructor;
                this.baseClass = baseClass;
                this.getActualType = getActualType;
                this.upcast = upcast;
                this.downcast = downcast;
                this.pureVirtualFunctions = []
            }
            function upcastPointer(ptr, ptrClass, desiredClass) {
                while (ptrClass !== desiredClass) {
                    if (!ptrClass.upcast) {
                        throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
                    }
                    ptr = ptrClass.upcast(ptr);
                    ptrClass = ptrClass.baseClass
                }
                return ptr
            }
            function constNoSmartPtrRawPointerToWireType(destructors, handle) {
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    return 0
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                return ptr
            }
            function genericPointerToWireType(destructors, handle) {
                var ptr;
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    if (this.isSmartPointer) {
                        ptr = this.rawConstructor();
                        if (destructors !== null) {
                            destructors.push(this.rawDestructor, ptr)
                        }
                        return ptr
                    } else {
                        return 0
                    }
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                if (!this.isConst && handle.$$.ptrType.isConst) {
                    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                if (this.isSmartPointer) {
                    if (undefined === handle.$$.smartPtr) {
                        throwBindingError("Passing raw pointer to smart pointer is illegal")
                    }
                    switch (this.sharingPolicy) {
                        case 0:
                            if (handle.$$.smartPtrType === this) {
                                ptr = handle.$$.smartPtr
                            } else {
                                throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
                            }
                            break;
                        case 1:
                            ptr = handle.$$.smartPtr;
                            break;
                        case 2:
                            if (handle.$$.smartPtrType === this) {
                                ptr = handle.$$.smartPtr
                            } else {
                                var clonedHandle = handle["clone"]();
                                ptr = this.rawShare(ptr, __emval_register(function () {
                                    clonedHandle["delete"]()
                                }));
                                if (destructors !== null) {
                                    destructors.push(this.rawDestructor, ptr)
                                }
                            }
                            break;
                        default:
                            throwBindingError("Unsupporting sharing policy")
                    }
                }
                return ptr
            }
            function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
                if (handle === null) {
                    if (this.isReference) {
                        throwBindingError("null is not a valid " + this.name)
                    }
                    return 0
                }
                if (!handle.$$) {
                    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
                }
                if (!handle.$$.ptr) {
                    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
                }
                if (handle.$$.ptrType.isConst) {
                    throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
                }
                var handleClass = handle.$$.ptrType.registeredClass;
                var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
                return ptr
            }
            function RegisteredPointer_getPointee(ptr) {
                if (this.rawGetPointee) {
                    ptr = this.rawGetPointee(ptr)
                }
                return ptr
            }
            function RegisteredPointer_destructor(ptr) {
                if (this.rawDestructor) {
                    this.rawDestructor(ptr)
                }
            }
            function RegisteredPointer_deleteObject(handle) {
                if (handle !== null) {
                    handle["delete"]()
                }
            }
            function downcastPointer(ptr, ptrClass, desiredClass) {
                if (ptrClass === desiredClass) {
                    return ptr
                }
                if (undefined === desiredClass.baseClass) {
                    return null
                }
                var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
                if (rv === null) {
                    return null
                }
                return desiredClass.downcast(rv)
            }
            function getInheritedInstanceCount() {
                return Object.keys(registeredInstances).length
            }
            function getLiveInheritedInstances() {
                var rv = [];
                for (var k in registeredInstances) {
                    if (registeredInstances.hasOwnProperty(k)) {
                        rv.push(registeredInstances[k])
                    }
                }
                return rv
            }
            function setDelayFunction(fn) {
                delayFunction = fn;
                if (deletionQueue.length && delayFunction) {
                    delayFunction(flushPendingDeletes)
                }
            }
            function init_embind() {
                Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
                Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
                Module["flushPendingDeletes"] = flushPendingDeletes;
                Module["setDelayFunction"] = setDelayFunction
            }
            var registeredInstances = {};
            function getBasestPointer(class_, ptr) {
                if (ptr === undefined) {
                    throwBindingError("ptr should not be undefined")
                }
                while (class_.baseClass) {
                    ptr = class_.upcast(ptr);
                    class_ = class_.baseClass
                }
                return ptr
            }
            function getInheritedInstance(class_, ptr) {
                ptr = getBasestPointer(class_, ptr);
                return registeredInstances[ptr]
            }
            function makeClassHandle(prototype, record) {
                if (!record.ptrType || !record.ptr) {
                    throwInternalError("makeClassHandle requires ptr and ptrType")
                }
                var hasSmartPtrType = !!record.smartPtrType;
                var hasSmartPtr = !!record.smartPtr;
                if (hasSmartPtrType !== hasSmartPtr) {
                    throwInternalError("Both smartPtrType and smartPtr must be specified")
                }
                record.count = {
                    value: 1
                };
                return attachFinalizer(Object.create(prototype, {
                    $$: {
                        value: record
                    }
                }))
            }
            function RegisteredPointer_fromWireType(ptr) {
                var rawPointer = this.getPointee(ptr);
                if (!rawPointer) {
                    this.destructor(ptr);
                    return null
                }
                var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
                if (undefined !== registeredInstance) {
                    if (0 === registeredInstance.$$.count.value) {
                        registeredInstance.$$.ptr = rawPointer;
                        registeredInstance.$$.smartPtr = ptr;
                        return registeredInstance["clone"]()
                    } else {
                        var rv = registeredInstance["clone"]();
                        this.destructor(ptr);
                        return rv
                    }
                }
                function makeDefaultHandle() {
                    if (this.isSmartPointer) {
                        return makeClassHandle(this.registeredClass.instancePrototype, {
                            ptrType: this.pointeeType,
                            ptr: rawPointer,
                            smartPtrType: this,
                            smartPtr: ptr
                        })
                    } else {
                        return makeClassHandle(this.registeredClass.instancePrototype, {
                            ptrType: this,
                            ptr: ptr
                        })
                    }
                }
                var actualType = this.registeredClass.getActualType(rawPointer);
                var registeredPointerRecord = registeredPointers[actualType];
                if (!registeredPointerRecord) {
                    return makeDefaultHandle.call(this)
                }
                var toType;
                if (this.isConst) {
                    toType = registeredPointerRecord.constPointerType
                } else {
                    toType = registeredPointerRecord.pointerType
                }
                var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
                if (dp === null) {
                    return makeDefaultHandle.call(this)
                }
                if (this.isSmartPointer) {
                    return makeClassHandle(toType.registeredClass.instancePrototype, {
                        ptrType: toType,
                        ptr: dp,
                        smartPtrType: this,
                        smartPtr: ptr
                    })
                } else {
                    return makeClassHandle(toType.registeredClass.instancePrototype, {
                        ptrType: toType,
                        ptr: dp
                    })
                }
            }
            function init_RegisteredPointer() {
                RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
                RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
                RegisteredPointer.prototype["argPackAdvance"] = 8;
                RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
                RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
                RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
            }
            function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
                this.name = name;
                this.registeredClass = registeredClass;
                this.isReference = isReference;
                this.isConst = isConst;
                this.isSmartPointer = isSmartPointer;
                this.pointeeType = pointeeType;
                this.sharingPolicy = sharingPolicy;
                this.rawGetPointee = rawGetPointee;
                this.rawConstructor = rawConstructor;
                this.rawShare = rawShare;
                this.rawDestructor = rawDestructor;
                if (!isSmartPointer && registeredClass.baseClass === undefined) {
                    if (isConst) {
                        this["toWireType"] = constNoSmartPtrRawPointerToWireType;
                        this.destructorFunction = null
                    } else {
                        this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
                        this.destructorFunction = null
                    }
                } else {
                    this["toWireType"] = genericPointerToWireType
                }
            }
            function replacePublicSymbol(name, value, numArguments) {
                if (!Module.hasOwnProperty(name)) {
                    throwInternalError("Replacing nonexistant public symbol")
                }
                if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
                    Module[name].overloadTable[numArguments] = value
                } else {
                    Module[name] = value;
                    Module[name].argCount = numArguments
                }
            }
            function embind__requireFunction(signature, rawFunction) {
                signature = readLatin1String(signature);
                function makeDynCaller(dynCall) {

                    if (IsWechat) {
                        var f1 = function (dynCall, rawFunction) {
                            return function () {
                                return dynCall(rawFunction, ...arguments);
                            }
                        }

                        return f1(dynCall, rawFunction)

                    } else {
                        var args = [];
                        for (var i = 1; i < signature.length; ++i) {
                            args.push("a" + i)
                        }
                        var name = "dynCall_" + signature + "_" + rawFunction;
                        var body = "return function " + name + "(" + args.join(", ") + ") {\n";
                        body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
                        body += "};\n";

                        return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction)
                    }


                }
                var fp;
                if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
                    fp = Module["FUNCTION_TABLE_" + signature][rawFunction]
                } else if (typeof FUNCTION_TABLE !== "undefined") {
                    fp = FUNCTION_TABLE[rawFunction]
                } else {
                    var dc = Module["dynCall_" + signature];
                    if (dc === undefined) {
                        dc = Module["dynCall_" + signature.replace(/f/g, "d")];
                        if (dc === undefined) {
                            throwBindingError("No dynCall invoker for signature: " + signature)
                        }
                    }
                    fp = makeDynCaller(dc)
                }
                if (typeof fp !== "function") {
                    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
                }
                return fp
            }
            var UnboundTypeError = undefined;
            function getTypeName(type) {
                var ptr = ___getTypeName(type);
                var rv = readLatin1String(ptr);
                _free(ptr);
                return rv
            }
            function throwUnboundTypeError(message, types) {
                var unboundTypes = [];
                var seen = {};
                function visit(type) {
                    if (seen[type]) {
                        return
                    }
                    if (registeredTypes[type]) {
                        return
                    }
                    if (typeDependencies[type]) {
                        typeDependencies[type].forEach(visit);
                        return
                    }
                    unboundTypes.push(type);
                    seen[type] = true
                }
                types.forEach(visit);
                throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
            }
            function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
                name = readLatin1String(name);
                getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
                if (upcast) {
                    upcast = embind__requireFunction(upcastSignature, upcast)
                }
                if (downcast) {
                    downcast = embind__requireFunction(downcastSignature, downcast)
                }
                rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
                var legalFunctionName = makeLegalFunctionName(name);
                exposePublicSymbol(legalFunctionName, function () {
                    throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
                });
                whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
                    base = base[0];
                    var baseClass;
                    var basePrototype;
                    if (baseClassRawType) {
                        baseClass = base.registeredClass;
                        basePrototype = baseClass.instancePrototype
                    } else {
                        basePrototype = ClassHandle.prototype
                    }
                    var constructor = createNamedFunction(legalFunctionName, function () {
                        if (Object.getPrototypeOf(this) !== instancePrototype) {
                            throw new BindingError("Use 'new' to construct " + name)
                        }
                        if (undefined === registeredClass.constructor_body) {
                            throw new BindingError(name + " has no accessible constructor")
                        }
                        var body = registeredClass.constructor_body[arguments.length];
                        if (undefined === body) {
                            throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
                        }
                        return body.apply(this, arguments)
                    });
                    var instancePrototype = Object.create(basePrototype, {
                        constructor: {
                            value: constructor
                        }
                    });
                    constructor.prototype = instancePrototype;
                    var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
                    var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
                    var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
                    var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
                    registeredPointers[rawType] = {
                        pointerType: pointerConverter,
                        constPointerType: constPointerConverter
                    };
                    replacePublicSymbol(legalFunctionName, constructor);
                    return [referenceConverter, pointerConverter, constPointerConverter]
                })
            }
            function new_(constructor, argumentList) {
                if (!(constructor instanceof Function)) {
                    throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
                }
                var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () { });
                dummy.prototype = constructor.prototype;
                var obj = new dummy;

                var r = constructor.apply(obj, argumentList);
                return r instanceof Object ? r : obj
            }
            function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
                var argCount = argTypes.length;
                if (argCount < 2) {
                    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
                }

                var isClassMethodFunc = argTypes[1] !== null && classType !== null;
                var needsDestructorStack = false;
                for (var i = 1; i < argTypes.length; ++i) {
                    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
                        needsDestructorStack = true;
                        break
                    }
                }
                var returns = argTypes[0].name !== "void";

                if (IsWechat) {
                    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
                    for (var i = 0; i < argCount - 2; ++i) {
                        args2.push(argTypes[i + 2])
                    }
                    if (isClassMethodFunc) {
                        for (var i = 1; i < argCount; ++i) {
                            if (argTypes[i].destructorFunction !== null) {
                                args2.push(argTypes[i].destructorFunction)
                            } else {
                                args2.push(null)
                            }
                        }
                    } else {
                        for (var i = 2; i < argCount; ++i) {
                            if (argTypes[i].destructorFunction !== null) {
                                args2.push(argTypes[i].destructorFunction)
                            } else {
                                args2.push(null)
                            }
                        }
                    }

                    function f1(throwBindingError, invoker, fn, runDestructors, retType, classParam) {
                        // arguments = [argType0,argType1,argType2,arg0Wired_dtor]
                        // argType0,argType1,argType2
                        const argsTypeOrigin = Array.prototype.slice.call(arguments, 6, 6 + argCount - 2)
                        // arg0Wired_dtor
                        const argsWired_dtorOrigin = Array.prototype.slice.call(arguments, 6 + argCount - 2)

                        return function () {
                            // arguments = [arg0, arg1, arg2]
                            if (arguments.length !== argCount - 2) {
                                throwBindingError('function ' + humanName + ' called with ' + arguments.length + ' arguments, expected 0 args!');
                            }
                            var thisWired;
                            var destructors;
                            if (needsDestructorStack) {
                                destructors = [];
                            }

                            if (isClassMethodFunc) {
                                if (needsDestructorStack) {
                                    thisWired = classParam.toWireType(destructors, this);
                                } else {
                                    thisWired = classParam.toWireType(null, this);
                                }
                            }

                            // arg0Wired,arg1Wired,arg2Wired
                            var argsWired = [];
                            for (var i = 0; i < argCount - 2; ++i) {
                                if (needsDestructorStack) {
                                    argsWired.push(argsTypeOrigin[i].toWireType(destructors, arguments[i]))
                                }
                                else {
                                    argsWired.push(argsTypeOrigin[i].toWireType(null, arguments[i]))
                                }
                            }

                            var rv;
                            if (isClassMethodFunc) {
                                rv = invoker(fn, thisWired, ...argsWired);
                            } else {
                                rv = invoker(fn, ...argsWired);
                            }

                            if (needsDestructorStack) {
                                runDestructors(destructors);
                            } else {
                                if (isClassMethodFunc) {
                                    for (var i = 1; i < argTypes.length; ++i) {
                                        if (argTypes[i].destructorFunction !== null) {
                                            if (i == 1) {
                                                argsWired_dtorOrigin[i - 1](thisWired);
                                            } else {
                                                argsWired_dtorOrigin[i - 1](argsWired[i - 1]);
                                            }
                                        }
                                    }
                                } else {
                                    for (var i = 2; i < argTypes.length; ++i) {
                                        if (argTypes[i].destructorFunction !== null) {
                                            argsWired_dtorOrigin[i - 2](argsWired[i - 2]);
                                        }
                                    }
                                }
                            }
                            if (returns) {
                                var ret = retType.fromWireType(rv);
                                return ret;
                            }
                        }
                    }

                    return f1.apply(null, args2)
                } else {
                    var argsList = "";
                    var argsListWired = "";
                    for (var i = 0; i < argCount - 2; ++i) {
                        argsList += (i !== 0 ? ", " : "") + "arg" + i;
                        argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
                    }

                    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
                    if (needsDestructorStack) {
                        invokerFnBody += "var destructors = [];\n"
                    }
                    var dtorStack = needsDestructorStack ? "destructors" : "null";
                    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
                    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
                    if (isClassMethodFunc) {
                        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
                    }
                    for (var i = 0; i < argCount - 2; ++i) {
                        invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
                        args1.push("argType" + i);
                        args2.push(argTypes[i + 2])
                    }
                    if (isClassMethodFunc) {
                        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
                    }
                    invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
                    if (needsDestructorStack) {
                        invokerFnBody += "runDestructors(destructors);\n"
                    } else {
                        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
                            var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
                            if (argTypes[i].destructorFunction !== null) {
                                invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                                args1.push(paramName + "_dtor");
                                args2.push(argTypes[i].destructorFunction)
                            }
                        }
                    }
                    if (returns) {
                        invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
                    } else { }
                    invokerFnBody += "}\n";
                    args1.push(invokerFnBody);
                    var invokerFunction = new_(Function, args1).apply(null, args2);
                    return invokerFunction
                }

            }
            function heap32VectorToArray(count, firstElement) {
                var array = [];
                for (var i = 0; i < count; i++) {
                    array.push(HEAP32[(firstElement >> 2) + i])
                }
                return array
            }
            function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                methodName = readLatin1String(methodName);
                rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + methodName;
                    function unboundTypesHandler() {
                        throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
                    }
                    var proto = classType.registeredClass.constructor;
                    if (undefined === proto[methodName]) {
                        unboundTypesHandler.argCount = argCount - 1;
                        proto[methodName] = unboundTypesHandler
                    } else {
                        ensureOverloadTable(proto, methodName, humanName);
                        proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler
                    }
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
                        var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
                        if (undefined === proto[methodName].overloadTable) {
                            func.argCount = argCount - 1;
                            proto[methodName] = func
                        } else {
                            proto[methodName].overloadTable[argCount - 1] = func
                        }
                        return []
                    });
                    return []
                })
            }
            function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                invoker = embind__requireFunction(invokerSignature, invoker);
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = "constructor " + classType.name;
                    if (undefined === classType.registeredClass.constructor_body) {
                        classType.registeredClass.constructor_body = []
                    }
                    if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                        throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
                    }
                    classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                        throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
                    }
                        ;
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                            if (arguments.length !== argCount - 1) {
                                throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
                            }
                            var destructors = [];
                            var args = new Array(argCount);
                            args[0] = rawConstructor;
                            for (var i = 1; i < argCount; ++i) {
                                args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
                            }
                            var ptr = invoker.apply(null, args);
                            runDestructors(destructors);
                            return argTypes[0]["fromWireType"](ptr)
                        }
                            ;
                        return []
                    });
                    return []
                })
            }
            function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
                var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                methodName = readLatin1String(methodName);
                rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
                whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + methodName;
                    if (isPureVirtual) {
                        classType.registeredClass.pureVirtualFunctions.push(methodName)
                    }
                    function unboundTypesHandler() {
                        throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
                    }
                    var proto = classType.registeredClass.instancePrototype;
                    var method = proto[methodName];
                    if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
                        unboundTypesHandler.argCount = argCount - 2;
                        unboundTypesHandler.className = classType.name;
                        proto[methodName] = unboundTypesHandler
                    } else {
                        ensureOverloadTable(proto, methodName, humanName);
                        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
                    }
                    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                        var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
                        if (undefined === proto[methodName].overloadTable) {
                            memberFunction.argCount = argCount - 2;
                            proto[methodName] = memberFunction
                        } else {
                            proto[methodName].overloadTable[argCount - 2] = memberFunction
                        }
                        return []
                    });
                    return []
                })
            }
            function validateThis(this_, classType, humanName) {
                if (!(this_ instanceof Object)) {
                    throwBindingError(humanName + ' with invalid "this": ' + this_)
                }
                if (!(this_ instanceof classType.registeredClass.constructor)) {
                    throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name)
                }
                if (!this_.$$.ptr) {
                    throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object")
                }
                return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass)
            }
            function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
                fieldName = readLatin1String(fieldName);
                getter = embind__requireFunction(getterSignature, getter);
                whenDependentTypesAreResolved([], [classType], function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + "." + fieldName;
                    var desc = {
                        get: function () {
                            throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
                        },
                        enumerable: true,
                        configurable: true
                    };
                    if (setter) {
                        desc.set = function () {
                            throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
                        }
                    } else {
                        desc.set = function (v) {
                            throwBindingError(humanName + " is a read-only property")
                        }
                    }
                    Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                    whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], function (types) {
                        var getterReturnType = types[0];
                        var desc = {
                            get: function () {
                                var ptr = validateThis(this, classType, humanName + " getter");
                                return getterReturnType["fromWireType"](getter(getterContext, ptr))
                            },
                            enumerable: true
                        };
                        if (setter) {
                            setter = embind__requireFunction(setterSignature, setter);
                            var setterArgumentType = types[1];
                            desc.set = function (v) {
                                var ptr = validateThis(this, classType, humanName + " setter");
                                var destructors = [];
                                setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, v));
                                runDestructors(destructors)
                            }
                        }
                        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                        return []
                    });
                    return []
                })
            }
            function __embind_register_constant(name, type, value) {
                name = readLatin1String(name);
                whenDependentTypesAreResolved([], [type], function (type) {
                    type = type[0];
                    Module[name] = type["fromWireType"](value);
                    return []
                })
            }
            var emval_free_list = [];
            var emval_handle_array = [{}, {
                value: undefined
            }, {
                value: null
            }, {
                value: true
            }, {
                value: false
            }];
            function __emval_decref(handle) {
                if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
                    emval_handle_array[handle] = undefined;
                    emval_free_list.push(handle)
                }
            }
            function count_emval_handles() {
                var count = 0;
                for (var i = 5; i < emval_handle_array.length; ++i) {
                    if (emval_handle_array[i] !== undefined) {
                        ++count
                    }
                }
                return count
            }
            function get_first_emval() {
                for (var i = 5; i < emval_handle_array.length; ++i) {
                    if (emval_handle_array[i] !== undefined) {
                        return emval_handle_array[i]
                    }
                }
                return null
            }
            function init_emval() {
                Module["count_emval_handles"] = count_emval_handles;
                Module["get_first_emval"] = get_first_emval
            }
            function __emval_register(value) {
                switch (value) {
                    case undefined:
                        {
                            return 1
                        }
                    case null:
                        {
                            return 2
                        }
                    case true:
                        {
                            return 3
                        }
                    case false:
                        {
                            return 4
                        }
                    default:
                        {
                            var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
                            emval_handle_array[handle] = {
                                refcount: 1,
                                value: value
                            };
                            return handle
                        }
                }
            }
            function __embind_register_emval(rawType, name) {
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (handle) {
                        var rv = emval_handle_array[handle].value;
                        __emval_decref(handle);
                        return rv
                    },
                    "toWireType": function (destructors, value) {
                        return __emval_register(value)
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": simpleReadValueFromPointer,
                    destructorFunction: null
                })
            }
            function _embind_repr(v) {
                if (v === null) {
                    return "null"
                }
                var t = typeof v;
                if (t === "object" || t === "array" || t === "function") {
                    return v.toString()
                } else {
                    return "" + v
                }
            }
            function floatReadValueFromPointer(name, shift) {
                switch (shift) {
                    case 2:
                        return function (pointer) {
                            return this["fromWireType"](HEAPF32[pointer >> 2])
                        }
                            ;
                    case 3:
                        return function (pointer) {
                            return this["fromWireType"](HEAPF64[pointer >> 3])
                        }
                            ;
                    default:
                        throw new TypeError("Unknown float type: " + name)
                }
            }
            function __embind_register_float(rawType, name, size) {
                var shift = getShiftFromSize(size);
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        return value
                    },
                    "toWireType": function (destructors, value) {
                        if (typeof value !== "number" && typeof value !== "boolean") {
                            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
                        }
                        return value
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": floatReadValueFromPointer(name, shift),
                    destructorFunction: null
                })
            }
            function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
                var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
                name = readLatin1String(name);
                rawInvoker = embind__requireFunction(signature, rawInvoker);
                exposePublicSymbol(name, function () {
                    throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
                }, argCount - 1);
                whenDependentTypesAreResolved([], argTypes, function (argTypes) {
                    var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
                    replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
                    return []
                })
            }
            function integerReadValueFromPointer(name, shift, signed) {
                switch (shift) {
                    case 0:
                        return signed ? function readS8FromPointer(pointer) {
                            return HEAP8[pointer]
                        }
                            : function readU8FromPointer(pointer) {
                                return HEAPU8[pointer]
                            }
                            ;
                    case 1:
                        return signed ? function readS16FromPointer(pointer) {
                            return HEAP16[pointer >> 1]
                        }
                            : function readU16FromPointer(pointer) {
                                return HEAPU16[pointer >> 1]
                            }
                            ;
                    case 2:
                        return signed ? function readS32FromPointer(pointer) {
                            return HEAP32[pointer >> 2]
                        }
                            : function readU32FromPointer(pointer) {
                                return HEAPU32[pointer >> 2]
                            }
                            ;
                    default:
                        throw new TypeError("Unknown integer type: " + name)
                }
            }
            function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
                name = readLatin1String(name);
                if (maxRange === -1) {
                    maxRange = 4294967295
                }
                var shift = getShiftFromSize(size);
                var fromWireType = function (value) {
                    return value
                };
                if (minRange === 0) {
                    var bitshift = 32 - 8 * size;
                    fromWireType = function (value) {
                        return value << bitshift >>> bitshift
                    }
                }
                var isUnsignedType = name.indexOf("unsigned") != -1;
                registerType(primitiveType, {
                    name: name,
                    "fromWireType": fromWireType,
                    "toWireType": function (destructors, value) {
                        if (typeof value !== "number" && typeof value !== "boolean") {
                            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
                        }
                        if (value < minRange || value > maxRange) {
                            throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
                        }
                        return isUnsignedType ? value >>> 0 : value | 0
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
                    destructorFunction: null
                })
            }
            function __embind_register_memory_view(rawType, dataTypeIndex, name) {
                var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
                var TA = typeMapping[dataTypeIndex];
                function decodeMemoryView(handle) {
                    handle = handle >> 2;
                    var heap = HEAPU32;
                    var size = heap[handle];
                    var data = heap[handle + 1];
                    return new TA(heap["buffer"], data, size)
                }
                name = readLatin1String(name);
                registerType(rawType, {
                    name: name,
                    "fromWireType": decodeMemoryView,
                    "argPackAdvance": 8,
                    "readValueFromPointer": decodeMemoryView
                }, {
                    ignoreDuplicateRegistrations: true
                })
            }
            function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
                name = readLatin1String(name);
                rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
                rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
                rawShare = embind__requireFunction(shareSignature, rawShare);
                rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
                whenDependentTypesAreResolved([rawType], [rawPointeeType], function (pointeeType) {
                    pointeeType = pointeeType[0];
                    var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
                    return [registeredPointer]
                })
            }
            function __embind_register_std_string(rawType, name) {
                name = readLatin1String(name);
                var stdStringIsUTF8 = name === "std::string";
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        var length = HEAPU32[value >> 2];
                        var str;
                        if (stdStringIsUTF8) {
                            var endChar = HEAPU8[value + 4 + length];
                            var endCharSwap = 0;
                            if (endChar != 0) {
                                endCharSwap = endChar;
                                HEAPU8[value + 4 + length] = 0
                            }
                            var decodeStartPtr = value + 4;
                            for (var i = 0; i <= length; ++i) {
                                var currentBytePtr = value + 4 + i;
                                if (HEAPU8[currentBytePtr] == 0) {
                                    var stringSegment = UTF8ToString(decodeStartPtr);
                                    if (str === undefined)
                                        str = stringSegment;
                                    else {
                                        str += String.fromCharCode(0);
                                        str += stringSegment
                                    }
                                    decodeStartPtr = currentBytePtr + 1
                                }
                            }
                            if (endCharSwap != 0)
                                HEAPU8[value + 4 + length] = endCharSwap
                        } else {
                            var a = new Array(length);
                            for (var i = 0; i < length; ++i) {
                                a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
                            }
                            str = a.join("")
                        }
                        _free(value);
                        return str
                    },
                    "toWireType": function (destructors, value) {
                        if (value instanceof ArrayBuffer) {
                            value = new Uint8Array(value)
                        }
                        var getLength;
                        var valueIsOfTypeString = typeof value === "string";
                        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                            throwBindingError("Cannot pass non-string to std::string")
                        }
                        if (stdStringIsUTF8 && valueIsOfTypeString) {
                            getLength = function () {
                                return lengthBytesUTF8(value)
                            }
                        } else {
                            getLength = function () {
                                return value.length
                            }
                        }
                        var length = getLength();
                        var ptr = _malloc(4 + length + 1);
                        HEAPU32[ptr >> 2] = length;
                        if (stdStringIsUTF8 && valueIsOfTypeString) {
                            stringToUTF8(value, ptr + 4, length + 1)
                        } else {
                            if (valueIsOfTypeString) {
                                for (var i = 0; i < length; ++i) {
                                    var charCode = value.charCodeAt(i);
                                    if (charCode > 255) {
                                        _free(ptr);
                                        throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                                    }
                                    HEAPU8[ptr + 4 + i] = charCode
                                }
                            } else {
                                for (var i = 0; i < length; ++i) {
                                    HEAPU8[ptr + 4 + i] = value[i]
                                }
                            }
                        }
                        if (destructors !== null) {
                            destructors.push(_free, ptr)
                        }
                        return ptr
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": simpleReadValueFromPointer,
                    destructorFunction: function (ptr) {
                        _free(ptr)
                    }
                })
            }
            function __embind_register_std_wstring(rawType, charSize, name) {
                name = readLatin1String(name);
                var getHeap, shift;
                if (charSize === 2) {
                    getHeap = function () {
                        return HEAPU16
                    }
                        ;
                    shift = 1
                } else if (charSize === 4) {
                    getHeap = function () {
                        return HEAPU32
                    }
                        ;
                    shift = 2
                }
                registerType(rawType, {
                    name: name,
                    "fromWireType": function (value) {
                        var HEAP = getHeap();
                        var length = HEAPU32[value >> 2];
                        var a = new Array(length);
                        var start = value + 4 >> shift;
                        for (var i = 0; i < length; ++i) {
                            a[i] = String.fromCharCode(HEAP[start + i])
                        }
                        _free(value);
                        return a.join("")
                    },
                    "toWireType": function (destructors, value) {
                        var length = value.length;
                        var ptr = _malloc(4 + length * charSize);
                        var HEAP = getHeap();
                        HEAPU32[ptr >> 2] = length;
                        var start = ptr + 4 >> shift;
                        for (var i = 0; i < length; ++i) {
                            HEAP[start + i] = value.charCodeAt(i)
                        }
                        if (destructors !== null) {
                            destructors.push(_free, ptr)
                        }
                        return ptr
                    },
                    "argPackAdvance": 8,
                    "readValueFromPointer": simpleReadValueFromPointer,
                    destructorFunction: function (ptr) {
                        _free(ptr)
                    }
                })
            }
            function __embind_register_value_array(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
                tupleRegistrations[rawType] = {
                    name: readLatin1String(name),
                    rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
                    rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
                    elements: []
                }
            }
            function __embind_register_value_array_element(rawTupleType, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
                tupleRegistrations[rawTupleType].elements.push({
                    getterReturnType: getterReturnType,
                    getter: embind__requireFunction(getterSignature, getter),
                    getterContext: getterContext,
                    setterArgumentType: setterArgumentType,
                    setter: embind__requireFunction(setterSignature, setter),
                    setterContext: setterContext
                })
            }
            function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
                structRegistrations[rawType] = {
                    name: readLatin1String(name),
                    rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
                    rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
                    fields: []
                }
            }
            function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
                structRegistrations[structType].fields.push({
                    fieldName: readLatin1String(fieldName),
                    getterReturnType: getterReturnType,
                    getter: embind__requireFunction(getterSignature, getter),
                    getterContext: getterContext,
                    setterArgumentType: setterArgumentType,
                    setter: embind__requireFunction(setterSignature, setter),
                    setterContext: setterContext
                })
            }
            function __embind_register_void(rawType, name) {
                name = readLatin1String(name);
                registerType(rawType, {
                    isVoid: true,
                    name: name,
                    "argPackAdvance": 0,
                    "fromWireType": function () {
                        return undefined
                    },
                    "toWireType": function (destructors, o) {
                        return undefined
                    }
                })
            }
            function requireHandle(handle) {
                if (!handle) {
                    throwBindingError("Cannot use deleted val. handle = " + handle)
                }
                return emval_handle_array[handle].value
            }
            function requireRegisteredType(rawType, humanName) {
                var impl = registeredTypes[rawType];
                if (undefined === impl) {
                    throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
                }
                return impl
            }
            function __emval_as(handle, returnType, destructorsRef) {
                handle = requireHandle(handle);
                returnType = requireRegisteredType(returnType, "emval::as");
                var destructors = [];
                var rd = __emval_register(destructors);
                HEAP32[destructorsRef >> 2] = rd;
                return returnType["toWireType"](destructors, handle)
            }
            var emval_symbols = {};
            function getStringOrSymbol(address) {
                var symbol = emval_symbols[address];
                if (symbol === undefined) {
                    return readLatin1String(address)
                } else {
                    return symbol
                }
            }
            var emval_methodCallers = [];
            function __emval_call_void_method(caller, handle, methodName, args) {
                caller = emval_methodCallers[caller];
                handle = requireHandle(handle);
                methodName = getStringOrSymbol(methodName);
                caller(handle, methodName, null, args)
            }
            function __emval_addMethodCaller(caller) {
                var id = emval_methodCallers.length;
                emval_methodCallers.push(caller);
                return id
            }
            function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
                var a = new Array(argCount);
                for (var i = 0; i < argCount; ++i) {
                    a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i)
                }
                return a
            }
            function __emval_get_method_caller(argCount, argTypes) {

                var types = __emval_lookupTypes(argCount, argTypes);
                var retType = types[0];
                var signatureName = retType.name + "_$" + types.slice(1).map(function (t) {
                    return t.name
                }).join("_") + "$";
                var params = ["retType"];
                var args = [retType];
                var argsList = "";
                for (var i = 0; i < argCount - 1; ++i) {
                    argsList += (i !== 0 ? ", " : "") + "arg" + i;
                    params.push("argType" + i);
                    args.push(types[1 + i])
                }
                var functionName = makeLegalFunctionName("methodCaller_" + signatureName);

                var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
                var offset = 0;
                for (var i = 0; i < argCount - 1; ++i) {
                    functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
                    offset += types[i + 1]["argPackAdvance"]
                }
                functionBody += "    var rv = handle[name](" + argsList + ");\n";
                for (var i = 0; i < argCount - 1; ++i) {
                    if (types[i + 1]["deleteObject"]) {
                        functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n"
                    }
                }
                if (!retType.isVoid) {
                    functionBody += "    return retType.toWireType(destructors, rv);\n"
                }
                functionBody += "};\n";
                params.push(functionBody);
                var invokerFunction = new_(Function, params).apply(null, args);
                return __emval_addMethodCaller(invokerFunction)
            }
            function __emval_get_property(handle, key) {
                handle = requireHandle(handle);
                key = requireHandle(key);
                return __emval_register(handle[key])
            }
            function __emval_incref(handle) {
                if (handle > 4) {
                    emval_handle_array[handle].refcount += 1
                }
            }
            function __emval_new_array() {
                return __emval_register([])
            }
            function __emval_new_cstring(v) {
                return __emval_register(getStringOrSymbol(v))
            }
            function __emval_run_destructors(handle) {
                var destructors = emval_handle_array[handle].value;
                runDestructors(destructors);
                __emval_decref(handle)
            }
            function __emval_set_property(handle, key, value) {
                handle = requireHandle(handle);
                key = requireHandle(key);
                value = requireHandle(value);
                handle[key] = value
            }
            function __emval_take_value(type, argv) {
                type = requireRegisteredType(type, "_emval_take_value");
                var v = type["readValueFromPointer"](argv);
                return __emval_register(v)
            }
            function _abort() {
                abort()
            }
            function _emscripten_get_now_is_monotonic() {
                return 0 || ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || typeof performance === "object" && performance && typeof performance["now"] === "function"
            }
            function _clock_gettime(clk_id, tp) {
                var now;
                if (clk_id === 0) {
                    now = Date.now()
                } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
                    now = _emscripten_get_now()
                } else {
                    ___setErrNo(28);
                    return -1
                }
                HEAP32[tp >> 2] = now / 1e3 | 0;
                HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
                return 0
            }
            function _emscripten_get_heap_size() {
                return HEAP8.length
            }
            function _emscripten_get_sbrk_ptr() {
                return 1275456
            }
            function _emscripten_memcpy_big(dest, src, num) {
                HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
            }
            function emscripten_realloc_buffer(size) {
                try {
                    wasmMemory.grow(size - buffer.byteLength + 65535 >> 16);
                    updateGlobalBufferAndViews(wasmMemory.buffer);
                    return 1
                } catch (e) { }
            }
            function _emscripten_resize_heap(requestedSize) {
                var oldSize = _emscripten_get_heap_size();
                var PAGE_MULTIPLE = 65536;
                var LIMIT = 2147483648 - PAGE_MULTIPLE;
                if (requestedSize > LIMIT) {
                    return false
                }
                var MIN_TOTAL_MEMORY = 16777216;
                var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
                while (newSize < requestedSize) {
                    if (newSize <= 536870912) {
                        newSize = alignUp(2 * newSize, PAGE_MULTIPLE)
                    } else {
                        newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
                    }
                }
                newSize = Math.min(newSize, 1073741824);
                if (newSize == oldSize) {
                    return false
                }
                var replacement = emscripten_realloc_buffer(newSize);
                if (!replacement) {
                    return false
                }
                return true
            }
            var ENV = {};
            function _emscripten_get_environ() {
                if (!_emscripten_get_environ.strings) {
                    var env = {
                        "USER": "web_user",
                        "LOGNAME": "web_user",
                        "PATH": "/",
                        "PWD": "/",
                        "HOME": "/home/web_user",
                        "LANG": (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
                        "_": thisProgram
                    };
                    for (var x in ENV) {
                        env[x] = ENV[x]
                    }
                    var strings = [];
                    for (var x in env) {
                        strings.push(x + "=" + env[x])
                    }
                    _emscripten_get_environ.strings = strings
                }
                return _emscripten_get_environ.strings
            }
            function _environ_get(__environ, environ_buf) {
                var strings = _emscripten_get_environ();
                var bufSize = 0;
                strings.forEach(function (string, i) {
                    var ptr = environ_buf + bufSize;
                    HEAP32[__environ + i * 4 >> 2] = ptr;
                    writeAsciiToMemory(string, ptr);
                    bufSize += string.length + 1
                });
                return 0
            }
            function _environ_sizes_get(penviron_count, penviron_buf_size) {
                var strings = _emscripten_get_environ();
                HEAP32[penviron_count >> 2] = strings.length;
                var bufSize = 0;
                strings.forEach(function (string) {
                    bufSize += string.length + 1
                });
                HEAP32[penviron_buf_size >> 2] = bufSize;
                return 0
            }
            function _fd_close(fd) {
                try {
                    var stream = SYSCALLS.getStreamFromFD(fd);
                    FS.close(stream);
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return e.errno
                }
            }
            function _fd_read(fd, iov, iovcnt, pnum) {
                try {
                    var stream = SYSCALLS.getStreamFromFD(fd);
                    var num = SYSCALLS.doReadv(stream, iov, iovcnt);
                    HEAP32[pnum >> 2] = num;
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return e.errno
                }
            }
            function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
                try {
                    var stream = SYSCALLS.getStreamFromFD(fd);
                    var HIGH_OFFSET = 4294967296;
                    var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
                    var DOUBLE_LIMIT = 9007199254740992;
                    if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                        return -61
                    }
                    FS.llseek(stream, offset, whence);
                    tempI64 = [stream.position >>> 0, (tempDouble = stream.position,
                        +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                        HEAP32[newOffset >> 2] = tempI64[0],
                        HEAP32[newOffset + 4 >> 2] = tempI64[1];
                    if (stream.getdents && offset === 0 && whence === 0)
                        stream.getdents = null;
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return e.errno
                }
            }
            function _fd_write(fd, iov, iovcnt, pnum) {
                try {
                    var stream = SYSCALLS.getStreamFromFD(fd);
                    var num = SYSCALLS.doWritev(stream, iov, iovcnt);
                    HEAP32[pnum >> 2] = num;
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                        abort(e);
                    return e.errno
                }
            }
            function _pthread_mutexattr_destroy() { }
            function _pthread_mutexattr_init() { }
            function _pthread_mutexattr_settype() { }
            function _roundf(d) {
                d = +d;
                return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5)
            }
            function _sched_yield() {
                return 0
            }
            function _setTempRet0($i) {
                setTempRet0($i | 0)
            }
            function __isLeapYear(year) {
                return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
            }
            function __arraySum(array, index) {
                var sum = 0;
                for (var i = 0; i <= index; sum += array[i++])
                    ;
                return sum
            }
            var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            function __addDays(date, days) {
                var newDate = new Date(date.getTime());
                while (days > 0) {
                    var leap = __isLeapYear(newDate.getFullYear());
                    var currentMonth = newDate.getMonth();
                    var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
                    if (days > daysInCurrentMonth - newDate.getDate()) {
                        days -= daysInCurrentMonth - newDate.getDate() + 1;
                        newDate.setDate(1);
                        if (currentMonth < 11) {
                            newDate.setMonth(currentMonth + 1)
                        } else {
                            newDate.setMonth(0);
                            newDate.setFullYear(newDate.getFullYear() + 1)
                        }
                    } else {
                        newDate.setDate(newDate.getDate() + days);
                        return newDate
                    }
                }
                return newDate
            }
            function _strftime(s, maxsize, format, tm) {
                var tm_zone = HEAP32[tm + 40 >> 2];
                var date = {
                    tm_sec: HEAP32[tm >> 2],
                    tm_min: HEAP32[tm + 4 >> 2],
                    tm_hour: HEAP32[tm + 8 >> 2],
                    tm_mday: HEAP32[tm + 12 >> 2],
                    tm_mon: HEAP32[tm + 16 >> 2],
                    tm_year: HEAP32[tm + 20 >> 2],
                    tm_wday: HEAP32[tm + 24 >> 2],
                    tm_yday: HEAP32[tm + 28 >> 2],
                    tm_isdst: HEAP32[tm + 32 >> 2],
                    tm_gmtoff: HEAP32[tm + 36 >> 2],
                    tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
                };
                var pattern = UTF8ToString(format);
                var EXPANSION_RULES_1 = {
                    "%c": "%a %b %d %H:%M:%S %Y",
                    "%D": "%m/%d/%y",
                    "%F": "%Y-%m-%d",
                    "%h": "%b",
                    "%r": "%I:%M:%S %p",
                    "%R": "%H:%M",
                    "%T": "%H:%M:%S",
                    "%x": "%m/%d/%y",
                    "%X": "%H:%M:%S",
                    "%Ec": "%c",
                    "%EC": "%C",
                    "%Ex": "%m/%d/%y",
                    "%EX": "%H:%M:%S",
                    "%Ey": "%y",
                    "%EY": "%Y",
                    "%Od": "%d",
                    "%Oe": "%e",
                    "%OH": "%H",
                    "%OI": "%I",
                    "%Om": "%m",
                    "%OM": "%M",
                    "%OS": "%S",
                    "%Ou": "%u",
                    "%OU": "%U",
                    "%OV": "%V",
                    "%Ow": "%w",
                    "%OW": "%W",
                    "%Oy": "%y"
                };
                for (var rule in EXPANSION_RULES_1) {
                    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
                }
                var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                function leadingSomething(value, digits, character) {
                    var str = typeof value === "number" ? value.toString() : value || "";
                    while (str.length < digits) {
                        str = character[0] + str
                    }
                    return str
                }
                function leadingNulls(value, digits) {
                    return leadingSomething(value, digits, "0")
                }
                function compareByDay(date1, date2) {
                    function sgn(value) {
                        return value < 0 ? -1 : value > 0 ? 1 : 0
                    }
                    var compare;
                    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                        if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                            compare = sgn(date1.getDate() - date2.getDate())
                        }
                    }
                    return compare
                }
                function getFirstWeekStartDate(janFourth) {
                    switch (janFourth.getDay()) {
                        case 0:
                            return new Date(janFourth.getFullYear() - 1, 11, 29);
                        case 1:
                            return janFourth;
                        case 2:
                            return new Date(janFourth.getFullYear(), 0, 3);
                        case 3:
                            return new Date(janFourth.getFullYear(), 0, 2);
                        case 4:
                            return new Date(janFourth.getFullYear(), 0, 1);
                        case 5:
                            return new Date(janFourth.getFullYear() - 1, 11, 31);
                        case 6:
                            return new Date(janFourth.getFullYear() - 1, 11, 30)
                    }
                }
                function getWeekBasedYear(date) {
                    var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                    var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
                    var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
                    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                        if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                            return thisDate.getFullYear() + 1
                        } else {
                            return thisDate.getFullYear()
                        }
                    } else {
                        return thisDate.getFullYear() - 1
                    }
                }
                var EXPANSION_RULES_2 = {
                    "%a": function (date) {
                        return WEEKDAYS[date.tm_wday].substring(0, 3)
                    },
                    "%A": function (date) {
                        return WEEKDAYS[date.tm_wday]
                    },
                    "%b": function (date) {
                        return MONTHS[date.tm_mon].substring(0, 3)
                    },
                    "%B": function (date) {
                        return MONTHS[date.tm_mon]
                    },
                    "%C": function (date) {
                        var year = date.tm_year + 1900;
                        return leadingNulls(year / 100 | 0, 2)
                    },
                    "%d": function (date) {
                        return leadingNulls(date.tm_mday, 2)
                    },
                    "%e": function (date) {
                        return leadingSomething(date.tm_mday, 2, " ")
                    },
                    "%g": function (date) {
                        return getWeekBasedYear(date).toString().substring(2)
                    },
                    "%G": function (date) {
                        return getWeekBasedYear(date)
                    },
                    "%H": function (date) {
                        return leadingNulls(date.tm_hour, 2)
                    },
                    "%I": function (date) {
                        var twelveHour = date.tm_hour;
                        if (twelveHour == 0)
                            twelveHour = 12;
                        else if (twelveHour > 12)
                            twelveHour -= 12;
                        return leadingNulls(twelveHour, 2)
                    },
                    "%j": function (date) {
                        return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
                    },
                    "%m": function (date) {
                        return leadingNulls(date.tm_mon + 1, 2)
                    },
                    "%M": function (date) {
                        return leadingNulls(date.tm_min, 2)
                    },
                    "%n": function () {
                        return "\n"
                    },
                    "%p": function (date) {
                        if (date.tm_hour >= 0 && date.tm_hour < 12) {
                            return "AM"
                        } else {
                            return "PM"
                        }
                    },
                    "%S": function (date) {
                        return leadingNulls(date.tm_sec, 2)
                    },
                    "%t": function () {
                        return "\t"
                    },
                    "%u": function (date) {
                        return date.tm_wday || 7
                    },
                    "%U": function (date) {
                        var janFirst = new Date(date.tm_year + 1900, 0, 1);
                        var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
                        var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                        if (compareByDay(firstSunday, endDate) < 0) {
                            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                            var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                            var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                            return leadingNulls(Math.ceil(days / 7), 2)
                        }
                        return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
                    },
                    "%V": function (date) {
                        var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
                        var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
                        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                        var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                        if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                            return "53"
                        }
                        if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                            return "01"
                        }
                        var daysDifference;
                        if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                            daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
                        } else {
                            daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
                        }
                        return leadingNulls(Math.ceil(daysDifference / 7), 2)
                    },
                    "%w": function (date) {
                        return date.tm_wday
                    },
                    "%W": function (date) {
                        var janFirst = new Date(date.tm_year, 0, 1);
                        var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
                        var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                        if (compareByDay(firstMonday, endDate) < 0) {
                            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                            var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                            var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                            return leadingNulls(Math.ceil(days / 7), 2)
                        }
                        return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
                    },
                    "%y": function (date) {
                        return (date.tm_year + 1900).toString().substring(2)
                    },
                    "%Y": function (date) {
                        return date.tm_year + 1900
                    },
                    "%z": function (date) {
                        var off = date.tm_gmtoff;
                        var ahead = off >= 0;
                        off = Math.abs(off) / 60;
                        off = off / 60 * 100 + off % 60;
                        return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
                    },
                    "%Z": function (date) {
                        return date.tm_zone
                    },
                    "%%": function () {
                        return "%"
                    }
                };
                for (var rule in EXPANSION_RULES_2) {
                    if (pattern.indexOf(rule) >= 0) {
                        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
                    }
                }
                var bytes = intArrayFromString(pattern, false);
                if (bytes.length > maxsize) {
                    return 0
                }
                writeArrayToMemory(bytes, s);
                return bytes.length - 1
            }
            function _strftime_l(s, maxsize, format, tm) {
                return _strftime(s, maxsize, format, tm)
            }
            function _sysconf(name) {
                switch (name) {
                    case 30:
                        return PAGE_SIZE;
                    case 85:
                        var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
                        maxHeapSize = 1073741824;
                        return maxHeapSize / PAGE_SIZE;
                    case 132:
                    case 133:
                    case 12:
                    case 137:
                    case 138:
                    case 15:
                    case 235:
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20:
                    case 149:
                    case 13:
                    case 10:
                    case 236:
                    case 153:
                    case 9:
                    case 21:
                    case 22:
                    case 159:
                    case 154:
                    case 14:
                    case 77:
                    case 78:
                    case 139:
                    case 80:
                    case 81:
                    case 82:
                    case 68:
                    case 67:
                    case 164:
                    case 11:
                    case 29:
                    case 47:
                    case 48:
                    case 95:
                    case 52:
                    case 51:
                    case 46:
                        return 200809;
                    case 79:
                        return 0;
                    case 27:
                    case 246:
                    case 127:
                    case 128:
                    case 23:
                    case 24:
                    case 160:
                    case 161:
                    case 181:
                    case 182:
                    case 242:
                    case 183:
                    case 184:
                    case 243:
                    case 244:
                    case 245:
                    case 165:
                    case 178:
                    case 179:
                    case 49:
                    case 50:
                    case 168:
                    case 169:
                    case 175:
                    case 170:
                    case 171:
                    case 172:
                    case 97:
                    case 76:
                    case 32:
                    case 173:
                    case 35:
                        return -1;
                    case 176:
                    case 177:
                    case 7:
                    case 155:
                    case 8:
                    case 157:
                    case 125:
                    case 126:
                    case 92:
                    case 93:
                    case 129:
                    case 130:
                    case 131:
                    case 94:
                    case 91:
                        return 1;
                    case 74:
                    case 60:
                    case 69:
                    case 70:
                    case 4:
                        return 1024;
                    case 31:
                    case 42:
                    case 72:
                        return 32;
                    case 87:
                    case 26:
                    case 33:
                        return 2147483647;
                    case 34:
                    case 1:
                        return 47839;
                    case 38:
                    case 36:
                        return 99;
                    case 43:
                    case 37:
                        return 2048;
                    case 0:
                        return 2097152;
                    case 3:
                        return 65536;
                    case 28:
                        return 32768;
                    case 44:
                        return 32767;
                    case 75:
                        return 16384;
                    case 39:
                        return 1e3;
                    case 89:
                        return 700;
                    case 71:
                        return 256;
                    case 40:
                        return 255;
                    case 2:
                        return 100;
                    case 180:
                        return 64;
                    case 25:
                        return 20;
                    case 5:
                        return 16;
                    case 6:
                        return 6;
                    case 73:
                        return 4;
                    case 84:
                        {
                            if (typeof navigator === "object")
                                return navigator["hardwareConcurrency"] || 1;
                            return 1
                        }
                }
                ___setErrNo(28);
                return -1
            }
            Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
                err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead.");
                Module["requestFullScreen"] = Module["requestFullscreen"];
                Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice)
            }
                ;
            Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) {
                Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
            }
                ;
            Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
                Browser.requestAnimationFrame(func)
            }
                ;
            Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
                Browser.setCanvasSize(width, height, noUpdates)
            }
                ;
            Module["pauseMainLoop"] = function Module_pauseMainLoop() {
                Browser.mainLoop.pause()
            }
                ;
            Module["resumeMainLoop"] = function Module_resumeMainLoop() {
                Browser.mainLoop.resume()
            }
                ;
            Module["getUserMedia"] = function Module_getUserMedia() {
                Browser.getUserMedia()
            }
                ;
            Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
                return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
            }
                ;
            if (ENVIRONMENT_IS_NODE) {
                _emscripten_get_now = function _emscripten_get_now_actual() {
                    var t = process["hrtime"]();
                    return t[0] * 1e3 + t[1] / 1e6
                }
            } else if (typeof dateNow !== "undefined") {
                _emscripten_get_now = dateNow
            } else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
                _emscripten_get_now = function () {
                    return performance["now"]()
                }
            } else {
                _emscripten_get_now = Date.now
            }
            FS.staticInit();
            Module["FS_createFolder"] = FS.createFolder;
            Module["FS_createPath"] = FS.createPath;
            Module["FS_createDataFile"] = FS.createDataFile;
            Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
            Module["FS_createLazyFile"] = FS.createLazyFile;
            Module["FS_createLink"] = FS.createLink;
            Module["FS_createDevice"] = FS.createDevice;
            Module["FS_unlink"] = FS.unlink;
            if (ENVIRONMENT_HAS_NODE) {
                var fs = require("fs");
                var NODEJS_PATH = require("path");
                NODEFS.staticInit()
            }
            InternalError = Module["InternalError"] = extendError(Error, "InternalError");
            embind_init_charCodes();
            BindingError = Module["BindingError"] = extendError(Error, "BindingError");
            init_ClassHandle();
            init_RegisteredPointer();
            init_embind();
            UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
            init_emval();
            var ASSERTIONS = false;
            function intArrayFromString(stringy, dontAddNull, length) {
                var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
                var u8array = new Array(len);
                var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
                if (dontAddNull)
                    u8array.length = numBytesWritten;
                return u8array
            }
            function intArrayToString(array) {
                var ret = [];
                for (var i = 0; i < array.length; i++) {
                    var chr = array[i];
                    if (chr > 255) {
                        if (ASSERTIONS) {
                            assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.")
                        }
                        chr &= 255
                    }
                    ret.push(String.fromCharCode(chr))
                }
                return ret.join("")
            }
            var decodeBase64 = typeof atob === "function" ? atob : function (input) {
                var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));
                    chr1 = enc1 << 2 | enc2 >> 4;
                    chr2 = (enc2 & 15) << 4 | enc3 >> 2;
                    chr3 = (enc3 & 3) << 6 | enc4;
                    output = output + String.fromCharCode(chr1);
                    if (enc3 !== 64) {
                        output = output + String.fromCharCode(chr2)
                    }
                    if (enc4 !== 64) {
                        output = output + String.fromCharCode(chr3)
                    }
                } while (i < input.length);
                return output
            }
                ;
            function intArrayFromBase64(s) {
                if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
                    var buf;
                    try {
                        buf = Buffer.from(s, "base64")
                    } catch (_) {
                        buf = new Buffer(s, "base64")
                    }
                    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
                }
                try {
                    var decoded = decodeBase64(s);
                    var bytes = new Uint8Array(decoded.length);
                    for (var i = 0; i < decoded.length; ++i) {
                        bytes[i] = decoded.charCodeAt(i)
                    }
                    return bytes
                } catch (_) {
                    throw new Error("Converting base64 string to bytes failed.")
                }
            }
            function tryParseAsDataURI(filename) {
                if (!isDataURI(filename)) {
                    return
                }
                return intArrayFromBase64(filename.slice(dataURIPrefix.length))
            }
            var asmLibraryArg = {
                "__cxa_allocate_exception": ___cxa_allocate_exception,
                "__cxa_atexit": ___cxa_atexit,
                "__cxa_throw": ___cxa_throw,
                "__lock": ___lock,
                "__map_file": ___map_file,
                "__syscall221": ___syscall221,
                "__syscall3": ___syscall3,
                "__syscall4": ___syscall4,
                "__syscall5": ___syscall5,
                "__syscall54": ___syscall54,
                "__syscall91": ___syscall91,
                "__unlock": ___unlock,
                "_embind_finalize_value_array": __embind_finalize_value_array,
                "_embind_finalize_value_object": __embind_finalize_value_object,
                "_embind_register_bool": __embind_register_bool,
                "_embind_register_class": __embind_register_class,
                "_embind_register_class_class_function": __embind_register_class_class_function,
                "_embind_register_class_constructor": __embind_register_class_constructor,
                "_embind_register_class_function": __embind_register_class_function,
                "_embind_register_class_property": __embind_register_class_property,
                "_embind_register_constant": __embind_register_constant,
                "_embind_register_emval": __embind_register_emval,
                "_embind_register_float": __embind_register_float,
                "_embind_register_function": __embind_register_function,
                "_embind_register_integer": __embind_register_integer,
                "_embind_register_memory_view": __embind_register_memory_view,
                "_embind_register_smart_ptr": __embind_register_smart_ptr,
                "_embind_register_std_string": __embind_register_std_string,
                "_embind_register_std_wstring": __embind_register_std_wstring,
                "_embind_register_value_array": __embind_register_value_array,
                "_embind_register_value_array_element": __embind_register_value_array_element,
                "_embind_register_value_object": __embind_register_value_object,
                "_embind_register_value_object_field": __embind_register_value_object_field,
                "_embind_register_void": __embind_register_void,
                "_emval_as": __emval_as,
                "_emval_call_void_method": __emval_call_void_method,
                "_emval_decref": __emval_decref,
                "_emval_get_method_caller": __emval_get_method_caller,
                "_emval_get_property": __emval_get_property,
                "_emval_incref": __emval_incref,
                "_emval_new_array": __emval_new_array,
                "_emval_new_cstring": __emval_new_cstring,
                "_emval_run_destructors": __emval_run_destructors,
                "_emval_set_property": __emval_set_property,
                "_emval_take_value": __emval_take_value,
                "abort": _abort,
                "clock_gettime": _clock_gettime,
                "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr,
                "emscripten_memcpy_big": _emscripten_memcpy_big,
                "emscripten_resize_heap": _emscripten_resize_heap,
                "environ_get": _environ_get,
                "environ_sizes_get": _environ_sizes_get,
                "fd_close": _fd_close,
                "fd_read": _fd_read,
                "fd_seek": _fd_seek,
                "fd_write": _fd_write,
                "memory": wasmMemory,
                "pthread_mutexattr_destroy": _pthread_mutexattr_destroy,
                "pthread_mutexattr_init": _pthread_mutexattr_init,
                "pthread_mutexattr_settype": _pthread_mutexattr_settype,
                "roundf": _roundf,
                "sched_yield": _sched_yield,
                "setTempRet0": _setTempRet0,
                "strftime_l": _strftime_l,
                "sysconf": _sysconf,
                "table": wasmTable
            };
            var asm = createWasm();
            Module["asm"] = asm;
            var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () {
                return Module["asm"]["__wasm_call_ctors"].apply(null, arguments)
            }
                ;
            var _malloc = Module["_malloc"] = function () {
                return Module["asm"]["malloc"].apply(null, arguments)
            }
                ;
            var _free = Module["_free"] = function () {
                return Module["asm"]["free"].apply(null, arguments)
            }
                ;
            var ___errno_location = Module["___errno_location"] = function () {
                return Module["asm"]["__errno_location"].apply(null, arguments)
            }
                ;
            var _setThrew = Module["_setThrew"] = function () {
                return Module["asm"]["setThrew"].apply(null, arguments)
            }
                ;
            var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function () {
                return Module["asm"]["_ZSt18uncaught_exceptionv"].apply(null, arguments)
            }
                ;
            var ___cxa_demangle = Module["___cxa_demangle"] = function () {
                return Module["asm"]["__cxa_demangle"].apply(null, arguments)
            }
                ;
            var ___getTypeName = Module["___getTypeName"] = function () {
                return Module["asm"]["__getTypeName"].apply(null, arguments)
            }
                ;
            var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function () {
                return Module["asm"]["__embind_register_native_and_builtin_types"].apply(null, arguments)
            }
                ;
            var stackSave = Module["stackSave"] = function () {
                return Module["asm"]["stackSave"].apply(null, arguments)
            }
                ;
            var stackAlloc = Module["stackAlloc"] = function () {
                return Module["asm"]["stackAlloc"].apply(null, arguments)
            }
                ;
            var stackRestore = Module["stackRestore"] = function () {
                return Module["asm"]["stackRestore"].apply(null, arguments)
            }
                ;
            var __growWasmMemory = Module["__growWasmMemory"] = function () {
                return Module["asm"]["__growWasmMemory"].apply(null, arguments)
            }
                ;
            var dynCall_ii = Module["dynCall_ii"] = function () {
                return Module["asm"]["dynCall_ii"].apply(null, arguments)
            }
                ;
            var dynCall_vi = Module["dynCall_vi"] = function () {
                return Module["asm"]["dynCall_vi"].apply(null, arguments)
            }
                ;
            var dynCall_i = Module["dynCall_i"] = function () {
                return Module["asm"]["dynCall_i"].apply(null, arguments)
            }
                ;
            var dynCall_iii = Module["dynCall_iii"] = function () {
                return Module["asm"]["dynCall_iii"].apply(null, arguments)
            }
                ;
            var dynCall_iiii = Module["dynCall_iiii"] = function () {
                return Module["asm"]["dynCall_iiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiii = Module["dynCall_iiiii"] = function () {
                return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiii = Module["dynCall_iiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viii = Module["dynCall_viii"] = function () {
                return Module["asm"]["dynCall_viii"].apply(null, arguments)
            }
                ;
            var dynCall_viiii = Module["dynCall_viiii"] = function () {
                return Module["asm"]["dynCall_viiii"].apply(null, arguments)
            }
                ;
            var dynCall_vii = Module["dynCall_vii"] = function () {
                return Module["asm"]["dynCall_vii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidd = Module["dynCall_viiidd"] = function () {
                return Module["asm"]["dynCall_viiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidd = Module["dynCall_viiiidd"] = function () {
                return Module["asm"]["dynCall_viiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiid = Module["dynCall_viiid"] = function () {
                return Module["asm"]["dynCall_viiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiid = Module["dynCall_viiiid"] = function () {
                return Module["asm"]["dynCall_viiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiii = Module["dynCall_viiiii"] = function () {
                return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
            }
                ;
            var dynCall_dii = Module["dynCall_dii"] = function () {
                return Module["asm"]["dynCall_dii"].apply(null, arguments)
            }
                ;
            var dynCall_diii = Module["dynCall_diii"] = function () {
                return Module["asm"]["dynCall_diii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiid = Module["dynCall_iiiid"] = function () {
                return Module["asm"]["dynCall_iiiid"].apply(null, arguments)
            }
                ;
            var dynCall_fiii = Module["dynCall_fiii"] = function () {
                return Module["asm"]["dynCall_fiii"].apply(null, arguments)
            }
                ;
            var dynCall_fiiii = Module["dynCall_fiiii"] = function () {
                return Module["asm"]["dynCall_fiiii"].apply(null, arguments)
            }
                ;
            var dynCall_fiiiii = Module["dynCall_fiiiii"] = function () {
                return Module["asm"]["dynCall_fiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiii = Module["dynCall_diiiii"] = function () {
                return Module["asm"]["dynCall_diiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiii = Module["dynCall_diiii"] = function () {
                return Module["asm"]["dynCall_diiii"].apply(null, arguments)
            }
                ;
            var dynCall_viid = Module["dynCall_viid"] = function () {
                return Module["asm"]["dynCall_viid"].apply(null, arguments)
            }
                ;
            var dynCall_fii = Module["dynCall_fii"] = function () {
                return Module["asm"]["dynCall_fii"].apply(null, arguments)
            }
                ;
            var dynCall_viif = Module["dynCall_viif"] = function () {
                return Module["asm"]["dynCall_viif"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiif = Module["dynCall_viiif"] = function () {
                return Module["asm"]["dynCall_viiif"].apply(null, arguments)
            }
                ;
            var dynCall_iiiif = Module["dynCall_iiiif"] = function () {
                return Module["asm"]["dynCall_iiiif"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddii = Module["dynCall_viiiddii"] = function () {
                return Module["asm"]["dynCall_viiiddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiddii = Module["dynCall_viiddii"] = function () {
                return Module["asm"]["dynCall_viiddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddi = Module["dynCall_viiiddi"] = function () {
                return Module["asm"]["dynCall_viiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiddi = Module["dynCall_viiddi"] = function () {
                return Module["asm"]["dynCall_viiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viidd = Module["dynCall_viidd"] = function () {
                return Module["asm"]["dynCall_viidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddi = Module["dynCall_viiiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddddii = Module["dynCall_viiiiddddii"] = function () {
                return Module["asm"]["dynCall_viiiiddddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddddii = Module["dynCall_viiiddddii"] = function () {
                return Module["asm"]["dynCall_viiiddddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddddi = Module["dynCall_viiiiddddi"] = function () {
                return Module["asm"]["dynCall_viiiiddddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddddi = Module["dynCall_viiiddddi"] = function () {
                return Module["asm"]["dynCall_viiiddddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidddd = Module["dynCall_viiiidddd"] = function () {
                return Module["asm"]["dynCall_viiiidddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiidddd = Module["dynCall_viiidddd"] = function () {
                return Module["asm"]["dynCall_viiidddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddd = Module["dynCall_viiiiddd"] = function () {
                return Module["asm"]["dynCall_viiiiddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddd = Module["dynCall_viiiddd"] = function () {
                return Module["asm"]["dynCall_viiiddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddidddd = Module["dynCall_viiiddidddd"] = function () {
                return Module["asm"]["dynCall_viiiddidddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiddidddd = Module["dynCall_viiddidddd"] = function () {
                return Module["asm"]["dynCall_viiddidddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddiddd = Module["dynCall_viiiddiddd"] = function () {
                return Module["asm"]["dynCall_viiiddiddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiddiddd = Module["dynCall_viiddiddd"] = function () {
                return Module["asm"]["dynCall_viiddiddd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddidd = Module["dynCall_viiiddidd"] = function () {
                return Module["asm"]["dynCall_viiiddidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiddidd = Module["dynCall_viiddidd"] = function () {
                return Module["asm"]["dynCall_viiddidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddid = Module["dynCall_viiiddid"] = function () {
                return Module["asm"]["dynCall_viiiddid"].apply(null, arguments)
            }
                ;
            var dynCall_viiddid = Module["dynCall_viiddid"] = function () {
                return Module["asm"]["dynCall_viiddid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiddi = Module["dynCall_viiiiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidd = Module["dynCall_viiiiidd"] = function () {
                return Module["asm"]["dynCall_viiiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiid = Module["dynCall_viiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiddi = Module["dynCall_viiiiiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidd = Module["dynCall_viiiiiidd"] = function () {
                return Module["asm"]["dynCall_viiiiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiii = Module["dynCall_viiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiddi = Module["dynCall_viiiiiiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiidd = Module["dynCall_viiiiiiidd"] = function () {
                return Module["asm"]["dynCall_viiiiiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiid = Module["dynCall_viiiiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidiiid = Module["dynCall_viiidiiid"] = function () {
                return Module["asm"]["dynCall_viiidiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viidiiid = Module["dynCall_viidiiid"] = function () {
                return Module["asm"]["dynCall_viidiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viididdii = Module["dynCall_viididdii"] = function () {
                return Module["asm"]["dynCall_viididdii"].apply(null, arguments)
            }
                ;
            var dynCall_vididdii = Module["dynCall_vididdii"] = function () {
                return Module["asm"]["dynCall_vididdii"].apply(null, arguments)
            }
                ;
            var dynCall_viididdi = Module["dynCall_viididdi"] = function () {
                return Module["asm"]["dynCall_viididdi"].apply(null, arguments)
            }
                ;
            var dynCall_vididdi = Module["dynCall_vididdi"] = function () {
                return Module["asm"]["dynCall_vididdi"].apply(null, arguments)
            }
                ;
            var dynCall_viiidi = Module["dynCall_viiidi"] = function () {
                return Module["asm"]["dynCall_viiidi"].apply(null, arguments)
            }
                ;
            var dynCall_viidi = Module["dynCall_viidi"] = function () {
                return Module["asm"]["dynCall_viidi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiiiidi = Module["dynCall_viiiidiiiidi"] = function () {
                return Module["asm"]["dynCall_viiiidiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_viiidiiiidi = Module["dynCall_viiidiiiidi"] = function () {
                return Module["asm"]["dynCall_viiidiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiiiid = Module["dynCall_viiiiiiiiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiiid = Module["dynCall_viiiiiiiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiiiiiiiii = Module["dynCall_diiiiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiiiiiiii = Module["dynCall_diiiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiiiiiii = Module["dynCall_diiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiiiiii = Module["dynCall_diiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_di = Module["dynCall_di"] = function () {
                return Module["asm"]["dynCall_di"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidi = Module["dynCall_viiiiidi"] = function () {
                return Module["asm"]["dynCall_viiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidi = Module["dynCall_viiiidi"] = function () {
                return Module["asm"]["dynCall_viiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_vidiii = Module["dynCall_vidiii"] = function () {
                return Module["asm"]["dynCall_vidiii"].apply(null, arguments)
            }
                ;
            var dynCall_vdiii = Module["dynCall_vdiii"] = function () {
                return Module["asm"]["dynCall_vdiii"].apply(null, arguments)
            }
                ;
            var dynCall_vidii = Module["dynCall_vidii"] = function () {
                return Module["asm"]["dynCall_vidii"].apply(null, arguments)
            }
                ;
            var dynCall_vdii = Module["dynCall_vdii"] = function () {
                return Module["asm"]["dynCall_vdii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiifi = Module["dynCall_viiiiiifi"] = function () {
                return Module["asm"]["dynCall_viiiiiifi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiifi = Module["dynCall_viiiiifi"] = function () {
                return Module["asm"]["dynCall_viiiiifi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiif = Module["dynCall_viiiiiif"] = function () {
                return Module["asm"]["dynCall_viiiiiif"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiif = Module["dynCall_viiiiif"] = function () {
                return Module["asm"]["dynCall_viiiiif"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidddiiii = Module["dynCall_viiiidddiiii"] = function () {
                return Module["asm"]["dynCall_viiiidddiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidddiiii = Module["dynCall_viiidddiiii"] = function () {
                return Module["asm"]["dynCall_viiidddiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidddiii = Module["dynCall_viiiidddiii"] = function () {
                return Module["asm"]["dynCall_viiiidddiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidddiii = Module["dynCall_viiidddiii"] = function () {
                return Module["asm"]["dynCall_viiidddiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidddii = Module["dynCall_viiiidddii"] = function () {
                return Module["asm"]["dynCall_viiiidddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidddii = Module["dynCall_viiidddii"] = function () {
                return Module["asm"]["dynCall_viiidddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidddi = Module["dynCall_viiiidddi"] = function () {
                return Module["asm"]["dynCall_viiiidddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiidddi = Module["dynCall_viiidddi"] = function () {
                return Module["asm"]["dynCall_viiidddi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiididi = Module["dynCall_iiiiiididi"] = function () {
                return Module["asm"]["dynCall_iiiiiididi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiididi = Module["dynCall_viiiiididi"] = function () {
                return Module["asm"]["dynCall_viiiiididi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiidid = Module["dynCall_iiiiiidid"] = function () {
                return Module["asm"]["dynCall_iiiiiidid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidid = Module["dynCall_viiiiidid"] = function () {
                return Module["asm"]["dynCall_viiiiidid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiidi = Module["dynCall_iiiiiidi"] = function () {
                return Module["asm"]["dynCall_iiiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = function () {
                return Module["asm"]["dynCall_iiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidi = Module["dynCall_viiiiiidi"] = function () {
                return Module["asm"]["dynCall_viiiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiidiid = Module["dynCall_iiiiidiid"] = function () {
                return Module["asm"]["dynCall_iiiiidiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiid = Module["dynCall_viiiidiid"] = function () {
                return Module["asm"]["dynCall_viiiidiid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiidii = Module["dynCall_iiiiidii"] = function () {
                return Module["asm"]["dynCall_iiiiidii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidii = Module["dynCall_viiiidii"] = function () {
                return Module["asm"]["dynCall_viiiidii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiidi = Module["dynCall_iiiiidi"] = function () {
                return Module["asm"]["dynCall_iiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiid = Module["dynCall_iiiiid"] = function () {
                return Module["asm"]["dynCall_iiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiiii = Module["dynCall_diiiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiiii = Module["dynCall_diiiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiididii = Module["dynCall_viiididii"] = function () {
                return Module["asm"]["dynCall_viiididii"].apply(null, arguments)
            }
                ;
            var dynCall_viididii = Module["dynCall_viididii"] = function () {
                return Module["asm"]["dynCall_viididii"].apply(null, arguments)
            }
                ;
            var dynCall_viiididi = Module["dynCall_viiididi"] = function () {
                return Module["asm"]["dynCall_viiididi"].apply(null, arguments)
            }
                ;
            var dynCall_viididi = Module["dynCall_viididi"] = function () {
                return Module["asm"]["dynCall_viididi"].apply(null, arguments)
            }
                ;
            var dynCall_iiidd = Module["dynCall_iiidd"] = function () {
                return Module["asm"]["dynCall_iiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddiiid = Module["dynCall_viiiiddiiid"] = function () {
                return Module["asm"]["dynCall_viiiiddiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddiiid = Module["dynCall_viiiddiiid"] = function () {
                return Module["asm"]["dynCall_viiiddiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddiii = Module["dynCall_viiiiddiii"] = function () {
                return Module["asm"]["dynCall_viiiiddiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddiii = Module["dynCall_viiiddiii"] = function () {
                return Module["asm"]["dynCall_viiiddiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddii = Module["dynCall_viiiiddii"] = function () {
                return Module["asm"]["dynCall_viiiiddii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddiiiid = Module["dynCall_viiiiddiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiddiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddiiiid = Module["dynCall_viiiddiiiid"] = function () {
                return Module["asm"]["dynCall_viiiddiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddiiii = Module["dynCall_viiiiddiiii"] = function () {
                return Module["asm"]["dynCall_viiiiddiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiddiiii = Module["dynCall_viiiddiiii"] = function () {
                return Module["asm"]["dynCall_viiiddiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiiii = Module["dynCall_diiiiii"] = function () {
                return Module["asm"]["dynCall_diiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_diiiid = Module["dynCall_diiiid"] = function () {
                return Module["asm"]["dynCall_diiiid"].apply(null, arguments)
            }
                ;
            var dynCall_diiid = Module["dynCall_diiid"] = function () {
                return Module["asm"]["dynCall_diiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiddiii = Module["dynCall_viiddiii"] = function () {
                return Module["asm"]["dynCall_viiddiii"].apply(null, arguments)
            }
                ;
            var dynCall_vidi = Module["dynCall_vidi"] = function () {
                return Module["asm"]["dynCall_vidi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiid = Module["dynCall_viiiiiiiid"] = function () {
                return Module["asm"]["dynCall_viiiiiiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiiii = Module["dynCall_viiiiidiiii"] = function () {
                return Module["asm"]["dynCall_viiiiidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiiii = Module["dynCall_viiiidiiii"] = function () {
                return Module["asm"]["dynCall_viiiidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiii = Module["dynCall_viiiiidiii"] = function () {
                return Module["asm"]["dynCall_viiiiidiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiii = Module["dynCall_viiiidiii"] = function () {
                return Module["asm"]["dynCall_viiiidiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidii = Module["dynCall_viiiiidii"] = function () {
                return Module["asm"]["dynCall_viiiiidii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiidi = Module["dynCall_viiiiiiidi"] = function () {
                return Module["asm"]["dynCall_viiiiiiidi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiiifdii = Module["dynCall_iiiiiiiiiifdii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiiifdii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiifdii = Module["dynCall_iiiiiiiiifdii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiifdii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiiifdi = Module["dynCall_iiiiiiiiiifdi"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiiifdi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiifdi = Module["dynCall_iiiiiiiiifdi"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiifdi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiiifd = Module["dynCall_iiiiiiiiiifd"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiiifd"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiifd = Module["dynCall_iiiiiiiiifd"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiifd"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiiif = Module["dynCall_iiiiiiiiiif"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiiif"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiif = Module["dynCall_iiiiiiiiif"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiif"].apply(null, arguments)
            }
                ;
            var dynCall_diiiddi = Module["dynCall_diiiddi"] = function () {
                return Module["asm"]["dynCall_diiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_diiddi = Module["dynCall_diiddi"] = function () {
                return Module["asm"]["dynCall_diiddi"].apply(null, arguments)
            }
                ;
            var dynCall_iiidiiiii = Module["dynCall_iiidiiiii"] = function () {
                return Module["asm"]["dynCall_iiidiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viidiiiii = Module["dynCall_viidiiiii"] = function () {
                return Module["asm"]["dynCall_viidiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiidiiii = Module["dynCall_iiidiiii"] = function () {
                return Module["asm"]["dynCall_iiidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viidiiii = Module["dynCall_viidiiii"] = function () {
                return Module["asm"]["dynCall_viidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiidiii = Module["dynCall_iiidiii"] = function () {
                return Module["asm"]["dynCall_iiidiii"].apply(null, arguments)
            }
                ;
            var dynCall_viidiii = Module["dynCall_viidiii"] = function () {
                return Module["asm"]["dynCall_viidiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiidii = Module["dynCall_iiidii"] = function () {
                return Module["asm"]["dynCall_iiidii"].apply(null, arguments)
            }
                ;
            var dynCall_viidii = Module["dynCall_viidii"] = function () {
                return Module["asm"]["dynCall_viidii"].apply(null, arguments)
            }
                ;
            var dynCall_iiidi = Module["dynCall_iiidi"] = function () {
                return Module["asm"]["dynCall_iiidi"].apply(null, arguments)
            }
                ;
            var dynCall_iiid = Module["dynCall_iiid"] = function () {
                return Module["asm"]["dynCall_iiid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiifiii = Module["dynCall_iiiiifiii"] = function () {
                return Module["asm"]["dynCall_iiiiifiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiifiii = Module["dynCall_viiiifiii"] = function () {
                return Module["asm"]["dynCall_viiiifiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiifii = Module["dynCall_iiiiifii"] = function () {
                return Module["asm"]["dynCall_iiiiifii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiifii = Module["dynCall_viiiifii"] = function () {
                return Module["asm"]["dynCall_viiiifii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiifi = Module["dynCall_iiiiifi"] = function () {
                return Module["asm"]["dynCall_iiiiifi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiifi = Module["dynCall_viiiifi"] = function () {
                return Module["asm"]["dynCall_viiiifi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiif = Module["dynCall_iiiiif"] = function () {
                return Module["asm"]["dynCall_iiiiif"].apply(null, arguments)
            }
                ;
            var dynCall_viiiif = Module["dynCall_viiiif"] = function () {
                return Module["asm"]["dynCall_viiiif"].apply(null, arguments)
            }
                ;
            var dynCall_vid = Module["dynCall_vid"] = function () {
                return Module["asm"]["dynCall_vid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiffi = Module["dynCall_iiiiffi"] = function () {
                return Module["asm"]["dynCall_iiiiffi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiffi = Module["dynCall_viiiffi"] = function () {
                return Module["asm"]["dynCall_viiiffi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiff = Module["dynCall_iiiiff"] = function () {
                return Module["asm"]["dynCall_iiiiff"].apply(null, arguments)
            }
                ;
            var dynCall_viiiff = Module["dynCall_viiiff"] = function () {
                return Module["asm"]["dynCall_viiiff"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiffi = Module["dynCall_iiiiiiffi"] = function () {
                return Module["asm"]["dynCall_iiiiiiffi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiffi = Module["dynCall_viiiiiffi"] = function () {
                return Module["asm"]["dynCall_viiiiiffi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiff = Module["dynCall_iiiiiiff"] = function () {
                return Module["asm"]["dynCall_iiiiiiff"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiff = Module["dynCall_viiiiiff"] = function () {
                return Module["asm"]["dynCall_viiiiiff"].apply(null, arguments)
            }
                ;
            var dynCall_iidi = Module["dynCall_iidi"] = function () {
                return Module["asm"]["dynCall_iidi"].apply(null, arguments)
            }
                ;
            var dynCall_iid = Module["dynCall_iid"] = function () {
                return Module["asm"]["dynCall_iid"].apply(null, arguments)
            }
                ;
            var dynCall_viiidiiii = Module["dynCall_viiidiiii"] = function () {
                return Module["asm"]["dynCall_viiidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidiii = Module["dynCall_viiidiii"] = function () {
                return Module["asm"]["dynCall_viiidiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidii = Module["dynCall_viiidii"] = function () {
                return Module["asm"]["dynCall_viiidii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiiiii = Module["dynCall_viiiiidiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiidiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidiiiii = Module["dynCall_viiiiiidiiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiidiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidiiii = Module["dynCall_viiiiiidiiii"] = function () {
                return Module["asm"]["dynCall_viiiiiidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidiii = Module["dynCall_viiiiiidiii"] = function () {
                return Module["asm"]["dynCall_viiiiiidiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiidii = Module["dynCall_viiiiiidii"] = function () {
                return Module["asm"]["dynCall_viiiiiidii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiifii = Module["dynCall_viiiiifii"] = function () {
                return Module["asm"]["dynCall_viiiiifii"].apply(null, arguments)
            }
                ;
            var dynCall_viiifii = Module["dynCall_viiifii"] = function () {
                return Module["asm"]["dynCall_viiifii"].apply(null, arguments)
            }
                ;
            var dynCall_viiifi = Module["dynCall_viiifi"] = function () {
                return Module["asm"]["dynCall_viiifi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiddiid = Module["dynCall_iiiddiid"] = function () {
                return Module["asm"]["dynCall_iiiddiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiddiid = Module["dynCall_viiddiid"] = function () {
                return Module["asm"]["dynCall_viiddiid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiddii = Module["dynCall_iiiddii"] = function () {
                return Module["asm"]["dynCall_iiiddii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiddi = Module["dynCall_iiiddi"] = function () {
                return Module["asm"]["dynCall_iiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiddiiid = Module["dynCall_iiiddiiid"] = function () {
                return Module["asm"]["dynCall_iiiddiiid"].apply(null, arguments)
            }
                ;
            var dynCall_viiddiiid = Module["dynCall_viiddiiid"] = function () {
                return Module["asm"]["dynCall_viiddiiid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiididiii = Module["dynCall_iiiiiiiididiii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiididiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = function () {
                return Module["asm"]["dynCall_iiiiiiiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiiddi = Module["dynCall_viiiidiiddi"] = function () {
                return Module["asm"]["dynCall_viiiidiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiiddi = Module["dynCall_viiiiidiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiidiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiidiidd = Module["dynCall_viiiidiidd"] = function () {
                return Module["asm"]["dynCall_viiiidiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiidd = Module["dynCall_viiiiidiidd"] = function () {
                return Module["asm"]["dynCall_viiiiidiidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiidiid = Module["dynCall_viiiiidiid"] = function () {
                return Module["asm"]["dynCall_viiiiidiid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiifiii = Module["dynCall_iiiifiii"] = function () {
                return Module["asm"]["dynCall_iiiifiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiifiii = Module["dynCall_viiifiii"] = function () {
                return Module["asm"]["dynCall_viiifiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiifii = Module["dynCall_iiiifii"] = function () {
                return Module["asm"]["dynCall_iiiifii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiifi = Module["dynCall_iiiifi"] = function () {
                return Module["asm"]["dynCall_iiiifi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiddiddi = Module["dynCall_iiiiiddiddi"] = function () {
                return Module["asm"]["dynCall_iiiiiddiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddiddi = Module["dynCall_viiiiddiddi"] = function () {
                return Module["asm"]["dynCall_viiiiddiddi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiddidd = Module["dynCall_iiiiiddidd"] = function () {
                return Module["asm"]["dynCall_iiiiiddidd"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddidd = Module["dynCall_viiiiddidd"] = function () {
                return Module["asm"]["dynCall_viiiiddidd"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiddid = Module["dynCall_iiiiiddid"] = function () {
                return Module["asm"]["dynCall_iiiiiddid"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiddid = Module["dynCall_viiiiddid"] = function () {
                return Module["asm"]["dynCall_viiiiddid"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiddi = Module["dynCall_iiiiiddi"] = function () {
                return Module["asm"]["dynCall_iiiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiidd = Module["dynCall_iiiiidd"] = function () {
                return Module["asm"]["dynCall_iiiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_iiifiiiiiii = Module["dynCall_iiifiiiiiii"] = function () {
                return Module["asm"]["dynCall_iiifiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viifiiiiiii = Module["dynCall_viifiiiiiii"] = function () {
                return Module["asm"]["dynCall_viifiiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifiiiiii = Module["dynCall_iiifiiiiii"] = function () {
                return Module["asm"]["dynCall_iiifiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viifiiiiii = Module["dynCall_viifiiiiii"] = function () {
                return Module["asm"]["dynCall_viifiiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifiiiii = Module["dynCall_iiifiiiii"] = function () {
                return Module["asm"]["dynCall_iiifiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viifiiiii = Module["dynCall_viifiiiii"] = function () {
                return Module["asm"]["dynCall_viifiiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifiiii = Module["dynCall_iiifiiii"] = function () {
                return Module["asm"]["dynCall_iiifiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viifiiii = Module["dynCall_viifiiii"] = function () {
                return Module["asm"]["dynCall_viifiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifiii = Module["dynCall_iiifiii"] = function () {
                return Module["asm"]["dynCall_iiifiii"].apply(null, arguments)
            }
                ;
            var dynCall_viifiii = Module["dynCall_viifiii"] = function () {
                return Module["asm"]["dynCall_viifiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifii = Module["dynCall_iiifii"] = function () {
                return Module["asm"]["dynCall_iiifii"].apply(null, arguments)
            }
                ;
            var dynCall_viifii = Module["dynCall_viifii"] = function () {
                return Module["asm"]["dynCall_viifii"].apply(null, arguments)
            }
                ;
            var dynCall_iiifi = Module["dynCall_iiifi"] = function () {
                return Module["asm"]["dynCall_iiifi"].apply(null, arguments)
            }
                ;
            var dynCall_viifi = Module["dynCall_viifi"] = function () {
                return Module["asm"]["dynCall_viifi"].apply(null, arguments)
            }
                ;
            var dynCall_iiif = Module["dynCall_iiif"] = function () {
                return Module["asm"]["dynCall_iiif"].apply(null, arguments)
            }
                ;
            var dynCall_viijii = Module["dynCall_viijii"] = function () {
                return Module["asm"]["dynCall_viijii"].apply(null, arguments)
            }
                ;
            var dynCall_ji = Module["dynCall_ji"] = function () {
                return Module["asm"]["dynCall_ji"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiiiddi = Module["dynCall_viiiiiiiiiiddi"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_v = Module["dynCall_v"] = function () {
                return Module["asm"]["dynCall_v"].apply(null, arguments)
            }
                ;
            var dynCall_viiiiiiiiidd = Module["dynCall_viiiiiiiiidd"] = function () {
                return Module["asm"]["dynCall_viiiiiiiiidd"].apply(null, arguments)
            }
                ;
            var dynCall_jiii = Module["dynCall_jiii"] = function () {
                return Module["asm"]["dynCall_jiii"].apply(null, arguments)
            }
                ;
            var dynCall_vij = Module["dynCall_vij"] = function () {
                return Module["asm"]["dynCall_vij"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiifiididiii = Module["dynCall_iiiiiifiididiii"] = function () {
                return Module["asm"]["dynCall_iiiiiifiididiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiidiiddi = Module["dynCall_viiidiiddi"] = function () {
                return Module["asm"]["dynCall_viiidiiddi"].apply(null, arguments)
            }
                ;
            var dynCall_viiij = Module["dynCall_viiij"] = function () {
                return Module["asm"]["dynCall_viiij"].apply(null, arguments)
            }
                ;
            var dynCall_jiiii = Module["dynCall_jiiii"] = function () {
                return Module["asm"]["dynCall_jiiii"].apply(null, arguments)
            }
                ;
            var dynCall_viiiij = Module["dynCall_viiiij"] = function () {
                return Module["asm"]["dynCall_viiiij"].apply(null, arguments)
            }
                ;
            var dynCall_jii = Module["dynCall_jii"] = function () {
                return Module["asm"]["dynCall_jii"].apply(null, arguments)
            }
                ;
            var dynCall_viji = Module["dynCall_viji"] = function () {
                return Module["asm"]["dynCall_viji"].apply(null, arguments)
            }
                ;
            var dynCall_vifi = Module["dynCall_vifi"] = function () {
                return Module["asm"]["dynCall_vifi"].apply(null, arguments)
            }
                ;
            var dynCall_jiji = Module["dynCall_jiji"] = function () {
                return Module["asm"]["dynCall_jiji"].apply(null, arguments)
            }
                ;
            var dynCall_iidiiii = Module["dynCall_iidiiii"] = function () {
                return Module["asm"]["dynCall_iidiiii"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiij = Module["dynCall_iiiiij"] = function () {
                return Module["asm"]["dynCall_iiiiij"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function () {
                return Module["asm"]["dynCall_iiiiijj"].apply(null, arguments)
            }
                ;
            var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function () {
                return Module["asm"]["dynCall_iiiiiijj"].apply(null, arguments)
            }
                ;
            Module["asm"] = asm;
            Module["getMemory"] = getMemory;
            Module["addRunDependency"] = addRunDependency;
            Module["removeRunDependency"] = removeRunDependency;
            Module["FS_createFolder"] = FS.createFolder;
            Module["FS_createPath"] = FS.createPath;
            Module["FS_createDataFile"] = FS.createDataFile;
            Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
            Module["FS_createLazyFile"] = FS.createLazyFile;
            Module["FS_createLink"] = FS.createLink;
            Module["FS_createDevice"] = FS.createDevice;
            Module["FS_unlink"] = FS.unlink;
            Module["calledRun"] = calledRun;
            var calledRun;
            Module["then"] = function (func) {
                if (calledRun) {
                    func(Module)
                } else {
                    var old = Module["onRuntimeInitialized"];
                    Module["onRuntimeInitialized"] = function () {
                        if (old)
                            old();
                        func(Module)
                    }
                }
                return Module
            }
                ;
            function ExitStatus(status) {
                this.name = "ExitStatus";
                this.message = "Program terminated with exit(" + status + ")";
                this.status = status
            }
            dependenciesFulfilled = function runCaller() {
                if (!calledRun)
                    run();
                if (!calledRun)
                    dependenciesFulfilled = runCaller
            }
                ;
            function run(args) {
                args = args || arguments_;
                if (runDependencies > 0) {
                    return
                }
                preRun();
                if (runDependencies > 0)
                    return;
                function doRun() {
                    if (calledRun)
                        return;
                    calledRun = true;
                    Module["calledRun"] = true;
                    if (ABORT)
                        return;
                    initRuntime();
                    preMain();
                    if (Module["onRuntimeInitialized"])
                        Module["onRuntimeInitialized"]();
                    postRun()
                }
                if (Module["setStatus"]) {
                    Module["setStatus"]("Running...");
                    setTimeout(function () {
                        setTimeout(function () {
                            Module["setStatus"]("")
                        }, 1);
                        doRun()
                    }, 1)
                } else {
                    doRun()
                }
            }
            Module["run"] = run;
            if (Module["preInit"]) {
                if (typeof Module["preInit"] == "function")
                    Module["preInit"] = [Module["preInit"]];
                while (Module["preInit"].length > 0) {
                    Module["preInit"].pop()()
                }
            }
            noExitRuntime = true;
            run();
            if (typeof Module.FS === "undefined" && typeof FS !== "undefined") {
                Module.FS = FS
            }

            if (!IsWechat) {
                // 在微信里不执行，请见另一个Module["imread"]
                Module["imread"] = function (imageSource) {
                    var img = null;
                    if (typeof imageSource === "string") {
                        img = document.getElementById(imageSource)
                    } else {
                        img = imageSource
                    }
                    var canvas = null;
                    var ctx = null;
                    if (img instanceof HTMLImageElement) {
                        canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, img.width, img.height)
                    } else if (img instanceof HTMLCanvasElement) {
                        canvas = img;
                        ctx = canvas.getContext("2d")
                    } else {
                        throw new Error("Please input the valid canvas or img id.");
                        return
                    }
                    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    return cv.matFromImageData(imgData)

                };
                // 在微信里不执行，请见另一个Module["imshow"]
                Module["imshow"] = function (canvasSource, mat) {
                    var canvas = null;
                    if (typeof canvasSource === "string") {
                        canvas = document.getElementById(canvasSource)
                    } else {
                        canvas = canvasSource
                    }
                    if (!(canvas instanceof HTMLCanvasElement)) {
                        throw new Error("Please input the valid canvas element or id.");
                        return
                    }
                    if (!(mat instanceof cv.Mat)) {
                        throw new Error("Please input the valid cv.Mat instance.");
                        return
                    }
                    var img = new cv.Mat;
                    var depth = mat.type() % 8;
                    var scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255;
                    var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0;
                    mat.convertTo(img, cv.CV_8U, scale, shift);
                    switch (img.type()) {
                        case cv.CV_8UC1:
                            cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
                            break;
                        case cv.CV_8UC3:
                            cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
                            break;
                        case cv.CV_8UC4:
                            break;
                        default:
                            throw new Error("Bad number of channels (Source image must have 1, 3 or 4 channels)");
                            return
                    }
                    var imgData = new ImageData(new Uint8ClampedArray(img.data), img.cols, img.rows);
                    var ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    canvas.width = imgData.width;
                    canvas.height = imgData.height;
                    ctx.putImageData(imgData, 0, 0);
                    img.delete()

                };
            } else {
                Module["imread"] = function (imgData) {
                    return cv.matFromImageData(imgData)
                };

                Module["imshow"] = function (canvas, mat) {
                    if (!(mat instanceof cv.Mat)) {
                        throw new Error("Please input the valid cv.Mat instance.");
                        return
                    }
                    var img = new cv.Mat;
                    var depth = mat.type() % 8;
                    var scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255;
                    var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0;

                    mat.convertTo(img, cv.CV_8U, scale, shift);

                    switch (img.type()) {
                        case cv.CV_8UC1:
                            cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
                            break;
                        case cv.CV_8UC3:
                            cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
                            break;
                        case cv.CV_8UC4:
                            break;
                        default:
                            throw new Error("Bad number of channels (Source image must have 1, 3 or 4 channels)");
                            return
                    }

                    var ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // 创建ImageData对象
                    var imgData = ctx.createImageData(img.cols, img.rows);
                    // imgData.data是只读对象，但是imgData.data.set()方法可修改imgData.data。
                    imgData.data.set(new Uint8ClampedArray(img.data))
                    // 画布canvas的宽度和高度，不能比图像imgData小。
                    canvas.width = imgData.width;
                    canvas.height = imgData.height;
                    // 需要传递ImageData类型，但小程序无法通过new ImageData()创建该类型。
                    ctx.putImageData(imgData, 0, 0);
                    img.delete()
                };

            }


            Module["VideoCapture"] = function (videoSource) {
                var video = null;
                if (typeof videoSource === "string") {
                    video = document.getElementById(videoSource)
                } else {
                    video = videoSource
                }
                if (!(video instanceof HTMLVideoElement)) {
                    throw new Error("Please input the valid video element or id.");
                    return
                }
                var canvas = document.createElement("canvas");
                canvas.width = video.width;
                canvas.height = video.height;
                var ctx = canvas.getContext("2d");
                this.video = video;
                this.read = function (frame) {
                    if (!(frame instanceof cv.Mat)) {
                        throw new Error("Please input the valid cv.Mat instance.");
                        return
                    }
                    if (frame.type() !== cv.CV_8UC4) {
                        throw new Error("Bad type of input mat: the type should be cv.CV_8UC4.");
                        return
                    }
                    if (frame.cols !== video.width || frame.rows !== video.height) {
                        throw new Error("Bad size of input mat: the size should be same as the video.");
                        return
                    }
                    ctx.drawImage(video, 0, 0, video.width, video.height);
                    frame.data.set(ctx.getImageData(0, 0, video.width, video.height).data)
                }
            }
                ;
            function Range(start, end) {
                this.start = typeof start === "undefined" ? 0 : start;
                this.end = typeof end === "undefined" ? 0 : end
            }
            Module["Range"] = Range;
            function Point(x, y) {
                this.x = typeof x === "undefined" ? 0 : x;
                this.y = typeof y === "undefined" ? 0 : y
            }
            Module["Point"] = Point;
            function Size(width, height) {
                this.width = typeof width === "undefined" ? 0 : width;
                this.height = typeof height === "undefined" ? 0 : height
            }
            Module["Size"] = Size;
            function Rect() {
                switch (arguments.length) {
                    case 0:
                        {
                            this.x = 0;
                            this.y = 0;
                            this.width = 0;
                            this.height = 0;
                            break
                        }
                    case 1:
                        {
                            var rect = arguments[0];
                            this.x = rect.x;
                            this.y = rect.y;
                            this.width = rect.width;
                            this.height = rect.height;
                            break
                        }
                    case 2:
                        {
                            var point = arguments[0];
                            var size = arguments[1];
                            this.x = point.x;
                            this.y = point.y;
                            this.width = size.width;
                            this.height = size.height;
                            break
                        }
                    case 4:
                        {
                            this.x = arguments[0];
                            this.y = arguments[1];
                            this.width = arguments[2];
                            this.height = arguments[3];
                            break
                        }
                    default:
                        {
                            throw new Error("Invalid arguments")
                        }
                }
            }
            Module["Rect"] = Rect;
            function RotatedRect() {
                switch (arguments.length) {
                    case 0:
                        {
                            this.center = {
                                x: 0,
                                y: 0
                            };
                            this.size = {
                                width: 0,
                                height: 0
                            };
                            this.angle = 0;
                            break
                        }
                    case 3:
                        {
                            this.center = arguments[0];
                            this.size = arguments[1];
                            this.angle = arguments[2];
                            break
                        }
                    default:
                        {
                            throw new Error("Invalid arguments")
                        }
                }
            }
            RotatedRect.points = function (obj) {
                return Module.rotatedRectPoints(obj)
            }
                ;
            RotatedRect.boundingRect = function (obj) {
                return Module.rotatedRectBoundingRect(obj)
            }
                ;
            RotatedRect.boundingRect2f = function (obj) {
                return Module.rotatedRectBoundingRect2f(obj)
            }
                ;
            Module["RotatedRect"] = RotatedRect;
            function Scalar(v0, v1, v2, v3) {
                this.push(typeof v0 === "undefined" ? 0 : v0);
                this.push(typeof v1 === "undefined" ? 0 : v1);
                this.push(typeof v2 === "undefined" ? 0 : v2);
                this.push(typeof v3 === "undefined" ? 0 : v3)
            }
            Scalar.prototype = new Array;
            Scalar.all = function (v) {
                return new Scalar(v, v, v, v)
            }
                ;
            Module["Scalar"] = Scalar;
            function MinMaxLoc() {
                switch (arguments.length) {
                    case 0:
                        {
                            this.minVal = 0;
                            this.maxVal = 0;
                            this.minLoc = new Point;
                            this.maxLoc = new Point;
                            break
                        }
                    case 4:
                        {
                            this.minVal = arguments[0];
                            this.maxVal = arguments[1];
                            this.minLoc = arguments[2];
                            this.maxLoc = arguments[3];
                            break
                        }
                    default:
                        {
                            throw new Error("Invalid arguments")
                        }
                }
            }
            Module["MinMaxLoc"] = MinMaxLoc;
            function Circle() {
                switch (arguments.length) {
                    case 0:
                        {
                            this.center = new Point;
                            this.radius = 0;
                            break
                        }
                    case 2:
                        {
                            this.center = arguments[0];
                            this.radius = arguments[1];
                            break
                        }
                    default:
                        {
                            throw new Error("Invalid arguments")
                        }
                }
            }
            Module["Circle"] = Circle;
            function TermCriteria() {
                switch (arguments.length) {
                    case 0:
                        {
                            this.type = 0;
                            this.maxCount = 0;
                            this.epsilon = 0;
                            break
                        }
                    case 3:
                        {
                            this.type = arguments[0];
                            this.maxCount = arguments[1];
                            this.epsilon = arguments[2];
                            break
                        }
                    default:
                        {
                            throw new Error("Invalid arguments")
                        }
                }
            }
            Module["TermCriteria"] = TermCriteria;
            Module["matFromArray"] = function (rows, cols, type, array) {
                var mat = new cv.Mat(rows, cols, type);
                switch (type) {
                    case cv.CV_8U:
                    case cv.CV_8UC1:
                    case cv.CV_8UC2:
                    case cv.CV_8UC3:
                    case cv.CV_8UC4:
                        {
                            mat.data.set(array);
                            break
                        }
                    case cv.CV_8S:
                    case cv.CV_8SC1:
                    case cv.CV_8SC2:
                    case cv.CV_8SC3:
                    case cv.CV_8SC4:
                        {
                            mat.data8S.set(array);
                            break
                        }
                    case cv.CV_16U:
                    case cv.CV_16UC1:
                    case cv.CV_16UC2:
                    case cv.CV_16UC3:
                    case cv.CV_16UC4:
                        {
                            mat.data16U.set(array);
                            break
                        }
                    case cv.CV_16S:
                    case cv.CV_16SC1:
                    case cv.CV_16SC2:
                    case cv.CV_16SC3:
                    case cv.CV_16SC4:
                        {
                            mat.data16S.set(array);
                            break
                        }
                    case cv.CV_32S:
                    case cv.CV_32SC1:
                    case cv.CV_32SC2:
                    case cv.CV_32SC3:
                    case cv.CV_32SC4:
                        {
                            mat.data32S.set(array);
                            break
                        }
                    case cv.CV_32F:
                    case cv.CV_32FC1:
                    case cv.CV_32FC2:
                    case cv.CV_32FC3:
                    case cv.CV_32FC4:
                        {
                            mat.data32F.set(array);
                            break
                        }
                    case cv.CV_64F:
                    case cv.CV_64FC1:
                    case cv.CV_64FC2:
                    case cv.CV_64FC3:
                    case cv.CV_64FC4:
                        {
                            mat.data64F.set(array);
                            break
                        }
                    default:
                        {
                            throw new Error("Type is unsupported")
                        }
                }
                return mat
            }
                ;
            Module["matFromImageData"] = function (imageData) {
                var mat = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
                mat.data.set(imageData.data);
                return mat
            }
                ;

            return cv
        }
        );
    }
    )();
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = cv;
    else if (typeof define === 'function' && define['amd'])
        define([], function () {
            return cv;
        });
    else if (typeof exports === 'object')
        exports["cv"] = cv;
    if (typeof Module === 'undefined')
       var Module = {};
    return cv(Module);
}));

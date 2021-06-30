"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnusedPlugin = void 0;
var path_1 = require("path");
var promises_1 = require("fs/promises");
var micromatch_1 = require("micromatch");
var schema_utils_1 = require("schema-utils");
var isIterable = function (iterable) {
    return iterable && iterable[Symbol.iterator];
};
var callValidator = function (params, pluginName) {
    schema_utils_1.validate({
        type: 'object',
        properties: {
            exclude: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
            outputFile: {
                type: 'string',
            },
        },
    }, params || {}, {
        name: pluginName,
        baseDataPath: 'params',
    });
};
var UnusedPlugin = (function () {
    function UnusedPlugin(params) {
        var _a;
        this.pluginName = 'UnusedPlugin';
        this.defaultFileName = 'unused.json';
        this.usedFilesList = new Set();
        this.filesList = new Set();
        this.excludeGlobs = [
            '**/node_modules',
            '**/node_modules/**',
            '**/.*',
            "**/" + this.defaultFileName,
        ];
        callValidator(params, this.pluginName);
        if (params === null || params === void 0 ? void 0 : params.exclude) {
            (_a = this.excludeGlobs).push.apply(_a, params.exclude);
        }
        if (params === null || params === void 0 ? void 0 : params.outputFile) {
            this.outputFile = params.outputFile;
        }
    }
    Object.defineProperty(UnusedPlugin.prototype, "relativeFilesList", {
        get: function () {
            var arr = [];
            var webpackCtx = this.webpackCtx;
            if (!webpackCtx) {
                throw new Error('Dont read relativeFilesList before the apply method');
            }
            this.filesList.forEach(function (file) {
                arr.push(path_1.relative(webpackCtx, file));
            });
            return arr;
        },
        enumerable: false,
        configurable: true
    });
    UnusedPlugin.prototype.parseDirectory = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var files, dirEntrys, fileOrDirStat, fileOrDirStatPathMap, stats, recursivePaths, recursivePathsResolved;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = [];
                        return [4, promises_1.readdir(path)];
                    case 1:
                        dirEntrys = _a.sent();
                        fileOrDirStat = [];
                        fileOrDirStatPathMap = [];
                        dirEntrys.forEach(function (pathToFileOrDir) {
                            var absPath = path_1.resolve(path, pathToFileOrDir);
                            fileOrDirStat.push(promises_1.stat(absPath));
                            fileOrDirStatPathMap.push(absPath);
                        });
                        return [4, Promise.all(fileOrDirStat)];
                    case 2:
                        stats = _a.sent();
                        recursivePaths = [];
                        stats.forEach(function (fileOrDirStat, i) {
                            var fileOrDirPath = fileOrDirStatPathMap[i];
                            if (fileOrDirStat.isDirectory()) {
                                if (!micromatch_1.isMatch(fileOrDirPath, _this.excludeGlobs)) {
                                    recursivePaths.push(_this.parseDirectory(fileOrDirPath));
                                }
                            }
                            else if (fileOrDirStat.isFile()) {
                                if (!micromatch_1.isMatch(fileOrDirPath, _this.excludeGlobs)) {
                                    files.push(fileOrDirPath);
                                }
                            }
                        });
                        return [4, Promise.all(recursivePaths)];
                    case 3:
                        recursivePathsResolved = _a.sent();
                        files.push.apply(files, recursivePathsResolved.flat());
                        return [2, files];
                }
            });
        });
    };
    UnusedPlugin.prototype.collectFilesPaths = function (compiler) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, entryStatic, _a, entyKeys, wait, paths;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        entry = compiler.options.entry;
                        if (!(typeof entry === 'function')) return [3, 2];
                        return [4, entry()];
                    case 1:
                        _a = _b.sent();
                        return [3, 3];
                    case 2:
                        _a = entry;
                        _b.label = 3;
                    case 3:
                        entryStatic = _a;
                        entyKeys = Object.keys(entryStatic);
                        wait = [];
                        entyKeys.forEach(function (key) {
                            var entry = entryStatic[key];
                            if (entry.import) {
                                entry.import.forEach(function (path) {
                                    if (path_1.isAbsolute(path)) {
                                        var dir = path_1.parse(path).dir;
                                        wait.push(_this.parseDirectory(dir));
                                    }
                                    else {
                                        var dir = path_1.parse(path_1.resolve(compiler.context, path)).dir;
                                        wait.push(_this.parseDirectory(dir));
                                    }
                                });
                            }
                        });
                        return [4, Promise.all(wait)];
                    case 4:
                        paths = _b.sent();
                        paths.flat().forEach(function (path) { return _this.filesList.add(path); });
                        return [2];
                }
            });
        });
    };
    UnusedPlugin.prototype.emitToFile = function (to, data) {
        return __awaiter(this, void 0, void 0, function () {
            var dataString;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dataString = JSON.stringify(isIterable(data) ? Array.from(data) : data);
                        return [4, promises_1.writeFile(to, dataString)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    UnusedPlugin.prototype.apply = function (compiler) {
        var _this = this;
        var outputFile = this.outputFile || path_1.resolve(compiler.context, this.defaultFileName);
        this.outputFile = outputFile;
        this.webpackCtx = compiler.context;
        var collectFilesPromise = this.collectFilesPaths(compiler);
        compiler.hooks.afterEmit.tapAsync(this.pluginName, function (compilation, cb) { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        compilation.fileDependencies.forEach(function (path) {
                            if (!micromatch_1.isMatch(path, _this.excludeGlobs)) {
                                _this.usedFilesList.add(path);
                            }
                        });
                        return [4, collectFilesPromise];
                    case 1:
                        _a.sent();
                        this.usedFilesList.forEach(function (usedPath) {
                            _this.filesList.delete(usedPath);
                        });
                        return [4, this.emitToFile(outputFile, this.relativeFilesList)];
                    case 2:
                        _a.sent();
                        cb();
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        cb(error_1);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        }); });
    };
    return UnusedPlugin;
}());
exports.UnusedPlugin = UnusedPlugin;
//# sourceMappingURL=index.js.map
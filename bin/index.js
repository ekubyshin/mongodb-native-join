'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var toObjectId = function toObjectId(id) {
    return new _mongodb2.default.ObjectId(id);
};

var Cursor = function () {
    function Cursor(cursor) {
        _classCallCheck(this, Cursor);

        this._query = [];
        if (cursor instanceof _mongodb2.default.Cursor) {
            this._source = cursor;
            this._db = cursor.options.db;
        } else {
            throw new Error('You must provide a mongodb cursor instance');
        }
    }
    /**
     * @param {String} field which to join
     * @param {String} collection from which to query
     * @param {String} fields to query from collection. Space is field separator
     * @returns {Cursor}
     */


    _createClass(Cursor, [{
        key: 'join',
        value: function join(field, collectionName, project) {
            var opts = { field: field, collectionName: collectionName };
            if (project) {
                opts = _extends({}, opts, { project: project });
            }
            this._query.push(opts);
            return this;
        }
    }, {
        key: '_getIdsForField',
        value: function _getIdsForField(sources, field) {
            return _lodash2.default.uniq(sources.reduce(function (memo, src) {
                var curField = _lodash2.default.get(src, field),
                    ids = [];
                if (Array.isArray(curField)) {
                    ids = curField.map(function (id) {
                        return id.toString();
                    });
                    memo = memo.concat(ids);
                } else {
                    memo.push(curField.toString());
                }
                return memo;
            }, [])).map(function (id) {
                return toObjectId(id);
            });
        }
    }, {
        key: '_getProjection',
        value: function _getProjection(project) {
            return project.split(/\s/gi).reduce(function (memo, key) {
                return _extends({}, memo, _defineProperty({}, key, true));
            }, {}) || null;
        }
    }, {
        key: '_prepareQueries',
        value: function _prepareQueries(source) {
            var _this = this;

            return this._query.map(function (option) {
                var field = option.field;
                var project = option.project;
                var collectionName = option.collectionName;

                var projection = project && _this._getProjection(project);
                var criteria = _this._getIdsForField(source, field);
                if (!criteria.length) {
                    return Promise.resolve([]);
                }
                var cursor = _this._db.collection(collectionName).find({
                    _id: {
                        $in: criteria
                    }
                });
                if (projection) {
                    cursor = cursor.project(projection);
                }
                return cursor.toArray();
            });
        }
    }, {
        key: '_mergeResults',
        value: function _mergeResults(source, resultsToMerge) {
            var _this2 = this;

            return source.map(function (src) {
                var source = _extends({}, src);
                _this2._query.forEach(function (option, index) {
                    var target = void 0,
                        field = _lodash2.default.get(source, option.field),
                        results = resultsToMerge[index];
                    if (Array.isArray(field)) {
                        target = field.map(function (id) {
                            return results.find(function (item) {
                                return item._id.toString() === id.toString();
                            });
                        });
                    } else {
                        target = resultsToMerge[index].find(function (item) {
                            return item._id.toString() === field.toString();
                        });
                    }
                    target && _lodash2.default.set(source, option.field, target);
                });
                return source;
            });
        }
    }, {
        key: 'toArray',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                var sources, promises, resultsToMerge, results;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return this._source.toArray();

                            case 2:
                                sources = _context.sent;

                                if (!(!sources || !sources.length)) {
                                    _context.next = 5;
                                    break;
                                }

                                return _context.abrupt('return', []);

                            case 5:
                                promises = this._prepareQueries(sources);
                                _context.next = 8;
                                return Promise.all(promises);

                            case 8:
                                resultsToMerge = _context.sent;

                                if (!(!resultsToMerge || resultsToMerge.length < this._query.length)) {
                                    _context.next = 11;
                                    break;
                                }

                                throw new Error(resultsToMerge);

                            case 11:

                                this._source = null;
                                this._db = null;

                                results = this._mergeResults(sources, resultsToMerge);


                                this._query.length = 0;

                                return _context.abrupt('return', results);

                            case 16:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function toArray() {
                return _ref.apply(this, arguments);
            }

            return toArray;
        }()
    }]);

    return Cursor;
}();

/**
 * @param {MongodbCursor} source cursor
 * @returns {Cursor} wrapped cursor with joins
 */


exports.default = function (cursor) {

    return new Cursor(cursor);
};

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.Service = void 0;

var _airtable = _interopRequireDefault(require("airtable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-unused-vars */
class Service {
  constructor(options) {
    this.options = options || {};
    var {
      apiKey,
      tableName,
      baseId
    } = this.options;
    this.base = new _airtable.default({
      apiKey
    }).base(baseId);
  }

  setup(app) {
    this.app = app;
  }
  /**
   * Maps an airtable record object into a field
   * @param {*} record
   */


  mapAirtableRecordToObject(record) {
    return _objectSpread({
      id: record.id
    }, record.fields);
  }
  /**
   * Maps an airtable record object into a field
   * @param {*} record
   */


  mapObjectToAirtableRecord(data) {
    return {
      fields: _objectSpread({}, data)
    };
  }

  find(params) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var mapConditional = queryParam => {
        var {
          $in,
          $nin
        } = queryParam;

        if ($in) {
          var $ors = $in.map(param => {
            return {
              [queryParam]: "".concat(param)
            };
          });
          return mapQuery({
            $or: $ors
          });
        } else if ($nin) {
          var _$ors = $in.map(param => {
            return {
              [queryParam]: "".concat(param)
            };
          });

          return "NOT(".concat(mapQuery({
            $or: _$ors
          }), ")");
        } else {
          return mapQuery(queryParam);
        }
      };

      var mapQuery = queryParams => {
        var validQueryParams = ["$or", "$in"];
        var condtionals = [];
        var {
          $or,
          $and,
          $gte,
          $sort,
          $in
        } = queryParams; // Base Case

        if (typeof queryParams !== "object") {
          return queryParams;
        } // OR


        if ($or) {
          condtionals.push("OR(".concat($or.filter(queryParam => validQueryParams.includes(queryParam) || typeof queryParam === "object").map(queryParam => {
            return Object.keys(queryParam).map(key => {
              if (typeof queryParam[key] === "object") {
                return mapQuery(queryParam);
              } else {
                return "{".concat(key, "} = '").concat(mapQuery(queryParam[key]), "'");
              }
            });
          }).join(","), ")"));
        } else {
          // AND
          condtionals.push("AND(".concat(Object.keys(queryParams).filter(queryParam => validQueryParams.includes(queryParam) || typeof queryParam === "object" || queryParam[0] !== "$").map(queryParam => {
            if (typeof queryParams[queryParam] === "object") {
              // Special equality in filter.
              var {
                $in: _$in,
                $nin,
                $lt,
                $lte,
                $gt,
                $gte: _$gte,
                $ne
              } = queryParams[queryParam];

              if (_$in) {
                var $ors = _$in.map(param => {
                  return {
                    [queryParam]: "".concat(param)
                  };
                });

                return mapQuery({
                  $or: $ors
                });
              } else if ($nin) {
                var _$ors2 = $nin.map(param => {
                  return {
                    [queryParam]: "".concat(param)
                  };
                });

                return "NOT(".concat(mapQuery({
                  $or: _$ors2
                }), ")");
              } else if ($lt) {
                return "{".concat(queryParam, "} < ").concat($lt);
              } else if ($lte) {
                return "{".concat(queryParam, "} <= ").concat($lte);
              } else if ($gt) {
                return "{".concat(queryParam, "} > ").concat($gt);
              } else if (_$gte) {
                return "{".concat(queryParam, "} >= ").concat(_$gte);
              } else if ($ne) {
                return "{".concat(queryParam, "} != ").concat($ne);
              } else {
                return mapQuery(queryParam);
              }
            }

            return "{".concat(queryParam, "} = ").concat(mapQuery(queryParams[queryParam]));
          }).join(","), ")"));
        }

        return condtionals.join(",");
      };

      return new Promise((resolve, reject) => {
        var {
          query
        } = params;
        var filterByFormula = "",
            maxRecords = "",
            skip;
        var selectOptions = {};

        if (query) {
          var {
            $limit,
            $sort,
            $select,
            $skip
          } = query; // For simple equality queries

          var fields = Object.keys(query).filter(queryParam => queryParam[0] != "$"); // @todo Need to refactor this to handle query params better
          // The modifiers should be mapped first
          // Then the conditionals
          // Some modifiers and conditionals contain $
          // So I need to keep a list of which ones are valid

          if (fields.length > 0) {
            var filters = fields.map(key => {
              if (typeof query[key] === "object") {
                return mapQuery({
                  [key]: query[key]
                });
              }

              return "{".concat(key, "} = '").concat(query[key], "'");
            });

            if (filters.length > 1) {
              filterByFormula = "AND(".concat(filters.join(","), ")");
            } else {
              filterByFormula = filters.join(",");
            }

            selectOptions.filterByFormula = filterByFormula;
          } else {
            selectOptions.filterByFormula = mapQuery(query);
          }

          if ($sort) {
            selectOptions.sort = Object.keys($sort).filter(key => key !== "id").map(key => {
              return {
                field: key,
                direction: $sort[key] > 0 ? "asc" : "desc"
              };
            });
          }

          if ($select) {
            selectOptions.fields = $select;
          }

          if ($limit) {
            selectOptions.maxRecords = parseInt($limit, 10);
          }

          if ($skip) {
            skip = $skip;
            selectOptions.maxRecords += skip;
          }
        }

        var output = [];

        _this.base(_this.options.tableName).select(selectOptions).eachPage( /*#__PURE__*/function () {
          var _ref = _asyncToGenerator(function* (records, fetchNextPage) {
            records.forEach(record => {
              output.push(_this.mapAirtableRecordToObject(record));
            });
            fetchNextPage();
          });

          return function (_x, _x2) {
            return _ref.apply(this, arguments);
          };
        }(), function done(err) {
          if (err) {
            return reject(err);
          }

          if (skip) {
            return resolve(output.slice(skip));
          }

          return resolve(output);
        });
      });
    })();
  }

  get(id, params) {
    return new Promise((resolve, reject) => {
      this.base(this.options.tableName).find(id).then(record => resolve(this.mapAirtableRecordToObject(record))).catch(err => reject(err));
    });
  }

  create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName).create([this.mapObjectToAirtableRecord(data)]).then(result => resolve(this.mapAirtableRecordToObject(result[0]))).catch(err => reject(err));
    });
  }

  patch(id, data, params) {
    var reqData; // For single resource

    if (id) {
      reqData = [_objectSpread({
        id
      }, this.mapObjectToAirtableRecord(data))];
    } else {
      reqData = data.map(dataItem => this.mapObjectToAirtableRecord(dataItem));
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName).update(reqData).then(records => {
        resolve(records.map(this.mapAirtableRecordToObject));
      }).catch(err => reject(err));
    });
  }

  update(id, data, params) {
    var reqData; // For single resource

    if (id) {
      data.id = id;
      reqData = [this.mapObjectToAirtableRecord(data)];
    } else {
      reqData = this.mapObjectToAirtableRecord(data);
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName).update(reqData).then(record => {
        resolve(this.mapAirtableRecordToObject(record));
      }).catch(err => reject(err));
    });
  }

  remove(id, params) {
    if (!id) {
      this.find(params).then(records => {
        if (Array.isArray(records)) {
          return Promise.all(records.map(current => this.remove(current.id)));
        }
      });
    }

    return new Promise((resolve, reject) => {
      this.base(this.options.tableName).destroy([id]).then(result => {
        if (Array.isArray(result)) {
          resolve(result[0]);
        } else {
          resolve(result);
        }
      }).catch(err => reject(err));
    });
  }

}

exports.Service = Service;

function _default(options) {
  return new Service(options);
}

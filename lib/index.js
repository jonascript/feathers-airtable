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
   * @returns {Object} { id: [airtable _id], "Field A", "Field B" }
   */


  mapAirtableRecordToObject(record) {
    return _objectSpread({
      id: record.id
    }, record.fields);
  }
  /**
   * Maps an airtable record object into a field
   * @param {*} record
   * @returns {Object} {fields: { "Field A": val, "Field B": val }}
   */


  mapObjectToAirtableRecord(data) {
    return {
      fields: _objectSpread({}, data)
    };
  }

  mapQuery(queryParams) {
    var comparisonOperators = ["$ne", "$in", "$lt", "$lte", "$gt", "$gte", "$nin", "$in"];
    var condtionals = [];
    var {
      $or
    } = queryParams; // Base Case

    if (typeof queryParams !== "object") {
      return queryParams;
    }

    if ($or) {
      condtionals.push("OR(".concat($or.filter(queryParam => ["$or", "$in"].includes(queryParam) || typeof queryParam === "object").map(queryParam => {
        return Object.keys(queryParam).map(key => {
          if (typeof queryParam[key] === "object") {
            return this.mapQuery(queryParam);
          } else {
            return "{".concat(key, "} = '").concat(this.mapQuery(queryParam[key]), "'");
          }
        });
      }).join(","), ")"));
    } else {
      // AND
      // @todo fix unecessary AND breaking query
      condtionals.push("".concat(Object.keys(queryParams).filter(field => {
        return !comparisonOperators.includes(field);
      }).map(field => {
        if (typeof queryParams[field] === "object") {
          var {
            $in,
            $nin,
            $lt,
            $lte,
            $gt,
            $gte,
            $ne
          } = queryParams[field];

          if ($in) {
            var $ors = $in.map(param => {
              return {
                [field]: "".concat(param)
              };
            });
            return this.mapQuery({
              $or: $ors
            });
          } else if ($nin) {
            var _$ors = $nin.map(param => {
              return {
                [field]: "".concat(param)
              };
            });

            return "NOT(".concat(this.mapQuery({
              $or: _$ors
            }), ")");
          } else if ($lt) {
            return "{".concat(field, "} < ").concat($lt);
          } else if ($lte) {
            return "{".concat(field, "} <= ").concat($lte);
          } else if ($gt) {
            return "{".concat(field, "} > ").concat($gt);
          } else if ($gte) {
            return "{".concat(field, "} >= ").concat($gte);
          } else if ($ne) {
            return "{".concat(field, "} != ").concat($ne);
          } else {
            throw Error("Invalid Operator ".concat(field));
          }
        }

        return "{".concat(field, "} = ").concat(this.mapQuery(queryParams[field]));
      }).join(",")));
    }

    if (condtionals.length > 1) {
      return condtionals.join(",");
    }

    return condtionals.join("");
  }

  find(params) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var comparisonOperators = ["$ne", "$in", "$lt", "$lte", "$gt", "$gte", "$nin", "$in", "$or"];
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

          var operators = Object.keys(query).filter(queryParam => comparisonOperators.includes(queryParam));
          var equalityConditionals = Object.keys(query).filter(queryParam => queryParam.charAt(0) !== "$");

          if (operators.length > 0) {
            var filters = operators.map(key => {
              if (typeof query[key] === "object") {
                return _this.mapQuery({
                  [key]: query[key]
                });
              }

              return "{".concat(key, "} = '").concat(query[key], "'");
            });

            if (filters.length > 1) {
              filterByFormula = "AND(".concat(filters.join(","), ")");
            } else {
              filterByFormula = filters.join("");
            }

            selectOptions.filterByFormula = filterByFormula;
          } else if (equalityConditionals.length > 0) {
            var _filters = equalityConditionals.map(key => {
              if (typeof query[key] === "object") {
                return _this.mapQuery({
                  [key]: query[key]
                });
              }

              return "{".concat(key, "} = '").concat(query[key], "'");
            });

            if (_filters.length > 1) {
              filterByFormula = "AND(".concat(_filters.join(","), ")");
            } else {
              filterByFormula = _filters.join("");
            }

            selectOptions.filterByFormula = filterByFormula;
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

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/js-yaml/dist/js-yaml.mjs
var __create, __defProp2, __getOwnPropDesc, __getOwnPropNames2, __getProtoOf, __hasOwnProp, __commonJSMin, __copyProps, __toESM, require_common, require_exception, require_snippet, require_type, require_schema, require_str, require_seq, require_map, require_failsafe, require_null, require_bool, require_int, require_float, require_json, require_core, require_timestamp, require_merge, require_binary, require_omap, require_pairs, require_set, require_default, require_loader, require_dumper, import_js_yaml, Type, Schema, FAILSAFE_SCHEMA, JSON_SCHEMA, CORE_SCHEMA, DEFAULT_SCHEMA, load, loadAll, dump, YAMLException, types, safeLoad, safeLoadAll, safeDump, index_vite_proxy_tmp_default;
var init_js_yaml = __esm({
  "node_modules/js-yaml/dist/js-yaml.mjs"() {
    __create = Object.create;
    __defProp2 = Object.defineProperty;
    __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    __getOwnPropNames2 = Object.getOwnPropertyNames;
    __getProtoOf = Object.getPrototypeOf;
    __hasOwnProp = Object.prototype.hasOwnProperty;
    __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
    __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function")
        for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
          key = keys[i];
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp2(to, key, {
              get: ((k) => from[k]).bind(null, key),
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
            });
        }
      return to;
    };
    __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", {
      value: mod,
      enumerable: true
    }) : target, mod));
    require_common = /* @__PURE__ */ __commonJSMin((exports, module) => {
      function isNothing(subject) {
        return typeof subject === "undefined" || subject === null;
      }
      function isObject(subject) {
        return typeof subject === "object" && subject !== null;
      }
      function toArray(sequence) {
        if (Array.isArray(sequence))
          return sequence;
        else if (isNothing(sequence))
          return [];
        return [sequence];
      }
      function extend(target, source) {
        if (source) {
          const sourceKeys = Object.keys(source);
          for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
            const key = sourceKeys[index];
            target[key] = source[key];
          }
        }
        return target;
      }
      function repeat(string, count) {
        let result = "";
        for (let cycle = 0; cycle < count; cycle += 1)
          result += string;
        return result;
      }
      function isNegativeZero(number) {
        return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
      }
      module.exports.isNothing = isNothing;
      module.exports.isObject = isObject;
      module.exports.toArray = toArray;
      module.exports.repeat = repeat;
      module.exports.isNegativeZero = isNegativeZero;
      module.exports.extend = extend;
    });
    require_exception = /* @__PURE__ */ __commonJSMin((exports, module) => {
      function formatError(exception, compact) {
        let where = "";
        const message = exception.reason || "(unknown reason)";
        if (!exception.mark)
          return message;
        if (exception.mark.name)
          where += 'in "' + exception.mark.name + '" ';
        where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
        if (!compact && exception.mark.snippet)
          where += "\n\n" + exception.mark.snippet;
        return message + " " + where;
      }
      function YAMLException2(reason, mark) {
        Error.call(this);
        this.name = "YAMLException";
        this.reason = reason;
        this.mark = mark;
        this.message = formatError(this, false);
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, this.constructor);
        else
          this.stack = (/* @__PURE__ */ new Error()).stack || "";
      }
      YAMLException2.prototype = Object.create(Error.prototype);
      YAMLException2.prototype.constructor = YAMLException2;
      YAMLException2.prototype.toString = function toString(compact) {
        return this.name + ": " + formatError(this, compact);
      };
      module.exports = YAMLException2;
    });
    require_snippet = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var common = require_common();
      function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
        let head = "";
        let tail = "";
        const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
        if (position - lineStart > maxHalfLength) {
          head = " ... ";
          lineStart = position - maxHalfLength + head.length;
        }
        if (lineEnd - position > maxHalfLength) {
          tail = " ...";
          lineEnd = position + maxHalfLength - tail.length;
        }
        return {
          str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
          pos: position - lineStart + head.length
        };
      }
      function padStart(string, max) {
        return common.repeat(" ", max - string.length) + string;
      }
      function makeSnippet(mark, options) {
        options = Object.create(options || null);
        if (!mark.buffer)
          return null;
        if (!options.maxLength)
          options.maxLength = 79;
        if (typeof options.indent !== "number")
          options.indent = 1;
        if (typeof options.linesBefore !== "number")
          options.linesBefore = 3;
        if (typeof options.linesAfter !== "number")
          options.linesAfter = 2;
        const re = /\r?\n|\r|\0/g;
        const lineStarts = [0];
        const lineEnds = [];
        let match;
        let foundLineNo = -1;
        while (match = re.exec(mark.buffer)) {
          lineEnds.push(match.index);
          lineStarts.push(match.index + match[0].length);
          if (mark.position <= match.index && foundLineNo < 0)
            foundLineNo = lineStarts.length - 2;
        }
        if (foundLineNo < 0)
          foundLineNo = lineStarts.length - 1;
        let result = "";
        const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
        const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
        for (let i = 1; i <= options.linesBefore; i++) {
          if (foundLineNo - i < 0)
            break;
          const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
          result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
        }
        const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
        result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
        result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
        for (let i = 1; i <= options.linesAfter; i++) {
          if (foundLineNo + i >= lineEnds.length)
            break;
          const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
          result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
        }
        return result.replace(/\n$/, "");
      }
      module.exports = makeSnippet;
    });
    require_type = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var YAMLException2 = require_exception();
      var TYPE_CONSTRUCTOR_OPTIONS = [
        "kind",
        "multi",
        "resolve",
        "construct",
        "instanceOf",
        "predicate",
        "represent",
        "representName",
        "defaultStyle",
        "styleAliases"
      ];
      var YAML_NODE_KINDS = [
        "scalar",
        "sequence",
        "mapping"
      ];
      function compileStyleAliases(map) {
        const result = {};
        if (map !== null)
          Object.keys(map).forEach(function(style) {
            map[style].forEach(function(alias) {
              result[String(alias)] = style;
            });
          });
        return result;
      }
      function Type2(tag, options) {
        options = options || {};
        Object.keys(options).forEach(function(name) {
          if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1)
            throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        });
        this.options = options;
        this.tag = tag;
        this.kind = options["kind"] || null;
        this.resolve = options["resolve"] || function() {
          return true;
        };
        this.construct = options["construct"] || function(data) {
          return data;
        };
        this.instanceOf = options["instanceOf"] || null;
        this.predicate = options["predicate"] || null;
        this.represent = options["represent"] || null;
        this.representName = options["representName"] || null;
        this.defaultStyle = options["defaultStyle"] || null;
        this.multi = options["multi"] || false;
        this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
        if (YAML_NODE_KINDS.indexOf(this.kind) === -1)
          throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
      module.exports = Type2;
    });
    require_schema = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var YAMLException2 = require_exception();
      var Type2 = require_type();
      function compileList(schema, name) {
        const result = [];
        schema[name].forEach(function(currentType) {
          let newIndex = result.length;
          result.forEach(function(previousType, previousIndex) {
            if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi)
              newIndex = previousIndex;
          });
          result[newIndex] = currentType;
        });
        return result;
      }
      function compileMap() {
        const result = {
          scalar: {},
          sequence: {},
          mapping: {},
          fallback: {},
          multi: {
            scalar: [],
            sequence: [],
            mapping: [],
            fallback: []
          }
        };
        function collectType(type) {
          if (type.multi) {
            result.multi[type.kind].push(type);
            result.multi["fallback"].push(type);
          } else
            result[type.kind][type.tag] = result["fallback"][type.tag] = type;
        }
        for (let index = 0, length = arguments.length; index < length; index += 1)
          arguments[index].forEach(collectType);
        return result;
      }
      function Schema2(definition) {
        return this.extend(definition);
      }
      Schema2.prototype.extend = function extend(definition) {
        let implicit = [];
        let explicit = [];
        if (definition instanceof Type2)
          explicit.push(definition);
        else if (Array.isArray(definition))
          explicit = explicit.concat(definition);
        else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
          if (definition.implicit)
            implicit = implicit.concat(definition.implicit);
          if (definition.explicit)
            explicit = explicit.concat(definition.explicit);
        } else
          throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
        implicit.forEach(function(type) {
          if (!(type instanceof Type2))
            throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
          if (type.loadKind && type.loadKind !== "scalar")
            throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
          if (type.multi)
            throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
        });
        explicit.forEach(function(type) {
          if (!(type instanceof Type2))
            throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        });
        const result = Object.create(Schema2.prototype);
        result.implicit = (this.implicit || []).concat(implicit);
        result.explicit = (this.explicit || []).concat(explicit);
        result.compiledImplicit = compileList(result, "implicit");
        result.compiledExplicit = compileList(result, "explicit");
        result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
        return result;
      };
      module.exports = Schema2;
    });
    require_str = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = new (require_type())("tag:yaml.org,2002:str", {
        kind: "scalar",
        construct: function(data) {
          return data !== null ? data : "";
        }
      });
    });
    require_seq = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = new (require_type())("tag:yaml.org,2002:seq", {
        kind: "sequence",
        construct: function(data) {
          return data !== null ? data : [];
        }
      });
    });
    require_map = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = new (require_type())("tag:yaml.org,2002:map", {
        kind: "mapping",
        construct: function(data) {
          return data !== null ? data : {};
        }
      });
    });
    require_failsafe = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = new (require_schema())({ explicit: [
        require_str(),
        require_seq(),
        require_map()
      ] });
    });
    require_null = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      function resolveYamlNull(data) {
        if (data === null)
          return true;
        const max = data.length;
        return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
      }
      function constructYamlNull() {
        return null;
      }
      function isNull(object) {
        return object === null;
      }
      module.exports = new Type2("tag:yaml.org,2002:null", {
        kind: "scalar",
        resolve: resolveYamlNull,
        construct: constructYamlNull,
        predicate: isNull,
        represent: {
          canonical: function() {
            return "~";
          },
          lowercase: function() {
            return "null";
          },
          uppercase: function() {
            return "NULL";
          },
          camelcase: function() {
            return "Null";
          },
          empty: function() {
            return "";
          }
        },
        defaultStyle: "lowercase"
      });
    });
    require_bool = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      function resolveYamlBoolean(data) {
        if (data === null)
          return false;
        const max = data.length;
        return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
      }
      function constructYamlBoolean(data) {
        return data === "true" || data === "True" || data === "TRUE";
      }
      function isBoolean(object) {
        return Object.prototype.toString.call(object) === "[object Boolean]";
      }
      module.exports = new Type2("tag:yaml.org,2002:bool", {
        kind: "scalar",
        resolve: resolveYamlBoolean,
        construct: constructYamlBoolean,
        predicate: isBoolean,
        represent: {
          lowercase: function(object) {
            return object ? "true" : "false";
          },
          uppercase: function(object) {
            return object ? "TRUE" : "FALSE";
          },
          camelcase: function(object) {
            return object ? "True" : "False";
          }
        },
        defaultStyle: "lowercase"
      });
    });
    require_int = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var common = require_common();
      var Type2 = require_type();
      function isHexCode(c) {
        return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
      }
      function isOctCode(c) {
        return c >= 48 && c <= 55;
      }
      function isDecCode(c) {
        return c >= 48 && c <= 57;
      }
      function resolveYamlInteger(data) {
        if (data === null)
          return false;
        const max = data.length;
        let index = 0;
        let hasDigits = false;
        if (!max)
          return false;
        let ch = data[index];
        if (ch === "-" || ch === "+")
          ch = data[++index];
        if (ch === "0") {
          if (index + 1 === max)
            return true;
          ch = data[++index];
          if (ch === "b") {
            index++;
            for (; index < max; index++) {
              ch = data[index];
              if (ch !== "0" && ch !== "1")
                return false;
              hasDigits = true;
            }
            return hasDigits && Number.isFinite(parseYamlInteger(data));
          }
          if (ch === "x") {
            index++;
            for (; index < max; index++) {
              if (!isHexCode(data.charCodeAt(index)))
                return false;
              hasDigits = true;
            }
            return hasDigits && Number.isFinite(parseYamlInteger(data));
          }
          if (ch === "o") {
            index++;
            for (; index < max; index++) {
              if (!isOctCode(data.charCodeAt(index)))
                return false;
              hasDigits = true;
            }
            return hasDigits && Number.isFinite(parseYamlInteger(data));
          }
        }
        for (; index < max; index++) {
          if (!isDecCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        if (!hasDigits)
          return false;
        return Number.isFinite(parseYamlInteger(data));
      }
      function parseYamlInteger(data) {
        let value = data;
        let sign = 1;
        let ch = value[0];
        if (ch === "-" || ch === "+") {
          if (ch === "-")
            sign = -1;
          value = value.slice(1);
          ch = value[0];
        }
        if (value === "0")
          return 0;
        if (ch === "0") {
          if (value[1] === "b")
            return sign * parseInt(value.slice(2), 2);
          if (value[1] === "x")
            return sign * parseInt(value.slice(2), 16);
          if (value[1] === "o")
            return sign * parseInt(value.slice(2), 8);
        }
        return sign * parseInt(value, 10);
      }
      function constructYamlInteger(data) {
        return parseYamlInteger(data);
      }
      function isInteger(object) {
        return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common.isNegativeZero(object);
      }
      module.exports = new Type2("tag:yaml.org,2002:int", {
        kind: "scalar",
        resolve: resolveYamlInteger,
        construct: constructYamlInteger,
        predicate: isInteger,
        represent: {
          binary: function(obj) {
            return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
          },
          octal: function(obj) {
            return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
          },
          decimal: function(obj) {
            return obj.toString(10);
          },
          hexadecimal: function(obj) {
            return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
          }
        },
        defaultStyle: "decimal",
        styleAliases: {
          binary: [2, "bin"],
          octal: [8, "oct"],
          decimal: [10, "dec"],
          hexadecimal: [16, "hex"]
        }
      });
    });
    require_float = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var common = require_common();
      var Type2 = require_type();
      var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
      var YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
      function resolveYamlFloat(data) {
        if (data === null)
          return false;
        if (!YAML_FLOAT_PATTERN.test(data))
          return false;
        if (Number.isFinite(parseFloat(data, 10)))
          return true;
        return YAML_FLOAT_SPECIAL_PATTERN.test(data);
      }
      function constructYamlFloat(data) {
        let value = data.toLowerCase();
        const sign = value[0] === "-" ? -1 : 1;
        if ("+-".indexOf(value[0]) >= 0)
          value = value.slice(1);
        if (value === ".inf")
          return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        else if (value === ".nan")
          return NaN;
        return sign * parseFloat(value, 10);
      }
      var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
      function representYamlFloat(object, style) {
        if (isNaN(object))
          switch (style) {
            case "lowercase":
              return ".nan";
            case "uppercase":
              return ".NAN";
            case "camelcase":
              return ".NaN";
          }
        else if (Number.POSITIVE_INFINITY === object)
          switch (style) {
            case "lowercase":
              return ".inf";
            case "uppercase":
              return ".INF";
            case "camelcase":
              return ".Inf";
          }
        else if (Number.NEGATIVE_INFINITY === object)
          switch (style) {
            case "lowercase":
              return "-.inf";
            case "uppercase":
              return "-.INF";
            case "camelcase":
              return "-.Inf";
          }
        else if (common.isNegativeZero(object))
          return "-0.0";
        const res = object.toString(10);
        return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
      }
      function isFloat(object) {
        return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
      }
      module.exports = new Type2("tag:yaml.org,2002:float", {
        kind: "scalar",
        resolve: resolveYamlFloat,
        construct: constructYamlFloat,
        predicate: isFloat,
        represent: representYamlFloat,
        defaultStyle: "lowercase"
      });
    });
    require_json = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = require_failsafe().extend({ implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ] });
    });
    require_core = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = require_json();
    });
    require_timestamp = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
      var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
      function resolveYamlTimestamp(data) {
        if (data === null)
          return false;
        if (YAML_DATE_REGEXP.exec(data) !== null)
          return true;
        if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
          return true;
        return false;
      }
      function constructYamlTimestamp(data) {
        let fraction = 0;
        let delta = null;
        let match = YAML_DATE_REGEXP.exec(data);
        if (match === null)
          match = YAML_TIMESTAMP_REGEXP.exec(data);
        if (match === null)
          throw new Error("Date resolve error");
        const year = +match[1];
        const month = +match[2] - 1;
        const day = +match[3];
        if (!match[4])
          return new Date(Date.UTC(year, month, day));
        const hour = +match[4];
        const minute = +match[5];
        const second = +match[6];
        if (match[7]) {
          fraction = match[7].slice(0, 3);
          while (fraction.length < 3)
            fraction += "0";
          fraction = +fraction;
        }
        if (match[9]) {
          const tzHour = +match[10];
          const tzMinute = +(match[11] || 0);
          delta = (tzHour * 60 + tzMinute) * 6e4;
          if (match[9] === "-")
            delta = -delta;
        }
        const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
        if (delta)
          date.setTime(date.getTime() - delta);
        return date;
      }
      function representYamlTimestamp(object) {
        return object.toISOString();
      }
      module.exports = new Type2("tag:yaml.org,2002:timestamp", {
        kind: "scalar",
        resolve: resolveYamlTimestamp,
        construct: constructYamlTimestamp,
        instanceOf: Date,
        represent: representYamlTimestamp
      });
    });
    require_merge = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      function resolveYamlMerge(data) {
        return data === "<<" || data === null;
      }
      module.exports = new Type2("tag:yaml.org,2002:merge", {
        kind: "scalar",
        resolve: resolveYamlMerge
      });
    });
    require_binary = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
      function resolveYamlBinary(data) {
        if (data === null)
          return false;
        let bitlen = 0;
        const max = data.length;
        const map = BASE64_MAP;
        for (let idx = 0; idx < max; idx++) {
          const code = map.indexOf(data.charAt(idx));
          if (code > 64)
            continue;
          if (code < 0)
            return false;
          bitlen += 6;
        }
        return bitlen % 8 === 0;
      }
      function constructYamlBinary(data) {
        const input = data.replace(/[\r\n=]/g, "");
        const max = input.length;
        const map = BASE64_MAP;
        let bits = 0;
        const result = [];
        for (let idx = 0; idx < max; idx++) {
          if (idx % 4 === 0 && idx) {
            result.push(bits >> 16 & 255);
            result.push(bits >> 8 & 255);
            result.push(bits & 255);
          }
          bits = bits << 6 | map.indexOf(input.charAt(idx));
        }
        const tailbits = max % 4 * 6;
        if (tailbits === 0) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        } else if (tailbits === 18) {
          result.push(bits >> 10 & 255);
          result.push(bits >> 2 & 255);
        } else if (tailbits === 12)
          result.push(bits >> 4 & 255);
        return new Uint8Array(result);
      }
      function representYamlBinary(object) {
        let result = "";
        let bits = 0;
        const max = object.length;
        const map = BASE64_MAP;
        for (let idx = 0; idx < max; idx++) {
          if (idx % 3 === 0 && idx) {
            result += map[bits >> 18 & 63];
            result += map[bits >> 12 & 63];
            result += map[bits >> 6 & 63];
            result += map[bits & 63];
          }
          bits = (bits << 8) + object[idx];
        }
        const tail = max % 3;
        if (tail === 0) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        } else if (tail === 2) {
          result += map[bits >> 10 & 63];
          result += map[bits >> 4 & 63];
          result += map[bits << 2 & 63];
          result += map[64];
        } else if (tail === 1) {
          result += map[bits >> 2 & 63];
          result += map[bits << 4 & 63];
          result += map[64];
          result += map[64];
        }
        return result;
      }
      function isBinary(obj) {
        return Object.prototype.toString.call(obj) === "[object Uint8Array]";
      }
      module.exports = new Type2("tag:yaml.org,2002:binary", {
        kind: "scalar",
        resolve: resolveYamlBinary,
        construct: constructYamlBinary,
        predicate: isBinary,
        represent: representYamlBinary
      });
    });
    require_omap = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      var _hasOwnProperty = Object.prototype.hasOwnProperty;
      var _toString = Object.prototype.toString;
      function resolveYamlOmap(data) {
        if (data === null)
          return true;
        const objectKeys = [];
        const object = data;
        for (let index = 0, length = object.length; index < length; index += 1) {
          const pair = object[index];
          let pairHasKey = false;
          if (_toString.call(pair) !== "[object Object]")
            return false;
          let pairKey;
          for (pairKey in pair)
            if (_hasOwnProperty.call(pair, pairKey))
              if (!pairHasKey)
                pairHasKey = true;
              else
                return false;
          if (!pairHasKey)
            return false;
          if (objectKeys.indexOf(pairKey) === -1)
            objectKeys.push(pairKey);
          else
            return false;
        }
        return true;
      }
      function constructYamlOmap(data) {
        return data !== null ? data : [];
      }
      module.exports = new Type2("tag:yaml.org,2002:omap", {
        kind: "sequence",
        resolve: resolveYamlOmap,
        construct: constructYamlOmap
      });
    });
    require_pairs = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      var _toString = Object.prototype.toString;
      function resolveYamlPairs(data) {
        if (data === null)
          return true;
        const object = data;
        const result = new Array(object.length);
        for (let index = 0, length = object.length; index < length; index += 1) {
          const pair = object[index];
          if (_toString.call(pair) !== "[object Object]")
            return false;
          const keys = Object.keys(pair);
          if (keys.length !== 1)
            return false;
          result[index] = [keys[0], pair[keys[0]]];
        }
        return true;
      }
      function constructYamlPairs(data) {
        if (data === null)
          return [];
        const object = data;
        const result = new Array(object.length);
        for (let index = 0, length = object.length; index < length; index += 1) {
          const pair = object[index];
          const keys = Object.keys(pair);
          result[index] = [keys[0], pair[keys[0]]];
        }
        return result;
      }
      module.exports = new Type2("tag:yaml.org,2002:pairs", {
        kind: "sequence",
        resolve: resolveYamlPairs,
        construct: constructYamlPairs
      });
    });
    require_set = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var Type2 = require_type();
      var _hasOwnProperty = Object.prototype.hasOwnProperty;
      function resolveYamlSet(data) {
        if (data === null)
          return true;
        const object = data;
        for (const key in object)
          if (_hasOwnProperty.call(object, key)) {
            if (object[key] !== null)
              return false;
          }
        return true;
      }
      function constructYamlSet(data) {
        return data !== null ? data : {};
      }
      module.exports = new Type2("tag:yaml.org,2002:set", {
        kind: "mapping",
        resolve: resolveYamlSet,
        construct: constructYamlSet
      });
    });
    require_default = /* @__PURE__ */ __commonJSMin((exports, module) => {
      module.exports = require_core().extend({
        implicit: [require_timestamp(), require_merge()],
        explicit: [
          require_binary(),
          require_omap(),
          require_pairs(),
          require_set()
        ]
      });
    });
    require_loader = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var common = require_common();
      var YAMLException2 = require_exception();
      var makeSnippet = require_snippet();
      var DEFAULT_SCHEMA2 = require_default();
      var _hasOwnProperty = Object.prototype.hasOwnProperty;
      var CONTEXT_FLOW_IN = 1;
      var CONTEXT_FLOW_OUT = 2;
      var CONTEXT_BLOCK_IN = 3;
      var CONTEXT_BLOCK_OUT = 4;
      var CHOMPING_CLIP = 1;
      var CHOMPING_STRIP = 2;
      var CHOMPING_KEEP = 3;
      var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
      var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
      var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
      var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
      var PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
      function _class(obj) {
        return Object.prototype.toString.call(obj);
      }
      function isEol(c) {
        return c === 10 || c === 13;
      }
      function isWhiteSpace(c) {
        return c === 9 || c === 32;
      }
      function isWsOrEol(c) {
        return c === 9 || c === 32 || c === 10 || c === 13;
      }
      function isFlowIndicator(c) {
        return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
      }
      function fromHexCode(c) {
        if (c >= 48 && c <= 57)
          return c - 48;
        const lc = c | 32;
        if (lc >= 97 && lc <= 102)
          return lc - 97 + 10;
        return -1;
      }
      function escapedHexLen(c) {
        if (c === 120)
          return 2;
        if (c === 117)
          return 4;
        if (c === 85)
          return 8;
        return 0;
      }
      function fromDecimalCode(c) {
        if (c >= 48 && c <= 57)
          return c - 48;
        return -1;
      }
      function simpleEscapeSequence(c) {
        switch (c) {
          case 48:
            return "\0";
          case 97:
            return "\x07";
          case 98:
            return "\b";
          case 116:
            return "	";
          case 9:
            return "	";
          case 110:
            return "\n";
          case 118:
            return "\v";
          case 102:
            return "\f";
          case 114:
            return "\r";
          case 101:
            return "\x1B";
          case 32:
            return " ";
          case 34:
            return '"';
          case 47:
            return "/";
          case 92:
            return "\\";
          case 78:
            return "\x85";
          case 95:
            return "\xA0";
          case 76:
            return "\u2028";
          case 80:
            return "\u2029";
          default:
            return "";
        }
      }
      function charFromCodepoint(c) {
        if (c <= 65535)
          return String.fromCharCode(c);
        return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
      }
      function setProperty(object, key, value) {
        if (key === "__proto__")
          Object.defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value
          });
        else
          object[key] = value;
      }
      var simpleEscapeCheck = new Array(256);
      var simpleEscapeMap = new Array(256);
      for (let i = 0; i < 256; i++) {
        simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
        simpleEscapeMap[i] = simpleEscapeSequence(i);
      }
      function State(input, options) {
        this.input = input;
        this.filename = options["filename"] || null;
        this.schema = options["schema"] || DEFAULT_SCHEMA2;
        this.onWarning = options["onWarning"] || null;
        this.legacy = options["legacy"] || false;
        this.json = options["json"] || false;
        this.listener = options["listener"] || null;
        this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
        this.maxMergeSeqLength = typeof options["maxMergeSeqLength"] === "number" ? options["maxMergeSeqLength"] : 20;
        this.implicitTypes = this.schema.compiledImplicit;
        this.typeMap = this.schema.compiledTypeMap;
        this.length = input.length;
        this.position = 0;
        this.line = 0;
        this.lineStart = 0;
        this.lineIndent = 0;
        this.depth = 0;
        this.firstTabInLine = -1;
        this.documents = [];
        this.anchorMapTransactions = [];
      }
      function generateError(state, message) {
        const mark = {
          name: state.filename,
          buffer: state.input.slice(0, -1),
          position: state.position,
          line: state.line,
          column: state.position - state.lineStart
        };
        mark.snippet = makeSnippet(mark);
        return new YAMLException2(message, mark);
      }
      function throwError(state, message) {
        throw generateError(state, message);
      }
      function throwWarning(state, message) {
        if (state.onWarning)
          state.onWarning.call(null, generateError(state, message));
      }
      function storeAnchor(state, name, value) {
        const transactions = state.anchorMapTransactions;
        if (transactions.length !== 0) {
          const transaction = transactions[transactions.length - 1];
          if (!_hasOwnProperty.call(transaction, name))
            transaction[name] = {
              existed: _hasOwnProperty.call(state.anchorMap, name),
              value: state.anchorMap[name]
            };
        }
        state.anchorMap[name] = value;
      }
      function beginAnchorTransaction(state) {
        state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
      }
      function commitAnchorTransaction(state) {
        const transaction = state.anchorMapTransactions.pop();
        const transactions = state.anchorMapTransactions;
        if (transactions.length === 0)
          return;
        const parent = transactions[transactions.length - 1];
        const names = Object.keys(transaction);
        for (let index = 0, length = names.length; index < length; index += 1) {
          const name = names[index];
          if (!_hasOwnProperty.call(parent, name))
            parent[name] = transaction[name];
        }
      }
      function rollbackAnchorTransaction(state) {
        const transaction = state.anchorMapTransactions.pop();
        const names = Object.keys(transaction);
        for (let index = names.length - 1; index >= 0; index -= 1) {
          const entry = transaction[names[index]];
          if (entry.existed)
            state.anchorMap[names[index]] = entry.value;
          else
            delete state.anchorMap[names[index]];
        }
      }
      function snapshotState(state) {
        return {
          position: state.position,
          line: state.line,
          lineStart: state.lineStart,
          lineIndent: state.lineIndent,
          firstTabInLine: state.firstTabInLine,
          tag: state.tag,
          anchor: state.anchor,
          kind: state.kind,
          result: state.result
        };
      }
      function restoreState(state, snapshot) {
        state.position = snapshot.position;
        state.line = snapshot.line;
        state.lineStart = snapshot.lineStart;
        state.lineIndent = snapshot.lineIndent;
        state.firstTabInLine = snapshot.firstTabInLine;
        state.tag = snapshot.tag;
        state.anchor = snapshot.anchor;
        state.kind = snapshot.kind;
        state.result = snapshot.result;
      }
      var directiveHandlers = {
        YAML: function handleYamlDirective(state, name, args) {
          if (state.version !== null)
            throwError(state, "duplication of %YAML directive");
          if (args.length !== 1)
            throwError(state, "YAML directive accepts exactly one argument");
          const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
          if (match === null)
            throwError(state, "ill-formed argument of the YAML directive");
          const major = parseInt(match[1], 10);
          const minor = parseInt(match[2], 10);
          if (major !== 1)
            throwError(state, "unacceptable YAML version of the document");
          state.version = args[0];
          state.checkLineBreaks = minor < 2;
          if (minor !== 1 && minor !== 2)
            throwWarning(state, "unsupported YAML version of the document");
        },
        TAG: function handleTagDirective(state, name, args) {
          let prefix;
          if (args.length !== 2)
            throwError(state, "TAG directive accepts exactly two arguments");
          const handle = args[0];
          prefix = args[1];
          if (!PATTERN_TAG_HANDLE.test(handle))
            throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
          if (_hasOwnProperty.call(state.tagMap, handle))
            throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
          if (!PATTERN_TAG_URI.test(prefix))
            throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
          try {
            prefix = decodeURIComponent(prefix);
          } catch (err) {
            throwError(state, "tag prefix is malformed: " + prefix);
          }
          state.tagMap[handle] = prefix;
        }
      };
      function captureSegment(state, start, end, checkJson) {
        if (start < end) {
          const _result = state.input.slice(start, end);
          if (checkJson)
            for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
              const _character = _result.charCodeAt(_position);
              if (!(_character === 9 || _character >= 32 && _character <= 1114111))
                throwError(state, "expected valid JSON character");
            }
          else if (PATTERN_NON_PRINTABLE.test(_result))
            throwError(state, "the stream contains non-printable characters");
          state.result += _result;
        }
      }
      function mergeMappings(state, destination, source, overridableKeys) {
        if (!common.isObject(source))
          throwError(state, "cannot merge mappings; the provided source object is unacceptable");
        const sourceKeys = Object.keys(source);
        for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
          const key = sourceKeys[index];
          if (!_hasOwnProperty.call(destination, key)) {
            setProperty(destination, key, source[key]);
            overridableKeys[key] = true;
          }
        }
      }
      function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
        if (Array.isArray(keyNode)) {
          keyNode = Array.prototype.slice.call(keyNode);
          for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
            if (Array.isArray(keyNode[index]))
              throwError(state, "nested arrays are not supported inside keys");
            if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]")
              keyNode[index] = "[object Object]";
          }
        }
        if (typeof keyNode === "object" && _class(keyNode) === "[object Object]")
          keyNode = "[object Object]";
        keyNode = String(keyNode);
        if (_result === null)
          _result = {};
        if (keyTag === "tag:yaml.org,2002:merge")
          if (Array.isArray(valueNode)) {
            if (valueNode.length > state.maxMergeSeqLength)
              throwError(state, "merge sequence length exceeded maxMergeSeqLength (" + state.maxMergeSeqLength + ")");
            const seen = /* @__PURE__ */ new Set();
            for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
              const src = valueNode[index];
              if (seen.has(src))
                continue;
              seen.add(src);
              mergeMappings(state, _result, src, overridableKeys);
            }
          } else
            mergeMappings(state, _result, valueNode, overridableKeys);
        else {
          if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
            state.line = startLine || state.line;
            state.lineStart = startLineStart || state.lineStart;
            state.position = startPos || state.position;
            throwError(state, "duplicated mapping key");
          }
          setProperty(_result, keyNode, valueNode);
          delete overridableKeys[keyNode];
        }
        return _result;
      }
      function readLineBreak(state) {
        const ch = state.input.charCodeAt(state.position);
        if (ch === 10)
          state.position++;
        else if (ch === 13) {
          state.position++;
          if (state.input.charCodeAt(state.position) === 10)
            state.position++;
        } else
          throwError(state, "a line break is expected");
        state.line += 1;
        state.lineStart = state.position;
        state.firstTabInLine = -1;
      }
      function skipSeparationSpace(state, allowComments, checkIndent) {
        let lineBreaks = 0;
        let ch = state.input.charCodeAt(state.position);
        while (ch !== 0) {
          while (isWhiteSpace(ch)) {
            if (ch === 9 && state.firstTabInLine === -1)
              state.firstTabInLine = state.position;
            ch = state.input.charCodeAt(++state.position);
          }
          if (allowComments && ch === 35)
            do
              ch = state.input.charCodeAt(++state.position);
            while (ch !== 10 && ch !== 13 && ch !== 0);
          if (isEol(ch)) {
            readLineBreak(state);
            ch = state.input.charCodeAt(state.position);
            lineBreaks++;
            state.lineIndent = 0;
            while (ch === 32) {
              state.lineIndent++;
              ch = state.input.charCodeAt(++state.position);
            }
          } else
            break;
        }
        if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent)
          throwWarning(state, "deficient indentation");
        return lineBreaks;
      }
      function testDocumentSeparator(state) {
        let _position = state.position;
        let ch = state.input.charCodeAt(_position);
        if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
          _position += 3;
          ch = state.input.charCodeAt(_position);
          if (ch === 0 || isWsOrEol(ch))
            return true;
        }
        return false;
      }
      function writeFoldedLines(state, count) {
        if (count === 1)
          state.result += " ";
        else if (count > 1)
          state.result += common.repeat("\n", count - 1);
      }
      function readPlainScalar(state, nodeIndent, withinFlowCollection) {
        let captureStart;
        let captureEnd;
        let hasPendingContent;
        let _line;
        let _lineStart;
        let _lineIndent;
        const _kind = state.kind;
        const _result = state.result;
        let ch = state.input.charCodeAt(state.position);
        if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96)
          return false;
        if (ch === 63 || ch === 45) {
          const following = state.input.charCodeAt(state.position + 1);
          if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following))
            return false;
        }
        state.kind = "scalar";
        state.result = "";
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
        while (ch !== 0) {
          if (ch === 58) {
            const following = state.input.charCodeAt(state.position + 1);
            if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following))
              break;
          } else if (ch === 35) {
            if (isWsOrEol(state.input.charCodeAt(state.position - 1)))
              break;
          } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch))
            break;
          else if (isEol(ch)) {
            _line = state.line;
            _lineStart = state.lineStart;
            _lineIndent = state.lineIndent;
            skipSeparationSpace(state, false, -1);
            if (state.lineIndent >= nodeIndent) {
              hasPendingContent = true;
              ch = state.input.charCodeAt(state.position);
              continue;
            } else {
              state.position = captureEnd;
              state.line = _line;
              state.lineStart = _lineStart;
              state.lineIndent = _lineIndent;
              break;
            }
          }
          if (hasPendingContent) {
            captureSegment(state, captureStart, captureEnd, false);
            writeFoldedLines(state, state.line - _line);
            captureStart = captureEnd = state.position;
            hasPendingContent = false;
          }
          if (!isWhiteSpace(ch))
            captureEnd = state.position + 1;
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, captureEnd, false);
        if (state.result)
          return true;
        state.kind = _kind;
        state.result = _result;
        return false;
      }
      function readSingleQuotedScalar(state, nodeIndent) {
        let captureStart;
        let captureEnd;
        let ch = state.input.charCodeAt(state.position);
        if (ch !== 39)
          return false;
        state.kind = "scalar";
        state.result = "";
        state.position++;
        captureStart = captureEnd = state.position;
        while ((ch = state.input.charCodeAt(state.position)) !== 0)
          if (ch === 39) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);
            if (ch === 39) {
              captureStart = state.position;
              state.position++;
              captureEnd = state.position;
            } else
              return true;
          } else if (isEol(ch)) {
            captureSegment(state, captureStart, captureEnd, true);
            writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
            captureStart = captureEnd = state.position;
          } else if (state.position === state.lineStart && testDocumentSeparator(state))
            throwError(state, "unexpected end of the document within a single quoted scalar");
          else {
            state.position++;
            if (!isWhiteSpace(ch))
              captureEnd = state.position;
          }
        throwError(state, "unexpected end of the stream within a single quoted scalar");
      }
      function readDoubleQuotedScalar(state, nodeIndent) {
        let captureStart;
        let captureEnd;
        let tmp;
        let ch = state.input.charCodeAt(state.position);
        if (ch !== 34)
          return false;
        state.kind = "scalar";
        state.result = "";
        state.position++;
        captureStart = captureEnd = state.position;
        while ((ch = state.input.charCodeAt(state.position)) !== 0)
          if (ch === 34) {
            captureSegment(state, captureStart, state.position, true);
            state.position++;
            return true;
          } else if (ch === 92) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);
            if (isEol(ch))
              skipSeparationSpace(state, false, nodeIndent);
            else if (ch < 256 && simpleEscapeCheck[ch]) {
              state.result += simpleEscapeMap[ch];
              state.position++;
            } else if ((tmp = escapedHexLen(ch)) > 0) {
              let hexLength = tmp;
              let hexResult = 0;
              for (; hexLength > 0; hexLength--) {
                ch = state.input.charCodeAt(++state.position);
                if ((tmp = fromHexCode(ch)) >= 0)
                  hexResult = (hexResult << 4) + tmp;
                else
                  throwError(state, "expected hexadecimal character");
              }
              state.result += charFromCodepoint(hexResult);
              state.position++;
            } else
              throwError(state, "unknown escape sequence");
            captureStart = captureEnd = state.position;
          } else if (isEol(ch)) {
            captureSegment(state, captureStart, captureEnd, true);
            writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
            captureStart = captureEnd = state.position;
          } else if (state.position === state.lineStart && testDocumentSeparator(state))
            throwError(state, "unexpected end of the document within a double quoted scalar");
          else {
            state.position++;
            if (!isWhiteSpace(ch))
              captureEnd = state.position;
          }
        throwError(state, "unexpected end of the stream within a double quoted scalar");
      }
      function readFlowCollection(state, nodeIndent) {
        let readNext = true;
        let _line;
        let _lineStart;
        let _pos;
        const _tag = state.tag;
        let _result;
        const _anchor = state.anchor;
        let terminator;
        let isPair;
        let isExplicitPair;
        let isMapping;
        const overridableKeys = /* @__PURE__ */ Object.create(null);
        let keyNode;
        let keyTag;
        let valueNode;
        let ch = state.input.charCodeAt(state.position);
        if (ch === 91) {
          terminator = 93;
          isMapping = false;
          _result = [];
        } else if (ch === 123) {
          terminator = 125;
          isMapping = true;
          _result = {};
        } else
          return false;
        if (state.anchor !== null)
          storeAnchor(state, state.anchor, _result);
        ch = state.input.charCodeAt(++state.position);
        while (ch !== 0) {
          skipSeparationSpace(state, true, nodeIndent);
          ch = state.input.charCodeAt(state.position);
          if (ch === terminator) {
            state.position++;
            state.tag = _tag;
            state.anchor = _anchor;
            state.kind = isMapping ? "mapping" : "sequence";
            state.result = _result;
            return true;
          } else if (!readNext)
            throwError(state, "missed comma between flow collection entries");
          else if (ch === 44)
            throwError(state, "expected the node content, but found ','");
          keyTag = keyNode = valueNode = null;
          isPair = isExplicitPair = false;
          if (ch === 63) {
            if (isWsOrEol(state.input.charCodeAt(state.position + 1))) {
              isPair = isExplicitPair = true;
              state.position++;
              skipSeparationSpace(state, true, nodeIndent);
            }
          }
          _line = state.line;
          _lineStart = state.lineStart;
          _pos = state.position;
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          keyTag = state.tag;
          keyNode = state.result;
          skipSeparationSpace(state, true, nodeIndent);
          ch = state.input.charCodeAt(state.position);
          if ((isExplicitPair || state.line === _line) && ch === 58) {
            isPair = true;
            ch = state.input.charCodeAt(++state.position);
            skipSeparationSpace(state, true, nodeIndent);
            composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
            valueNode = state.result;
          }
          if (isMapping)
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
          else if (isPair)
            _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
          else
            _result.push(keyNode);
          skipSeparationSpace(state, true, nodeIndent);
          ch = state.input.charCodeAt(state.position);
          if (ch === 44) {
            readNext = true;
            ch = state.input.charCodeAt(++state.position);
          } else
            readNext = false;
        }
        throwError(state, "unexpected end of the stream within a flow collection");
      }
      function readBlockScalar(state, nodeIndent) {
        let folding;
        let chomping = CHOMPING_CLIP;
        let didReadContent = false;
        let detectedIndent = false;
        let textIndent = nodeIndent;
        let emptyLines = 0;
        let atMoreIndented = false;
        let tmp;
        let ch = state.input.charCodeAt(state.position);
        if (ch === 124)
          folding = false;
        else if (ch === 62)
          folding = true;
        else
          return false;
        state.kind = "scalar";
        state.result = "";
        while (ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
          if (ch === 43 || ch === 45)
            if (CHOMPING_CLIP === chomping)
              chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
            else
              throwError(state, "repeat of a chomping mode identifier");
          else if ((tmp = fromDecimalCode(ch)) >= 0)
            if (tmp === 0)
              throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
            else if (!detectedIndent) {
              textIndent = nodeIndent + tmp - 1;
              detectedIndent = true;
            } else
              throwError(state, "repeat of an indentation width identifier");
          else
            break;
        }
        if (isWhiteSpace(ch)) {
          do
            ch = state.input.charCodeAt(++state.position);
          while (isWhiteSpace(ch));
          if (ch === 35)
            do
              ch = state.input.charCodeAt(++state.position);
            while (!isEol(ch) && ch !== 0);
        }
        while (ch !== 0) {
          readLineBreak(state);
          state.lineIndent = 0;
          ch = state.input.charCodeAt(state.position);
          while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
          if (!detectedIndent && state.lineIndent > textIndent)
            textIndent = state.lineIndent;
          if (isEol(ch)) {
            emptyLines++;
            continue;
          }
          if (!detectedIndent && textIndent === 0)
            throwError(state, "missing indentation for block scalar");
          if (state.lineIndent < textIndent) {
            if (chomping === CHOMPING_KEEP)
              state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
            else if (chomping === CHOMPING_CLIP) {
              if (didReadContent)
                state.result += "\n";
            }
            break;
          }
          if (folding)
            if (isWhiteSpace(ch)) {
              atMoreIndented = true;
              state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
            } else if (atMoreIndented) {
              atMoreIndented = false;
              state.result += common.repeat("\n", emptyLines + 1);
            } else if (emptyLines === 0) {
              if (didReadContent)
                state.result += " ";
            } else
              state.result += common.repeat("\n", emptyLines);
          else
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          didReadContent = true;
          detectedIndent = true;
          emptyLines = 0;
          const captureStart = state.position;
          while (!isEol(ch) && ch !== 0)
            ch = state.input.charCodeAt(++state.position);
          captureSegment(state, captureStart, state.position, false);
        }
        return true;
      }
      function readBlockSequence(state, nodeIndent) {
        const _tag = state.tag;
        const _anchor = state.anchor;
        const _result = [];
        let detected = false;
        if (state.firstTabInLine !== -1)
          return false;
        if (state.anchor !== null)
          storeAnchor(state, state.anchor, _result);
        let ch = state.input.charCodeAt(state.position);
        while (ch !== 0) {
          if (state.firstTabInLine !== -1) {
            state.position = state.firstTabInLine;
            throwError(state, "tab characters must not be used in indentation");
          }
          if (ch !== 45)
            break;
          if (!isWsOrEol(state.input.charCodeAt(state.position + 1)))
            break;
          detected = true;
          state.position++;
          if (skipSeparationSpace(state, true, -1)) {
            if (state.lineIndent <= nodeIndent) {
              _result.push(null);
              ch = state.input.charCodeAt(state.position);
              continue;
            }
          }
          const _line = state.line;
          composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
          _result.push(state.result);
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
          if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0)
            throwError(state, "bad indentation of a sequence entry");
          else if (state.lineIndent < nodeIndent)
            break;
        }
        if (detected) {
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = "sequence";
          state.result = _result;
          return true;
        }
        return false;
      }
      function readBlockMapping(state, nodeIndent, flowIndent) {
        let allowCompact;
        let _keyLine;
        let _keyLineStart;
        let _keyPos;
        const _tag = state.tag;
        const _anchor = state.anchor;
        const _result = {};
        const overridableKeys = /* @__PURE__ */ Object.create(null);
        let keyTag = null;
        let keyNode = null;
        let valueNode = null;
        let atExplicitKey = false;
        let detected = false;
        if (state.firstTabInLine !== -1)
          return false;
        if (state.anchor !== null)
          storeAnchor(state, state.anchor, _result);
        let ch = state.input.charCodeAt(state.position);
        while (ch !== 0) {
          if (!atExplicitKey && state.firstTabInLine !== -1) {
            state.position = state.firstTabInLine;
            throwError(state, "tab characters must not be used in indentation");
          }
          const following = state.input.charCodeAt(state.position + 1);
          const _line = state.line;
          if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
            if (ch === 63) {
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = true;
              allowCompact = true;
            } else if (atExplicitKey) {
              atExplicitKey = false;
              allowCompact = true;
            } else
              throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
            state.position += 1;
            ch = following;
          } else {
            _keyLine = state.line;
            _keyLineStart = state.lineStart;
            _keyPos = state.position;
            if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true))
              break;
            if (state.line === _line) {
              ch = state.input.charCodeAt(state.position);
              while (isWhiteSpace(ch))
                ch = state.input.charCodeAt(++state.position);
              if (ch === 58) {
                ch = state.input.charCodeAt(++state.position);
                if (!isWsOrEol(ch))
                  throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
                if (atExplicitKey) {
                  storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                  keyTag = keyNode = valueNode = null;
                }
                detected = true;
                atExplicitKey = false;
                allowCompact = false;
                keyTag = state.tag;
                keyNode = state.result;
              } else if (detected)
                throwError(state, "can not read an implicit mapping pair; a colon is missed");
              else {
                state.tag = _tag;
                state.anchor = _anchor;
                return true;
              }
            } else if (detected)
              throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
            else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          }
          if (state.line === _line || state.lineIndent > nodeIndent) {
            if (atExplicitKey) {
              _keyLine = state.line;
              _keyLineStart = state.lineStart;
              _keyPos = state.position;
            }
            if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact))
              if (atExplicitKey)
                keyNode = state.result;
              else
                valueNode = state.result;
            if (!atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            skipSeparationSpace(state, true, -1);
            ch = state.input.charCodeAt(state.position);
          }
          if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0)
            throwError(state, "bad indentation of a mapping entry");
          else if (state.lineIndent < nodeIndent)
            break;
        }
        if (atExplicitKey)
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
        if (detected) {
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = "mapping";
          state.result = _result;
        }
        return detected;
      }
      function readTagProperty(state) {
        let isVerbatim = false;
        let isNamed = false;
        let tagHandle;
        let tagName;
        let ch = state.input.charCodeAt(state.position);
        if (ch !== 33)
          return false;
        if (state.tag !== null)
          throwError(state, "duplication of a tag property");
        ch = state.input.charCodeAt(++state.position);
        if (ch === 60) {
          isVerbatim = true;
          ch = state.input.charCodeAt(++state.position);
        } else if (ch === 33) {
          isNamed = true;
          tagHandle = "!!";
          ch = state.input.charCodeAt(++state.position);
        } else
          tagHandle = "!";
        let _position = state.position;
        if (isVerbatim) {
          do
            ch = state.input.charCodeAt(++state.position);
          while (ch !== 0 && ch !== 62);
          if (state.position < state.length) {
            tagName = state.input.slice(_position, state.position);
            ch = state.input.charCodeAt(++state.position);
          } else
            throwError(state, "unexpected end of the stream within a verbatim tag");
        } else {
          while (ch !== 0 && !isWsOrEol(ch)) {
            if (ch === 33)
              if (!isNamed) {
                tagHandle = state.input.slice(_position - 1, state.position + 1);
                if (!PATTERN_TAG_HANDLE.test(tagHandle))
                  throwError(state, "named tag handle cannot contain such characters");
                isNamed = true;
                _position = state.position + 1;
              } else
                throwError(state, "tag suffix cannot contain exclamation marks");
            ch = state.input.charCodeAt(++state.position);
          }
          tagName = state.input.slice(_position, state.position);
          if (PATTERN_FLOW_INDICATORS.test(tagName))
            throwError(state, "tag suffix cannot contain flow indicator characters");
        }
        if (tagName && !PATTERN_TAG_URI.test(tagName))
          throwError(state, "tag name cannot contain such characters: " + tagName);
        try {
          tagName = decodeURIComponent(tagName);
        } catch (err) {
          throwError(state, "tag name is malformed: " + tagName);
        }
        if (isVerbatim)
          state.tag = tagName;
        else if (_hasOwnProperty.call(state.tagMap, tagHandle))
          state.tag = state.tagMap[tagHandle] + tagName;
        else if (tagHandle === "!")
          state.tag = "!" + tagName;
        else if (tagHandle === "!!")
          state.tag = "tag:yaml.org,2002:" + tagName;
        else
          throwError(state, 'undeclared tag handle "' + tagHandle + '"');
        return true;
      }
      function readAnchorProperty(state) {
        let ch = state.input.charCodeAt(state.position);
        if (ch !== 38)
          return false;
        if (state.anchor !== null)
          throwError(state, "duplication of an anchor property");
        ch = state.input.charCodeAt(++state.position);
        const _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch))
          ch = state.input.charCodeAt(++state.position);
        if (state.position === _position)
          throwError(state, "name of an anchor node must contain at least one character");
        state.anchor = state.input.slice(_position, state.position);
        return true;
      }
      function readAlias(state) {
        let ch = state.input.charCodeAt(state.position);
        if (ch !== 42)
          return false;
        ch = state.input.charCodeAt(++state.position);
        const _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch))
          ch = state.input.charCodeAt(++state.position);
        if (state.position === _position)
          throwError(state, "name of an alias node must contain at least one character");
        const alias = state.input.slice(_position, state.position);
        if (!_hasOwnProperty.call(state.anchorMap, alias))
          throwError(state, 'unidentified alias "' + alias + '"');
        state.result = state.anchorMap[alias];
        skipSeparationSpace(state, true, -1);
        return true;
      }
      function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
        const fallbackState = snapshotState(state);
        beginAnchorTransaction(state);
        restoreState(state, propertyStart);
        state.tag = null;
        state.anchor = null;
        state.kind = null;
        state.result = null;
        if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
          commitAnchorTransaction(state);
          return true;
        }
        rollbackAnchorTransaction(state);
        restoreState(state, fallbackState);
        return false;
      }
      function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
        let allowBlockScalars;
        let allowBlockCollections;
        let indentStatus = 1;
        let atNewLine = false;
        let hasContent = false;
        let propertyStart = null;
        let type;
        let flowIndent;
        let blockIndent;
        if (state.depth >= state.maxDepth)
          throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
        state.depth += 1;
        if (state.listener !== null)
          state.listener("open", state);
        state.tag = null;
        state.anchor = null;
        state.kind = null;
        state.result = null;
        const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
        if (allowToSeek) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            if (state.lineIndent > parentIndent)
              indentStatus = 1;
            else if (state.lineIndent === parentIndent)
              indentStatus = 0;
            else if (state.lineIndent < parentIndent)
              indentStatus = -1;
          }
        }
        if (indentStatus === 1)
          while (true) {
            const ch = state.input.charCodeAt(state.position);
            const propertyState = snapshotState(state);
            if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null))
              break;
            if (!readTagProperty(state) && !readAnchorProperty(state))
              break;
            if (propertyStart === null)
              propertyStart = propertyState;
            if (skipSeparationSpace(state, true, -1)) {
              atNewLine = true;
              allowBlockCollections = allowBlockStyles;
              if (state.lineIndent > parentIndent)
                indentStatus = 1;
              else if (state.lineIndent === parentIndent)
                indentStatus = 0;
              else if (state.lineIndent < parentIndent)
                indentStatus = -1;
            } else
              allowBlockCollections = false;
          }
        if (allowBlockCollections)
          allowBlockCollections = atNewLine || allowCompact;
        if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
          if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext)
            flowIndent = parentIndent;
          else
            flowIndent = parentIndent + 1;
          blockIndent = state.position - state.lineStart;
          if (indentStatus === 1)
            if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent))
              hasContent = true;
            else {
              const ch = state.input.charCodeAt(state.position);
              if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent))
                hasContent = true;
              else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent))
                hasContent = true;
              else if (readAlias(state)) {
                hasContent = true;
                if (state.tag !== null || state.anchor !== null)
                  throwError(state, "alias node should not have any properties");
              } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
                hasContent = true;
                if (state.tag === null)
                  state.tag = "?";
              }
              if (state.anchor !== null)
                storeAnchor(state, state.anchor, state.result);
            }
          else if (indentStatus === 0)
            hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
        if (state.tag === null) {
          if (state.anchor !== null)
            storeAnchor(state, state.anchor, state.result);
        } else if (state.tag === "?") {
          if (state.result !== null && state.kind !== "scalar")
            throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
          for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
            type = state.implicitTypes[typeIndex];
            if (type.resolve(state.result)) {
              state.result = type.construct(state.result);
              state.tag = type.tag;
              if (state.anchor !== null)
                storeAnchor(state, state.anchor, state.result);
              break;
            }
          }
        } else if (state.tag !== "!") {
          if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag))
            type = state.typeMap[state.kind || "fallback"][state.tag];
          else {
            type = null;
            const typeList = state.typeMap.multi[state.kind || "fallback"];
            for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1)
              if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
                type = typeList[typeIndex];
                break;
              }
          }
          if (!type)
            throwError(state, "unknown tag !<" + state.tag + ">");
          if (state.result !== null && type.kind !== state.kind)
            throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
          if (!type.resolve(state.result, state.tag))
            throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
          else {
            state.result = type.construct(state.result, state.tag);
            if (state.anchor !== null)
              storeAnchor(state, state.anchor, state.result);
          }
        }
        if (state.listener !== null)
          state.listener("close", state);
        state.depth -= 1;
        return state.tag !== null || state.anchor !== null || hasContent;
      }
      function readDocument(state) {
        const documentStart = state.position;
        let hasDirectives = false;
        let ch;
        state.version = null;
        state.checkLineBreaks = state.legacy;
        state.tagMap = /* @__PURE__ */ Object.create(null);
        state.anchorMap = /* @__PURE__ */ Object.create(null);
        while ((ch = state.input.charCodeAt(state.position)) !== 0) {
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
          if (state.lineIndent > 0 || ch !== 37)
            break;
          hasDirectives = true;
          ch = state.input.charCodeAt(++state.position);
          let _position = state.position;
          while (ch !== 0 && !isWsOrEol(ch))
            ch = state.input.charCodeAt(++state.position);
          const directiveName = state.input.slice(_position, state.position);
          const directiveArgs = [];
          if (directiveName.length < 1)
            throwError(state, "directive name must not be less than one character in length");
          while (ch !== 0) {
            while (isWhiteSpace(ch))
              ch = state.input.charCodeAt(++state.position);
            if (ch === 35) {
              do
                ch = state.input.charCodeAt(++state.position);
              while (ch !== 0 && !isEol(ch));
              break;
            }
            if (isEol(ch))
              break;
            _position = state.position;
            while (ch !== 0 && !isWsOrEol(ch))
              ch = state.input.charCodeAt(++state.position);
            directiveArgs.push(state.input.slice(_position, state.position));
          }
          if (ch !== 0)
            readLineBreak(state);
          if (_hasOwnProperty.call(directiveHandlers, directiveName))
            directiveHandlers[directiveName](state, directiveName, directiveArgs);
          else
            throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
        skipSeparationSpace(state, true, -1);
        if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        } else if (hasDirectives)
          throwError(state, "directives end mark is expected");
        composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
        skipSeparationSpace(state, true, -1);
        if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position)))
          throwWarning(state, "non-ASCII line breaks are interpreted as content");
        state.documents.push(state.result);
        if (state.position === state.lineStart && testDocumentSeparator(state)) {
          if (state.input.charCodeAt(state.position) === 46) {
            state.position += 3;
            skipSeparationSpace(state, true, -1);
          }
          return;
        }
        if (state.position < state.length - 1)
          throwError(state, "end of the stream or a document separator is expected");
      }
      function loadDocuments(input, options) {
        input = String(input);
        options = options || {};
        if (input.length !== 0) {
          if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13)
            input += "\n";
          if (input.charCodeAt(0) === 65279)
            input = input.slice(1);
        }
        const state = new State(input, options);
        const nullpos = input.indexOf("\0");
        if (nullpos !== -1) {
          state.position = nullpos;
          throwError(state, "null byte is not allowed in input");
        }
        state.input += "\0";
        while (state.input.charCodeAt(state.position) === 32) {
          state.lineIndent += 1;
          state.position += 1;
        }
        while (state.position < state.length - 1)
          readDocument(state);
        return state.documents;
      }
      function loadAll2(input, iterator, options) {
        if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
          options = iterator;
          iterator = null;
        }
        const documents = loadDocuments(input, options);
        if (typeof iterator !== "function")
          return documents;
        for (let index = 0, length = documents.length; index < length; index += 1)
          iterator(documents[index]);
      }
      function load2(input, options) {
        const documents = loadDocuments(input, options);
        if (documents.length === 0)
          return;
        else if (documents.length === 1)
          return documents[0];
        throw new YAMLException2("expected a single document in the stream, but found more");
      }
      module.exports.loadAll = loadAll2;
      module.exports.load = load2;
    });
    require_dumper = /* @__PURE__ */ __commonJSMin((exports, module) => {
      var common = require_common();
      var YAMLException2 = require_exception();
      var DEFAULT_SCHEMA2 = require_default();
      var _toString = Object.prototype.toString;
      var _hasOwnProperty = Object.prototype.hasOwnProperty;
      var CHAR_BOM = 65279;
      var CHAR_TAB = 9;
      var CHAR_LINE_FEED = 10;
      var CHAR_CARRIAGE_RETURN = 13;
      var CHAR_SPACE = 32;
      var CHAR_EXCLAMATION = 33;
      var CHAR_DOUBLE_QUOTE = 34;
      var CHAR_SHARP = 35;
      var CHAR_PERCENT = 37;
      var CHAR_AMPERSAND = 38;
      var CHAR_SINGLE_QUOTE = 39;
      var CHAR_ASTERISK = 42;
      var CHAR_COMMA = 44;
      var CHAR_MINUS = 45;
      var CHAR_COLON = 58;
      var CHAR_EQUALS = 61;
      var CHAR_GREATER_THAN = 62;
      var CHAR_QUESTION = 63;
      var CHAR_COMMERCIAL_AT = 64;
      var CHAR_LEFT_SQUARE_BRACKET = 91;
      var CHAR_RIGHT_SQUARE_BRACKET = 93;
      var CHAR_GRAVE_ACCENT = 96;
      var CHAR_LEFT_CURLY_BRACKET = 123;
      var CHAR_VERTICAL_LINE = 124;
      var CHAR_RIGHT_CURLY_BRACKET = 125;
      var ESCAPE_SEQUENCES = {};
      ESCAPE_SEQUENCES[0] = "\\0";
      ESCAPE_SEQUENCES[7] = "\\a";
      ESCAPE_SEQUENCES[8] = "\\b";
      ESCAPE_SEQUENCES[9] = "\\t";
      ESCAPE_SEQUENCES[10] = "\\n";
      ESCAPE_SEQUENCES[11] = "\\v";
      ESCAPE_SEQUENCES[12] = "\\f";
      ESCAPE_SEQUENCES[13] = "\\r";
      ESCAPE_SEQUENCES[27] = "\\e";
      ESCAPE_SEQUENCES[34] = '\\"';
      ESCAPE_SEQUENCES[92] = "\\\\";
      ESCAPE_SEQUENCES[133] = "\\N";
      ESCAPE_SEQUENCES[160] = "\\_";
      ESCAPE_SEQUENCES[8232] = "\\L";
      ESCAPE_SEQUENCES[8233] = "\\P";
      var DEPRECATED_BOOLEANS_SYNTAX = [
        "y",
        "Y",
        "yes",
        "Yes",
        "YES",
        "on",
        "On",
        "ON",
        "n",
        "N",
        "no",
        "No",
        "NO",
        "off",
        "Off",
        "OFF"
      ];
      var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
      function compileStyleMap(schema, map) {
        if (map === null)
          return {};
        const result = {};
        const keys = Object.keys(map);
        for (let index = 0, length = keys.length; index < length; index += 1) {
          let tag = keys[index];
          let style = String(map[tag]);
          if (tag.slice(0, 2) === "!!")
            tag = "tag:yaml.org,2002:" + tag.slice(2);
          const type = schema.compiledTypeMap["fallback"][tag];
          if (type && _hasOwnProperty.call(type.styleAliases, style))
            style = type.styleAliases[style];
          result[tag] = style;
        }
        return result;
      }
      function encodeHex(character) {
        let handle;
        let length;
        const string = character.toString(16).toUpperCase();
        if (character <= 255) {
          handle = "x";
          length = 2;
        } else if (character <= 65535) {
          handle = "u";
          length = 4;
        } else if (character <= 4294967295) {
          handle = "U";
          length = 8;
        } else
          throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
        return "\\" + handle + common.repeat("0", length - string.length) + string;
      }
      var QUOTING_TYPE_SINGLE = 1;
      var QUOTING_TYPE_DOUBLE = 2;
      function State(options) {
        this.schema = options["schema"] || DEFAULT_SCHEMA2;
        this.indent = Math.max(1, options["indent"] || 2);
        this.noArrayIndent = options["noArrayIndent"] || false;
        this.skipInvalid = options["skipInvalid"] || false;
        this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
        this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
        this.sortKeys = options["sortKeys"] || false;
        this.lineWidth = options["lineWidth"] || 80;
        this.noRefs = options["noRefs"] || false;
        this.noCompatMode = options["noCompatMode"] || false;
        this.condenseFlow = options["condenseFlow"] || false;
        this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
        this.forceQuotes = options["forceQuotes"] || false;
        this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
        this.implicitTypes = this.schema.compiledImplicit;
        this.explicitTypes = this.schema.compiledExplicit;
        this.tag = null;
        this.result = "";
        this.duplicates = [];
        this.usedDuplicates = null;
      }
      function indentString(string, spaces) {
        const ind = common.repeat(" ", spaces);
        let position = 0;
        let result = "";
        const length = string.length;
        while (position < length) {
          let line;
          const next = string.indexOf("\n", position);
          if (next === -1) {
            line = string.slice(position);
            position = length;
          } else {
            line = string.slice(position, next + 1);
            position = next + 1;
          }
          if (line.length && line !== "\n")
            result += ind;
          result += line;
        }
        return result;
      }
      function generateNextLine(state, level) {
        return "\n" + common.repeat(" ", state.indent * level);
      }
      function testImplicitResolving(state, str) {
        for (let index = 0, length = state.implicitTypes.length; index < length; index += 1)
          if (state.implicitTypes[index].resolve(str))
            return true;
        return false;
      }
      function isWhitespace(c) {
        return c === CHAR_SPACE || c === CHAR_TAB;
      }
      function isPrintable(c) {
        return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
      }
      function isNsCharOrWhitespace(c) {
        return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
      }
      function isPlainSafe(c, prev, inblock) {
        const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
        const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
        return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
      }
      function isPlainSafeFirst(c) {
        return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
      }
      function isPlainSafeLast(c) {
        return !isWhitespace(c) && c !== CHAR_COLON;
      }
      function codePointAt(string, pos) {
        const first = string.charCodeAt(pos);
        let second;
        if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
          second = string.charCodeAt(pos + 1);
          if (second >= 56320 && second <= 57343)
            return (first - 55296) * 1024 + second - 56320 + 65536;
        }
        return first;
      }
      function needIndentIndicator(string) {
        return /^\n* /.test(string);
      }
      var STYLE_PLAIN = 1;
      var STYLE_SINGLE = 2;
      var STYLE_LITERAL = 3;
      var STYLE_FOLDED = 4;
      var STYLE_DOUBLE = 5;
      function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
        let i;
        let char = 0;
        let prevChar = null;
        let hasLineBreak = false;
        let hasFoldableLine = false;
        const shouldTrackWidth = lineWidth !== -1;
        let previousLineBreak = -1;
        let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
        if (singleLineOnly || forceQuotes)
          for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
            char = codePointAt(string, i);
            if (!isPrintable(char))
              return STYLE_DOUBLE;
            plain = plain && isPlainSafe(char, prevChar, inblock);
            prevChar = char;
          }
        else {
          for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
            char = codePointAt(string, i);
            if (char === CHAR_LINE_FEED) {
              hasLineBreak = true;
              if (shouldTrackWidth) {
                hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
                previousLineBreak = i;
              }
            } else if (!isPrintable(char))
              return STYLE_DOUBLE;
            plain = plain && isPlainSafe(char, prevChar, inblock);
            prevChar = char;
          }
          hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
        }
        if (!hasLineBreak && !hasFoldableLine) {
          if (plain && !forceQuotes && !testAmbiguousType(string))
            return STYLE_PLAIN;
          return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
        }
        if (indentPerLevel > 9 && needIndentIndicator(string))
          return STYLE_DOUBLE;
        if (!forceQuotes)
          return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
        return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
      }
      function writeScalar(state, string, level, iskey, inblock) {
        state.dump = function() {
          if (string.length === 0)
            return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
          if (!state.noCompatMode) {
            if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string))
              return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
          }
          const indent = state.indent * Math.max(1, level);
          const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
          const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
          function testAmbiguity(string2) {
            return testImplicitResolving(state, string2);
          }
          switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
            case STYLE_PLAIN:
              return string;
            case STYLE_SINGLE:
              return "'" + string.replace(/'/g, "''") + "'";
            case STYLE_LITERAL:
              return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
            case STYLE_FOLDED:
              return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
            case STYLE_DOUBLE:
              return '"' + escapeString(string, lineWidth) + '"';
            default:
              throw new YAMLException2("impossible error: invalid scalar style");
          }
        }();
      }
      function blockHeader(string, indentPerLevel) {
        const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
        const clip = string[string.length - 1] === "\n";
        return indentIndicator + (clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-") + "\n";
      }
      function dropEndingNewline(string) {
        return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
      }
      function foldString(string, width) {
        const lineRe = /(\n+)([^\n]*)/g;
        let result = function() {
          let nextLF = string.indexOf("\n");
          nextLF = nextLF !== -1 ? nextLF : string.length;
          lineRe.lastIndex = nextLF;
          return foldLine(string.slice(0, nextLF), width);
        }();
        let prevMoreIndented = string[0] === "\n" || string[0] === " ";
        let moreIndented;
        let match;
        while (match = lineRe.exec(string)) {
          const prefix = match[1];
          const line = match[2];
          moreIndented = line[0] === " ";
          result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
          prevMoreIndented = moreIndented;
        }
        return result;
      }
      function foldLine(line, width) {
        if (line === "" || line[0] === " ")
          return line;
        const breakRe = / [^ ]/g;
        let match;
        let start = 0;
        let end;
        let curr = 0;
        let next = 0;
        let result = "";
        while (match = breakRe.exec(line)) {
          next = match.index;
          if (next - start > width) {
            end = curr > start ? curr : next;
            result += "\n" + line.slice(start, end);
            start = end + 1;
          }
          curr = next;
        }
        result += "\n";
        if (line.length - start > width && curr > start)
          result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
        else
          result += line.slice(start);
        return result.slice(1);
      }
      function escapeString(string) {
        let result = "";
        let char = 0;
        for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          const escapeSeq = ESCAPE_SEQUENCES[char];
          if (!escapeSeq && isPrintable(char)) {
            result += string[i];
            if (char >= 65536)
              result += string[i + 1];
          } else
            result += escapeSeq || encodeHex(char);
        }
        return result;
      }
      function writeFlowSequence(state, level, object) {
        let _result = "";
        const _tag = state.tag;
        for (let index = 0, length = object.length; index < length; index += 1) {
          let value = object[index];
          if (state.replacer)
            value = state.replacer.call(object, String(index), value);
          if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
            if (_result !== "")
              _result += "," + (!state.condenseFlow ? " " : "");
            _result += state.dump;
          }
        }
        state.tag = _tag;
        state.dump = "[" + _result + "]";
      }
      function writeBlockSequence(state, level, object, compact) {
        let _result = "";
        const _tag = state.tag;
        for (let index = 0, length = object.length; index < length; index += 1) {
          let value = object[index];
          if (state.replacer)
            value = state.replacer.call(object, String(index), value);
          if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
            if (!compact || _result !== "")
              _result += generateNextLine(state, level);
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0))
              _result += "-";
            else
              _result += "- ";
            _result += state.dump;
          }
        }
        state.tag = _tag;
        state.dump = _result || "[]";
      }
      function writeFlowMapping(state, level, object) {
        let _result = "";
        const _tag = state.tag;
        const objectKeyList = Object.keys(object);
        for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
          let pairBuffer = "";
          if (_result !== "")
            pairBuffer += ", ";
          if (state.condenseFlow)
            pairBuffer += '"';
          const objectKey = objectKeyList[index];
          let objectValue = object[objectKey];
          if (state.replacer)
            objectValue = state.replacer.call(object, objectKey, objectValue);
          if (!writeNode(state, level, objectKey, false, false))
            continue;
          if (state.dump.length > 1024)
            pairBuffer += "? ";
          pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
          if (!writeNode(state, level, objectValue, false, false))
            continue;
          pairBuffer += state.dump;
          _result += pairBuffer;
        }
        state.tag = _tag;
        state.dump = "{" + _result + "}";
      }
      function writeBlockMapping(state, level, object, compact) {
        let _result = "";
        const _tag = state.tag;
        const objectKeyList = Object.keys(object);
        if (state.sortKeys === true)
          objectKeyList.sort();
        else if (typeof state.sortKeys === "function")
          objectKeyList.sort(state.sortKeys);
        else if (state.sortKeys)
          throw new YAMLException2("sortKeys must be a boolean or a function");
        for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
          let pairBuffer = "";
          if (!compact || _result !== "")
            pairBuffer += generateNextLine(state, level);
          const objectKey = objectKeyList[index];
          let objectValue = object[objectKey];
          if (state.replacer)
            objectValue = state.replacer.call(object, objectKey, objectValue);
          if (!writeNode(state, level + 1, objectKey, true, true, true))
            continue;
          const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
          if (explicitPair)
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0))
              pairBuffer += "?";
            else
              pairBuffer += "? ";
          pairBuffer += state.dump;
          if (explicitPair)
            pairBuffer += generateNextLine(state, level);
          if (!writeNode(state, level + 1, objectValue, true, explicitPair))
            continue;
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0))
            pairBuffer += ":";
          else
            pairBuffer += ": ";
          pairBuffer += state.dump;
          _result += pairBuffer;
        }
        state.tag = _tag;
        state.dump = _result || "{}";
      }
      function detectType(state, object, explicit) {
        const typeList = explicit ? state.explicitTypes : state.implicitTypes;
        for (let index = 0, length = typeList.length; index < length; index += 1) {
          const type = typeList[index];
          if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
            if (explicit)
              if (type.multi && type.representName)
                state.tag = type.representName(object);
              else
                state.tag = type.tag;
            else
              state.tag = "?";
            if (type.represent) {
              const style = state.styleMap[type.tag] || type.defaultStyle;
              let _result;
              if (_toString.call(type.represent) === "[object Function]")
                _result = type.represent(object, style);
              else if (_hasOwnProperty.call(type.represent, style))
                _result = type.represent[style](object, style);
              else
                throw new YAMLException2("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
              state.dump = _result;
            }
            return true;
          }
        }
        return false;
      }
      function writeNode(state, level, object, block, compact, iskey, isblockseq) {
        state.tag = null;
        state.dump = object;
        if (!detectType(state, object, false))
          detectType(state, object, true);
        const type = _toString.call(state.dump);
        const inblock = block;
        if (block)
          block = state.flowLevel < 0 || state.flowLevel > level;
        const objectOrArray = type === "[object Object]" || type === "[object Array]";
        let duplicateIndex;
        let duplicate;
        if (objectOrArray) {
          duplicateIndex = state.duplicates.indexOf(object);
          duplicate = duplicateIndex !== -1;
        }
        if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0)
          compact = false;
        if (duplicate && state.usedDuplicates[duplicateIndex])
          state.dump = "*ref_" + duplicateIndex;
        else {
          if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex])
            state.usedDuplicates[duplicateIndex] = true;
          if (type === "[object Object]")
            if (block && Object.keys(state.dump).length !== 0) {
              writeBlockMapping(state, level, state.dump, compact);
              if (duplicate)
                state.dump = "&ref_" + duplicateIndex + state.dump;
            } else {
              writeFlowMapping(state, level, state.dump);
              if (duplicate)
                state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          else if (type === "[object Array]")
            if (block && state.dump.length !== 0) {
              if (state.noArrayIndent && !isblockseq && level > 0)
                writeBlockSequence(state, level - 1, state.dump, compact);
              else
                writeBlockSequence(state, level, state.dump, compact);
              if (duplicate)
                state.dump = "&ref_" + duplicateIndex + state.dump;
            } else {
              writeFlowSequence(state, level, state.dump);
              if (duplicate)
                state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          else if (type === "[object String]") {
            if (state.tag !== "?")
              writeScalar(state, state.dump, level, iskey, inblock);
          } else if (type === "[object Undefined]")
            return false;
          else {
            if (state.skipInvalid)
              return false;
            throw new YAMLException2("unacceptable kind of an object to dump " + type);
          }
          if (state.tag !== null && state.tag !== "?") {
            let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
            if (state.tag[0] === "!")
              tagStr = "!" + tagStr;
            else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:")
              tagStr = "!!" + tagStr.slice(18);
            else
              tagStr = "!<" + tagStr + ">";
            state.dump = tagStr + " " + state.dump;
          }
        }
        return true;
      }
      function getDuplicateReferences(object, state) {
        const objects = [];
        const duplicatesIndexes = [];
        inspectNode(object, objects, duplicatesIndexes);
        const length = duplicatesIndexes.length;
        for (let index = 0; index < length; index += 1)
          state.duplicates.push(objects[duplicatesIndexes[index]]);
        state.usedDuplicates = new Array(length);
      }
      function inspectNode(object, objects, duplicatesIndexes) {
        if (object !== null && typeof object === "object") {
          const index = objects.indexOf(object);
          if (index !== -1) {
            if (duplicatesIndexes.indexOf(index) === -1)
              duplicatesIndexes.push(index);
          } else {
            objects.push(object);
            if (Array.isArray(object))
              for (let i = 0, length = object.length; i < length; i += 1)
                inspectNode(object[i], objects, duplicatesIndexes);
            else {
              const objectKeyList = Object.keys(object);
              for (let i = 0, length = objectKeyList.length; i < length; i += 1)
                inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
            }
          }
        }
      }
      function dump2(input, options) {
        options = options || {};
        const state = new State(options);
        if (!state.noRefs)
          getDuplicateReferences(input, state);
        let value = input;
        if (state.replacer)
          value = state.replacer.call({ "": value }, "", value);
        if (writeNode(state, 0, value, true, true))
          return state.dump + "\n";
        return "";
      }
      module.exports.dump = dump2;
    });
    import_js_yaml = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin((exports, module) => {
      var loader = require_loader();
      var dumper = require_dumper();
      function renamed(from, to) {
        return function() {
          throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
        };
      }
      module.exports.Type = require_type();
      module.exports.Schema = require_schema();
      module.exports.FAILSAFE_SCHEMA = require_failsafe();
      module.exports.JSON_SCHEMA = require_json();
      module.exports.CORE_SCHEMA = require_core();
      module.exports.DEFAULT_SCHEMA = require_default();
      module.exports.load = loader.load;
      module.exports.loadAll = loader.loadAll;
      module.exports.dump = dumper.dump;
      module.exports.YAMLException = require_exception();
      module.exports.types = {
        binary: require_binary(),
        float: require_float(),
        map: require_map(),
        null: require_null(),
        pairs: require_pairs(),
        set: require_set(),
        timestamp: require_timestamp(),
        bool: require_bool(),
        int: require_int(),
        merge: require_merge(),
        omap: require_omap(),
        seq: require_seq(),
        str: require_str()
      };
      module.exports.safeLoad = renamed("safeLoad", "load");
      module.exports.safeLoadAll = renamed("safeLoadAll", "loadAll");
      module.exports.safeDump = renamed("safeDump", "dump");
    }))(), 1);
    ({ Type, Schema, FAILSAFE_SCHEMA, JSON_SCHEMA, CORE_SCHEMA, DEFAULT_SCHEMA, load, loadAll, dump, YAMLException, types, safeLoad, safeLoadAll, safeDump } = import_js_yaml.default);
    index_vite_proxy_tmp_default = import_js_yaml.default;
  }
});

// src/core/document.ts
function parseDocument(text) {
  const lines = text.split("\n");
  if (lines.length === 0 || lines[0].trim() !== DELIM) {
    return { frontmatter: {}, body: text };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIM) {
      end = i;
      break;
    }
  }
  if (end === -1)
    throw new OKFDocumentError("Unterminated YAML frontmatter block");
  let fm;
  try {
    fm = index_vite_proxy_tmp_default.load(lines.slice(1, end).join("\n"), { schema: index_vite_proxy_tmp_default.JSON_SCHEMA }) ?? {};
  } catch (e) {
    throw new OKFDocumentError(`Invalid YAML in frontmatter: ${e.message}`);
  }
  if (typeof fm !== "object" || fm === null || Array.isArray(fm)) {
    throw new OKFDocumentError("Frontmatter must be a YAML mapping");
  }
  let body = lines.slice(end + 1).join("\n");
  if (body.startsWith("\n"))
    body = body.slice(1);
  return { frontmatter: fm, body };
}
function serializeDocument(doc) {
  const fmText = index_vite_proxy_tmp_default.dump(doc.frontmatter, { sortKeys: false, lineWidth: -1 }).trimEnd();
  const body = doc.body.endsWith("\n") ? doc.body : doc.body + "\n";
  return `${DELIM}
${fmText}
${DELIM}

${body}`;
}
function validateConcept(doc) {
  const out = [];
  const fm = doc.frontmatter;
  const type = fm["type"];
  if (typeof type !== "string" || type.trim() === "") {
    out.push({ level: "error", code: "E-TYPE-MISSING", message: "Missing or empty required field: type" });
  }
  for (const key of ["title", "description", "timestamp"]) {
    const v = fm[key];
    const empty = v === void 0 || v === null || typeof v === "string" && v.trim() === "";
    if (empty)
      out.push({ level: "warning", code: "W-FIELD-MISSING", message: `Missing recommended field: ${key}` });
  }
  const ts = fm["timestamp"];
  if (typeof ts === "string" && ts.trim() !== "" && !ISO.test(ts.trim())) {
    out.push({ level: "warning", code: "W-TIMESTAMP-FORMAT", message: `timestamp is not valid ISO 8601: ${ts}` });
  }
  return out;
}
var OKFDocumentError, DELIM, ISO;
var init_document = __esm({
  "src/core/document.ts"() {
    "use strict";
    init_js_yaml();
    OKFDocumentError = class extends Error {
    };
    DELIM = "---";
    ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  }
});

// src/core/paths.ts
function parseConceptId(s) {
  const parts = s.split("/").filter(Boolean);
  if (parts.length === 0)
    throw new Error(`Empty concept id: ${s}`);
  for (const p of parts) {
    if (!SEGMENT.test(p))
      throw new Error(`Invalid concept id segment: ${p}`);
  }
  return parts;
}
function conceptIdToRelPath(id) {
  return parseConceptId(id).join("/") + ".md";
}
function relPathToConceptId(relPath) {
  return relPath.replace(/\.md$/, "");
}
var SEGMENT;
var init_paths = __esm({
  "src/core/paths.ts"() {
    "use strict";
    SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/;
  }
});

// src/core/bundle.ts
var bundle_exports = {};
__export(bundle_exports, {
  loadBundle: () => loadBundle
});
import { promises as fs } from "node:fs";
import path from "node:path";
function toPosix(p) {
  return p.split(path.sep).join("/");
}
async function collectDirs(dir, acc) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
      const abs = path.join(dir, e.name);
      acc.push(abs);
      await collectDirs(abs, acc);
    }
  }
}
async function loadBundle(root) {
  root = path.resolve(root);
  const concepts = /* @__PURE__ */ new Map();
  const indexFiles = [];
  const logFiles = [];
  const parseErrors = [];
  const subDirs = [];
  await collectDirs(root, subDirs);
  const allDirs = [root, ...subDirs];
  const dirs = allDirs.map((d) => toPosix(path.relative(root, d))).sort();
  for (const d of allDirs) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith(".md"))
        continue;
      const abs = path.join(d, e.name);
      const relPath = toPosix(path.relative(root, abs));
      if (e.name === "index.md") {
        indexFiles.push(relPath);
        continue;
      }
      if (e.name === "log.md") {
        logFiles.push(relPath);
        continue;
      }
      const text = await fs.readFile(abs, "utf8");
      try {
        const doc = parseDocument(text);
        const id = relPathToConceptId(relPath);
        concepts.set(id, { id, relPath, absPath: abs, doc });
      } catch (err) {
        parseErrors.push({ relPath, message: err.message });
      }
    }
  }
  return { root, concepts, indexFiles, logFiles, dirs, parseErrors };
}
var SKIP_DIRS;
var init_bundle = __esm({
  "src/core/bundle.ts"() {
    "use strict";
    init_document();
    init_paths();
    SKIP_DIRS = /* @__PURE__ */ new Set([".git", "node_modules"]);
  }
});

// src/cli.ts
init_bundle();

// src/commands/validate.ts
init_document();
import { promises as fs3 } from "node:fs";
import path4 from "node:path";

// src/core/links.ts
import path2 from "node:path";
var LINK_RE = /\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g;
function extractLinks(body) {
  const out = [];
  for (const m of body.matchAll(LINK_RE)) {
    const target = m[1];
    out.push({ target, isAbsolute: target.startsWith("/") });
  }
  return out;
}
function resolveTarget(rawTarget, fromRelPath) {
  let rel;
  if (rawTarget.startsWith("/")) {
    rel = rawTarget.slice(1);
  } else {
    const fromDir = path2.posix.dirname(fromRelPath);
    rel = path2.posix.normalize(path2.posix.join(fromDir, rawTarget));
  }
  if (rel.startsWith("..") || rel.startsWith("/"))
    return null;
  return rel.replace(/\.md$/, "");
}
function buildGraph(bundle) {
  const edges = [];
  const backlinks = /* @__PURE__ */ new Map();
  const broken = [];
  const outDeg = /* @__PURE__ */ new Map();
  const inDeg = /* @__PURE__ */ new Map();
  for (const [id, entry] of bundle.concepts) {
    const seen = /* @__PURE__ */ new Set();
    for (const link of extractLinks(entry.doc.body)) {
      const to = resolveTarget(link.target, entry.relPath);
      if (to === null || !bundle.concepts.has(to)) {
        broken.push({ from: id, rawTarget: link.target });
        continue;
      }
      if (to === id || seen.has(to))
        continue;
      seen.add(to);
      edges.push({ from: id, to, absolute: link.isAbsolute });
      outDeg.set(id, (outDeg.get(id) ?? 0) + 1);
      inDeg.set(to, (inDeg.get(to) ?? 0) + 1);
      const bl = backlinks.get(to) ?? [];
      bl.push(id);
      backlinks.set(to, bl);
    }
  }
  const orphans = [];
  for (const id of bundle.concepts.keys()) {
    if ((outDeg.get(id) ?? 0) === 0 && (inDeg.get(id) ?? 0) === 0)
      orphans.push(id);
  }
  return { edges, backlinks, broken, orphans };
}

// src/commands/index.ts
import { promises as fs2 } from "node:fs";
import path3 from "node:path";
function buildIndexText(entries) {
  const grouped = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const g = grouped.get(e.type) ?? [];
    g.push(e);
    grouped.set(e.type, g);
  }
  const sections = [];
  for (const type of [...grouped.keys()].sort()) {
    const lines = [`# ${type}`, ""];
    const items = grouped.get(type).sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    for (const it of items) {
      lines.push(`* [${it.title}](${it.link})${it.desc ? ` - ${it.desc}` : ""}`);
    }
    sections.push(lines.join("\n"));
  }
  return sections.join("\n\n") + "\n";
}
function expectedIndexes(bundle) {
  const result = /* @__PURE__ */ new Map();
  for (const dir of bundle.dirs) {
    const entries = [];
    const prefix = dir === "" ? "" : dir + "/";
    for (const c of bundle.concepts.values()) {
      const cdir = c.relPath.includes("/") ? c.relPath.slice(0, c.relPath.lastIndexOf("/")) : "";
      if (cdir !== dir)
        continue;
      const fm = c.doc.frontmatter;
      entries.push({
        type: String(fm.type ?? "Other"),
        title: String(fm.title ?? path3.basename(c.relPath, ".md")),
        link: path3.posix.basename(c.relPath),
        desc: String(fm.description ?? "")
      });
    }
    for (const d of bundle.dirs) {
      if (d === "" || d === dir)
        continue;
      const ddir = d.includes("/") ? d.slice(0, d.lastIndexOf("/")) : "";
      if (ddir !== dir)
        continue;
      const name = path3.posix.basename(d);
      const childTitles = [...bundle.concepts.values()].filter((c) => c.relPath.startsWith(d + "/")).map((c) => String(c.doc.frontmatter.title ?? path3.basename(c.relPath, ".md"))).sort();
      const desc = childTitles.length ? `Contains: ${childTitles.slice(0, 6).join(", ")}.` : "";
      entries.push({ type: "Subdirectories", title: name, link: `${name}/index.md`, desc });
    }
    if (entries.length === 0)
      continue;
    result.set(`${prefix}index.md`, buildIndexText(entries));
  }
  return result;
}
async function checkIndexes(bundle) {
  const expected = expectedIndexes(bundle);
  const drift = [];
  for (const [rel, content] of expected) {
    const abs = path3.join(bundle.root, rel);
    let current = null;
    try {
      current = await fs2.readFile(abs, "utf8");
    } catch {
      current = null;
    }
    if (current !== content)
      drift.push(rel);
  }
  return drift;
}
async function writeIndexes(bundle) {
  const expected = expectedIndexes(bundle);
  const changed = [];
  for (const [rel, content] of expected) {
    const abs = path3.join(bundle.root, rel);
    let current = null;
    try {
      current = await fs2.readFile(abs, "utf8");
    } catch {
      current = null;
    }
    if (current !== content) {
      await fs2.writeFile(abs, content, "utf8");
      changed.push(rel);
    }
  }
  return changed;
}

// src/commands/validate.ts
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
async function runValidate(bundle) {
  const out = [];
  for (const pe of bundle.parseErrors) {
    out.push({ level: "error", code: "E-FRONTMATTER-PARSE", message: pe.message, where: pe.relPath });
  }
  for (const c of bundle.concepts.values()) {
    for (const f of validateConcept(c.doc))
      out.push({ ...f, where: c.id });
    for (const l of extractLinks(c.doc.body)) {
      if (l.isAbsolute) {
        out.push({ level: "warning", code: "W-LINK-ABSOLUTE", message: `Absolute link ${l.target} (profile prefers relative)`, where: c.id });
      }
    }
  }
  const g = buildGraph(bundle);
  for (const b of g.broken)
    out.push({ level: "warning", code: "W-LINK-BROKEN", message: `Broken link to ${b.rawTarget}`, where: b.from });
  for (const o of g.orphans)
    out.push({ level: "warning", code: "W-ORPHAN", message: "Concept has no inbound or outbound links", where: o });
  for (const rel of bundle.indexFiles) {
    const text = await fs3.readFile(path4.join(bundle.root, rel), "utf8");
    if (text.trimStart().startsWith("---") && rel !== "index.md") {
      out.push({ level: "error", code: "E-INDEX-FRONTMATTER", message: "Non-root index.md must not contain frontmatter", where: rel });
    }
  }
  for (const rel of bundle.logFiles) {
    const text = await fs3.readFile(path4.join(bundle.root, rel), "utf8");
    for (const line of text.split("\n")) {
      const m = /^##\s+(.+?)\s*$/.exec(line);
      if (m && !ISO_DATE.test(m[1])) {
        out.push({ level: "error", code: "E-LOG-DATE", message: `Log date heading not ISO YYYY-MM-DD: ${m[1]}`, where: rel });
      }
    }
  }
  const expected = expectedIndexes(bundle);
  const present = new Set(bundle.indexFiles);
  for (const [rel, content] of expected) {
    if (!present.has(rel)) {
      out.push({ level: "warning", code: "W-INDEX-MISSING", message: "Directory has no index.md", where: rel });
      continue;
    }
    const onDisk = await fs3.readFile(path4.join(bundle.root, rel), "utf8");
    if (onDisk !== content) {
      out.push({ level: "warning", code: "W-INDEX-STALE", message: "index.md is out of date (run `okf index`)", where: rel });
    }
  }
  return out;
}
function formatFindings(findings) {
  if (findings.length === 0)
    return "OK: no findings.";
  const errs = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warning");
  const lines = [];
  for (const f of [...errs, ...warns]) {
    lines.push(`${f.level === "error" ? "ERROR" : "warn "} [${f.code}] ${f.where}: ${f.message}`);
  }
  lines.push("");
  lines.push(`${errs.length} error(s), ${warns.length} warning(s).`);
  return lines.join("\n");
}

// src/commands/new.ts
init_document();
init_paths();
import { promises as fs4 } from "node:fs";
import path5 from "node:path";

// src/commands/templates.ts
function bodyTemplate(type) {
  const t = type.toLowerCase();
  if (t === "reference") {
    return "# Definition\n\nDescribe the concept here.\n\n# Citations\n";
  }
  if (t.includes("table")) {
    return "# Schema\n\n| Column | Type | Description |\n|--------|------|-------------|\n\n# Citations\n";
  }
  if (t === "playbook") {
    return "# Trigger\n\nWhen this applies.\n\n# Steps\n\n1. First step.\n\n# Citations\n";
  }
  return "Describe the concept here.\n\n# Citations\n";
}

// src/commands/new.ts
function scaffold(opts) {
  const fm = { type: opts.type };
  if (opts.resource)
    fm.resource = opts.resource;
  fm.title = opts.title ?? opts.id.split("/").pop();
  fm.description = opts.description ?? "";
  if (opts.tags && opts.tags.length)
    fm.tags = opts.tags;
  fm.timestamp = opts.now ?? (/* @__PURE__ */ new Date()).toISOString();
  return { frontmatter: fm, body: bodyTemplate(opts.type) };
}
async function runNew(root, opts) {
  const rel = conceptIdToRelPath(opts.id);
  const abs = path5.join(root, rel);
  let exists = false;
  try {
    await fs4.access(abs);
    exists = true;
  } catch {
    exists = false;
  }
  if (exists && !opts.force)
    throw new Error(`Concept already exists: ${rel} (use --force to overwrite)`);
  await fs4.mkdir(path5.dirname(abs), { recursive: true });
  await fs4.writeFile(abs, serializeDocument(scaffold(opts)), "utf8");
  return rel;
}

// src/commands/move.ts
init_bundle();
import { promises as fs5 } from "node:fs";
import path6 from "node:path";
init_paths();
function relLink(fromRelPath, toRelPath) {
  return path6.posix.relative(path6.posix.dirname(fromRelPath), toRelPath) || path6.posix.basename(toRelPath);
}
function planMove(bundle, fromId, toId) {
  const fileFrom = conceptIdToRelPath(fromId);
  const fileTo = conceptIdToRelPath(toId);
  const edits = [];
  for (const c of bundle.concepts.values()) {
    if (c.id === fromId)
      continue;
    let body = c.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (resolveTarget(link.target, c.relPath) !== fromId)
        continue;
      body = body.split(`](${link.target})`).join(`](${relLink(c.relPath, fileTo)})`);
      changed = true;
    }
    if (changed)
      edits.push({ relPath: c.relPath, before: c.doc.body, after: body });
  }
  const moved = bundle.concepts.get(fromId);
  if (moved) {
    let body = moved.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (link.isAbsolute)
        continue;
      const tgt = resolveTarget(link.target, moved.relPath);
      if (tgt === null)
        continue;
      const newRel = relLink(fileTo, conceptIdToRelPath(tgt));
      if (newRel !== link.target) {
        body = body.split(`](${link.target})`).join(`](${newRel})`);
        changed = true;
      }
    }
    if (changed)
      edits.push({ relPath: fileFrom, before: moved.doc.body, after: body });
  }
  return { fromId, toId, fileFrom, fileTo, edits };
}
function applyBodyEdit(fileText, before, after) {
  const idx = fileText.lastIndexOf(before);
  if (idx === -1)
    return fileText;
  return fileText.slice(0, idx) + after + fileText.slice(idx + before.length);
}
async function runMove(root, fromId, toId, opts = {}) {
  const bundle = await loadBundle(root);
  if (!bundle.concepts.has(fromId))
    throw new Error(`Concept not found: ${fromId}`);
  const plan = planMove(bundle, fromId, toId);
  const absFrom = path6.join(root, plan.fileFrom);
  const absTo = path6.join(root, plan.fileTo);
  let targetExists = false;
  try {
    await fs5.access(absTo);
    targetExists = true;
  } catch {
    targetExists = false;
  }
  if (targetExists)
    throw new Error(`Target already exists: ${plan.fileTo}`);
  if (opts.dryRun)
    return plan;
  for (const edit of plan.edits) {
    if (edit.relPath === plan.fileFrom)
      continue;
    const abs = path6.join(root, edit.relPath);
    const text = await fs5.readFile(abs, "utf8");
    await fs5.writeFile(abs, applyBodyEdit(text, edit.before, edit.after), "utf8");
  }
  const selfEdit = plan.edits.find((e) => e.relPath === plan.fileFrom);
  let content = await fs5.readFile(absFrom, "utf8");
  if (selfEdit)
    content = applyBodyEdit(content, selfEdit.before, selfEdit.after);
  await fs5.mkdir(path6.dirname(absTo), { recursive: true });
  await fs5.writeFile(absTo, content, "utf8");
  await fs5.rm(absFrom);
  return plan;
}

// src/commands/search.ts
function runSearch(bundle, filters) {
  const out = [];
  const text = filters.text?.toLowerCase();
  for (const c of bundle.concepts.values()) {
    const fm = c.doc.frontmatter;
    const type = String(fm.type ?? "");
    if (filters.type && type !== filters.type)
      continue;
    if (filters.tag) {
      const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
      if (!tags.includes(filters.tag))
        continue;
    }
    if (text) {
      const hay = `${fm.title ?? ""}
${fm.description ?? ""}
${c.doc.body}`.toLowerCase();
      if (!hay.includes(text))
        continue;
    }
    out.push({ id: c.id, title: String(fm.title ?? c.id), description: String(fm.description ?? ""), type });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
function runBacklinks(bundle, id) {
  return (buildGraph(bundle).backlinks.get(id) ?? []).slice().sort();
}

// src/commands/log.ts
import { promises as fs6 } from "node:fs";
import path7 from "node:path";
var HEADER = "# Update Log";
function prependLogEntry(existing, dateISO, kind, message) {
  const entry = `* **${kind}**: ${message}`;
  const heading = `## ${dateISO}`;
  if (!existing || existing.trim() === "") {
    return `${HEADER}

${heading}
${entry}
`;
  }
  const lines = existing.replace(/\n+$/, "").split("\n");
  const idx = lines.findIndex((l) => l.trim() === heading);
  if (idx === -1) {
    const headerIdx = lines.findIndex((l) => l.trim() === HEADER);
    const at = headerIdx === -1 ? 0 : headerIdx + 1;
    lines.splice(at, 0, "", heading, entry);
  } else {
    lines.splice(idx + 1, 0, entry);
  }
  return lines.join("\n") + "\n";
}
async function runLog(root, scope, kind, message, dateISO) {
  const date = dateISO ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const rel = scope === "." || scope === "" ? "log.md" : path7.posix.join(scope, "log.md");
  const abs = path7.join(root, rel);
  let existing = null;
  try {
    existing = await fs6.readFile(abs, "utf8");
  } catch {
    existing = null;
  }
  await fs6.mkdir(path7.dirname(abs), { recursive: true });
  await fs6.writeFile(abs, prependLogEntry(existing, date, kind, message), "utf8");
  return rel;
}

// src/commands/viz.ts
import { promises as fs7 } from "node:fs";
var PALETTE = {
  "BigQuery Dataset": "#8b5cf6",
  "BigQuery Table": "#3b82f6",
  "Reference": "#10b981"
};
function colorFor(type) {
  return PALETTE[type] ?? "#94a3b8";
}
function generateViz(bundle, name) {
  const graph = buildGraph(bundle);
  const nodes = [];
  for (const c of bundle.concepts.values()) {
    const fm = c.doc.frontmatter;
    const linkMap = {};
    for (const l of extractLinks(c.doc.body)) {
      const to = resolveTarget(l.target, c.relPath);
      linkMap[l.target] = to && bundle.concepts.has(to) ? to : null;
    }
    nodes.push({
      id: c.id,
      label: String(fm.title ?? c.id),
      type: String(fm.type ?? "Other"),
      description: String(fm.description ?? ""),
      resource: String(fm.resource ?? ""),
      tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
      color: colorFor(String(fm.type ?? "Other")),
      body: c.doc.body,
      linkMap
    });
  }
  const edges = graph.edges.map((e) => ({ source: e.from, target: e.to }));
  const data = JSON.stringify({ name, nodes, edges });
  return HTML.replace("__NAME__", () => escapeHtml(name)).replace("__BUNDLE__", () => data);
}
async function runViz(root, outPath, name) {
  const { loadBundle: loadBundle2 } = await Promise.resolve().then(() => (init_bundle(), bundle_exports));
  await fs7.writeFile(outPath, generateViz(await loadBundle2(root), name), "utf8");
  return outPath;
}
function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
var HTML = `<!doctype html><html><head><meta charset="utf-8"><title>__NAME__ \u2014 OKF</title>
<script src="https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<style>body{margin:0;font-family:system-ui;display:flex;height:100vh}#cy{flex:2;height:100%}#panel{flex:1;padding:1rem;overflow:auto;border-left:1px solid #ddd}a{cursor:pointer}</style>
</head><body>
<div id="cy"></div><div id="panel"><em>Click a node.</em></div>
<script>
const BUNDLE = __BUNDLE__;
const byId = Object.fromEntries(BUNDLE.nodes.map(n => [n.id, n]));
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
    ...BUNDLE.nodes.map(n => ({ data: { id: n.id, label: n.label, color: n.color } })),
    ...BUNDLE.edges.map(e => ({ data: { id: e.source + '__' + e.target, source: e.source, target: e.target } })),
  ],
  style: [
    { selector: 'node', style: { 'background-color': 'data(color)', label: 'data(label)', 'font-size': 8 } },
    { selector: 'edge', style: { 'width': 1, 'line-color': '#ccc', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#ccc', 'curve-style': 'bezier' } },
  ],
  layout: { name: 'cose' },
});
function show(id) {
  const n = byId[id]; if (!n) return;
  const p = document.getElementById('panel');
  p.innerHTML = '<h2>' + n.label + '</h2><p><code>' + n.id + '</code> \xB7 ' + n.type + '</p>' +
    (n.resource ? '<p><a href="' + n.resource + '" target="_blank" rel="noopener">resource</a></p>' : '') +
    '<div id="body"></div>';
  const body = document.getElementById('body');
  body.innerHTML = marked.parse(n.body);
  body.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    const target = n.linkMap[href];
    if (target) { a.onclick = (e) => { e.preventDefault(); show(target); }; }
    else { a.target = '_blank'; a.rel = 'noopener'; }
  });
}
cy.on('tap', 'node', (e) => show(e.target.id()));
</script></body></html>`;

// src/cli.ts
function flag(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : void 0;
}
function has(argv, name) {
  return argv.includes(name);
}
function bundleRoot(argv) {
  return flag(argv, "--bundle") ?? process.env.OKF_BUNDLE ?? process.cwd();
}
async function main(argv) {
  if (argv.includes("--version") || argv[0] === "version") {
    console.log("okf 0.1.1");
    return 0;
  }
  const cmd = argv[0];
  const rest = argv.slice(1);
  const root = bundleRoot(rest);
  switch (cmd) {
    case "validate": {
      const findings = await runValidate(await loadBundle(root));
      const errs = findings.filter((f) => f.level === "error").length;
      console.log(has(rest, "--json") ? JSON.stringify(findings) : formatFindings(findings));
      return errs > 0 || has(rest, "--strict") && findings.length > 0 ? 1 : 0;
    }
    case "index": {
      const bundle = await loadBundle(root);
      if (has(rest, "--check")) {
        const drift = await checkIndexes(bundle);
        console.log(drift.length ? `Out-of-date indexes:
${drift.join("\n")}` : "Indexes up to date.");
        return drift.length ? 1 : 0;
      }
      const changed = await writeIndexes(bundle);
      console.log(`Wrote ${changed.length} index file(s).`);
      return 0;
    }
    case "new": {
      const tags = flag(rest, "--tags");
      const rel = await runNew(root, {
        type: flag(rest, "--type") ?? "Reference",
        id: flag(rest, "--id") ?? "",
        title: flag(rest, "--title"),
        description: flag(rest, "--description"),
        resource: flag(rest, "--resource"),
        tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : void 0,
        force: has(rest, "--force")
      });
      console.log(`Created ${rel}`);
      return 0;
    }
    case "move": {
      const plan = await runMove(root, flag(rest, "--from") ?? "", flag(rest, "--to") ?? "", { dryRun: has(rest, "--dry-run") });
      console.log(`${has(rest, "--dry-run") ? "[dry-run] " : ""}moved ${plan.fromId} -> ${plan.toId}; ${plan.edits.length} doc(s) relinked.`);
      return 0;
    }
    case "search": {
      const results = runSearch(await loadBundle(root), { type: flag(rest, "--type"), tag: flag(rest, "--tag"), text: flag(rest, "--text") });
      console.log(has(rest, "--json") ? JSON.stringify(results) : results.map((r) => `${r.id}  [${r.type}]  ${r.description}`).join("\n"));
      return 0;
    }
    case "backlinks": {
      const id = rest.find((a) => !a.startsWith("--") && a !== flag(rest, "--bundle")) ?? "";
      const r = runBacklinks(await loadBundle(root), id);
      console.log(has(rest, "--json") ? JSON.stringify(r) : r.join("\n"));
      return 0;
    }
    case "log": {
      const rel = await runLog(root, flag(rest, "--scope") ?? ".", flag(rest, "--kind") ?? "Update", flag(rest, "--message") ?? "");
      console.log(`Logged to ${rel}`);
      return 0;
    }
    case "viz": {
      const out = flag(rest, "--out") ?? `${root.replace(/\/$/, "")}/viz.html`;
      await runViz(root, out, flag(rest, "--name") ?? "OKF Wiki");
      console.log(`Wrote ${out}`);
      return 0;
    }
    default:
      console.error("usage: okf <validate|index|new|move|search|backlinks|log|viz> [--bundle <path>] [options]");
      return 1;
  }
}

// src/main.ts
main(process.argv.slice(2)).then((code) => {
  process.exit(code);
});
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.2.0 https://github.com/nodeca/js-yaml @license MIT *)
*/

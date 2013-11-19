// Generated by CoffeeScript 1.6.3
var MasterDefaultsConfig, ResourceConverter, UError, addIgnoreToFilezAsExclude, arrayizePusher, arrayizeUniquePusher, blendConfigs, bundleBuildBlender, deepCloneBlender, dependenciesBindingsBlender, depracatedKeysBlender, fs, l, moveKeysBlender, renameKeys, templateBlender, upath, _, _B, _blendDerivedConfigs, _optimizers,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('lodash');

fs = require('fs');

require('butter-require')();

_B = require('uberscore');

l = new _B.Logger('urequire/blendConfigs');

upath = require('../paths/upath');

MasterDefaultsConfig = require('./MasterDefaultsConfig');

ResourceConverter = require('./ResourceConverter');

UError = require('../utils/UError');

arrayizeUniquePusher = new _B.ArrayizePushBlender([], {
  unique: true
});

arrayizePusher = new _B.ArrayizePushBlender;

moveKeysBlender = new _B.Blender([
  {
    order: ['path'],
    '*': {
      '|': (function(partsKeys) {
        return function(prop, src, dst) {
          var confPart, _i, _len, _ref;
          _ref = _.keys(partsKeys);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            confPart = _ref[_i];
            if (__indexOf.call(partsKeys[confPart], prop) >= 0) {
              _B.setp(this.dstRoot, "/" + confPart + "/" + prop, src[prop], {
                overwrite: true
              });
              break;
            }
          }
          return this.SKIP;
        };
      })({
        bundle: _.keys(MasterDefaultsConfig.bundle),
        build: _.keys(MasterDefaultsConfig.build)
      })
    },
    bundle: {
      '|': function() {
        return _B.Blender.NEXT;
      }
    },
    build: {
      '|': function() {
        return _B.Blender.NEXT;
      }
    }
  }
]);

renameKeys = {
  $: {
    bundle: {
      bundlePath: 'path',
      bundleName: 'name',
      copyNonResources: 'copy',
      filespecs: 'filez',
      dependencies: {
        noWeb: 'node',
        bundleExports: 'exports.bundle',
        variableNames: 'depsVars',
        _knownVariableNames: '_knownDepsVars'
      }
    },
    build: {
      outputPath: 'dstPath'
    }
  }
};

_.extend(renameKeys.$, renameKeys.$.bundle);

_.extend(renameKeys.$, renameKeys.$.build);

depracatedKeysBlender = new _B.DeepDefaultsBlender([
  {
    order: ['src'],
    '*': function(prop, src, dst) {
      var renameTo;
      renameTo = _B.getp(renameKeys, this.path);
      if (_.isString(renameTo)) {
        l.warn("DEPRACATED key '" + (_.last(this.path)) + "' found @ config path '" + (this.path.join('.')) + "' - rename to '" + renameTo + "'");
        _B.setp(this.dstRoot, this.path.slice(1, -1).join('.') + '.' + renameTo, src[prop], {
          overwrite: true,
          separator: '.'
        });
        return this.SKIP;
      }
      return this.NEXT;
    }
  }
]);

addIgnoreToFilezAsExclude = function(cfg) {
  var filez, ignore, ignoreSpec, _i, _len, _ref, _ref1;
  ignore = _B.arrayize(((_ref = cfg.bundle) != null ? _ref.ignore : void 0) || cfg.ignore);
  if (!_.isEmpty(ignore)) {
    l.warn("DEPRACATED key 'ignore' found @ config - adding them as exclude '!' to 'bundle.filez'");
    filez = _B.arrayize(((_ref1 = cfg.bundle) != null ? _ref1.filez : void 0) || cfg.filez || ['**/*.*']);
    for (_i = 0, _len = ignore.length; _i < _len; _i++) {
      ignoreSpec = ignore[_i];
      filez.push('!');
      filez.push(ignoreSpec);
    }
    delete cfg.ignore;
    delete cfg.bundle.ignore;
    _B.setp(cfg, ['bundle', 'filez'], filez, {
      overwrite: true
    });
  }
  return cfg;
};

_optimizers = MasterDefaultsConfig.build._optimizers;

bundleBuildBlender = new _B.DeepCloneBlender([
  {
    order: ['path', 'src', 'dst'],
    arrayizePush: function(prop, src, dst) {
      return arrayizePusher.blend(dst[prop], src[prop]);
    },
    arraysPushOrOverwrite: function(prop, src, dst) {
      if (_.isArray(dst[prop]) && _.isArray(src[prop])) {
        return arrayizePusher.blend(dst[prop], src[prop]);
      } else {
        return src[prop];
      }
    },
    arrayPush: function(prop, src, dst) {
      var item, _i, _len, _ref;
      _ref = src[prop];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        dst[prop].push(item);
      }
      return dst[prop];
    },
    dependenciesBindings: function(prop, src, dst) {
      return dependenciesBindingsBlender.blend(dst[prop], src[prop]);
    },
    bundle: {
      filez: {
        '|': {
          '*': 'arrayizePush'
        }
      },
      copy: {
        '|': {
          '*': 'arrayizePush'
        }
      },
      resources: {
        '|': {
          '*': function(prop, src) {
            throw new Error("`bundle.resources` must be an array - was : ", src[prop]);
          },
          '[]': function(prop, src, dst) {
            var rc, rcs, _i, _len, _ref;
            rcs = [];
            _ref = src[prop];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              rc = _ref[_i];
              if (_.isEqual(rc, [null])) {
                rcs.push(rc);
              } else {
                rc = ResourceConverter.searchRegisterUpdate(rc);
                if (rc && !_.isEmpty(rc)) {
                  rcs.push(rc);
                }
              }
            }
            return arrayizePusher.blend(dst[prop], rcs);
          }
        }
      },
      dependencies: {
        node: {
          '|': {
            '*': function(prop, src, dst) {
              return arrayizeUniquePusher.blend(dst[prop], src[prop]);
            }
          }
        },
        exports: {
          bundle: {
            '|': {
              '*': 'dependenciesBindings'
            }
          },
          root: {
            '|': {
              '*': 'dependenciesBindings'
            }
          }
        },
        replace: {
          '|': {
            '*': 'dependenciesBindings'
          }
        },
        depsVars: {
          '|': {
            '*': 'dependenciesBindings'
          }
        },
        _knownDepsVars: {
          '|': {
            '*': 'dependenciesBindings'
          }
        }
      }
    },
    build: {
      useStrict: {
        '|': 'arraysPushOrOverwrite'
      },
      bare: {
        '|': 'arraysPushOrOverwrite'
      },
      globalWindow: {
        '|': 'arraysPushOrOverwrite'
      },
      runtimeInfo: {
        '|': 'arraysPushOrOverwrite'
      },
      template: {
        '|': {
          '*': function(prop, src, dst) {
            return templateBlender.blend(dst[prop], src[prop]);
          }
        }
      },
      debugLevel: {
        '|': {
          '*': function(prop, src) {
            var dl;
            dl = src[prop] * 1;
            if (_.isNumber(dl) && !_.isNaN(dl)) {
              return dl;
            } else {
              l.warn('Not a Number debugLevel: ', src[prop], ' - defaulting to 1.');
              return 1;
            }
          }
        }
      },
      optimize: {
        '|': {
          Boolean: function(prop, src, dst) {
            if (src[prop]) {
              return _optimizers[0];
            }
          },
          String: function(prop, src, dst) {
            var optimizer;
            if (!(optimizer = _.find(_optimizers, function(v) {
              return v === src[prop];
            }))) {
              l.er("Unknown optimize '" + src[prop] + "' - using 'uglify2' as default");
              return _optimizers[0];
            } else {
              return optimizer;
            }
          },
          Object: function(prop, src, dst) {
            var optimizer;
            if (!(optimizer = _.find(_optimizers, function(v) {
              return __indexOf.call(_.keys(src[prop]), v) >= 0;
            }))) {
              l.er("Unknown optimize object", src[prop], " - using 'uglify2' as default");
              return _optimizers[0];
            } else {
              dst[optimizer] = src[prop][optimizer];
              return optimizer;
            }
          }
        }
      }
    }
  }
]);

/*
*dependenciesBindingsBlender*

Converts String, Array<String> or Object {variable:bindingsArrayOfStringsOrString
to the 'proper' dependenciesBinding structure ({dependency1:ArrayOfDep1Bindings, dependency2:ArrayOfDep2Bindings, ...}

So with    *source*                 is converted to proper      *destination*
* String : `'lodash'`                       --->                `{lodash:[]}`

* Array<String>: `['lodash', 'jquery']`     --->            `{lodash:[], jquery:[]}`

* Object: `{lodash:['_'], jquery: '$'}`     --->          as is @todo: convert '$' to proper ['$'], i.e `{lodash:['_'], jquery: ['$']}`

The resulting array of bindings for each 'variable' is blended via arrayizeUniquePusher
to the existing? corresponding array on the destination
*/


dependenciesBindingsBlender = new _B.DeepCloneBlender([
  {
    order: ['src'],
    'String': function(prop, src, dst) {
      var _base, _name;
      dst[prop] || (dst[prop] = {});
      (_base = dst[prop])[_name = src[prop]] || (_base[_name] = []);
      return dst[prop];
    },
    'Array': function(prop, src, dst) {
      var dep, _i, _len, _ref;
      if (!_.isPlainObject(dst[prop])) {
        dst[prop] = {};
      } else {
        _B.mutate(dst[prop], _B.arrayize);
      }
      _ref = src[prop];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dep = _ref[_i];
        dst[prop][dep] = _B.arrayize(dst[prop][dep]);
      }
      return dst[prop];
    },
    'Object': function(prop, src, dst) {
      var dep, depVars, _ref;
      if (!_.isPlainObject(dst[prop])) {
        dst[prop] = {};
      } else {
        _B.mutate(dst[prop], _B.arrayize);
      }
      _ref = src[prop];
      for (dep in _ref) {
        depVars = _ref[dep];
        dst[prop][dep] = arrayizeUniquePusher.blend(dst[prop][dep], depVars);
      }
      return dst[prop];
    }
  }
]);

deepCloneBlender = new _B.DeepCloneBlender;

templateBlender = new _B.DeepCloneBlender([
  {
    order: ['src'],
    'String': function(prop, src, dst) {
      var _ref;
      if (src[prop] !== ((_ref = dst[prop]) != null ? _ref.name : void 0)) {
        dst[prop] = {};
      }
      return deepCloneBlender.blend(dst[prop], {
        name: src[prop]
      });
    },
    '{}': 'templateSetter',
    templateSetter: function(prop, src, dst) {
      var _ref;
      if ((src[prop].name !== ((_ref = dst[prop]) != null ? _ref.name : void 0)) && !_.isUndefined(src[prop].name)) {
        dst[prop] = {};
      }
      return deepCloneBlender.blend(dst[prop], src[prop]);
    }
  }
]);

blendConfigs = function(configsArray, deriveLoader) {
  var finalCfg;
  finalCfg = {};
  deriveLoader = _.isFunction(deriveLoader) ? deriveLoader : function(derive) {
    var cfgObject, err, errMsg;
    if (_.isString(derive)) {
      l.debug(5, "Loading config file: '" + derive + "'");
      try {
        if (cfgObject = require(fs.realpathSync(derive))) {
          return cfgObject;
        }
      } catch (_error) {
        err = _error;
        l.er(errMsg = "Error loading configuration: Can't load '" + derive + "'.", err);
        throw new UError(errMsg, {
          nested: err
        });
      }
    } else {
      if (_.isObject(derive)) {
        return derive;
      }
    }
  };
  _blendDerivedConfigs(finalCfg, configsArray, deriveLoader);
  return finalCfg;
};

_blendDerivedConfigs = function(cfgDest, cfgsArray, deriveLoader) {
  var cfg, derivedObjects, drv, _i;
  for (_i = cfgsArray.length - 1; _i >= 0; _i += -1) {
    cfg = cfgsArray[_i];
    if (!(cfg)) {
      continue;
    }
    derivedObjects = (function() {
      var _j, _len, _ref, _results;
      _ref = _B.arrayize(cfg.derive);
      _results = [];
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        drv = _ref[_j];
        if (drv) {
          _results.push(deriveLoader(drv));
        }
      }
      return _results;
    })();
    if (!_.isEmpty(derivedObjects)) {
      _blendDerivedConfigs(cfgDest, derivedObjects, deriveLoader);
    }
    bundleBuildBlender.blend(cfgDest, moveKeysBlender.blend(addIgnoreToFilezAsExclude(depracatedKeysBlender.blend(cfg))));
  }
  return null;
};

_.extend(blendConfigs, {
  moveKeysBlender: moveKeysBlender,
  depracatedKeysBlender: depracatedKeysBlender,
  templateBlender: templateBlender,
  dependenciesBindingsBlender: dependenciesBindingsBlender,
  bundleBuildBlender: bundleBuildBlender
});

module.exports = blendConfigs;

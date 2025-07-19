/**
 * npm options parser
 * 
 * An option can be set and overridden
 * (last one wins)
 * 
 * "enable_option=true" .npmrc entry
 * - "npm_config_enable_option=true" env variable
 * - "--enable-option" npm install CLI option
 *
 * "magickwand_js_enable_option=true" .npmrc entry 
 * "npm_config_magickwand_js_enable_option=true" env variable
 * "--magickwand_js_enable-option" npm install CLI option
 * 
 * Additionally, a `-conan` or a `-meson` suffix will enable
 * the option only for conan or only for meson - allowing
 * to enable a given feature by using the system-provided
 * library without getting the corresponding package
 * from conan
 */

import * as path from 'node:path';

import * as Liquid from 'liquidjs';

import { mesonBuildOptions, MesonProfile, parseMesonOptions } from './meson.js';
import { conanBuildOptions, parseConanOptions } from './conan.js';
import { IfNpmOption } from './if-unless.js';

module.exports = function (this: Liquid.Liquid) {
  this.registerTag('mesonProfiles', class MesonProfilesDir extends Liquid.Tag {
    render(context: Liquid.Context, emitter: Liquid.Emitter) {
      return path.resolve(__dirname, '..', 'meson');
    }
  })
  this.registerTag('mesonProfile', MesonProfile);
  this.registerTag('conanProfiles', class ConanProfilesDir extends Liquid.Tag {
    render(context: Liquid.Context, emitter: Liquid.Emitter) {
      return path.resolve(__dirname, '..', 'conan');
    }
  })

  this.registerTag('mesonOptions', class MesonOptions extends Liquid.Tag {
    render(context: Liquid.Context, emitter: Liquid.Emitter) {
      const pkgName = context.environments['package'].name as string;
      const mesonOptions = mesonBuildOptions(context.environments['PATH']);
      return parseMesonOptions(pkgName, context.environments['env'], mesonOptions);
    }
  });
  this.registerTag('conanOptions', class ConanOptions extends Liquid.Tag {
    render(context: Liquid.Context, emitter: Liquid.Emitter) {
      const pkgName = context.environments['package'].name as string;
      const conanOptions = conanBuildOptions(context.environments['PATH']);
      return parseConanOptions(pkgName, context.environments['env'], conanOptions);
    }
  });

  this.registerTag('ifNpmOption', IfNpmOption);
  this.registerTag('unlessNpmOption', IfNpmOption);
};

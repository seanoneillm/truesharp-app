const { withDangerousMod, withPlugins } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const withSharpSports = config => {
  return withPlugins(config, [
    // Add iOS source files during prebuild
    config => {
      return withDangerousMod(config, [
        'ios',
        async config => {
          const iosRoot = config.modRequest.platformProjectRoot
          const projectName = config.modRequest.projectName || 'TrueSharp'

          // Create the native module files in the iOS project
          const swiftModuleSource = `
import Foundation
import ExpoModulesCore

// SharpSports native iOS module for TrueSharp app
public class SharpSportsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SharpSports")
        
        Constants([
            "PI": Double.pi
        ])
        
        Function("hello") {
            return "Hello world from SharpSports! 👋"
        }
        
        AsyncFunction("setValueAsync") { (value: String) in
            self.sendEvent("onChange", [
                "value": value
            ])
        }
        
        Events("onChange")
    }
}`

          const objcModuleSource = `
#import <ExpoModulesCore/ExpoModulesCore.h>

@interface EXO_MODULES_NAMESPACE(SharpSportsModule) : EXExportedModule
@end`

          const bridgingHeaderSource = `
//
//  TrueSharp-Bridging-Header.h
//  TrueSharp
//
#import <ExpoModulesCore/ExpoModulesCore.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>`

          // Write the files to the iOS project directory
          const projectDir = path.join(iosRoot, projectName)

          // Ensure the directory exists
          if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true })
          }

          fs.writeFileSync(path.join(projectDir, 'SharpSportsModule.swift'), swiftModuleSource)
          fs.writeFileSync(path.join(projectDir, 'SharpSportsModule.m'), objcModuleSource)
          fs.writeFileSync(
            path.join(projectDir, 'TrueSharp-Bridging-Header.h'),
            bridgingHeaderSource
          )

          return config
        },
      ])
    },
  ])
}

module.exports = withSharpSports

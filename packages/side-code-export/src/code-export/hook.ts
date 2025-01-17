// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { ProjectShape, TestShape } from '@seleniumhq/side-model'
import {
  EmitOptions,
  ExportCommandShape,
  ExportCommandsShape,
  LanguageHooks,
} from '../types'

export type SyntaxFactory = string | ((opts: any) => ExportCommandsShape)

export interface HookProps {
  startingSyntax: SyntaxFactory
  endingSyntax: SyntaxFactory
  registrationLevel: number
}

export interface HookEmitterInput {
  name: string
  tests: TestShape[]
  project: ProjectShape
}

export type HookEmitter = (
  input: HookEmitterInput
) => ExportCommandsShape | ExportCommandShape

export default class Hook {
  constructor({
    startingSyntax = '',
    endingSyntax = '',
    registrationLevel = 0,
  }) {
    this.startingSyntax = startingSyntax
    this.endingSyntax = endingSyntax
    this.registrationLevel = registrationLevel
    this.clearRegister = this.clearRegister.bind(this)
    this.emit = this.emit.bind(this)
    this.emitters = []
    this.register = this.register.bind(this)
    this.isRegistered = this.isRegistered.bind(this)
    this.clearRegister()
  }
  clearRegister() {
    this.emitters = []
  }

  async emit({
    isOptional = false,
    test,
    suite,
    tests,
    project,
    startingSyntaxOptions,
  }: EmitOptions): Promise<ExportCommandsShape> {
    let commands: ExportCommandShape[] = []
    let registeredCommandLevel = 0
    if (this.startingSyntax) {
      const _startingSyntax =
        typeof this.startingSyntax === 'function'
          ? this.startingSyntax(startingSyntaxOptions)
          : this.startingSyntax
      if (typeof _startingSyntax === 'string') {
        commands.push({ level: 0, statement: _startingSyntax })
      } else {
        _startingSyntax.commands.forEach((command) => {
          commands.push(command)
          if (typeof command !== 'string') {
            registeredCommandLevel = command.level
          }
        })
      }
    }
    const name = test ? test.name : suite ? suite.name : ''
    const emittedCommands = (
      await Promise.all(
        this.emitters.map((emitter) => emitter({ name, tests, project }))
      )
    ).filter((entry) => entry != undefined)
    if (isOptional && !emittedCommands.length) {
      return { commands: [] }
    }
    emittedCommands.forEach((command) => {
      if (typeof command === 'string') {
        command.split('\n').forEach((statement) => {
          commands.push({
            level: this.registrationLevel
              ? this.registrationLevel
              : registeredCommandLevel,
            statement,
          })
        })
      } else if ('statement' in command) {
        commands.push(command)
      } else if ('commands' in command) {
        commands = commands.concat(command.commands)
      }
    })
    const _endingSyntax =
      typeof this.endingSyntax === 'function'
        ? this.endingSyntax(startingSyntaxOptions)
        : this.endingSyntax
    if (typeof _endingSyntax === 'string') {
      commands.push({ level: 0, statement: _endingSyntax })
    } else {
      _endingSyntax.commands.forEach((command) => {
        commands.push(command)
      })
    }
    return { commands }
  }

  emitters: HookEmitter[]
  endingSyntax: SyntaxFactory
  registrationLevel: number
  startingSyntax: SyntaxFactory

  register(emitter: HookEmitter) {
    this.emitters.push(emitter)
  }

  async isRegistered(input = '') {
    const result = await Promise.all(
      this.emitters.map((emitter) =>
        emitter({ name: '', tests: [], project: {} as unknown as ProjectShape })
      )
    )
    return result.includes(input)
  }
}

export function clearHooks(hooks: LanguageHooks) {
  Object.values(hooks).forEach((hook) => {
    hook.clearRegister()
  })
}

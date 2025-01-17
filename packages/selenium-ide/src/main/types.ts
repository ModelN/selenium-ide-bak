import { Chrome } from '@seleniumhq/browser-info'
import { Browser } from '@seleniumhq/get-driver'
import { App } from 'electron'
import Store from 'electron-store'
import config from './store/config'
import ArgTypesController from './session/controllers/ArgTypes'
import CommandsController from './session/controllers/Commands'
import DialogsController from './session/controllers/Dialogs'
import DriverController from './session/controllers/Driver'
import MenuController from './session/controllers/Menu'
import PlaybackController from './session/controllers/Playback'
import PluginsController from './session/controllers/Plugins'
import ProjectsController from './session/controllers/Projects'
import RecorderController from './session/controllers/Recorder'
import StateController from './session/controllers/State'
import SuitesController from './session/controllers/Suites'
import TestsController from './session/controllers/Tests'
import WindowsController from './session/controllers/Windows'
import { MainApi } from './api'
import { StorageSchema } from './store'
import SystemController from './session/controllers/System'

export interface BrowserInfo extends Pick<Chrome.BrowserInfo, 'version'> {
  browser: Browser
}

export interface BrowsersInfo {
  browsers: BrowserInfo[]
  selected: BrowserInfo
}

export type Config = typeof config

export type Storage = Store<StorageSchema>

export interface Session {
  api: MainApi
  app: App
  argTypes: ArgTypesController
  commands: CommandsController
  dialogs: DialogsController
  driver: DriverController
  menus: MenuController
  playback: PlaybackController
  plugins: PluginsController
  projects: ProjectsController
  recorder: RecorderController
  state: StateController
  store: Storage
  suites: SuitesController
  system: SystemController
  tests: TestsController
  windows: WindowsController
}

export type SessionControllerKeys = keyof Omit<Session, 'app' | 'api'>

export type SessionApiHandler = (
  path: string,
  session: Session
) => (...args: any[]) => any

export type MenuComponent = (
  session: Session
) => () => Promise<Electron.MenuItemConstructorOptions[]>


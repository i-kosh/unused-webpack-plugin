import type { Compiler } from 'webpack'
import { isAbsolute, parse, resolve } from 'path'
import { readdir, stat, writeFile } from 'fs/promises'
import { isMatch } from 'micromatch'
import { validate } from 'schema-utils'

const isIterable = (iterable: any): iterable is Iterable<any> => {
  return iterable && iterable[Symbol.iterator]
}

interface ConstructorParams {
  exclude?: string[]
  outputFile?: string
}

export class UnusedPlugin {
  private pluginName: string
  private usedFilesList: Set<string>
  private filesList: Set<string>
  private excludeGlobs: string[]
  private outputFile?: string
  private defaultFileName: string

  constructor(params?: ConstructorParams) {
    this.pluginName = 'UnusedPlugin'
    this.defaultFileName = 'unused.json'

    validate(
      {
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
      },
      params || {},
      {
        name: this.pluginName,
        baseDataPath: 'params',
      }
    )

    this.usedFilesList = new Set()
    this.filesList = new Set()
    this.excludeGlobs = [
      '**/node_modules',
      '**/.*',
      `**/${this.defaultFileName}`,
    ]

    if (params?.exclude) {
      this.excludeGlobs.push(...params.exclude)
    }

    if (params?.outputFile) {
      this.outputFile = params.outputFile
    }
  }

  private async parseDirectory(path: string): Promise<string[]> {
    const files: string[] = []

    const dirEntrys = await readdir(path)
    const fileOrDirStat: ReturnType<typeof stat>[] = []
    const fileOrDirStatPathMap: string[] = []

    dirEntrys.forEach((pathToFileOrDir) => {
      const absPath = resolve(path, pathToFileOrDir)
      fileOrDirStat.push(stat(absPath))
      fileOrDirStatPathMap.push(absPath)
    })

    const stats = await Promise.all(fileOrDirStat)

    const recursivePaths: ReturnType<UnusedPlugin['parseDirectory']>[] = []

    stats.forEach((fileOrDirStat, i) => {
      const fileOrDirPath = fileOrDirStatPathMap[i]

      if (fileOrDirStat.isDirectory()) {
        if (!isMatch(fileOrDirPath, this.excludeGlobs)) {
          recursivePaths.push(this.parseDirectory(fileOrDirPath))
        }
      } else if (fileOrDirStat.isFile()) {
        if (!isMatch(fileOrDirPath, this.excludeGlobs)) {
          files.push(fileOrDirPath)
        }
      }
    })

    const recursivePathsResolved = await Promise.all(recursivePaths)
    files.push(...recursivePathsResolved.flat())

    return files
  }

  private async collectFilesPaths(compiler: Compiler) {
    const entry = compiler.options.entry
    const entryStatic = typeof entry === 'function' ? await entry() : entry
    const entyKeys = Object.keys(entryStatic)
    const wait: ReturnType<UnusedPlugin['parseDirectory']>[] = []

    entyKeys.forEach((key) => {
      const entry = entryStatic[key]

      if (entry.import) {
        entry.import.forEach((path) => {
          if (isAbsolute(path)) {
            const dir = parse(path).dir
            wait.push(this.parseDirectory(dir))
          } else {
            const dir = resolve(compiler.context, path)
            wait.push(this.parseDirectory(dir))
          }
        })
      }
    })

    const paths = await Promise.all(wait)
    paths.flat().forEach((path) => this.filesList.add(path))
  }

  private async emitToFile(to: string, data: unknown) {
    const dataString = JSON.stringify(
      isIterable(data) ? Array.from(data) : data
    )
    await writeFile(to, dataString)
  }

  public apply(compiler: Compiler): void {
    const collectFilesPromise = this.collectFilesPaths(compiler)

    compiler.hooks.compilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.buildModule.tap(this.pluginName, (module) => {
        this.usedFilesList.add(module.identifier())
      })
    })

    compiler.hooks.finishMake.tapAsync(
      this.pluginName,
      async (compilation, cb) => {
        try {
          await collectFilesPromise
          this.usedFilesList.forEach((usedPath) => {
            this.filesList.delete(usedPath)
          })

          const pathToFile = this.outputFile
            ? this.outputFile
            : resolve(compiler.context, this.defaultFileName)

          await this.emitToFile(pathToFile, this.filesList)

          cb()
        } catch (error) {
          cb(error)
        }
      }
    )
  }
}
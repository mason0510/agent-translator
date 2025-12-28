import { z } from "zod"
import { readFile } from "fs/promises"
import { extname } from "path"
import type { FileContent, ToolCallResult, ToolContext } from "../types/index.js"

export interface FileReaderInput {
  filePath: string
}

export class FileReaderTool {
  name = "file_reader"
  description = "Read local text files (.md, .txt, .html, etc.) and return structured content"
  
  inputSchema = z.object({
    filePath: z.string().describe("The local file path to read")
  })

  async prompt(input: FileReaderInput): Promise<string> {
    return `Reading file: ${input.filePath}`
  }

  async* call(
    input: FileReaderInput,
    context: ToolContext
  ): AsyncGenerator<ToolCallResult, void, unknown> {
    try {
      const { filePath } = input
      const ext = extname(filePath).toLowerCase()
      
      // Check if it's a supported text file
      const supportedExtensions = [
        '.md', '.txt', '.html', '.htm', '.json', 
        '.js', '.ts', '.jsx', '.tsx', '.css', 
        '.xml', '.csv', '.yaml', '.yml'
      ]
      
      if (!supportedExtensions.includes(ext)) {
        throw new Error(
          `Unsupported file type: ${ext}. Supported types: ${supportedExtensions.join(', ')}`
        )
      }

      const content = await readFile(filePath, 'utf-8')
      const filename = filePath.split('/').pop() || filePath
      const stats = await import('fs/promises').then(fs => fs.stat(filePath))

      const result: FileContent = {
        name: filename,
        content,
        type: ext,
        size: stats.size
      }

      yield {
        type: 'file_read',
        data: result
      }
    } catch (error) {
      yield {
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          filePath: input.filePath
        }
      }
    }
  }

  async readFileContent(filePath: string): Promise<FileContent> {
    const context: ToolContext = {
      abortController: new AbortController(),
      options: { isNonInteractiveSession: true }
    }

    for await (const result of this.call({ filePath }, context)) {
      if (result.type === 'file_read') {
        return result.data as FileContent
      } else if (result.type === 'error') {
        throw new Error(result.data.message)
      }
    }

    throw new Error('File reading failed')
  }
}
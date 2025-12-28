import { z } from "zod"
import axios from "axios"
import type { UrlContent } from "../types/index.js"

const CRAWL4AI_API_URL = process.env.CRAWL4AI_API_URL || "http://localhost:11235"

export class UrlFetcherTool {
  name = "url_fetcher"
  description = "Fetch content from HTTP(S) URLs using Crawl4AI service"
  
  inputSchema = z.object({
    url: z.string().url().describe("The HTTP(S) URL to fetch content from")
  })

  private async crawl(url: string): Promise<string> {
    const response = await axios.post(`${CRAWL4AI_API_URL}/crawl`, {
      urls: [url],
      priority: 10
    })
    if (response.status !== 200 || !response.data.task_ids?.[0]) {
      throw new Error("Failed to submit crawl task to Crawl4AI")
    }
    return response.data.task_ids[0]
  }

  private async getTaskResult(taskId: string): Promise<any> {
    for (let i = 0; i < 30; i++) { // Poll for 30 seconds max
      const response = await axios.get(`${CRAWL4AI_API_URL}/task/${taskId}`)
      if (response.status === 200 && response.data.status === 'completed') {
        if (response.data.result.status === 'success') {
          return response.data.result.data
        } else {
          throw new Error(`Crawl4AI failed to fetch URL: ${response.data.result.error}`)
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    throw new Error("Crawl4AI task timed out")
  }

  async fetchUrlContent(url: string): Promise<UrlContent> {
    try {
      const taskId = await this.crawl(url)
      console.log(`[UrlFetcherTool] Submitted crawl task for ${url}. Task ID: ${taskId}`)
      
      const result = await this.getTaskResult(taskId)
      console.log(`[UrlFetcherTool] Received crawl result for Task ID ${taskId}:`, JSON.stringify(result, null, 2))
      
      return {
        url: result.url,
        title: result.title,
        content: result.html_content,
        markdown: result.markdown_content
      }
    } catch (error: any) {
      console.error(`[UrlFetcherTool] Error fetching ${url}:`, error.message)
      throw new Error(error.message || `Failed to fetch content from URL: ${url}`)
    }
  }
}
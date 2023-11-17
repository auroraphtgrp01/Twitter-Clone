import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { __IS_PRODUCTION__ } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'

config()

class Queue {
  item: string[]
  encoding: boolean
  constructor() {
    this.item = []
    this.encoding = false
  }
  enqueue(item: string) {
    this.item.push(item)
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.item.length > 0) {
      this.encoding = true
      const videoPath = this.item[0]
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.item.shift()
        await fsPromise.unlink(videoPath)
        console.log('Encode Video Done ', videoPath)
      } catch (error) {
        console.log('Encode Video Error: ' + error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode Video Queue Empty')
    }
  }
}
const queue = new Queue()
class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: __IS_PRODUCTION__
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    console.log('files', files)

    const result = files.map((file) => {
      return {
        url: __IS_PRODUCTION__
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediaType.Video
      }
    })
    return result
  }
  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result = await Promise.all(
      files.map(async (file) => {
        queue.enqueue(file.filepath)
        const nameFile = getNameFromFullName(file.newFilename)
        return {
          url: __IS_PRODUCTION__
            ? `${process.env.HOST}/static/video-hls/${nameFile}`
            : `http://localhost:${process.env.PORT}/static/video-hls/${nameFile}`,
          type: MediaType.HLS
        }
      })
    )
    return result
  }
}

const mediaService = new MediaService()
export default mediaService

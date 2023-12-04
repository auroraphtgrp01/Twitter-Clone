import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFiles, getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { __IS_PRODUCTION__ } from '~/constants/config'
import { config } from 'dotenv'
import { EncodingStatus, MediaType } from '~/constants/enums'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import { split } from 'lodash'
import databaseService from './database.services'
import { VideoStatus } from '~/models/schemas/VideoStatus.schemas'
import { uploadFileToS3 } from '~/utils/s3'

config()

class Queue {
  item: string[]
  encoding: boolean
  constructor() {
    this.item = []
    this.encoding = false
  }
  async enqueue(item: string) {
    this.item.push(item)
    const nameID = getNameFromFullName(item.split('/').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: nameID,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.item.length > 0) {
      this.encoding = true
      const videoPath = this.item[0]
      const nameID = getNameFromFullName(videoPath.split('\\').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: nameID
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.item.shift()
        await fsPromise.unlink(videoPath)
        const name = nameID.split(/\\/)[nameID.split(/\\/).length - 1]
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, nameID))
        await Promise.all(
          files.map((filepath) => {
            const fileName = 'video-hls' + filepath.replace(path.resolve(UPLOAD_VIDEO_DIR), '').replace(/\\/g, '/')
            return uploadFileToS3({
              filePath: filepath,
              fileName: fileName,
              contentType: 'application/x-mpegURL'
            })
          })
        )
        await databaseService.videoStatus.updateOne(
          {
            name: nameID
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log('Encode Video Done ', videoPath)
      } catch (error) {
        console.log('Encode Video Error: ' + error)
        await databaseService.videoStatus
          .updateOne(
            {
              name: nameID
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.log('Update Video Status Error: ' + err)
          })
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
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Reult = await uploadFileToS3({
          fileName: 'images/' + newFullFileName,
          filePath: newPath,
          contentType: 'image/jpeg'
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        // return {
        //   url: __IS_PRODUCTION__
        //     ? `${process.env.HOST}/static/image/${newFullFileName}`
        //     : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
        //   type: MediaType.Image
        // }
        return {
          url: s3Reult.Location,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result = await Promise.all(
      files.map(async (file) => {
        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + file.newFilename,
          contentType: 'video/mp4',
          filePath: file.filepath
        })
        fs.unlinkSync(file.filepath)
        return {
          url: s3Result.Location,
          type: MediaType.Video
        }
        // return {
        //   url: __IS_PRODUCTION__
        //     ? `${process.env.HOST}/static/video/${file.newFilename}`
        //     : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        //   type: MediaType.Video
        // }
      })
    )

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
  async getVideoStatus(id: string) {
    const db = await databaseService.videoStatus.findOne({
      name: id
    })
    return db
  }
}

const mediaService = new MediaService()
export default mediaService

import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import mediaService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'
import { split } from 'lodash'
import { USER_MESSAGES } from '~/constants/messages'
import { sendFileFromS3 } from '~/utils/s3'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.uploadImage(req)
  console.log(result)
  return res.json({
    result: result
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.uploadVideo(req)
  console.log(result)
  return res.json({
    result: result
  })
}
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.uploadVideoHLS(req)
  return res.json({
    result: result
  })
}
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  console.log('name', name)
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR + '/', name), (err) => {
    if (err) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('Not Found !!!')
    }
  })
}
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1 MB = 10 ** 6 bytes theo hệ thập phân
  // 1 MB = 2 ** 20 bytes theo hệ nhị phân

  // Dung lượng video (bytes) F
  const videoSize = fs.statSync(videoPath).size
  // Dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 30 * 10 ** 6
  // Lấy giá trị byte bắt đầu từ headers Range ( vd: bytes=0-1000000 )
  const start = Number(range.replace(/\D/g, ''))
  // Lấy giá trị kết thúc, vượt quá dung lượng video thì lấy giá trị videoSize
  const end = Math.min(start + chunkSize, videoSize - 1)
  // Dung lượng thực tế cho mỗi đoạn video stream
  // Thường đây sẽ là chunkSize, ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
export const serveM3U8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR + '/', id, 'master.m3u8'), (err) => {
  //   if (err) {
  //     return res.status(HTTP_STATUS.NOT_FOUND).send('Not Found !!!')
  //   }
  // })
  sendFileFromS3(res, `video-hls/${id}/master.m3u8`)
}
export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  sendFileFromS3(res, `video-hls/${id}/${v}/${segment}`)
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR + '/', id, v, segment), (err) => {
  //   if (err) {
  //     return res.status(HTTP_STATUS.NOT_FOUND).send('Not Found !!!')
  //   }
  // })
}

export const videoStatusMediaController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const result = await mediaService.getVideoStatus(id as string)
  return res.json({
    status:
      result?.status == 0 ? 'Pending' : result?.status == 1 ? 'Processing' : result?.status == 2 ? 'Success' : 'Failed',
    result: result !== null ? result : "Don't have this video"
  })
}

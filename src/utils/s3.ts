import { S3 } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'
config()
const s3 = new S3({
  region: process.env.AWS_REGION as string, credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})
export const uploadFileToS3 = ({
  fileName,
  filePath,
  contentType
}: {
  fileName: string
  filePath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: 'twitter-clone-4869',
      Key: fileName,
      Body: fs.readFileSync(path.resolve(filePath)),
      ContentType: contentType
    },
    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })
  return parallelUploads3.done()
}


// parallelUploads3.on("httpUploadProgress", (progress) => {
//   console.log(progress);
// });

// parallelUploads3.done().then(res => {
//   console.log(res)
// })

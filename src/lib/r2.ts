import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_S3_API,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

/**
 * R2 파일 복사 (Get -> Put 방식)
 * @param sourceKey - 원본 파일 키 (예: "temp/image.png")
 * @param targetKey - 대상 파일 키 (예: "blogs/image.png")
 * @returns 복사된 파일의 공개 URL
 */
export async function copyFileInR2(sourceKey: string, targetKey: string): Promise<string> {
  try {
      // 1. 원본 파일 가져오기
      const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: sourceKey,
      });
      const { Body, ContentType } = await r2Client.send(getCommand);

      if (!Body) {
          throw new Error(`File not found: ${sourceKey}`);
      }

      // 2. 새 위치에 업로드
      // Body(ReadableStream)를 바로 PutObject에 전달 (스트리밍 업로드)
      const putCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: targetKey,
          Body: Body as any, 
          ContentType: ContentType,
      });
      await r2Client.send(putCommand);

      return `${PUBLIC_URL}/${targetKey}`;
  } catch (error) {
      console.error("R2 Copy failed:", error);
      throw error;
  }
}


/**
 * R2에 파일 업로드
 * @param key - 저장할 파일 경로 (예: "images/profile/user123.jpg")
 * @param file - File 객체 또는 Buffer
 * @param contentType - MIME 타입 (예: "image/jpeg")
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadToR2(
  key: string,
  file: File | Buffer,
  contentType?: string
): Promise<string> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType || (file instanceof File ? file.type : undefined),
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

/**
 * R2에서 파일 삭제
 * @param key - 삭제할 파일 경로
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * R2에서 여러 파일 삭제
 * @param keys - 삭제할 파일 경로 배열
 */
export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    })
  );
}

/**
 * URL에서 R2 키 추출
 * @param url - R2 공개 URL
 * @returns 파일 키 (경로)
 */
export function getKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
  } catch (e) {
    return url.replace(`${PUBLIC_URL}/`, "");
  }
}

import "server-only"; // 关键：确保此模块只在服务端运行

import { Signer } from "@volcengine/openapi"
import { RequestObj } from "@volcengine/openapi/lib/base/types"

export const signHeader = (data: RequestObj) => {
  const accessKey = process.env.VOLCENGINE_ACCESS_KEY
  const secretKey = process.env.VOLCENGINE_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error("Missing VOLCENGINE_ACCESS_KEY or VOLCENGINE_SECRET_KEY")
  }

  const signer = new Signer(data, "rtc")
  signer.addAuthorization({
    accessKeyId: accessKey,
    secretKey: secretKey,
  })
}

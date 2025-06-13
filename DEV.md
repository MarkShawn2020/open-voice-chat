# 开发经验总结

## 第三方SDK兼容性问题

### @volcengine/openapi SDK 在 Next.js 中的使用

**问题描述：**
在 Next.js 的 Server Actions 中使用 `@volcengine/openapi` SDK 时，会出现以下错误：
```
TypeError: Cannot set properties of undefined (setting 'xxh_update')
```

**根本原因：**
- `@volcengine/openapi` SDK 内部使用了 WebAssembly (WASM) 模块
- Next.js 的 webpack 打包环境无法正确处理 WASM 依赖
- 特别是 SDK 中的 lz4.js 压缩算法模块在服务端渲染环境中不兼容

**解决方案：**
在 `next.config.ts` 中添加 `serverExternalPackages` 配置，将火山引擎 SDK 隔离到 Node.js 环境中：

```typescript
const config: NextConfig = {
  // 其他配置...
  serverExternalPackages: [
    // 火山sdk用到了wasm，必须隔离在nodejs环境里，否则会报错
    "@volcengine/openapi"
  ],
}
```

**适用场景：**
- 任何在 Next.js Server Actions 中使用包含 WASM 模块的第三方 SDK
- 其他可能包含原生二进制依赖的 Node.js 包

**注意事项：**
- 不要尝试将这类 SDK 移动到 `/app/api/` 路由中来解决问题，根本原因是 webpack 打包问题
- 不要移除 `"use server"` 指令，Server Actions 本身没有问题
- 确保在 `serverExternalPackages` 中包含所有相关的依赖包名
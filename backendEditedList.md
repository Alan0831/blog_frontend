# 后端修改记录

## 已修改或已优化

1. 评论/回复删除权限已改为服务端校验。
   - token 校验通过后会把解析出的用户信息挂到 `req.user`。
   - `/deleteComment`、`/deleteVideoComment` 删除时不再信任请求体里的用户字段。
   - 普通用户只能删除自己发布的评论或回复。
   - 管理员 `role === 1` 可以删除任意评论或回复。
   - 无权限时返回 `COMMENT_DELETE_FORBIDDEN`。

2. 评论内容已增加后端校验。
   - 评论和回复都会先去掉首尾空格。
   - 去掉空格后为空会返回 `COMMENT_EMPTY`。
   - 一级评论限制 500 字以内。
   - 回复限制 300 字以内。
   - 超长会返回 `COMMENT_TOO_LONG`。

3. 创建评论接口返回结构已统一。
   - `/createComment` 和 `/createVideoComment` 都统一返回：
     ```json
     {
       "comments": []
     }
     ```
   - 视频评论里的回复字段已额外统一成 `replies`。

4. 新增评论分页查询接口。
   - 支持 `GET /commit/api/comments?targetType=article&targetId=1&pageNum=1&pageSize=20`
   - 支持 `GET /commit/api/comments?targetType=video&targetId=1&pageNum=1&pageSize=20`
   - 也兼容 `POST /commit/api/comments`。
   - 返回包含 `count`、`rows`、`comments`、`pageNum`、`pageSize`。

5. `/editArticle` 已支持字段未传则保持原值。
   - `title`、`content`、`articleCover`、`visibleType`、`classId`、`tagList` 都只在请求体传入时更新。
   - 加锁文章编辑时，如果未传 `password` 或 `password` 为空字符串，会保留原密码。

6. `/findArticleById` 返回字段已补齐并稳定化。
   - 稳定返回 `id`、`title`、`content`、`tagList`、`visibleType`、`articleCover`、`articleclassId`。
   - `tagList` 后端会尽量返回数组。
   - `articleCover` 没有值时返回空字符串。
   - `articleclassId` 没有值时返回 `null`。

7. `/editVideo` 已支持字段未传则保持原值。
   - `title`、`content`、`visibleType`、`poster`、`videoUrl` 都只在请求体传入时更新。
   - 未传 `videoUrl` 不会清空原视频地址。
   - 未传 `poster` 不会清空原封面。

8. `/findVideoById` 返回字段已补齐并稳定化。
   - 稳定返回 `id`、`title`、`content`、`videoUrl`、`poster`、`visibleType`。
   - `poster` 没有值时返回空字符串。
   - 额外提供统一后的 `comments` 字段，评论回复统一放在 `replies`。

9. 分片上传相关接口错误返回已优化。
   - `/verify` 稳定返回 `existFile`、`existChunks`、`videoUrl`。
   - `/uploadChunks` 分片上传失败时返回非 200 状态和 `VIDEO_CHUNK_UPLOAD_FAILED`。
   - `/mergeChunks` 找不到分片时返回 `VIDEO_CHUNKS_NOT_FOUND`。
   - `/mergeChunks` 合并失败时返回非 200 状态和 `VIDEO_MERGE_FAILED`。

10. 通用错误响应支持 `errorCode`。
    - `packageResponse('error', ...)` 现在会把传入的 `errorCode` 一并返回给前端。

## 需要前端配合

1. 评论和视频评论建议统一读取 `data.comments`。
   - 原视频评论字段 `videocomments` 后续建议不再依赖。
   - 评论项中的回复统一读取 `comment.replies`。

2. 评论错误提示建议优先使用 `errorCode`。
   - `COMMENT_EMPTY`：评论内容为空。
   - `COMMENT_TOO_LONG`：评论内容超长。
   - `COMMENT_DELETE_FORBIDDEN`：无权删除该评论或回复。

3. 评论分页建议改用独立接口加载。
   - 文章评论：`/commit/api/comments?targetType=article&targetId=文章ID&pageNum=1&pageSize=20`
   - 视频评论：`/commit/api/comments?targetType=video&targetId=视频ID&pageNum=1&pageSize=20`
   - 详情接口里仍可能带评论数据，但后续页面首屏加载建议使用分页接口。

4. 编辑文章时，不想修改的字段可以不传。
   - 加锁文章密码输入框留空时，可以不传 `password`，或者传空字符串，后端会保留旧密码。
   - 不修改封面时不要传 `articleCover`。

5. 编辑视频时，不想修改的字段可以不传。
   - 不修改视频文件时不要传 `videoUrl`。
   - 不修改封面时不要传 `poster`。

6. 视频详情建议优先读取统一字段。
   - 评论读取 `data.comments`。
   - 回复读取 `comment.replies`。
   - 封面读取 `data.poster`，没有封面时会是空字符串。

7. 分片上传失败时，前端可以根据状态码和 `errorCode` 做重试或提示。
   - `VIDEO_CHUNK_UPLOAD_FAILED`：单片上传失败，可提示重试当前分片。
   - `VIDEO_CHUNKS_NOT_FOUND`：合并前没有找到分片，需要重新上传。
   - `VIDEO_MERGE_FAILED`：合并失败，可提示稍后重试或重新上传。

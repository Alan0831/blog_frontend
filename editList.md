# 评论功能后端待办

## 必须修复的安全问题

1. 删除评论/回复接口需要增加服务端权限校验。
   - 普通用户只能删除自己发布的评论或回复。
   - 管理员可以删除任意评论或回复。
   - 不要只依赖前端是否展示“删除”按钮来判断权限。
   - 涉及接口：`/deleteComment`、`/deleteVideoComment`。
   - 操作者身份建议从 token/session 中解析，不要信任请求体里任意传入的用户字段。

## 建议统一的接口规范

2. 建议统一“创建评论”接口的返回结构。
   - 当前文章评论接口返回 `comments`。
   - 当前视频评论接口返回 `videocomments`。
   - 建议文章和视频统一返回：
     ```json
     {
       "comments": []
     }
     ```
   - 涉及接口：`/createComment`、`/createVideoComment`。

3. 建议统一回复字段名称。
   - 当前文章评论的回复字段是 `replies`。
   - 当前视频评论的回复字段是 `videoreplies`。
   - 建议统一为 `replies`，评论项结构建议如下：
     ```json
     {
       "id": 1,
       "content": "评论内容",
       "createdAt": "2026-06-10 12:00:00",
       "user": { "id": 1, "username": "alan", "avatar": "" },
       "replyTo": null,
       "replyUser": "",
       "replies": []
     }
     ```

4. 评论内容需要在后端做校验。
   - 去掉首尾空格后不能为空。
   - 一级评论建议限制在 500 字以内。
   - 回复建议限制在 300 字以内。
   - 建议返回明确错误码或错误信息，例如：`COMMENT_EMPTY`、`COMMENT_TOO_LONG`。

5. 建议增加评论分页查询接口。
   - 评论数量变多后，如果全部挂在文章/视频详情接口里返回，会影响详情页首屏加载速度。
   - 建议提供独立分页接口，例如：
     - `GET /comments?targetType=article&targetId=1&pageNum=1&pageSize=20`
     - `GET /comments?targetType=video&targetId=1&pageNum=1&pageSize=20`

# 写文章页面后端待办

## 建议优化的文章编辑接口

1. `/editArticle` 建议支持“字段未传则保持原值”。
   - 前端编辑加锁文章时，密码输入框留空表示不修改原密码。
   - 如果请求体没有 `password` 字段，后端应保持原密码，不要清空或覆盖为 `null`。
   - 如果请求体没有 `articleCover` 字段，后端也建议保持原封面。

2. `/findArticleById` 返回编辑态详情时建议保证以下字段稳定存在。
   - `id`：文章 ID。
   - `title`：文章标题。
   - `content`：文章 HTML 内容。
   - `tagList`：建议统一为数组；如果继续返回 JSON 字符串，需保证是合法 JSON。
   - `visibleType`：文章可见类型。
   - `articleCover`：文章封面地址，没有封面时返回空字符串。
   - `articleclassId`：文章分类 ID，没有分类时返回 `null`。

# 上传视频页面后端待办

## 建议优化的视频编辑接口

1. `/editVideo` 建议支持“字段未传则保持原值”。
   - 如果请求体没有 `videoUrl` 字段，后端应保持原视频地址，不要清空。
   - 如果请求体没有 `poster` 字段，后端应保持原封面，不要覆盖为 `null`。
   - 前端当前会尽量传入编辑态已有值，但后端兜底可以避免异常编辑导致数据丢失。

2. `/findVideoById` 返回编辑态详情时建议保证以下字段稳定存在。
   - `id`：视频 ID。
   - `title`：视频标题。
   - `content`：视频描述。
   - `videoUrl`：视频播放地址。
   - `poster`：视频封面地址，没有封面时返回空字符串。
   - `visibleType`：视频可见类型。

3. 分片上传相关接口建议返回明确错误信息。
   - `/verify` 建议稳定返回 `existFile`、`existChunks`、`videoUrl`。
   - `/mergeChunks` 合并失败时建议返回明确错误码或错误信息，例如：`VIDEO_MERGE_FAILED`。
   - `/uploadChunks` 单个分片失败时建议返回非 200 状态，方便前端提示重试。

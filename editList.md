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

# language: zh
功能: 稿台 V1
  已登录作者在 Board 中收集 file、阅读并高亮，用 Board 内 Task chat 消化原料，再经 Write 按体裁生成四类彼此独立的中文文档。
  长文、短文提纲、小红书图文、口播稿是兄弟文档：可只生成一种，可并存，可重复生成；不是把长文改写成其他体裁。
  每篇按体裁复制为可粘贴纯文本，并有各自的公开只读 Share。界面中文优先；材料可以是中文或英文。
  壳上若干入口保持原样，V1 点击为未开放。

  背景:
    假如 作者已登录

  场景: 打开应用落在 New task 而非 Board 列表
    当 作者打开应用
    那么 落在 New task
    而且 中央可见 "What can I do for you?"
    而且 不是 Board 列表页

  场景: 全局左侧栏含规定入口
    当 作者查看全局左侧栏
    那么 可见 New task、Boards、Skills、Sprite、Search
    而且 可见 Recents
    而且 底部可见 Upgrade 与账户（Free 类徽章可为占位）

  场景: New task 提问框与页签可见
    假如 作者在 New task
    那么 提问框占位为 "Describe a task or ask anything"
    而且 可见 +、cube、Auto、mic、提交
    而且 下方可见 For you、Research、Write、Image、Slides、Video、Webpage 与 Browse all

  场景: 无当前 Board 时须先创建或选择才能继续 New task
    假如 作者在 New task 且当前没有 Board
    当 作者提交一项 New task
    那么 须先创建或选择一个 Board 才能继续
    而且 顶栏显示当前 Board

  场景: 顶栏可切换当前 Board
    假如 作者已有至少两个 Board
    当 作者在顶栏切换当前 Board
    那么 当前 Board 变为所选 Board

  场景: cube 打开 Create 菜单
    假如 作者在 New task 或 Board 内提问框
    当 作者打开 cube
    那么 可见 Create：Research、Write、Create image、Create slides、Create video、Build webpage
    而且 可见 Use skill 与 Chat mode

  场景: 加号打开添加菜单
    假如 作者在 New task 或 Board 内提问框
    当 作者打开 +
    那么 可见 Add from files、从稿台已有 file 加入、Use browser 开关、Add connectors

  场景: Create 菜单没有四种体裁按钮
    假如 作者已打开 cube 的 Create 菜单
    那么 菜单上没有「长文」「短文提纲」「小红书图文」「口播稿」四个按钮
    而且 体裁选择只出现在 Write 流程内

  场景: Boards 页可新建 Board
    假如 作者打开 Boards
    那么 标题为 Boards
    而且 可见 + New board、Recents 卡片、Active / Archived，以及网格或列表
    而且 Archived 可以为空
    当 作者执行 New board 并确认
    那么 出现一个可打开的 Board

  场景: 打开已有 Board
    假如 Boards 中已有一个 Board
    当 作者打开该 Board
    那么 进入该 Board
    而且 顶栏显示该 Board 为当前 Board

  场景: 重命名 Board
    假如 已有一个 Board
    当 作者将其重命名为新名称
    那么 Boards 列表中显示新名称

  场景: 删除自己的 Board 后列表消失
    假如 Boards 列表中已有作者自己的 Board
    当 作者删除该 Board
    那么 该 Board 从列表中消失

  场景: Board 内分段为 Tasks Files globe 与加号
    假如 作者在一个 Board 内
    那么 左侧可见 Board 名称
    而且 可见分段 Tasks、Files、globe、+

  场景: Your files 列表与中间阅读器或文档画布可同时可见
    假如 作者在 Board 的 Files
    那么 可见 Your files 列表
    而且 中间为卡片墙或阅读器或文档画布
    而且 Your files 列表与中间阅读器或文档画布可同时可见

  场景: Tasks 空状态为 Nothing here
    假如 作者打开一个尚无 task 的 Board 的 Tasks
    那么 可见 Your tasks 列表
    而且 空状态为 "Nothing here"

  场景: Board 内 New task 显示同一提问框
    假如 作者在 Board 内
    当 作者发起 New task
    那么 可见与首页相同的 "What can I do for you?" 提问框

  场景: Board 内加号含 New task New document Add sources
    假如 作者在 Board 内
    当 作者打开分段旁的 +
    那么 可见 New task、New document、Add sources

  场景: 作者想法用 New document 且无独立笔记对象
    假如 作者在 Board 内要写下自己的想法
    当 作者执行 New document
    那么 得到一篇可编辑标题与正文的文档
    而且 界面没有独立的笔记对象

  场景: globe 整 Board 发布入口存在点击为未开放
    假如 作者在 Board 内
    当 作者点击 globe
    那么 该入口存在
    而且 V1 显示未开放
    而且 不能完成整 Board 发布

  场景: Add sources 加入至少一条链接和一个本地文件
    假如 作者在当前 Board 打开 Add sources
    当 作者粘贴至少一条链接并上传至少一个本地文件
    那么 可见进度 Adding materials… (n/m)
    而且 这些条目出现在 Your files
    而且 链接与本地文件均可打开阅读或查看

  场景: 网页 file 干净阅读器带来源芯片与 Share
    假如 Your files 中有一条网页 file
    当 作者打开该 file
    那么 进入干净阅读器
    而且 可见来源芯片
    而且 工具栏可见 Share

  场景: 文档 file 可编辑标题正文且工具栏有 Share
    假如 Your files 中有一篇文档 file
    当 作者打开该文档
    那么 进入文档画布
    而且 标题与正文可编辑
    而且 工具栏可见 Share

  场景: 图片可查看且 YouTube 与音频出现在 Your files
    假如 作者在 Add sources 上传一张图片、粘贴一条 YouTube 链接、上传一段音频
    那么 三条都出现在 Your files
    而且 图片可打开查看

  场景: Research 无结果不阻断 Add sources
    假如 作者在当前 Board 执行 Research
    当 没有可加入的结果
    那么 Board 可以为空
    而且 不阻断 Add sources
    而且 作者仍可粘贴链接或上传文件

  场景: 高亮所选文字属于该 file 并可勾选
    假如 作者已打开一条可读 file
    当 作者对所选文字执行高亮
    那么 该高亮属于这条 file
    而且 该高亮可被勾选用于 Task 或 Write

  场景: 音视频转录成功可按时间轴跳转
    假如 Your files 中有一条音或视频 file 且转录成功
    当 作者打开该 file
    那么 可见转录文本
    而且 作者可按时间轴跳转到对应位置

  场景: 转录失败有提示且不挡其他 file
    假如 Your files 中已有一条音或视频 file，以及至少另一条 file
    当 该音或视频转录失败
    那么 该 file 显示失败提示
    而且 原始链接或文件仍可打开
    而且 另一条 file 仍可正常打开

  场景: 可将 file 放入文件夹且未分组仍可见
    假如 Files 中可见新建文件夹图标
    当 作者新建文件夹并把一条 file 放入其中
    那么 该 file 出现在该文件夹下
    而且 未放入文件夹的 file 仍然可见
    而且 没有看板

  场景: Board 内 Task chat 基于 file 与高亮作答并指回来源
    假如 当前 Board 中已有可阅读的 file 与高亮
    当 作者在 Board 内 Task chat 就这些 file 与高亮提问
    那么 回答可见地标出所用 file 或高亮
    而且 作者能分辨依据了哪条来源

  场景: Chat 气泡形态与 Message 输入区
    假如 作者在 Board 内 Chat
    那么 用户气泡右对齐
    而且 回答下工具条可见复制、保存、重试、赞/踩
    而且 可见 Ran for Ns 与回答
    而且 若还有翻译类等多余图标，入口可在，V1 未开放
    而且 输入区标签为 Message
    而且 仍有 + 与 cube

  场景: Chat mode 不要求先生成文档
    假如 当前 Board 中还没有任何 Write 文档
    当 作者选择 Chat mode 并提问
    那么 可以开始 Board 内 Chat
    而且 不要求先生成一篇文档

  场景: Write 流程内选择四种中文模板
    假如 作者从 Create 的 Write、Write 页签、或对着已勾选的 file 与高亮进入 Write
    当 作者选择体裁
    那么 体裁选择在 Write 流程内
    而且 可见四种中文模板名：长文、短文提纲、小红书图文、口播稿
    而且 Create 菜单上没有这四个按钮

  场景: 按长文模板生成独立文档
    假如 作者已勾选若干 file 与高亮
    当 作者在 Write 中选择「长文」并生成
    那么 Files 中出现一篇独立文档：标题、连续分段正文、可见来源
    而且 Tasks 中可以有对应这次 Write 的 task

  场景: 按短文提纲模板生成独立文档
    假如 作者已勾选若干 file 与高亮
    当 作者在 Write 中选择「短文提纲」并生成
    那么 Files 中出现一篇独立文档：主题加分层条目，条目可有一句「这段写什么」
    而且 该文档不是成文

  场景: 按小红书图文模板生成独立文档
    假如 作者已勾选若干 file 与高亮
    当 作者在 Write 中选择「小红书图文」并生成
    那么 Files 中出现一篇独立文档：短封面标题、短句分段正文（允许步骤或对比）、话题标签
    而且 必须有话题标签；不规定条数、不要求 emoji；有标签即过、没有不过
    而且 该文档是可粘贴笔记，不是长文压缩
    而且 V1 不出图、不排九宫格；正文可留「建议配图」

  场景: 按口播稿模板生成独立文档
    假如 作者已勾选若干 file 与高亮
    当 作者在 Write 中选择「口播稿」并生成
    那么 Files 中出现一篇独立文档：可朗读全文，结构为开场钩子、2 到 4 个展开点、收束或行动
    而且 按结构验收，不拿秒表、不朗读计时
    而且 不是 B 站长口播，不是分镜、配音或视频

  场景: 可以只生成其中一种
    假如 作者已勾选若干 file 与高亮，Files 中还没有这四类 Write 文档
    当 作者只生成「小红书图文」，不生成长文
    那么 Files 中出现这一篇小红书图文文档
    而且 不要求先有长文

  场景: 已有长文不会自动变成其他体裁
    假如 Files 中已有一篇长文文档
    当 作者未再生成其他模板
    那么 不会自动出现短文提纲、小红书图文或口播稿
    而且 界面不是「把这篇长文改写成小红书」

  场景: 四类文档并存互不覆盖
    假如 作者已勾选同一批 file 与高亮
    当 作者依次生成「长文」「短文提纲」「小红书图文」「口播稿」
    那么 Files 中同时存在这四篇彼此独立的文档
    而且 后生成的一篇不替换先生成的一篇
    而且 改其中一篇时另外三篇保持不变

  场景: 同一体裁可生成两次彼此独立
    假如 作者已勾选同一批 file 与高亮
    当 作者用「小红书图文」生成两次
    那么 Files 中出现两篇彼此独立的小红书图文文档
    而且 后一篇不覆盖前一篇

  场景: 继续编辑更新当前文档不是另存
    假如 Files 中已有多篇独立文档，作者正对着其中一篇
    当 作者在 Chat 中要求修改当前这篇
    那么 当前这篇作为同一文档被更新，不是另存一篇
    而且 其他文档保持不变

  场景: 未勾选 file 不出现在该文档来源中
    假如 Board 内有 file 甲已勾选、file 乙未勾选
    当 作者用任一 Write 模板生成一篇文档
    那么 该文档来源中可见 file 甲
    而且 该文档来源中不可见 file 乙

  场景: 复制长文得到标题正文和来源
    假如 Files 中已有一篇长文文档
    当 作者在该文档工具栏执行复制
    那么 剪贴板为可粘贴纯文本，含标题与正文（含来源）

  场景: 复制短文提纲得到主题和提纲
    假如 Files 中已有一篇短文提纲文档
    当 作者在该文档工具栏执行复制
    那么 剪贴板为可粘贴纯文本，含主题与分层提纲

  场景: 复制小红书图文得到标题正文和标签
    假如 Files 中已有一篇小红书图文文档
    当 作者在该文档工具栏执行复制
    那么 剪贴板为可粘贴纯文本，含封面标题、分段正文与话题标签
    而且 不含图文件，也不是直发到小红书

  场景: 复制口播稿得到按朗读顺序的全文
    假如 Files 中已有一篇口播稿文档
    当 作者在该文档工具栏执行复制
    那么 剪贴板为可粘贴纯文本，按朗读顺序含开场钩子、展开点与收束，以及分段提示
    而且 不含视频或配音

  场景: 每篇文档有各自公开只读链接且分享不是第四主导航
    假如 Files 中已有至少两篇独立文档
    当 作者对其中一篇在文档工具栏执行 Share
    那么 得到只指向这一篇的可复制公开只读链接
    而且 另一篇仍在，且有自己独立的复制与 Share
    而且 Share 在该文档工具栏上，不是第四个主导航

  场景: 未登录访客只读且看不到 Board 其余内容
    假如 作者已为某篇文档生成 Share 链接
    当 一名未登录访客打开该链接
    那么 访客能看到该文档内容
    而且 访客不能编辑
    而且 访客看不到该 Board 的其他 file、Chat、以及其他文档

  场景: 删除 Board 后分享链接失效且无撤销分享按钮
    假如 作者已为某篇文档生成 Share 链接，且未登录访客刚才能打开
    当 作者删除该文档所属 Board
    那么 该 Board 从列表中消失
    而且 访客再打开原链接时打不开该文档
    而且 界面没有单独的撤销 Share 按钮

  场景: Skills 页骨架存在点击为未开放
    当 作者打开 Skills
    那么 可见骨架：Explore、Yours、搜索、+ New skill
    而且 点击后为未开放
    而且 不能完成技能市场、安装或付费技能

  场景: Sprite 入口存在点击为未开放
    当 作者打开左侧 Sprite，或点击 Board 右上角 Sprite 占位图标
    那么 该入口存在
    而且 Sprite 只作导航标签与占位图标
    而且 不使用真机吉祥物形象，也不使用官方 slogan
    而且 点击后为未开放

  场景: Create 中未开放能力入口仍在
    假如 作者打开 cube 的 Create 或 New task 页签
    当 作者分别点击 Create image、Create slides、Create video、Build webpage，以及 Image、Slides、Video、Webpage 页签
    那么 这些入口都存在
    而且 点击后为未开放
    而且 不能完成出图、幻灯片、视频或网页搭建

  场景: Use skill 连接器浏览器代理与 mic 未开放
    假如 作者在提问框或 Create 中
    当 作者分别点击 Use skill、Add connectors、Use browser 的浏览器代理、mic 语音输入
    那么 这些入口都存在
    而且 点击后为未开放

  场景: Auto 文档图标 Upgrade 与 Browse all 为占位或未开放
    假如 作者查看提问框 Auto、一篇文档画布，以及壳上 Upgrade 与 Browse all
    那么 Auto 模型选择器可见；V1 使用一个默认模型；切换不提供多模型矩阵
    而且 文档上可见生成标题、Translate、配图、封面出图类图标，点击为未开放
    而且 Upgrade 可为占位，V1 不能完成支付；不出现促销倒计时文案
    而且 Browse all 或 Editor's pick 可为空或未开放

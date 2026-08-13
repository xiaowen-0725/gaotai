import { After, AfterAll, Before, BeforeAll, Given, Then, When, setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { Browser, BrowserContext, Page, chromium } from "playwright";
import path from "path";

setDefaultTimeout(60_000);

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const FIX = path.join(process.cwd(), "fixtures");

let browser: Browser;

type World = {
  page: Page;
  context: BrowserContext;
  guestContext?: BrowserContext;
  guestPage?: Page;
  shareUrl?: string;
  boardId?: string;
  boardName?: string;
  fileIds?: Record<string, string>;
  writeIds?: string[];
};

const world: World = {} as World;

async function api(page: Page, type: string, payload?: Record<string, unknown>) {
  const res = await page.request.post(`${BASE}/api/action`, {
    data: { type, payload },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${type} failed: ${JSON.stringify(json)}`);
  return json;
}

async function login(page: Page) {
  await page.request.post(`${BASE}/api/test`, { data: { op: "reset" } });
  await page.request.post(`${BASE}/api/test`, { data: { op: "login" } });
}

async function createBoard(page: Page, name = "Chaos") {
  const json = await api(page, "createBoard", { name });
  world.boardId = json.result.id;
  world.boardName = name;
  return json.result as { id: string; name: string };
}

async function openCurrentBoard() {
  const fromUrl = world.page.url().match(/\/boards\/([^/?#]+)/)?.[1];
  const id = world.boardId || fromUrl;
  if (!id) throw new Error("no current board id");
  world.boardId = id;
  await world.page.goto(`${BASE}/boards/${id}`);
  await world.page.getByTestId("your-files").waitFor({ timeout: 15_000 });
}

async function primedSources(page: Page) {
  const board = await createBoard(page, "Chaos");
  const a = (await api(page, "addDocument", { boardId: board.id, title: "file甲", body: "知识管理正文甲" })).result;
  const b = (await api(page, "addDocument", { boardId: board.id, title: "file乙", body: "未勾选正文乙" })).result;
  await api(page, "updateFile", { id: a.id, selected: true });
  await api(page, "updateFile", { id: b.id, selected: false });
  const hl = (await api(page, "addHighlight", { fileId: a.id, text: "组织知识" })).result;
  world.fileIds = { 甲: a.id, 乙: b.id, hl: hl.id };
  return { board, a, b, hl };
}

async function visible(text: string | RegExp) {
  await world.page.getByText(text).first().waitFor({ state: "visible", timeout: 15_000 });
}

BeforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});

AfterAll(async () => {
  await browser?.close();
});

Before(async () => {
  world.context = await browser.newContext();
  world.page = await world.context.newPage();
  await login(world.page);
});

After(async () => {
  await world.guestPage?.close();
  await world.guestContext?.close();
  await world.page?.close();
  await world.context?.close();
});

Given("作者已登录", async () => {
  await login(world.page);
});

When("作者打开应用", async () => {
  await world.page.goto(BASE);
});

Then("落在 New task", async () => {
  await world.page.getByTestId("new-task-page").waitFor();
  await expect(world.page.getByTestId("nav-new-task")).toBeVisible();
});

Then('中央可见 {string}', async (text: string) => {
  await visible(text);
});

Then("不是 Board 列表页", async () => {
  await expect(world.page.getByTestId("boards-page")).toHaveCount(0);
});

When("作者查看全局左侧栏", async () => {
  await world.page.goto(BASE);
  await world.page.getByTestId("global-sidebar").waitFor();
});

Then("可见 New task、Boards、Skills、Sprite、Search", async () => {
  for (const name of ["New task", "Boards", "Skills", "Sprite", "Search"]) {
    await visible(name);
  }
});

Then("可见 Recents", async () => {
  await visible("Recents");
});

Then("底部可见 Upgrade 与账户（Free 类徽章可为占位）", async () => {
  await visible("Upgrade");
  await visible("Free");
});

Given("作者在 New task", async () => {
  await world.page.goto(BASE);
  await world.page.getByTestId("new-task-page").waitFor();
});

Then('提问框占位为 {string}', async (ph: string) => {
  await expect(world.page.getByPlaceholder(ph)).toBeVisible();
});

Then("可见 +、cube、Auto、mic、提交", async () => {
  await expect(world.page.getByTestId("btn-plus")).toBeVisible();
  await expect(world.page.getByTestId("btn-cube")).toBeVisible();
  await expect(world.page.getByTestId("auto-selector")).toBeVisible();
  await expect(world.page.getByTestId("btn-mic")).toBeVisible();
  await expect(world.page.getByTestId("btn-submit")).toBeVisible();
});

Then("下方可见 For you、Research、Write、Image、Slides、Video、Webpage 与 Browse all", async () => {
  for (const name of ["For you", "Research", "Write", "Image", "Slides", "Video", "Webpage", "Browse all"]) {
    await visible(name);
  }
});

Given("作者在 New task 且当前没有 Board", async () => {
  await world.page.request.post(`${BASE}/api/test`, { data: { op: "reset" } });
  await world.page.request.post(`${BASE}/api/test`, { data: { op: "login" } });
  await world.page.goto(BASE);
});

When("作者提交一项 New task", async () => {
  await world.page.getByTestId("composer-input").fill("帮我整理资料");
  await world.page.getByTestId("btn-submit").click();
});

Then("须先创建或选择一个 Board 才能继续", async () => {
  await visible("须先创建或选择一个 Board 才能继续");
});

Then("顶栏显示当前 Board", async () => {
  if (await world.page.getByText("创建 Board").count()) {
    await world.page.getByText("创建 Board").click();
  }
  await expect(world.page.getByTestId("board-switcher")).not.toHaveText("选择 Board", { timeout: 15_000 });
});

Given("作者已有至少两个 Board", async () => {
  await createBoard(world.page, "Alpha");
  await createBoard(world.page, "Beta");
  await world.page.goto(BASE);
});

When("作者在顶栏切换当前 Board", async () => {
  await world.page.getByTestId("board-switcher").click();
  await world.page.getByTestId("board-switcher-menu").getByText("Alpha").click();
});

Then("当前 Board 变为所选 Board", async () => {
  await expect(world.page.getByTestId("board-switcher")).toHaveText("Alpha");
});

Given("作者在 New task 或 Board 内提问框", async () => {
  await world.page.goto(BASE);
});

When("作者打开 cube", async () => {
  await world.page.getByTestId("btn-cube").click();
});

Then("可见 Create：Research、Write、Create image、Create slides、Create video、Build webpage", async () => {
  const menu = world.page.getByTestId("create-menu");
  for (const name of ["Research", "Write", "Create image", "Create slides", "Create video", "Build webpage"]) {
    await expect(menu.getByText(name, { exact: true })).toBeVisible();
  }
});

Then("可见 Use skill 与 Chat mode", async () => {
  const menu = world.page.getByTestId("create-menu");
  await expect(menu.getByText("Use skill")).toBeVisible();
  await expect(menu.getByText("Chat mode")).toBeVisible();
});

When("作者打开 +", async () => {
  await world.page.getByTestId("btn-plus").click();
});

Then("可见 Add from files、从稿台已有 file 加入、Use browser 开关、Add connectors", async () => {
  const menu = world.page.getByTestId("add-menu");
  await expect(menu.getByText("Add from files")).toBeVisible();
  await expect(menu.getByText("从稿台已有 file 加入")).toBeVisible();
  await expect(menu.getByText("Use browser")).toBeVisible();
  await expect(menu.getByTestId("use-browser-toggle")).toBeVisible();
  await expect(menu.getByText("Add connectors")).toBeVisible();
});

Given("作者已打开 cube 的 Create 菜单", async () => {
  await world.page.goto(BASE);
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-menu").waitFor();
});

Then("菜单上没有「长文」「短文提纲」「小红书图文」「口播稿」四个按钮", async () => {
  const menu = world.page.getByTestId("create-menu");
  for (const name of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await expect(menu.getByText(name, { exact: true })).toHaveCount(0);
  }
});

Then("体裁选择只出现在 Write 流程内", async () => {
  if (await world.page.getByTestId("create-write").count()) {
    await world.page.getByTestId("create-write").click();
  } else {
    await world.page.getByTestId("btn-cube").click();
    await world.page.getByTestId("create-write").click();
  }
  if (await world.page.getByText("创建 Board").count()) {
    await world.page.getByText("创建 Board").click();
    await world.page.goto(BASE);
    await world.page.getByTestId("btn-cube").click();
    await world.page.getByTestId("create-write").click();
  }
  await world.page.getByTestId("write-dialog").waitFor();
  for (const name of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await expect(world.page.getByTestId("write-dialog").getByText(name)).toBeVisible();
  }
});

Given("作者打开 Boards", async () => {
  await world.page.goto(`${BASE}/boards`);
});

Then("标题为 Boards", async () => {
  await expect(world.page.locator("h1")).toHaveText("Boards");
});

Then("可见 + New board、Recents 卡片、Active \\/ Archived，以及网格或列表", async () => {
  await visible("New board");
  await expect(world.page.getByTestId("recents-cards")).toBeVisible();
  await visible("Active");
  await visible("Archived");
  await visible("Grid view");
});

Then("Archived 可以为空", async () => {
  await world.page.getByText("Archived", { exact: true }).click();
  await visible("Archived");
});

When("作者执行 New board 并确认", async () => {
  await world.page.getByTestId("new-board").click();
  await world.page.getByTestId("new-board-name").fill("Chaos");
  await world.page.getByTestId("confirm-new-board").click();
});

Then("出现一个可打开的 Board", async () => {
  await world.page.getByTestId("board-workspace").waitFor();
  await visible("Chaos");
});

Given("Boards 中已有一个 Board", async () => {
  await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards`);
});

When("作者打开该 Board", async () => {
  await world.page.getByText("Chaos").first().click();
});

Then("进入该 Board", async () => {
  await world.page.getByTestId("board-workspace").waitFor();
});

Then("顶栏显示该 Board 为当前 Board", async () => {
  await expect(world.page.getByTestId("board-switcher")).toHaveText("Chaos");
});

Given("已有一个 Board", async () => {
  await createBoard(world.page, "旧名");
  await world.page.goto(`${BASE}/boards`);
});

When("作者将其重命名为新名称", async () => {
  await world.page.getByText("重命名").first().click();
  await world.page.getByTestId("rename-board-input").fill("新名称");
  await world.page.getByTestId("confirm-rename").click();
});

Then("Boards 列表中显示新名称", async () => {
  await visible("新名称");
});

Given("Boards 列表中已有作者自己的 Board", async () => {
  await createBoard(world.page, "待删");
  await world.page.goto(`${BASE}/boards`);
});

When("作者删除该 Board", async () => {
  await world.page.getByText("删除").first().click();
});

When("作者删除该文档所属 Board", async () => {
  await world.page.goto(`${BASE}/boards`);
  await world.page.getByText("删除").first().click();
});

Then("该 Board 从列表中消失", async () => {
  const name = world.boardName || "待删";
  await expect(world.page.getByTestId("boards-list").getByText(name)).toHaveCount(0);
});

Given("作者在一个 Board 内", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

Then("左侧可见 Board 名称", async () => {
  await expect(world.page.getByTestId("board-name")).toBeVisible();
});

Then("可见分段 Tasks、Files、globe、+", async () => {
  await expect(world.page.getByTestId("seg-tasks")).toBeVisible();
  await expect(world.page.getByTestId("seg-files")).toBeVisible();
  await expect(world.page.getByTestId("seg-globe")).toBeVisible();
  await expect(world.page.getByTestId("board-plus")).toBeVisible();
});

Given("作者在 Board 的 Files", async () => {
  const board = await createBoard(world.page, "Chaos");
  await api(world.page, "addDocument", { boardId: board.id, title: "欢迎", body: "正文" });
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

Then("可见 Your files 列表", async () => {
  await expect(world.page.getByTestId("your-files")).toBeVisible();
  await visible("Your files");
});

Then("中间为卡片墙或阅读器或文档画布", async () => {
  await expect(world.page.getByTestId("middle-canvas")).toBeVisible();
});

Then("Your files 列表与中间阅读器或文档画布可同时可见", async () => {
  await expect(world.page.getByTestId("your-files")).toBeVisible();
  await expect(world.page.getByTestId("middle-canvas")).toBeVisible();
});

Given("作者打开一个尚无 task 的 Board 的 Tasks", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
  await world.page.getByTestId("seg-tasks").click();
});

Then("可见 Your tasks 列表", async () => {
  await expect(world.page.getByTestId("your-tasks")).toBeVisible();
});

Then('空状态为 {string}', async (text: string) => {
  await visible(text);
});

Given("作者在 Board 内", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

When("作者发起 New task", async () => {
  await world.page.getByTestId("board-plus").click();
  await world.page.getByTestId("board-add-menu").getByText("New task").click();
});

Then('可见与首页相同的 {string} 提问框', async (text: string) => {
  await visible(text);
});

When("作者打开分段旁的 +", async () => {
  await world.page.getByTestId("board-plus").click();
});

Then("可见 New task、New document、Add sources", async () => {
  const menu = world.page.getByTestId("board-add-menu");
  await expect(menu.getByText("New task")).toBeVisible();
  await expect(menu.getByText("New document")).toBeVisible();
  await expect(menu.getByText("Add sources")).toBeVisible();
});

Given("作者在 Board 内要写下自己的想法", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

When("作者执行 New document", async () => {
  await world.page.getByTestId("board-plus").click();
  await world.page.getByTestId("board-add-menu").getByText("New document").click();
});

Then("得到一篇可编辑标题与正文的文档", async () => {
  await expect(world.page.getByTestId("doc-title")).toBeVisible();
  await expect(world.page.getByTestId("doc-body")).toBeVisible();
  await world.page.getByTestId("doc-title").fill("我的想法");
  await world.page.getByTestId("doc-body").fill("一段想法");
});

Then("界面没有独立的笔记对象", async () => {
  await expect(world.page.getByText("独立笔记", { exact: true })).toHaveCount(0);
  await expect(world.page.getByRole("heading", { name: "笔记" })).toHaveCount(0);
});

When("作者点击 globe", async () => {
  await world.page.getByTestId("seg-globe").click();
});

Then("该入口存在", async () => {
  if (world.page.url().includes("/boards/")) {
    await expect(world.page.getByTestId("seg-globe")).toBeVisible();
  } else {
    await expect(world.page.getByTestId("nav-sprite")).toBeVisible();
  }
});

Then("V1 显示未开放", async () => {
  await visible("未开放");
});

Then("不能完成整 Board 发布", async () => {
  await expect(world.page.getByText("发布整个 Board", { exact: false })).toHaveCount(0);
});

Given("作者在当前 Board 打开 Add sources", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
  await world.page.getByTestId("board-plus").click();
  await world.page.getByTestId("board-add-menu").getByText("Add sources").click();
});

When("作者粘贴至少一条链接并上传至少一个本地文件", async () => {
  await world.page.getByTestId("source-links").fill("https://example.com/article");
  await world.page.getByTestId("source-file-input").setInputFiles(path.join(FIX, "sample.txt"));
});

Then("可见进度 Adding materials… \\(n\\/m\\)", async () => {
  await expect(world.page.getByTestId("add-progress")).toHaveText(/Adding materials… \(\d+\/\d+\)/);
});

Then("这些条目出现在 Your files", async () => {
  await world.page.getByText("关闭").click();
  await visible("example.com");
  await visible("sample.txt");
});

Then("链接与本地文件均可打开阅读或查看", async () => {
  await world.page.getByText("example.com").first().click();
  await expect(world.page.getByTestId("file-canvas")).toBeVisible();
  await world.page.getByText("sample.txt").first().click();
  await expect(world.page.getByTestId("file-canvas")).toBeVisible();
});

Given("Your files 中有一条网页 file", async () => {
  const board = await createBoard(world.page, "Chaos");
  const file = (await api(world.page, "addLink", { boardId: board.id, url: "https://en.wikipedia.org/wiki/Knowledge_management" })).result;
  world.fileIds = { web: file.id };
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

When("作者打开该 file", async () => {
  await world.page.locator("[data-testid^='file-row-'] button").first().click();
});

Then("进入干净阅读器", async () => {
  await expect(world.page.getByTestId("web-reader")).toBeVisible();
});

Then("可见来源芯片", async () => {
  await expect(world.page.getByTestId("source-chip")).toBeVisible();
});

Then("工具栏可见 Share", async () => {
  await expect(world.page.getByTestId("btn-share")).toBeVisible();
});

Given("Your files 中有一篇文档 file", async () => {
  const board = await createBoard(world.page, "Chaos");
  await api(world.page, "addDocument", { boardId: board.id, title: "草稿", body: "可编辑正文" });
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

When("作者打开该文档", async () => {
  await world.page.getByText("草稿").first().click();
});

Then("进入文档画布", async () => {
  await expect(world.page.getByTestId("document-canvas")).toBeVisible();
});

Then("标题与正文可编辑", async () => {
  await world.page.getByTestId("doc-title").fill("新标题");
  await world.page.getByTestId("doc-body").fill("新正文");
  await expect(world.page.getByTestId("doc-title")).toHaveValue("新标题");
});

Given("作者在 Add sources 上传一张图片、粘贴一条 YouTube 链接、上传一段音频", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
  await world.page.getByTestId("board-plus").click();
  await world.page.getByTestId("board-add-menu").getByText("Add sources").click();
  await world.page.getByTestId("source-links").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await world.page.getByTestId("source-file-input").setInputFiles([
    path.join(FIX, "sample.png"),
    path.join(FIX, "sample.wav"),
  ]);
  await world.page.getByText("关闭").click();
});

Then("三条都出现在 Your files", async () => {
  await visible("YouTube");
  await visible("sample.png");
  await visible("sample.wav");
});

Then("图片可打开查看", async () => {
  await world.page.getByText("sample.png").first().click();
  await expect(world.page.getByTestId("image-viewer")).toBeVisible();
});

Given("作者在当前 Board 执行 Research", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(`${BASE}/boards/${board.id}`);
  await world.page.getByTestId("board-plus").click();
  await world.page.getByTestId("board-add-menu").getByText("New task").click();
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-research").click();
});

When("没有可加入的结果", async () => {
  await visible("没有可加入的结果");
});

Then("Board 可以为空", async () => {
  await expect(world.page.getByTestId("ungrouped-files").locator("[data-testid^='file-row-']")).toHaveCount(0);
});

Then("不阻断 Add sources", async () => {
  await world.page.getByTestId("board-plus").click();
  await expect(world.page.getByTestId("board-add-menu").getByText("Add sources")).toBeVisible();
});

Then("作者仍可粘贴链接或上传文件", async () => {
  await world.page.getByTestId("board-add-menu").getByText("Add sources").click();
  await expect(world.page.getByTestId("source-links")).toBeVisible();
  await expect(world.page.getByTestId("source-file-input")).toBeAttached();
});

Given("作者已打开一条可读 file", async () => {
  const board = await createBoard(world.page, "Chaos");
  const file = (await api(world.page, "addLink", { boardId: board.id, url: "https://example.com/read" })).result;
  await world.page.goto(`${BASE}/boards/${board.id}?file=${file.id}`);
});

When("作者对所选文字执行高亮", async () => {
  await world.page.getByTestId("btn-highlight").click();
});

Then("该高亮属于这条 file", async () => {
  await visible("高亮属于该 file");
});

Then("该高亮可被勾选用于 Task 或 Write", async () => {
  await expect(world.page.getByTestId("highlight-list").locator("input[type=checkbox]")).toBeVisible();
});

Given("Your files 中有一条音或视频 file 且转录成功", async () => {
  const board = await createBoard(world.page, "Chaos");
  const file = (await api(world.page, "addLocalFile", { boardId: board.id, name: "ok-audio.mp3", mime: "audio/mpeg" })).result;
  await api(world.page, "setTranscription", { fileId: file.id, outcome: "success" });
  world.fileIds = { media: file.id };
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

Then("可见转录文本", async () => {
  await expect(world.page.getByTestId("transcript-text")).toBeVisible();
});

Then("作者可按时间轴跳转到对应位置", async () => {
  await world.page.locator(".cue").first().click();
  await expect(world.page.getByTestId("timeline-position")).toContainText("已跳转到");
});

Given("Your files 中已有一条音或视频 file，以及至少另一条 file", async () => {
  const board = await createBoard(world.page, "Chaos");
  const audio = (await api(world.page, "addLocalFile", { boardId: board.id, name: "clip.mp3", mime: "audio/mpeg" })).result;
  await api(world.page, "addDocument", { boardId: board.id, title: "另一条", body: "仍可打开" });
  world.fileIds = { media: audio.id };
  await world.page.goto(`${BASE}/boards/${board.id}`);
});

When("该音或视频转录失败", async () => {
  await api(world.page, "setTranscription", { fileId: world.fileIds!.media, outcome: "failed" });
  await world.page.reload();
});

Then("该 file 显示失败提示", async () => {
  await visible("转录失败");
});

Then("原始链接或文件仍可打开", async () => {
  await world.page.getByText("clip.mp3").first().click();
  await expect(world.page.getByTestId("media-viewer")).toBeVisible();
  await visible("原始");
});

Then("另一条 file 仍可正常打开", async () => {
  await world.page.getByText("另一条").first().click();
  await expect(world.page.getByTestId("document-canvas")).toBeVisible();
});

Given("Files 中可见新建文件夹图标", async () => {
  const board = await createBoard(world.page, "Chaos");
  await api(world.page, "addDocument", { boardId: board.id, title: "甲文件", body: "a" });
  await api(world.page, "addDocument", { boardId: board.id, title: "乙文件", body: "b" });
  await world.page.goto(`${BASE}/boards/${board.id}`);
  await expect(world.page.getByTestId("new-folder")).toBeVisible();
});

When("作者新建文件夹并把一条 file 放入其中", async () => {
  await world.page.getByTestId("new-folder").click();
  await world.page.getByText("放入文件夹").first().waitFor();
  await world.page.getByText("放入文件夹").first().click();
});

Then("该 file 出现在该文件夹下", async () => {
  await expect(world.page.locator("[data-testid^='folder-']")).toContainText("甲文件");
});

Then("未放入文件夹的 file 仍然可见", async () => {
  await expect(world.page.getByTestId("ungrouped-files")).toContainText("乙文件");
});

Then("没有看板", async () => {
  await expect(world.page.getByText("看板")).toHaveCount(0);
});

Given("当前 Board 中已有可阅读的 file 与高亮", async () => {
  const { board } = await primedSources(world.page);
  const task = (await api(world.page, "startChat", { boardId: board.id, title: "消化原料" })).result;
  await world.page.goto(`${BASE}/boards/${board.id}?task=${task.id}`);
});

When("作者在 Board 内 Task chat 就这些 file 与高亮提问", async () => {
  await world.page.getByTestId("chat-input").fill("一句话解释知识管理");
  await world.page.getByLabel("发送").click();
});

Then("回答可见地标出所用 file 或高亮", async () => {
  await expect(world.page.getByTestId("assistant-bubble")).toContainText("file甲");
  await expect(world.page.getByTestId("assistant-bubble")).toContainText("组织知识");
});

Then("作者能分辨依据了哪条来源", async () => {
  await expect(world.page.getByTestId("assistant-bubble")).toContainText("来源");
});

Given("作者在 Board 内 Chat", async () => {
  const { board } = await primedSources(world.page);
  const task = (await api(world.page, "startChat", { boardId: board.id, title: "Chat" })).result;
  await api(world.page, "askChat", { taskId: task.id, question: "In one sentence, what is knowledge management?" });
  await world.page.goto(`${BASE}/boards/${board.id}?task=${task.id}`);
});

Then("用户气泡右对齐", async () => {
  const box = await world.page.getByTestId("user-bubble").boundingBox();
  const parent = await world.page.getByTestId("chat-pane").boundingBox();
  expect(box && parent).toBeTruthy();
  expect(box!.x + box!.width).toBeGreaterThan(parent!.x + parent!.width * 0.55);
});

Then("回答下工具条可见复制、保存、重试、赞\\/踩", async () => {
  const bar = world.page.getByTestId("answer-toolbar");
  await expect(bar.getByLabel("复制")).toBeVisible();
  await expect(bar.getByLabel("保存")).toBeVisible();
  await expect(bar.getByLabel("重试")).toBeVisible();
  await expect(bar.getByLabel("赞")).toBeVisible();
  await expect(bar.getByLabel("踩")).toBeVisible();
});

Then("可见 Ran for Ns 与回答", async () => {
  await visible(/Ran for \ds/);
});

Then("若还有翻译类等多余图标，入口可在，V1 未开放", async () => {
  await world.page.getByLabel("翻译").click();
  await visible("未开放");
});

Then("输入区标签为 Message", async () => {
  await expect(world.page.getByPlaceholder("Message")).toBeVisible();
});

Then("仍有 + 与 cube", async () => {
  await expect(world.page.getByTestId("chat-plus").or(world.page.getByTestId("btn-plus"))).toBeVisible();
  await expect(world.page.getByTestId("chat-cube").or(world.page.getByTestId("btn-cube"))).toBeVisible();
});

Given("当前 Board 中还没有任何 Write 文档", async () => {
  const board = await createBoard(world.page, "Chaos");
  await world.page.goto(BASE);
  world.boardId = board.id;
});

When("作者选择 Chat mode 并提问", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-chat-mode").click();
  await world.page.getByTestId("chat-pane").waitFor();
  await world.page.getByTestId("chat-input").fill("直接开始聊天");
  await world.page.getByLabel("发送").click();
});

Then("可以开始 Board 内 Chat", async () => {
  await expect(world.page.getByTestId("chat-pane")).toBeVisible();
  await expect(world.page.getByTestId("user-bubble")).toBeVisible();
});

Then("不要求先生成一篇文档", async () => {
  await expect(world.page.getByText("请先生成一篇文档")).toHaveCount(0);
});

Given("作者从 Create 的 Write、Write 页签、或对着已勾选的 file 与高亮进入 Write", async () => {
  await primedSources(world.page);
  await world.page.goto(BASE);
  await world.page.getByTestId("btn-cube").click();
});

When("作者选择体裁", async () => {
  await world.page.getByTestId("create-write").click();
});

Then("体裁选择在 Write 流程内", async () => {
  await expect(world.page.getByTestId("write-dialog")).toContainText("Write 流程");
});

Then("可见四种中文模板名：长文、短文提纲、小红书图文、口播稿", async () => {
  for (const name of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await expect(world.page.getByTestId("write-dialog").getByText(name)).toBeVisible();
  }
});

Then("Create 菜单上没有这四个按钮", async () => {
  if (await world.page.getByTestId("close-write").count()) {
    await world.page.getByTestId("close-write").click();
  }
  await world.page.getByTestId("btn-cube").click();
  const menu = world.page.getByTestId("create-menu");
  for (const name of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await expect(menu.getByText(name, { exact: true })).toHaveCount(0);
  }
});

Given("作者已勾选若干 file 与高亮", async () => {
  await primedSources(world.page);
  await world.page.goto(BASE);
});

When("作者在 Write 中选择「长文」并生成", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-长文").click();
});

Then("Files 中出现一篇独立文档：标题、连续分段正文、可见来源", async () => {
  await expect(world.page.getByTestId("document-canvas")).toBeVisible();
  await expect(world.page.getByTestId("doc-title")).not.toHaveValue("");
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/## /);
  await expect(world.page.getByTestId("doc-sources")).toContainText("来源");
  await expect(world.page.getByTestId("write-genre")).toContainText("长文");
});

Then("Tasks 中可以有对应这次 Write 的 task", async () => {
  await world.page.getByTestId("seg-tasks").click();
  await visible("Write · 长文");
});

When("作者在 Write 中选择「短文提纲」并生成", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-短文提纲").click();
});

Then("Files 中出现一篇独立文档：主题加分层条目，条目可有一句「这段写什么」", async () => {
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/主题：/);
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/这段写什么/);
});

Then("该文档不是成文", async () => {
  await expect(world.page.getByTestId("doc-body")).not.toHaveValue(/## 引言/);
});

When("作者在 Write 中选择「小红书图文」并生成", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-小红书图文").click();
});

Then("Files 中出现一篇独立文档：短封面标题、短句分段正文（允许步骤或对比）、话题标签", async () => {
  const title = await world.page.getByTestId("doc-title").inputValue();
  expect(title.length).toBeLessThan(40);
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/#\S+/);
});

Then("必须有话题标签；不规定条数、不要求 emoji；有标签即过、没有不过", async () => {
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/#\S+/);
});

Then("该文档是可粘贴笔记，不是长文压缩", async () => {
  await expect(world.page.getByTestId("write-genre")).toContainText("小红书图文");
  await expect(world.page.getByTestId("doc-body")).not.toHaveValue(/## 引言/);
});

Then("V1 不出图、不排九宫格；正文可留「建议配图」", async () => {
  await expect(world.page.getByTestId("doc-body")).toHaveValue(/建议配图/);
  await expect(world.page.getByText("九宫格")).toHaveCount(0);
});

When("作者在 Write 中选择「口播稿」并生成", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-口播稿").click();
});

Then("Files 中出现一篇独立文档：可朗读全文，结构为开场钩子、2 到 4 个展开点、收束或行动", async () => {
  const body = await world.page.getByTestId("doc-body").inputValue();
  expect(body).toContain("开场钩子");
  expect(body).toContain("收束");
  const points = body.match(/【展开点 \d+】/g) || [];
  expect(points.length).toBeGreaterThanOrEqual(2);
  expect(points.length).toBeLessThanOrEqual(4);
});

Then("按结构验收，不拿秒表、不朗读计时", async () => {
  await expect(world.page.getByText("秒表")).toHaveCount(0);
});

Then("不是 B 站长口播，不是分镜、配音或视频", async () => {
  await expect(world.page.getByText("分镜")).toHaveCount(0);
  await expect(world.page.getByText("配音")).toHaveCount(0);
});

Given("作者已勾选若干 file 与高亮，Files 中还没有这四类 Write 文档", async () => {
  await primedSources(world.page);
  await world.page.goto(BASE);
});

When("作者只生成「小红书图文」，不生成长文", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-小红书图文").click();
});

Then("Files 中出现这一篇小红书图文文档", async () => {
  await expect(world.page.getByTestId("write-genre")).toContainText("小红书图文");
});

Then("不要求先有长文", async () => {
  await expect(world.page.getByText("长文", { exact: true })).toHaveCount(0);
});

When("作者未再生成其他模板", async () => {
  await world.page.reload();
});

Then("不会自动出现短文提纲、小红书图文或口播稿", async () => {
  await expect(world.page.getByText("短文提纲")).toHaveCount(0);
  await expect(world.page.getByText("小红书图文")).toHaveCount(0);
  await expect(world.page.getByText("口播稿")).toHaveCount(0);
});

Then("界面不是「把这篇长文改写成小红书」", async () => {
  await expect(world.page.getByText("把这篇长文改写成小红书")).toHaveCount(0);
});

Given("作者已勾选同一批 file 与高亮", async () => {
  await primedSources(world.page);
  await world.page.goto(BASE);
});

When("作者依次生成「长文」「短文提纲」「小红书图文」「口播稿」", async () => {
  for (const g of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await world.page.goto(BASE);
    await world.page.getByTestId("btn-cube").click();
    await world.page.getByTestId("create-write").click();
    await world.page.getByTestId(`genre-${g}`).click();
    await world.page.getByTestId("write-genre").waitFor();
  }
});

Then("Files 中同时存在这四篇彼此独立的文档", async () => {
  await openCurrentBoard();
  for (const g of ["长文", "短文提纲", "小红书图文", "口播稿"]) {
    await expect(world.page.getByTestId("your-files")).toContainText(g);
  }
});

Then("后生成的一篇不替换先生成的一篇", async () => {
  const rows = world.page.locator("[data-testid^='file-row-']");
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
});

Then("改其中一篇时另外三篇保持不变", async () => {
  const before = await world.page.getByTestId("your-files").innerText();
  await world.page.getByText("长文").first().click();
  await world.page.getByTestId("doc-body").fill((await world.page.getByTestId("doc-body").inputValue()) + "改");
  await openCurrentBoard();
  const after = await world.page.getByTestId("your-files").innerText();
  expect(after).toContain("短文提纲");
  expect(after).toContain("小红书图文");
  expect(after).toContain("口播稿");
  expect(before.includes("短文提纲")).toBe(true);
});

When("作者用「小红书图文」生成两次", async () => {
  for (let i = 0; i < 2; i += 1) {
    await world.page.goto(BASE);
    await world.page.getByTestId("btn-cube").click();
    await world.page.getByTestId("create-write").click();
    await world.page.getByTestId("genre-小红书图文").click();
    await world.page.getByTestId("write-genre").waitFor();
  }
});

Then("Files 中出现两篇彼此独立的小红书图文文档", async () => {
  await openCurrentBoard();
  const text = await world.page.getByTestId("your-files").innerText();
  expect(text.split("小红书图文").length - 1).toBeGreaterThanOrEqual(2);
});

Then("后一篇不覆盖前一篇", async () => {
  const count = await world.page.locator("[data-testid^='file-row-']", { hasText: "小红书图文" }).count();
  expect(count).toBeGreaterThanOrEqual(2);
});

Given("Files 中已有多篇独立文档，作者正对着其中一篇", async () => {
  const { board } = await primedSources(world.page);
  const first = (await api(world.page, "generateWrite", { boardId: board.id, genre: "长文" })).result;
  await api(world.page, "generateWrite", { boardId: board.id, genre: "短文提纲" });
  const task = (await api(world.page, "startChat", { boardId: board.id, title: "改稿" })).result;
  world.fileIds = { ...(world.fileIds || {}), current: first.id };
  await world.page.goto(`${BASE}/boards/${board.id}?file=${first.id}&task=${task.id}`);
});

When("作者在 Chat 中要求修改当前这篇", async () => {
  await world.page.getByTestId("chat-input").fill("修改当前这篇：加一句收束");
  await world.page.getByLabel("发送").click();
});

Then("当前这篇作为同一文档被更新，不是另存一篇", async () => {
  await visible("没有另存");
  await openCurrentBoard();
  const writes = await world.page.locator("[data-testid^='file-row-']", { hasText: "长文" }).count();
  expect(writes).toBe(1);
});

Then("其他文档保持不变", async () => {
  await expect(world.page.getByTestId("your-files")).toContainText("短文提纲");
});

Given("Board 内有 file 甲已勾选、file 乙未勾选", async () => {
  await primedSources(world.page);
  await world.page.goto(BASE);
});

When("作者用任一 Write 模板生成一篇文档", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-write").click();
  await world.page.getByTestId("genre-长文").click();
});

Then("该文档来源中可见 file 甲", async () => {
  await expect(world.page.getByTestId("doc-sources")).toContainText("file甲");
});

Then("该文档来源中不可见 file 乙", async () => {
  await expect(world.page.getByTestId("doc-sources")).not.toContainText("file乙");
});

async function openWrite(genre: string) {
  const { board } = await primedSources(world.page);
  const file = (await api(world.page, "generateWrite", { boardId: board.id, genre })).result;
  await world.page.goto(`${BASE}/boards/${board.id}?file=${file.id}`);
}

Given("Files 中已有一篇长文文档", async () => {
  await openWrite("长文");
});

Given("Files 中已有一篇短文提纲文档", async () => {
  await openWrite("短文提纲");
});

Given("Files 中已有一篇小红书图文文档", async () => {
  await openWrite("小红书图文");
});

Given("Files 中已有一篇口播稿文档", async () => {
  await openWrite("口播稿");
});

When("作者在该文档工具栏执行复制", async () => {
  await world.page.getByTestId("btn-copy").click();
  await world.page.getByText("已复制").waitFor({ timeout: 10_000 });
});

async function lastCopy() {
  return world.page.evaluate(() => {
    const w = window as unknown as { __lastCopy?: string };
    return w.__lastCopy || document.body.getAttribute("data-last-copy") || "";
  });
}

Then("剪贴板为可粘贴纯文本，含标题与正文（含来源）", async () => {
  const text = await lastCopy();
  expect(text).toMatch(/关于|长文|来源/);
  expect(text).not.toMatch(/<html/);
});

Then("剪贴板为可粘贴纯文本，含主题与分层提纲", async () => {
  const text = await lastCopy();
  expect(text).toContain("主题");
  expect(text).toMatch(/-/);
});

Then("剪贴板为可粘贴纯文本，含封面标题、分段正文与话题标签", async () => {
  const text = await lastCopy();
  expect(text).toMatch(/#\S+/);
});

Then("不含图文件，也不是直发到小红书", async () => {
  const text = await lastCopy();
  expect(text).not.toContain("data:image");
  await expect(world.page.getByText("直发到小红书")).toHaveCount(0);
});

Then("剪贴板为可粘贴纯文本，按朗读顺序含开场钩子、展开点与收束，以及分段提示", async () => {
  const text = await lastCopy();
  expect(text.indexOf("开场钩子")).toBeLessThan(text.indexOf("展开点"));
  expect(text.indexOf("展开点")).toBeLessThan(text.indexOf("收束"));
});

Then("不含视频或配音", async () => {
  const text = await lastCopy();
  expect(text).not.toContain("配音");
  expect(text).not.toContain("视频文件");
});

Given("Files 中已有至少两篇独立文档", async () => {
  const { board } = await primedSources(world.page);
  const a = (await api(world.page, "generateWrite", { boardId: board.id, genre: "长文" })).result;
  const b = (await api(world.page, "generateWrite", { boardId: board.id, genre: "口播稿" })).result;
  world.writeIds = [a.id, b.id];
  await world.page.goto(`${BASE}/boards/${board.id}?file=${a.id}`);
});

When("作者对其中一篇在文档工具栏执行 Share", async () => {
  await world.page.getByTestId("btn-share").click();
  world.shareUrl = await world.page.getByTestId("share-url").innerText();
});

Then("得到只指向这一篇的可复制公开只读链接", async () => {
  expect(world.shareUrl).toMatch(/\/share\//);
});

Then("另一篇仍在，且有自己独立的复制与 Share", async () => {
  await world.page.goto(`${BASE}/boards/${world.boardId}?file=${world.writeIds![1]}`);
  await expect(world.page.getByTestId("btn-copy")).toBeVisible();
  await expect(world.page.getByTestId("btn-share")).toBeVisible();
  await expect(world.page.getByTestId("your-files")).toContainText("口播稿");
  await expect(world.page.getByTestId("your-files")).toContainText("长文");
});

Then("Share 在该文档工具栏上，不是第四个主导航", async () => {
  await expect(world.page.getByTestId("doc-toolbar").getByText("Share")).toBeVisible();
  await expect(world.page.getByTestId("global-sidebar").getByText("Share", { exact: true })).toHaveCount(0);
});

Given("作者已为某篇文档生成 Share 链接", async () => {
  const { board } = await primedSources(world.page);
  const file = (await api(world.page, "generateWrite", { boardId: board.id, genre: "长文" })).result;
  const share = (await api(world.page, "createShare", { fileId: file.id })).result;
  world.shareUrl = `${BASE}/share/${share.token}`;
  world.boardId = board.id;
});

When("一名未登录访客打开该链接", async () => {
  world.guestContext = await browser.newContext();
  world.guestPage = await world.guestContext.newPage();
  await world.guestPage.goto(world.shareUrl!);
});

Then("访客能看到该文档内容", async () => {
  await expect(world.guestPage!.getByTestId("share-title")).toBeVisible();
  await expect(world.guestPage!.getByTestId("share-body")).not.toHaveText("");
});

Then("访客不能编辑", async () => {
  await expect(world.guestPage!.locator("textarea")).toHaveCount(0);
});

Then("访客看不到该 Board 的其他 file、Chat、以及其他文档", async () => {
  await expect(world.guestPage!.getByText("Your files")).toHaveCount(0);
  await expect(world.guestPage!.getByText("Your tasks")).toHaveCount(0);
  await expect(world.guestPage!.getByTestId("chat-pane")).toHaveCount(0);
  await expect(world.guestPage!.getByText("file乙")).toHaveCount(0);
});

Given("作者已为某篇文档生成 Share 链接，且未登录访客刚才能打开", async () => {
  const { board } = await primedSources(world.page);
  const file = (await api(world.page, "generateWrite", { boardId: board.id, genre: "长文" })).result;
  const share = (await api(world.page, "createShare", { fileId: file.id })).result;
  world.shareUrl = `${BASE}/share/${share.token}`;
  world.boardId = board.id;
  world.boardName = board.name;
  world.guestContext = await browser.newContext();
  world.guestPage = await world.guestContext.newPage();
  await world.guestPage.goto(world.shareUrl);
  await expect(world.guestPage.getByTestId("share-title")).toBeVisible();
  await world.page.goto(`${BASE}/boards`);
});

Then("访客再打开原链接时打不开该文档", async () => {
  await world.guestPage!.goto(world.shareUrl!);
  await expect(world.guestPage!.getByTestId("share-invalid")).toContainText("打不开该文档");
});

Then("界面没有单独的撤销 Share 按钮", async () => {
  await expect(world.page.getByText("撤销 Share")).toHaveCount(0);
  await expect(world.page.getByText("Unshare")).toHaveCount(0);
});

When("作者打开 Skills", async () => {
  await world.page.goto(`${BASE}/skills`);
});

Then("可见骨架：Explore、Yours、搜索、+ New skill", async () => {
  await visible("Explore");
  await visible("Yours");
  await expect(world.page.getByTestId("skills-search")).toBeVisible();
  await visible("New skill");
});

Then("点击后为未开放", async () => {
  const toast = world.page.getByTestId("toast");
  if (await toast.count()) {
    await visible("未开放");
    return;
  }
  if (await world.page.getByTestId("new-skill").count()) {
    await world.page.getByTestId("new-skill").click();
  } else {
    await world.page.getByTestId("nav-sprite").click();
  }
  await visible("未开放");
});

Then("不能完成技能市场、安装或付费技能", async () => {
  await expect(world.page.getByText("安装技能")).toHaveCount(0);
  await expect(world.page.getByText("付费技能")).toHaveCount(0);
});

When("作者打开左侧 Sprite，或点击 Board 右上角 Sprite 占位图标", async () => {
  await world.page.goto(BASE);
  await world.page.getByTestId("nav-sprite").click();
});

Then("Sprite 只作导航标签与占位图标", async () => {
  await expect(world.page.getByTestId("nav-sprite")).toBeVisible();
  await expect(world.page.getByTestId("sprite-placeholder-icon").first()).toBeVisible();
});

Then("不使用真机吉祥物形象，也不使用官方 slogan", async () => {
  await expect(world.page.getByText("YouMind")).toHaveCount(0);
  await expect(world.page.getByText("create bolder", { exact: false })).toHaveCount(0);
});

Given("作者打开 cube 的 Create 或 New task 页签", async () => {
  await world.page.goto(BASE);
});

When("作者分别点击 Create image、Create slides、Create video、Build webpage，以及 Image、Slides、Video、Webpage 页签", async () => {
  for (const key of ["image", "slides", "video", "webpage"]) {
    await world.page.getByTestId("btn-cube").click();
    await world.page.getByTestId(`create-${key}`).click();
    await visible("未开放");
  }
  for (const name of ["Image", "Slides", "Video", "Webpage"]) {
    await world.page.getByTestId(`tab-${name}`).click();
    await visible("未开放");
  }
});

Then("这些入口都存在", async () => {
  for (const name of ["Image", "Slides", "Video", "Webpage"]) {
    await expect(world.page.getByTestId(`tab-${name}`)).toBeVisible();
  }
  await expect(world.page.getByTestId("btn-cube")).toBeVisible();
});

Then("不能完成出图、幻灯片、视频或网页搭建", async () => {
  await expect(world.page.getByText("开始出图")).toHaveCount(0);
});

Given("作者在提问框或 Create 中", async () => {
  await world.page.goto(BASE);
});

When("作者分别点击 Use skill、Add connectors、Use browser 的浏览器代理、mic 语音输入", async () => {
  await world.page.getByTestId("btn-cube").click();
  await world.page.getByTestId("create-use-skill").click();
  await visible("未开放");
  await world.page.getByTestId("btn-plus").click();
  await world.page.getByTestId("add-connectors").click();
  await visible("未开放");
  await world.page.getByTestId("btn-plus").click();
  await world.page.getByTestId("use-browser").click();
  await visible("未开放");
  await world.page.getByTestId("btn-mic").click();
  await visible("未开放");
});

Given("作者查看提问框 Auto、一篇文档画布，以及壳上 Upgrade 与 Browse all", async () => {
  const { board } = await primedSources(world.page);
  const file = (await api(world.page, "addDocument", { boardId: board.id, title: "画布文档", body: "正文" })).result;
  world.fileIds = { ...(world.fileIds || {}), canvas: file.id };
  await world.page.goto(`${BASE}/boards/${board.id}?file=${file.id}`);
});

Then("Auto 模型选择器可见；V1 使用一个默认模型；切换不提供多模型矩阵", async () => {
  await world.page.goto(BASE);
  await expect(world.page.getByTestId("auto-selector")).toBeVisible();
  await world.page.getByTestId("auto-selector").click();
  await expect(world.page.getByTestId("auto-menu")).toContainText("默认");
  await expect(world.page.getByText("GPT")).toHaveCount(0);
  await expect(world.page.getByText("Claude")).toHaveCount(0);
});

Then("文档上可见生成标题、Translate、配图、封面出图类图标，点击为未开放", async () => {
  await world.page.goto(`${BASE}/boards/${world.boardId}?file=${world.fileIds!.canvas}`);
  await world.page.getByTestId("icon-generate-title").waitFor();
  await world.page.getByTestId("icon-generate-title").click();
  await visible("未开放");
  await world.page.getByTestId("icon-translate").click();
  await visible("未开放");
  await world.page.getByTestId("icon-image").click();
  await visible("未开放");
  await world.page.getByTestId("icon-cover").click();
  await visible("未开放");
});

Then("Upgrade 可为占位，V1 不能完成支付；不出现促销倒计时文案", async () => {
  await expect(world.page.getByTestId("upgrade")).toBeVisible();
  await world.page.getByTestId("upgrade").click();
  await visible("未开放");
  await expect(world.page.getByText("倒计时")).toHaveCount(0);
  await expect(world.page.getByText("countdown", { exact: false })).toHaveCount(0);
});

Then("Browse all 或 Editor's pick 可为空或未开放", async () => {
  await world.page.goto(BASE);
  await world.page.getByTestId("browse-all").click();
  await visible("未开放");
});

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5174";
const username = process.env.PLAYWRIGHT_USERNAME || "admin";
const password = process.env.PLAYWRIGHT_PASSWORD || "1234";
const slowMo = Number(process.env.PLAYWRIGHT_SLOWMO || "250");
const keepOpen = process.env.PLAYWRIGHT_KEEP_OPEN === "1";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const artifactDir = path.resolve("playwright-artifacts");
const listURL = `${baseURL}/admin/goods_manage/goods_list`;
const createdTitle = `Playwright 商品 ${Date.now()}`;
const editedTitle = `${createdTitle} - 已编辑`;

async function ensureArtifactDir() {
  await fs.mkdir(artifactDir, { recursive: true });
}

async function takeShot(page, name) {
  const file = path.join(artifactDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`已保存截图: ${file}`);
}

async function fillFirst(locator, value) {
  await locator.first().fill(value);
}

async function main() {
  await ensureArtifactDir();

  const browser = await chromium.launch({
    headless: false,
    slowMo,
    executablePath,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    console.log(`打开页面: ${baseURL}/login`);
    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
    await takeShot(page, "01-login");

    await page.getByPlaceholder("请输入用户名").fill(username);
    await page.getByPlaceholder("请输入密码").fill(password);
    await page.getByRole("button", { name: "登陆" }).click();
    await page.waitForURL(/\/admin/);
    await takeShot(page, "02-admin-home");

    await page.goto(listURL, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "发布商品" }).click();
    await page.waitForURL(/\/admin\/goods_manage\/create/);
    await takeShot(page, "03-goods-create");

    await page.getByPlaceholder("请输入商品名称").fill(createdTitle);
    await page.getByPlaceholder("请输入商品分类").fill("自动化测试分类");
    await page.getByPlaceholder("单位：元").fill("19.90");
    await page.getByPlaceholder("不填表示无限库存").fill("12");
    await fillFirst(page.getByPlaceholder("请输入图片地址"), "https://picsum.photos/seed/fm-web-1/320/320");
    await page.getByPlaceholder("可选").fill("https://example.com/demo.mp4");

    const editor = page.locator(".md-editor .cm-content[contenteditable='true']");
    await editor.fill("# 自动化验证\n\n- 这是一个测试商品\n- 用于验证发布、编辑和删除流程");

    const groupTitleInputs = page.locator(".group_title_input input");
    await groupTitleInputs.first().fill("颜色");

    const subTitleInputs = page.locator(".sub_title_input input");
    const subImageInputs = page.locator(".sub_image_input input");
    await subTitleInputs.first().fill("红色");
    await subImageInputs.first().fill("https://picsum.photos/seed/fm-web-red/200/200");

    await page.locator(".config_group .config_sub_row .row_actions").first().getByRole("button").first().click();
    await subTitleInputs.nth(1).fill("蓝色");
    await subImageInputs.nth(1).fill("https://picsum.photos/seed/fm-web-blue/200/200");

    await page.getByRole("button", { name: "确认发布" }).click();
    await page.getByText("商品发布成功").waitFor({ timeout: 30000 });
    await page.goto(listURL, { waitUntil: "networkidle" });
    await takeShot(page, "04-goods-created");

    await page.getByPlaceholder("搜索商品").fill(createdTitle);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    await takeShot(page, "05-goods-search");

    const row = page.locator("tbody tr").filter({ hasText: createdTitle }).first();
    await row.getByRole("button", { name: "编辑" }).click();
    await page.waitForURL(/\/admin\/goods_manage\/edit\/\d+/);
    await takeShot(page, "06-goods-edit");

    await page.getByPlaceholder("请输入商品名称").fill(editedTitle);
    await editor.fill("# 自动化验证\n\n- 已完成编辑流程\n- 这是一条更新后的简介");
    await page.getByRole("button", { name: "保存修改" }).click();
    await page.getByText("商品更新成功").waitFor({ timeout: 30000 });
    await page.goto(listURL, { waitUntil: "networkidle" });
    await takeShot(page, "07-goods-updated");

    await page.getByPlaceholder("搜索商品").fill(editedTitle);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    const updatedRow = page.locator("tbody tr").filter({ hasText: editedTitle }).first();
    await updatedRow.waitFor({ timeout: 30000 });
    await updatedRow.getByRole("button", { name: "删除" }).click();
    await page.getByRole("button", { name: "确定" }).click();
    await page.getByText(/商品删除成功/).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1000);
    await takeShot(page, "08-goods-deleted");

    console.log("商品验证流程已完成");
    if (keepOpen) {
      console.log("按 Ctrl+C 结束浏览器进程");
      await page.waitForTimeout(600000);
    }
  } finally {
    if (!keepOpen) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

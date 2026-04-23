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
const sampleImagePath = path.join(artifactDir, "sample-upload.png");
const sampleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7KXSUAAAAASUVORK5CYII=";

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

async function ensureSampleImage() {
  await fs.writeFile(sampleImagePath, Buffer.from(sampleImageBase64, "base64"));
}

async function uploadViaPreview(page, containerSelector, index = 0) {
  const container = page.locator(containerSelector).nth(index)
  await container.locator(".upload_trigger").click()
  await container.locator('input[type="file"]').setInputFiles(sampleImagePath)
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
    await ensureSampleImage();
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
    await uploadViaPreview(page, ".image_upload");
    await page.waitForFunction(() => {
      const input = document.querySelector(".image_row input[type='text']");
      return input instanceof HTMLInputElement && input.value.includes("/uploads/");
    });
    await takeShot(page, "03a-main-image-uploaded");
    await fillFirst(page.getByPlaceholder("支持手动填写图片路径，也可本地上传"), "/uploads/manual-main.jpg");
    await page.getByPlaceholder("可选").fill("https://example.com/demo.mp4");

    const editor = page.locator(".md-editor .cm-content[contenteditable='true']");
    await editor.fill("# 自动化验证\n\n- 这是一个测试商品\n- 用于验证发布、编辑和删除流程");

    const editorBox = await page.locator(".editor_card").boundingBox();
    const configBox = await page.locator(".goods_form_left .form_card").last().boundingBox();
    if (!editorBox || !configBox) {
      throw new Error("无法读取编辑器或高级配置的布局信息");
    }
    const gap = Math.abs((editorBox.y + editorBox.height) - (configBox.y + configBox.height));
    if (gap > 24) {
      throw new Error(`编辑器底部与高级配置底部未对齐，偏差 ${gap}px`);
    }

    const groupTitleInputs = page.locator(".group_title_input input");
    await groupTitleInputs.first().fill("颜色");

    const subTitleInputs = page.locator(".sub_title_input input");
    const subImageInputs = page.locator(".sub_image_input input");
    await subTitleInputs.first().fill("红色");
    await uploadViaPreview(page, ".sub_image_upload", 0);
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll(".sub_image_input input");
      const first = inputs[0];
      return first instanceof HTMLInputElement && first.value.includes("/uploads/");
    });

    await page.locator(".config_group .config_sub_row .row_actions").first().getByRole("button").nth(0).click();
    await page.waitForFunction(() => document.querySelectorAll(".sub_image_input input").length >= 2);
    await subTitleInputs.nth(1).fill("蓝色");
    await uploadViaPreview(page, ".sub_image_upload", 1);
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll(".sub_image_input input");
      const second = inputs[1];
      return second instanceof HTMLInputElement && second.value.includes("/uploads/");
    });

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
    await uploadViaPreview(page, ".image_upload");
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

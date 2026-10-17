# 部署手册

目标：`https://lab.yuhailinlxy.com`

## 0. 现状

- 本地仓库：`C:\dev\动效实验室`（分支 `master`，已提交，工作区干净）
- 构建：`npm run build` → `dist/`，纯静态，无服务端依赖
- GitHub SSH 已验证可用（`Hi YHLLXY! You've successfully authenticated`）
- 机器上**没有** `gh` 和 `vercel` CLI

## 1. 建仓库（需要你做）

打开 https://github.com/new

| 字段 | 值 |
|---|---|
| Repository name | `yuhailinlxy-lab` |
| 可见性 | **Public** |
| 初始化 | **什么都不要勾**（不要 README / .gitignore / license）|

> 勾了会生成初始提交，导致两边历史不一致，还得处理冲突。

## 2. 推送（我来做）

仓库建好后我执行：

```bash
git remote add origin git@github.com:YHLLXY/yuhailinlxy-lab.git
git push -u origin master
```

## 3. 导入 Vercel（需要你做）

1. https://vercel.com/new → 选 `yuhailinlxy-lab`
2. Framework Preset 会自动识别为 **Astro**，其余全部保持默认
3. Deploy

> 构建命令 `npm run build`、输出目录 `dist`，Vercel 对 Astro 会自动填对。

## 4. 绑定域名（需要你做）

项目 → Settings → Domains → 添加 `lab.yuhailinlxy.com`
Vercel 会提示需要一条 CNAME，值通常是 `cname.vercel-dns.com`。

## 5. 加 DNS 记录（需要你做，阿里云域名控制台）

| 类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| CNAME | `lab` | `cname.vercel-dns.com` | 10 分钟 |

> ⚠️ 这是**新增**一条记录。现有的 4 条 A 记录、MX、SPF、DMARC 一律不动。
> 加完我会做全量 DNS 快照比对，确认没有误伤邮箱。

## 6. 验证（我来做）

- [ ] `/easing` `/timing` `/rules` `/404` 全部 200，无控制台报错
- [ ] HTTPS 证书正常
- [ ] 深浅色切换、减少动效、四条演示均可交互
- [ ] `/sitemap-index.xml` 可访问且域名正确
- [ ] 三个旧站（`www` / `workbench` / `toolbox`）仍正常
- [ ] 邮箱收发仍正常（MX / SPF / DMARC 未被触及）

## 回滚

Vercel 上任意历史部署可一键 Promote；DNS 记录删除即恢复。

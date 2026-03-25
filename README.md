# TimeAlign - 智能跨时区找时间 🌍🕰️

在全球任意时区寻找最完美的开会时间。TimeAlign 是一个云端支持的多人协作时间调度平台，旨在解决跨时区团队或朋友在安排会议与活动时的“找时间”痛点。

## ✨ 核心特性

- **🌍 自动时区转换**：参与者只需输入自己所在时区的空闲时间，系统会自动计算并统一到展示者的时区，找出所有人的最佳重叠时段。
- **🔢 6位会议口令快速分享**：一键生成6位专属会议编号，通过分享编号或链接，其他人可快速加入该会议。
- **☁️ 云端实时同步**：基于 Supabase 后端，数据云端保存。点击“确认保存”后，您的可用时间将实时更新至该会议，所有人可见最新结果。
- **🖱️ 可视化拖拽日历**：支持在可视化周日历上拖拽选择空闲时间段，直观且高效。
- **🎨 个性化参与者卡片**：支持 emoji 头像选择或基于首字母的默认头像，卡片式设计，清晰展示每个人的可用时段。
- **📱 响应式现代界面**：运用深色模式、玻璃拟态（Glassmorphism）与微动效，在桌面和移动端均提供出色的沉浸式体验。

## 🚀 立即体验

您可以直接访问部署好的站点进行体验。使用时只需：
1. 创建或输入已有的会议编号。
2. 添加自己的名字和所处时区。
3. 在日历中拖拽选出自己空闲的时间。
4. 点击“确认保存”与“寻找最佳时间”，查看与他人的完美重合时段！

## 🛠️ 技术栈

- **前端**：HTML5, CSS3 (现代 CSS 特性：Flexbox/Grid, CSS Variables, 动画), Vanilla JavaScript (无大框架依赖，极致轻量)
- **后端 / 数据库**：[Supabase](https://supabase.com/) (提供稳定可靠的 PostgreSQL 数据库与 REST API)
- **部署**：支持一键部署至各类静态托管平台 (如 Netlify, Vercel 等)，项目中包含 `deploy.sh` 快捷部署脚本。

## 📥 本地运行与开发

本系统基于纯静态文件和调用远程 Supabase API 运行，无需复杂的本地 Node.js 开发环境。

1. **克隆代码库**
   ```bash
   git clone https://github.com/your-username/timealign.git
   cd timealign
   ```

2. **环境变量配置**
   项目中通过 `app.js` 连接 Supabase。请确保在 `app.js` 或对应配置中填入您自己的 Supabase URL 和 API Key（生产环境中请注意不要直接暴露敏感高权限 Key）：
   ```javascript
   const SUPABASE_URL = '你的_SUPABASE_URL';
   const SUPABASE_KEY = '你的_SUPABASE_ANON_KEY';
   ```

3. **运行测试**
   您可以直接使用任意简单的本地 Web 服务器运行项目。例如：
   ```bash
   # 使用 Python 3
   python -m http.server 8000
   
   # 或使用 Node.js 的 http-server 或 live-server
   npx live-server
   ```
   然后打开浏览器访问 `http://localhost:8000` 即可。

## 🤝 贡献指南

欢迎提交 Issues 报告问题或提出新功能建议！如需贡献代码：
1. 派生 (Fork) 此代码库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到您的分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 授权。

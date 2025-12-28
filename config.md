# 项目配置说明与开发指导

## 📋 AI编程指导原则

### 🎯 核心开发原则
```
✅ 永远确保每个版本都能独立运行
✅ 优先使用项目配置的技术栈
✅ 遇到问题先回滚再重新开始
✅ 保持代码简洁和可维护性

❌ 不要一次性实现所有功能
❌ 不要使用过时的API和语法
❌ 不要忽略错误处理和测试
❌ 不要偏离既定的技术架构
```

### 🔄 版本迭代原则
- 每个版本必须独立可运行
- 优先实现最小可用版本(MVP)
- 版本号递增：v0.1 → v0.2 → v0.3
- 每次完成后自动测试并修复错误

### 📝 开发流程
1. 先理解完整需求，再开始编码
2. 实现一个功能就立即测试
3. 有问题优先考虑回滚重做
4. 每次提交都要更新版本号和changelog

### 🛠️ Claude Code专用规则
- 每次生成代码后自己测试
- 发现错误立即修复
- 使用 #记忆 保存重要配置
- 遇到复杂问题先 @添加相关文件夹
- 必要时使用 !bash模式 调试

## 🚀 技术栈配置

### 前端开发
- **主要框架:** Vue 3.5.12
- **编程语言:** TypeScript 5.3.3
- **UI组件库:** Element Plus 2.8.4 (及 `@element-plus/icons-vue`)
- **状态管理:** Pinia 2.1.7 (及持久化插件 `pinia-plugin-persistedstate`)
- **路由:** Vue Router
- **样式:** SCSS
- **国际化:** Vue I18n 9.10.2
- **备选方案:**
  - React (特殊情况)
  - 原生 HTML + jQuery (简单Demo)
  - PHP (小项目)

### 后端开发
- **Java:** 遵循阿里巴巴Java开发手册, Spring 3.0
- **Go:** Gin 框架
- **Rust:** rustweb 框架
- **Node.js:** Express 框架 (包含接口规范和错误追踪)

### 数据库
- **主要选择:** MySQL, SQLite
- **缓存/会话:** Redis

### 区块链 智能合约
- **语言:** Solidity
- **安全参考:** [Solidity安全：已知攻击向量和常见反模式综合列表](https://github.com/slowmist/Knowledge-Base/blob/master/translations/solidity-security-comprehensive-list-of-known-attack-vectors-and-common-anti-patterns_zh-cn.md)

## 🔧 工具与服务

### Claude Code快捷键
- `Shift + Tab` - 自动接收编辑
- `Esc` - 取消操作
- `#` - 创造一个记忆
- `双击` - 回退操作
- `!` - bash模式
- `Ctrl + R` - 输出日志verbose模式
- `@` - 添加文件夹作为上下文
- `/vibe` - 特殊命令

### 代理配置
```bash
# 我的本地环境是macOS
export https_proxy=http://127.0.0.1:7890 
export http_proxy=http://127.0.0.1:7890 
export all_proxy=socks5://127.0.0.1:7890
```

### VPN代理服务
- iRoyal: https://iproyal.cn/?r=232466
- Bright Data: https://brightdata.com/
(均已有会员，如需使用代理请选择这些)

### 工作流自动化 (n8n)
- **优先原则:** 优先使用n8n满足自动化需求，而非手写代码。 部署和调用可使用n8n的api (http://myflow.aihang365.com/)
- **参考:** https://x.com/wlzh/status/1932804337430106388

## 🌐 API资源

### 可用API服务
- Replicate (AI 相关): https://replicate.com
- Free API 列表: https://github.com/fangzesheng/free-api
- Public API 列表: https://github.com/public-apis/public-apis

### 支付集成
- Z-Pay: https://z-pay.cn/ (支付API)

## 📁 项目规范

### 标准项目目录
- **参考项目:** https://github.com/JimLiu/agent-translator

### 项目文档结构
每个项目必须包含：
1. **需求分析** - 明确项目目标和功能
2. **项目架构** - 技术选型和系统设计
3. **项目结构** - 目录和文件组织
4. **当前版本规划** - 迭代计划和里程碑
5. **模块设计** - 各模块功能和接口
6. **代码示例** - 关键功能演示
7. **配置说明** - 环境和依赖配置
8. **使用指导** - 安装和运行说明

## 🧪 测试规范

### 测试要求
1. 编写详细的测试报告和测试文档
2. 测试功能以及API接口
3. 编写完整的测试用例

### 测试流程
- 每个版本完成后立即测试
- 发现问题及时修复
- 确保向后兼容性

## 💻 代码风格与工作流

### 代码风格指南 (Code Style Guide)
- **目标**: 保持代码风格统一，提升可读性和协作效率。
- **前端**:
  - **格式化**: 使用 `Prettier` 统一代码风格。项目根目录需包含 `.prettierrc` 配置文件。
  - **代码质量**: 使用 `ESLint` 进行静态代码检查，遵循高质量的规则集。
- **Java**:
  - **规范**: 严格遵循《阿里巴巴Java开发手册》。
  - **工具**: 在 IDE 中安装相关插件（如 Alibaba Java Coding Guidelines）进行实时检查。
- **通用原则**:
  - **命名**: 采用清晰、可预测的命名约定（如变量、函数、类名）。
  - **注释**: 对复杂逻辑、公共组件和 API 接口编写必要的 JSDoc / KDoc 注释。

### Git 工作流规范 (Git Workflow)
- **分支模型**: 采用 `GitHub Flow` 模型，简单高效。
  1.  `main` 分支是主分支，始终保持可部署状态。
  2.  创建新功能或修复 bug 时，从 `main` 分支创建新的特性分支，命名规范为 `feat/xxx` 或 `fix/xxx`。
  3.  开发完成后，向 `main` 分支发起 Pull Request (PR)。
  4.  PR 必须经过至少一位团队成员的 Code Review，并通过所有自动化检查 (CI) 后，才能合并。
- **提交信息规范 (Commit Message)**:
  - **格式**: 遵循 `Conventional Commits` 规范。
    ```
    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>
    ```
  - **示例**:
    - `feat(auth): add user login endpoint`
    - `fix(ui): correct button alignment on login page`
  - **工具**: 推荐使用 `commitizen` 辅助生成规范的 commit message。

## 🛡️ 安全、监控与日志

### 安全最佳实践 (Security Best Practices)
- **依赖安全**:
  - 定期运行 `npm audit fix` 或使用 `Snyk` 等工具扫描项目依赖，及时修复已知漏洞。
  - CI/CD 流程中应包含自动化安全扫描步骤。
- **Web 安全基础**:
  - **输入验证**: 永远不要相信用户的输入。对所有传入数据进行严格的验证和清洗。
  - **防止 XSS**: 对所有输出到页面的数据进行 HTML 转义。
  - **防止 CSRF**: 使用 CSRF Token 保护表单和状态变更的 API。
  - **防止 SQL 注入**: 严禁拼接 SQL 语句，始终使用参数化查询或 ORM。

### 监控与日志策略 (Monitoring & Logging)
- **日志**:
  - **格式**: 所有应用日志应输出为 **JSON 格式**，便于机器解析和查询。
  - **级别**: 至少包含 `INFO`, `WARN`, `ERROR` 三个级别。
  - **内容**: 日志应包含时间戳、请求 ID (traceId)、日志级别和详细信息，以便追踪和调试。
- **监控**:
  - **应用性能**: 使用 `Prometheus` 收集关键性能指标 (APM)，如请求延迟、QPS、错误率。
  - **错误追踪**: 集成 `Sentry` 或类似服务，实时捕获和上报线上应用的运行时错误。
  - **可视化**: 使用 `Grafana` 创建监控仪表盘，可视化系统健康状况。

## ⚙️ CI/CD (持续集成/持续部署)
- **目标**: 实现从代码提交到自动化测试、再到部署的完整流程，提升交付效率和质量。
- **工具**: 优先选择 `GitHub Actions`，与代码仓库无缝集成。
- **核心流程**:
  1.  **Push/PR 到特性分支**: 自动触发 `build` 和 `lint` 任务，运行单元测试。
  2.  **合并到 `main` 分支**:
      - 再次运行所有测试（单元测试、集成测试）。
      - 构建生产环境的 Docker 镜像并推送到镜像仓库。
      - 自动部署到**预发布环境 (Staging)**。
  3.  **手动触发/打 Tag**: 从 `main` 分支将应用部署到**生产环境 (Production)**。

## 📚 学习资源

### 推荐书籍
- 《程序员底层思维》- 架构开发指导

### 视频教程
- Claude Code学习视频：https://www.youtube.com/watch?v=XVOPBlY9FLA&t=507s

### 示例项目
**RSS阅读器示例：**
```
帮助我搭建一个简易的RSS阅读器，用来获取阮一峰日志的RSS信息。
使用Python作为开发语言，同时使用现成的解析库（如feedparser）来简化任务。
可以根据需要扩展，比如增加图形界面或网络后端等。
```

**网页翻页效果示例：**
```
设计一个网页，HTML，点击后可以像书本一样翻页，有翻动效果，
每个页面上有卡片，卡片里有自己的API，可以进行网络请求数据，
可以对各面进行随机放大和缩小，展示20多张名画。
```

## 💡 创业感悟

**AI时代的新规则：**
- AI让创业门槛降低，但竞争更激烈
- 成功关键不再是写代码，而是：
  - 理解用户需求
  - 设计好的工作流程
  - 快速迭代能力
- **核心要素：用户思维**

## 🔄 版本更新记录

- v1.0 - 初始配置说明
- v1.1 - 添加AI编程指导原则
- v1.2 - 完善技术栈和工具配置
- v1.3 - 重新整理文档结构，增加服务器部署信息
- v1.4 - 补充代码、安全、CI/CD等规范

## 🔩 服务器与部署

### 关键信息
- **可用域名:**
  - `https://satoshitech.xyz`
  - `https://aihang365.com`
- **说明:** 如需部署新服务，请告知所需域名，将在 Cloudflare 上为您创建子域名。
- **反向代理:** `nginxproxy/nginx-proxy:alpine`
- **SSL证书:** `nginxproxy/acme-companion:latest` (基于 Let's Encrypt)

### 核心服务
- **MySQL:**
  - **版本:** 8.0.42
  - **凭证:** `remote` / `zxc6545398`
- **Redis:**
  - **版本:** 8.0.2
  - **凭证:** `n(,fkR6X]o6E`

### 已部署应用

#### phpMyAdmin
- **访问地址:** https://mysqlui.aihang365.com/
- **部署命令:**
  ```bash
  docker run -d \
    --name phpmyadmin \
    --network nginx-proxy \
    -e VIRTUAL_HOST=mysqlui.aihang365.com \
    -e VIRTUAL_PORT=80 \
    -e LETSENCRYPT_HOST=mysqlui.aihang365.com \
    -e LETSENCRYPT_EMAIL=zhangke_2021@126.com \
    -e PMA_HOST=mysql \
    -e PMA_PORT=3306 \
    -e PMA_ARBITRARY_SERVER_REGEXP='/.*/' \
    phpmyadmin/phpmyadmin
  ```

#### Crawl4AI (网页抓取)
- **访问地址:** https://crawl4ai.aihang365.com/playground/
- **部署命令:**
  ```bash
  sudo docker run --name crawl4ai \
    --network nginx-proxy \
    --restart unless-stopped \
    -d -p 11235:11235 --env-file .env \
    -e VIRTUAL_HOST=crawl4ai.aihang365.com \
    -e VIRTUAL_PORT=11235 \
    -e LETSENCRYPT_HOST=crawl4ai.aihang365.com \
    -e LETSENCRYPT_EMAIL=zhangke_2021@126.com \
    -e ALLOWED_HOSTS="crawl4ai.aihang365.com,localhost" \
    -e TZ=Asia/Shanghai \
    -v $(pwd)/data:/app/data \
    -v $(pwd)/data/config:/app/config \
    crawl4ai
  ```
- **调用示例 (本地Docker环境):**
  ```python
  import requests

  # 提交抓取任务
  response = requests.post(
      "http://localhost:11235/crawl",
      json={"urls": "https://example.com", "priority": 10}
  )
  task_id = response.json()["task_id"]

  # 轮询直到任务完成
  result = requests.get(f"http://localhost:11235/task/{task_id}")
  ```

#### Temporal (分布式定时任务)
- **访问地址:** https://temporal.satoshitech.xyz/
- **主配置文件** (`/root/temporal-setup/docker-compose-main`):
  ```yaml
  version: "3.5"
  services:
    elasticsearch:
      container_name: temporal-elasticsearch
      environment:
        - cluster.routing.allocation.disk.threshold_enabled=true
        - cluster.routing.allocation.disk.watermark.low=512mb
        - cluster.routing.allocation.disk.watermark.high=256mb
        - cluster.routing.allocation.disk.watermark.flood_stage=128mb
        - discovery.type=single-node
        - ES_JAVA_OPTS=-Xms256m -Xmx256m
        - xpack.security.enabled=false
      image: elasticsearch:${ELASTICSEARCH_VERSION}
      networks:
        - temporal-network
      expose:
        - 9200
      volumes:
        - /var/lib/elasticsearch/data
    postgresql:
      container_name: temporal-postgresql
      environment:
        POSTGRES_PASSWORD: temporal
        POSTGRES_USER: temporal
      image: postgres:${POSTGRESQL_VERSION}
      networks:
        - temporal-network
      expose:
        - 5432
      volumes:
        - /var/lib/postgresql/data
    temporal:
      container_name: temporal
      depends_on:
        - postgresql
        - elasticsearch
      environment:
        - DB=postgres12
        - DB_PORT=5432
        - POSTGRES_USER=temporal
        - POSTGRES_PWD=temporal
        - POSTGRES_SEEDS=postgresql
        - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
        - ENABLE_ES=true
        - ES_SEEDS=elasticsearch
        - ES_VERSION=v7
        - TEMPORAL_ADDRESS=temporal:7233
        - TEMPORAL_CLI_ADDRESS=temporal:7233
      image: temporalio/auto-setup:${TEMPORAL_VERSION}
      networks:
        - temporal-network
      ports:
        - 7233:7233
      volumes:
        - ./dynamicconfig:/etc/temporal/config/dynamicconfig
    temporal-admin-tools:
      container_name: temporal-admin-tools
      depends_on:
        - temporal
      environment:
        - TEMPORAL_ADDRESS=temporal:7233
        - TEMPORAL_CLI_ADDRESS=temporal:7233
      image: temporalio/admin-tools:${TEMPORAL_ADMINTOOLS_VERSION}
      networks:
        - temporal-network
      stdin_open: true
      tty: true
    temporal-ui:
      container_name: temporal-ui
      depends_on:
        - temporal
      environment:
        - TEMPORAL_ADDRESS=temporal:7233
        - TEMPORAL_CORS_ORIGINS=http://localhost:3000
      image: temporalio/ui:${TEMPORAL_UI_VERSION}
      networks:
        - temporal-network
      ports:
        - 8080:8080
  networks:
    temporal-network:
      driver: bridge
      name: temporal-network
  ```
- **UI代理配置:**
  ```yaml
  version: '3.8'
  services:
    temporal-ui:
      networks:
        - nginx-proxy
      environment:
        - VIRTUAL_HOST=temporal.satoshitech.xyz
        - VIRTUAL_PORT=8080
        - LETSENCRYPT_HOST=temporal.satoshitech.xyz
        - LETSENCRYPT_EMAIL=admin@satoshitech.xyz

  networks:
    nginx-proxy:
      external: true
  ```

#### n8n (工作流自动化)
- **访问地址:** http://myflow.aihang365.com/
- **数据库初始化:**
  ```bash
  docker exec -it mysql mysql -u root -pzxc6545398 -e "CREATE DATABASE n8n CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
  ```
- **相关资源:** https://community.n8n.io/
import React from "react"; //导入react模块
import ReactDOM from "react-dom/client"; //导入react-dom模块
import { App } from "./App"; //导入App组件
import { ThemeProvider } from "./contexts/ThemeContext"; //导入主题提供者组件
import { initPostHog } from "./lib/posthog";
import "katex/dist/katex.min.css"; // 导入 KaTeX 样式表
import "./index.css"; //导入全局样式表
import "./i18n"; //导入国际化配置

// 渲染应用程序到根元素

initPostHog();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

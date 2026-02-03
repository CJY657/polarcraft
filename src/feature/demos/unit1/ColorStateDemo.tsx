/**
 * Saccharimeter (量糖计) Demo - Unit 1
 * 演示糖溶液的旋光色散现象
 *
 * 展示当线偏振光通过糖溶液时，不同波长的光旋转速度不同，
 * 在管内不同位置呈现不同颜色，产生色彩渐变效果。
 */

import { useState, useRef, useEffect, useMemo } from "react";
// import { useCallback } from "react"; // 预留：用于事件处理优化
// import { motion } from "framer-motion"; // 预留：用于动画效果
// import { useTranslation } from "react-i18next"; // 预留：用于国际化
import { useTheme } from "@/contexts/ThemeContext";
import {
  SliderControl,
  ControlPanel,
  ValueDisplay,
  Formula,
  InfoCard,
  Toggle,
  ListItem,
} from "../DemoControls";
// import { cn } from "@/utils/classNames"; // 预留：用于条件类名拼接
// import { wavelengthToRGB, getColorName, SPECTRUM_WAVELENGTHS } from "@/lib/physics/ColorUtils"; // 预留：颜色转换和名称获取
//import { MathText } from "@/components/shared/MathText"; // 预留：数学公式渲染组件
import {
  calculateAllRotations,
  // calculateRotation, // 预留：单个波长旋转计算
  // wavelengthToRGB, // 预留：颜色转换
  // getColorName, // 预留：颜色名称
  // SPECTRUM_WAVELENGTHS, // 预留：波长数组
} from "@/lib/physics/Saccharimetry";

/**
 * 量糖计 Canvas 组件
 * 绘制水平放置的量糖计，重点展示管内的颜色梯度变化
 */
function SaccharimeterCanvas({
  polarizerAngle,
  concentration,
  pathLength,
  showRotationAngles,
  animate,
}: {
  polarizerAngle: number;
  concentration: number;
  pathLength: number;
  showRotationAngles: boolean;
  animate: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  // 计算各波长的旋转角度
  const rotationsData = useMemo(() => {
    return calculateAllRotations(concentration, pathLength, 20);
  }, [concentration, pathLength]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 850;
    const height = 450;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 布局参数
    const layout = {
      lightSourceX: 70,
      lightSourceY: height / 2 + 30,
      polarizerX: 160,
      polarizerY: height / 2 + 30,
      tubeStartX: 230,
      tubeEndX: 580,
      tubeY: height / 2 + 30,
      tubeRadius: 55,
      rayEndX: 820,
    };

    const draw = () => {
      // 清除画布
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // 绘制背景网格
      ctx.strokeStyle = "rgba(100, 150, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ===== 1. 绘制光源 =====
      const glowIntensity = 0.5 + 0.3 * Math.sin(timeRef.current * 0.05);
      const lightGradient = ctx.createRadialGradient(
        layout.lightSourceX,
        layout.lightSourceY,
        0,
        layout.lightSourceX,
        layout.lightSourceY,
        55
      );
      lightGradient.addColorStop(0, `rgba(255, 255, 220, ${glowIntensity})`);
      lightGradient.addColorStop(0.4, "rgba(255, 255, 150, 0.3)");
      lightGradient.addColorStop(1, "rgba(255, 255, 100, 0)");

      ctx.fillStyle = lightGradient;
      ctx.beginPath();
      ctx.arc(layout.lightSourceX, layout.lightSourceY, 55, 0, Math.PI * 2);
      ctx.fill();

      // 光源图标
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(layout.lightSourceX, layout.lightSourceY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☀", layout.lightSourceX, layout.lightSourceY);

      // 光源标签
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("白光源", layout.lightSourceX, layout.lightSourceY + 80);

      // ===== 2. 绘制从光源到偏振片的光线 =====
      ctx.strokeStyle = "rgba(255, 255, 220, 0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(layout.lightSourceX + 22, layout.lightSourceY);
      ctx.lineTo(layout.polarizerX - 6, layout.polarizerY);
      ctx.stroke();

      // 光波动画（表示非偏振光）
      if (animate) {
        const waveOffset = timeRef.current * 1.5;
        for (let i = 0; i < 8; i++) {
          const t = ((waveOffset + i * 15) % 120) / 120;
          const x = layout.lightSourceX + 22 + t * (layout.polarizerX - layout.lightSourceX - 28);

          // 绘制多个方向的偏振（表示非偏振光）
          for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            const amp = 10 * Math.sin(t * Math.PI * 3);
            ctx.moveTo(x, layout.polarizerY + amp * Math.cos(angle));
            ctx.lineTo(x, layout.polarizerY + amp * Math.cos(angle + Math.PI));
            ctx.stroke();
          }
        }
      }

      // ===== 3. 绘制偏振片 =====
      ctx.fillStyle = "rgba(100, 200, 255, 0.25)";
      ctx.strokeStyle = "#64c8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(layout.polarizerX - 6, layout.polarizerY - 55, 12, 110);
      ctx.fill();
      ctx.stroke();

      // 偏振方向指示线
      const rad = (polarizerAngle * Math.PI) / 180;
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const lineLen = 40;
      ctx.moveTo(
        layout.polarizerX - lineLen * Math.cos(rad),
        layout.polarizerY + lineLen * Math.sin(rad)
      );
      ctx.lineTo(
        layout.polarizerX + lineLen * Math.cos(rad),
        layout.polarizerY - lineLen * Math.sin(rad)
      );
      ctx.stroke();

      // 偏振片两端标记
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(
        layout.polarizerX - lineLen * Math.cos(rad),
        layout.polarizerY + lineLen * Math.sin(rad),
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        layout.polarizerX + lineLen * Math.cos(rad),
        layout.polarizerY - lineLen * Math.sin(rad),
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 偏振片标签
      ctx.fillStyle = "#64c8ff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("起偏器", layout.polarizerX, layout.polarizerY + 80);
      ctx.font = "11px monospace";
      ctx.fillText(`θ = ${polarizerAngle}°`, layout.polarizerX, layout.polarizerY + 98);

      // ===== 4. 绘制从偏振片到量糖计的线偏振光 =====
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(layout.polarizerX + 6, layout.polarizerY);
      ctx.lineTo(layout.tubeStartX, layout.tubeY);
      ctx.stroke();

      // 线偏振光波动画
      if (animate) {
        const waveOffset = timeRef.current * 1.5;
        for (let i = 0; i < 6; i++) {
          const t = ((waveOffset + i * 12) % 80) / 80;
          const x = layout.polarizerX + 6 + t * (layout.tubeStartX - layout.polarizerX - 12);
          const amp = 8 * Math.sin(t * Math.PI * 4);
          ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, layout.tubeY - amp * Math.cos(rad));
          ctx.lineTo(x, layout.tubeY + amp * Math.cos(rad));
          ctx.stroke();
        }
      }

      // ===== 5. 绘制量糖计管 - 重点展示内部颜色梯度 =====
      const tubeWidth = layout.tubeEndX - layout.tubeStartX;

      // 5a. 绘制管内颜色梯度（最关键的视觉效果）
      if (concentration > 0.01) {
        // 创建水平颜色梯度
        const colorGradient = ctx.createLinearGradient(
          layout.tubeStartX,
          layout.tubeY,
          layout.tubeEndX,
          layout.tubeY
        );

        // 根据各波长的旋转角度在管内的分布来设置梯度
        // 旋转角度小的波长(红)在前，旋转角度大的波长(紫)在后
        const maxRotation = Math.max(...rotationsData.map(r => r.rotationAngle));
        const minRotation = Math.min(...rotationsData.map(r => r.rotationAngle));

        rotationsData.forEach((data) => {
          // 归一化位置：旋转角度最小的(红)在起始位置，最大的(紫)在结束位置
          const normalizedPos = (data.rotationAngle - minRotation) / (maxRotation - minRotation || 1);
          colorGradient.addColorStop(Math.max(0, Math.min(1, normalizedPos)), data.color);
        });

        // 绘制管体（带颜色梯度）- 矩形管充满整个溶液
        ctx.save();

        // 直接填充颜色梯度到矩形管区域
        ctx.fillStyle = colorGradient;
        ctx.fillRect(
          layout.tubeStartX,
          layout.tubeY - layout.tubeRadius,
          tubeWidth,
          layout.tubeRadius * 2
        );

        // 添加高光效果（模拟圆柱体光泽）- 叠加在颜色梯度之上
        const highlightGradient = ctx.createLinearGradient(
          layout.tubeStartX,
          layout.tubeY - layout.tubeRadius,
          layout.tubeStartX,
          layout.tubeY + layout.tubeRadius
        );
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        highlightGradient.addColorStop(0.2, "rgba(255, 255, 255, 0.1)");
        highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        highlightGradient.addColorStop(0.8, "rgba(255, 255, 255, 0.05)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.15)");

        ctx.fillStyle = highlightGradient;
        ctx.fillRect(
          layout.tubeStartX,
          layout.tubeY - layout.tubeRadius,
          tubeWidth,
          layout.tubeRadius * 2
        );

        ctx.restore();

        // 以下是原来的椭圆形裁剪实现，已注释
        // 原因：用户要求管内应该是充满整个溶液的彩虹带，而不是椭圆型的彩带
        /*
        // 创建圆形裁剪区域模拟圆柱体
        ctx.beginPath();
        ctx.ellipse(
          (layout.tubeStartX + layout.tubeEndX) / 2,
          layout.tubeY,
          tubeWidth / 2 + 8,
          layout.tubeRadius,
          0,
          0,
          Math.PI * 2
        );
        ctx.clip();

        // 填充颜色梯度
        ctx.fillStyle = colorGradient;
        ctx.fillRect(
          layout.tubeStartX - 10,
          layout.tubeY - layout.tubeRadius,
          tubeWidth + 20,
          layout.tubeRadius * 2
        );

        // 添加高光效果（模拟圆柱体光泽）
        const highlightGradient = ctx.createLinearGradient(
          layout.tubeStartX,
          layout.tubeY - layout.tubeRadius,
          layout.tubeStartX,
          layout.tubeY + layout.tubeRadius
        );
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        highlightGradient.addColorStop(0.2, "rgba(255, 255, 255, 0.1)");
        highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        highlightGradient.addColorStop(0.8, "rgba(255, 255, 255, 0.05)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

        ctx.fillStyle = highlightGradient;
        ctx.fillRect(
          layout.tubeStartX - 10,
          layout.tubeY - layout.tubeRadius,
          tubeWidth + 20,
          layout.tubeRadius * 2
        );
        */

        // 5b. 在管上方标注各颜色区域
        if (showRotationAngles) {
          rotationsData.forEach((data) => {
            const normalizedPos = (data.rotationAngle - minRotation) / (maxRotation - minRotation || 1);
            const labelX = layout.tubeStartX + normalizedPos * tubeWidth;

            // 垂直指示线
            ctx.strokeStyle = data.color.replace("rgb", "rgba").replace(")", ", 0.5)");
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(labelX, layout.tubeY - layout.tubeRadius - 5);
            ctx.lineTo(labelX, layout.tubeY - layout.tubeRadius - 25);
            ctx.stroke();
            ctx.setLineDash([]);

            // 标签背景
            const labelText = `${data.wavelength}nm`;
            ctx.font = "10px sans-serif";
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillStyle = data.color.replace("rgb", "rgba").replace(")", ", 0.2)");
            ctx.beginPath();
            ctx.roundRect(labelX - textWidth / 2 - 4, layout.tubeY - layout.tubeRadius - 42, textWidth + 8, 16, 3);
            ctx.fill();

            // 波长标签
            ctx.fillStyle = data.color;
            ctx.textAlign = "center";
            ctx.fillText(labelText, labelX, layout.tubeY - layout.tubeRadius - 30);

            // 旋转角度标签
            ctx.font = "9px sans-serif";
            ctx.fillStyle = "#aaa";
            ctx.fillText(`${data.rotationAngle.toFixed(1)}°`, labelX, layout.tubeY - layout.tubeRadius - 18);
          });
        }
      } else {
        // 零浓度时的透明管
        const emptyGradient = ctx.createLinearGradient(
          layout.tubeStartX,
          layout.tubeY - layout.tubeRadius,
          layout.tubeStartX,
          layout.tubeY + layout.tubeRadius
        );
        emptyGradient.addColorStop(0, "rgba(200, 220, 255, 0.15)");
        emptyGradient.addColorStop(0.5, "rgba(200, 220, 255, 0.05)");
        emptyGradient.addColorStop(1, "rgba(200, 220, 255, 0.15)");

        ctx.fillStyle = emptyGradient;
        ctx.fillRect(layout.tubeStartX, layout.tubeY - layout.tubeRadius, tubeWidth, layout.tubeRadius * 2);
      }

      // 5c. 绘制管轮廓（玻璃效果）
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(layout.tubeStartX, layout.tubeY, 8, layout.tubeRadius, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(layout.tubeStartX, layout.tubeY - layout.tubeRadius);
      ctx.lineTo(layout.tubeEndX, layout.tubeY - layout.tubeRadius);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(layout.tubeStartX, layout.tubeY + layout.tubeRadius);
      ctx.lineTo(layout.tubeEndX, layout.tubeY + layout.tubeRadius);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(layout.tubeEndX, layout.tubeY, 8, layout.tubeRadius, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 管两端高光
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.ellipse(layout.tubeStartX, layout.tubeY, 6, layout.tubeRadius - 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(layout.tubeEndX, layout.tubeY, 6, layout.tubeRadius - 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 量糖计标签
      ctx.fillStyle = "#ffd700";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      const tubeCenterX = (layout.tubeStartX + layout.tubeEndX) / 2;
      ctx.fillText("量糖计", tubeCenterX, layout.tubeY + layout.tubeRadius + 35);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.fillText(`L = ${pathLength} dm  |  c = ${concentration.toFixed(2)} g/mL`, tubeCenterX, layout.tubeY + layout.tubeRadius + 52);

      // ===== 6. 绘制出射光 - 平行光线展示偏振面旋转 =====
      // 原理说明：量糖计中光的传播方向不变，只是偏振面旋转
      // 这与牛顿棱镜色散完全不同（棱镜是光的方向改变）
      const rayOriginX = layout.tubeEndX;
      const rayOriginY = layout.tubeY;
      const rayLength = 200;
      const raySpacing = 35; // 光线之间的垂直间距

      // 计算Y方向的偏移，使光线居中排列
      const totalHeight = (rotationsData.length - 1) * raySpacing;
      const startY = rayOriginY - totalHeight / 2;

      // 绘制各波长的平行出射光线
      rotationsData.forEach((data, index) => {
        const rayY = startY + index * raySpacing;
        const endX = rayOriginX + rayLength;

        // 绘制光线（水平平行线）
        // 光线渐变
        const rayGradient = ctx.createLinearGradient(
          rayOriginX,
          rayY,
          endX,
          rayY
        );
        rayGradient.addColorStop(0, data.color.replace("rgb", "rgba").replace(")", ", 0.95)"));
        rayGradient.addColorStop(0.7, data.color.replace("rgb", "rgba").replace(")", ", 0.6)"));
        rayGradient.addColorStop(1, data.color.replace("rgb", "rgba").replace(")", ", 0.2)"));

        ctx.strokeStyle = rayGradient;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rayOriginX, rayY);
        ctx.lineTo(endX, rayY);
        ctx.stroke();

        // 光晕效果
        ctx.strokeStyle = data.color.replace("rgb", "rgba").replace(")", ", 0.15)");
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(rayOriginX, rayY);
        ctx.lineTo(endX, rayY);
        ctx.stroke();

        // 在光线末端绘制偏振矢量箭头（旋转后的方向）
        const vectorSize = 30;

        // 最终偏振角度 = 起偏器角度 + 旋光角度
        const finalAngle = polarizerAngle + data.rotationAngle;
        const finalRad = (finalAngle * Math.PI) / 180;

        ctx.save();
        ctx.translate(endX, rayY);
        ctx.rotate(-finalRad);

        // 绘制偏振矢量箭头
        ctx.strokeStyle = data.color;
        ctx.fillStyle = data.color;
        ctx.lineWidth = 3;

        // 箭头主线
        ctx.beginPath();
        ctx.moveTo(-vectorSize, 0);
        ctx.lineTo(vectorSize, 0);
        ctx.stroke();

        // 箭头头部
        ctx.beginPath();
        ctx.moveTo(vectorSize, 0);
        ctx.lineTo(vectorSize - 10, -6);
        ctx.lineTo(vectorSize - 10, 6);
        ctx.closePath();
        ctx.fill();

        // 箭头尾部（小圆点表示起点）
        ctx.beginPath();
        ctx.arc(-vectorSize, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 在光线右端显示波长和旋转角度
        if (showRotationAngles) {
          ctx.fillStyle = data.color;
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`${data.wavelength}nm`, endX + 8, rayY - 8);

          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#aaa";
          ctx.fillText(`${data.rotationAngle.toFixed(1)}°`, endX + 8, rayY + 6);
        }
      });

      // 以下是原来的扇形展开实现，已注释
      // 原因：用户指出扇形展开会让人联想到牛顿棱镜色散，
      // 但量糖计的原理是偏振面旋转，不是光的方向改变
      /*
      const fanOriginX = layout.tubeEndX;
      const fanOriginY = layout.tubeY;
      const fanRadius = 180;

      // 绘制扇形区域的渐变背景
      const fanGradient = ctx.createRadialGradient(
        fanOriginX,
        fanOriginY,
        0,
        fanOriginX,
        fanOriginY,
        fanRadius
      );

      rotationsData.forEach((data, _index) => {
        const angle = data.rotationAngle;
        const normalizedAngle = Math.max(0, Math.min(1, (angle / 180) * 0.8));
        fanGradient.addColorStop(normalizedAngle, data.color.replace("rgb", "rgba").replace(")", ", 0.1)"));
      });

      ctx.fillStyle = fanGradient;
      ctx.beginPath();
      ctx.moveTo(fanOriginX, fanOriginY);
      ctx.arc(fanOriginX, fanOriginY, fanRadius, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
      ctx.closePath();
      ctx.fill();

      // 绘制各波长的出射光线
      rotationsData.forEach((data) => {
        const angle = data.rotationAngle;
        const baseAngle = -Math.PI / 2;
        const spreadAngle = (angle / 180) * 0.5;

        const endX = fanOriginX + fanRadius * Math.cos(baseAngle + spreadAngle);
        const endY = fanOriginY + fanRadius * Math.sin(baseAngle + spreadAngle);

        // 光线渐变
        const rayGradient = ctx.createLinearGradient(
          fanOriginX,
          fanOriginY,
          endX,
          endY
        );
        rayGradient.addColorStop(0, data.color.replace("rgb", "rgba").replace(")", ", 0.9)"));
        rayGradient.addColorStop(0.5, data.color.replace("rgb", "rgba").replace(")", ", 0.5)"));
        rayGradient.addColorStop(1, data.color.replace("rgb", "rgba").replace(")", ", 0.1)"));

        ctx.strokeStyle = rayGradient;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fanOriginX, fanOriginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 光晕
        ctx.strokeStyle = data.color.replace("rgb", "rgba").replace(")", ", 0.15)");
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(fanOriginX, fanOriginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 在光线末端绘制偏振方向
        const finalAngle = polarizerAngle + angle;
        const finalRad = (finalAngle * Math.PI) / 180;

        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(-finalRad);

        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();

        // 箭头
        ctx.beginPath();
        ctx.moveTo(10, -5);
        ctx.lineTo(15, 0);
        ctx.lineTo(10, 5);
        ctx.stroke();

        ctx.restore();

        // 显示旋转角度
        if (showRotationAngles) {
          ctx.fillStyle = data.color;
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`${data.colorName} ${data.rotationAngle.toFixed(1)}°`, endX + 8, endY + 4);
        }
      });
      */

      // ===== 7. 绘制图例 =====
      const legendX = 60;
      const legendY = height - 50;

      ctx.fillStyle = "#888";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("图例:", legendX, legendY);

      // 光源
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(legendX + 55, legendY - 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#aaa";
      ctx.font = "11px sans-serif";
      ctx.fillText("光源", legendX + 68, legendY);

      // 偏振片
      ctx.fillStyle = "rgba(100, 200, 255, 0.5)";
      ctx.fillRect(legendX + 125, legendY - 7, 8, 14);
      ctx.strokeStyle = "#64c8ff";
      ctx.strokeRect(legendX + 125, legendY - 7, 8, 14);
      ctx.fillStyle = "#aaa";
      ctx.fillText("起偏器", legendX + 138, legendY);

      // 旋光色散说明
      ctx.fillStyle = "linear-gradient(to right, #ff4444, #4444ff)";
      ctx.fillRect(legendX + 210, legendY - 5, 30, 10);
      ctx.fillStyle = "#aaa";
      ctx.fillText("旋光色散", legendX + 245, legendY);

      // 旋光原理说明（强调偏振面旋转，不是光的方向改变）
      ctx.fillStyle = "#666";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("不同波长的偏振面旋转角度不同 | 光的传播方向不变", width / 2, legendY + 25);

      if (animate) {
        timeRef.current += 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [polarizerAngle, concentration, pathLength, showRotationAngles, animate, rotationsData]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-cyan-400/20 w-full"
      style={{ maxWidth: 850, height: 450 }}
    />
  );
}

/**
 * 旋转角度表格组件
 */
function RotationTable({
  concentration,
  pathLength,
}: {
  concentration: number;
  pathLength: number;
}) {
  const { theme } = useTheme();
  const rotations = useMemo(
    () => calculateAllRotations(concentration, pathLength),
    [concentration, pathLength]
  );

  return (
    <div className="space-y-1">
      <div className={`grid grid-cols-3 gap-2 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} pb-1 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
        <span className="text-center">波长</span>
        <span className="text-center">颜色</span>
        <span className="text-center">旋转角</span>
      </div>
      {rotations.map((data) => (
        <div
          key={data.wavelength}
          className="grid grid-cols-3 gap-2 text-sm items-center py-1"
        >
          <span className={`text-center font-mono ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{data.wavelength} nm</span>
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{data.colorName}</span>
          </span>
          <span
            className="text-center font-mono font-bold"
            style={{ color: data.color }}
          >
            {data.rotationAngle.toFixed(1)}°
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 主演示组件
 */
export function ColorStateDemo() {
  const { theme } = useTheme();
  // const { i18n } = useTranslation(); // 预留：用于国际化语言切换

  // 状态管理
  const [polarizerAngle, setPolarizerAngle] = useState(0);
  const [concentration, setConcentration] = useState(0.6);
  const [pathLength, setPathLength] = useState(5);
  const [showRotationAngles, setShowRotationAngles] = useState(true);
  const [animate, setAnimate] = useState(true);

  // 计算总旋转角度范围
  const rotationRange = useMemo(() => {
    const rotations = calculateAllRotations(concentration, pathLength);
    const maxRotation = Math.max(...rotations.map((r) => r.rotationAngle));
    const minRotation = Math.min(...rotations.map((r) => r.rotationAngle));
    return { max: maxRotation, min: minRotation, spread: maxRotation - minRotation };
  }, [concentration, pathLength]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
          量糖计演示 - 旋光色散
        </h2>
        <p className={theme === "dark" ? "text-gray-400 mt-1" : "text-gray-600 mt-1"}>
          观察管内颜色梯度：不同波长的光旋转速度不同，在糖溶液中逐渐分离
        </p>
      </div>

      {/* 主要内容区：Canvas + 控制面板 */}
      <div className="flex gap-6 flex-col xl:flex-row">
        {/* Canvas 区域 */}
        <div className="flex-1">
          <SaccharimeterCanvas
            polarizerAngle={polarizerAngle}
            concentration={concentration}
            pathLength={pathLength}
            showRotationAngles={showRotationAngles}
            animate={animate}
          />
        </div>

        {/* 右侧控制面板 */}
        <ControlPanel
          title="控制面板"
          className="w-full xl:w-72"
        >
          <SliderControl
            label="起偏器角度"
            value={polarizerAngle}
            min={0}
            max={180}
            step={5}
            unit="°"
            onChange={setPolarizerAngle}
            color="cyan"
          />

          <SliderControl
            label="糖浓度"
            value={concentration}
            min={0}
            max={1}
            step={0.01}
            unit=" g/mL"
            onChange={setConcentration}
            color="orange"
            formatValue={(v) => `${v.toFixed(2)} g/mL`}
          />

          <SliderControl
            label="管长"
            value={pathLength}
            min={1}
            max={10}
            step={0.5}
            unit=" dm"
            onChange={setPathLength}
            color="green"
          />

          <div className="flex gap-3">
            <Toggle
              label="显示标注"
              checked={showRotationAngles}
              onChange={setShowRotationAngles}
            />
            <Toggle
              label="动画"
              checked={animate}
              onChange={setAnimate}
            />
          </div>

          {/* 实时数据 */}
          <div className="pt-3 border-t border-slate-700 space-y-2">
            <ValueDisplay
              label="最大旋转角"
              value={rotationRange.max.toFixed(1)}
              unit="°"
              color="purple"
            />
            <ValueDisplay
              label="色散范围"
              value={rotationRange.spread.toFixed(1)}
              unit="°"
              color="orange"
            />
          </div>

          {/* 快速预设 */}
          <div className={`pt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-gray-300"}`}>
            <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} mb-2`}>快速预设</p>
            <div className="grid grid-cols-3 gap-2">
              {[0.2, 0.5, 0.8].map((c) => (
                <button
                  key={c}
                  onClick={() => setConcentration(c)}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    concentration === c
                      ? "bg-orange-500/30 text-orange-400 border border-orange-500/50"
                      : theme === "dark" ? "bg-slate-700/50 text-gray-400 border border-slate-600 hover:border-orange-400/30" : "bg-gray-100/50 text-gray-600 border border-gray-300 hover:border-orange-400/30"
                  }`}
                >
                  {c} g/mL
                </button>
              ))}
            </div>
          </div>
        </ControlPanel>
      </div>

      {/* 公式和数值表格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Formula highlight>
            $\Phi = [\alpha]_\lambda \cdot c \cdot L$
          </Formula>
          <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-2 space-y-1`}>
            <p>• <span className="text-cyan-400">α</span> : 旋转角 (度)</p>
            <p>• <span className="text-orange-400">[α]_λ</span> : 比旋光度 (与波长有关)</p>
            <p>• <span className="text-yellow-400">c</span> : 溶液浓度 (g/mL)</p>
            <p>• <span className="text-green-400">L</span> : 管长 (dm)</p>
          </div>
          <div className={`mt-3 p-3 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100/50 border-gray-300/50"} border`}>
            <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} mb-1`}>蔗糖比旋光度参考 (20°C):</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-purple-400">400nm (紫): ~115°</span>
              <span className="text-blue-400">450nm (蓝): ~96°</span>
              <span className="text-green-400">550nm (绿): ~71°</span>
              <span className="text-yellow-400">589nm (钠D): +66.5°</span>
              <span className="text-orange-400">600nm (橙): ~61°</span>
              <span className="text-red-400">700nm (红): ~45°</span>
            </div>
          </div>
        </div>

        <ControlPanel title="各波长旋转角" className="h-full">
          <RotationTable
            concentration={concentration}
            pathLength={pathLength}
          />
        </ControlPanel>
      </div>

      {/* 信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="旋光性原理"
          color="cyan"
        >
          <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
            <ListItem>• 糖分子具有手性结构，存在对映异构体</ListItem>
            <ListItem>• 线偏振光通过时，偏振面发生旋转</ListItem>
            <ListItem>• 旋转方向和大小取决于物质种类和浓度</ListItem>
            <ListItem>• 蔗糖为右旋物质，旋转角为正</ListItem>
          </ul>
        </InfoCard>

        <InfoCard
          title="管内颜色梯度"
          color="purple"
        >
          <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
            <ListItem>• 短波长(紫)光旋转最快，最先到达最大偏转</ListItem>
            <ListItem>• 长波长(红)光旋转最慢，偏转最小</ListItem>
            <ListItem>• 在管内形成彩虹般的颜色梯度</ListItem>
            <ListItem>• 浓度越高，颜色分离越明显</ListItem>
          </ul>
        </InfoCard>

        <InfoCard
          title="应用场景"
          color="green"
        >
          <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
            <ListItem>• 食品工业：测定糖含量</ListItem>
            <ListItem>• 制药工业：药品纯度检测</ListItem>
            <ListItem>• 化学研究：分子结构分析</ListItem>
            <ListItem>• 医学诊断：尿糖检测</ListItem>
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}

export default ColorStateDemo;

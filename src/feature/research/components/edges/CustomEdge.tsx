/**
 * Custom Edge Component
 * 自定义边组件
 *
 * Styled edge with label for research relationships
 * 带标签的研究关系边
 */

import { memo } from "react";
import { EdgeProps, getBezierPath, EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/utils/classNames";

interface CustomEdgeProps extends EdgeProps {
  onDelete?: (edgeId: string) => void;
}

// Edge type configurations
const edgeTypeConfig = {
  derivesTo: {
    color: "#f59e0b", // amber
    label: "推导出",
    dashArray: "",
  },
  verifies: {
    color: "#10b981", // emerald
    label: "验证",
    dashArray: "",
  },
  refutes: {
    color: "#f43f5e", // rose
    label: "反驳",
    dashArray: "6,4",
  },
  cites: {
    color: "#3b82f6", // blue
    label: "引用",
    dashArray: "",
  },
  basedOn: {
    color: "#8b5cf6", // violet
    label: "基于",
    dashArray: "3,3",
  },
  relatedTo: {
    color: "#64748b", // slate
    label: "关联",
    dashArray: "10,5",
  },
};

export const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    onDelete,
  }: CustomEdgeProps) => {
    const edgeType = data?.edgeType || "relatedTo";
    const config =
      edgeTypeConfig[edgeType as keyof typeof edgeTypeConfig] || edgeTypeConfig.relatedTo;

    // Use SmoothStep path for a more technical look
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 20,
    });

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      const deleteFn = data?.onDelete || onDelete;
      if (deleteFn) {
        deleteFn(id);
      }
    };

    const colorId = config.color.replace("#", "");

    return (
      <>
        <defs>
          <marker
            id={`arrow-${colorId}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
          >
            <path
              d="M2,2 L10,6 L2,10 L4,6 Z"
              fill={config.color}
              className="transition-all"
            />
          </marker>
        </defs>

        <g className="group">
          {/* Background interactive path */}
          <path
            d={edgePath}
            fill="none"
            stroke="transparent"
            strokeWidth={20}
            className="cursor-pointer"
          />

          {/* Selection glow */}
          {selected && (
            <path
              d={edgePath}
              fill="none"
              stroke={config.color}
              strokeWidth={6}
              strokeOpacity={0.2}
              className="animate-in fade-in zoom-in duration-300"
            />
          )}

          {/* Main edge line */}
          <path
            id={id}
            d={edgePath}
            fill="none"
            stroke={selected ? config.color : `${config.color}90`}
            strokeWidth={selected ? 3 : 2}
            strokeDasharray={config.dashArray || undefined}
            markerEnd={`url(#arrow-${colorId})`}
            className={cn(
              "transition-all duration-300",
              !selected && "group-hover:stroke-slate-400 group-hover:stroke-[3px]"
            )}
          />
        </g>

        {/* Floating Label and Controls */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full border shadow-xl transition-all duration-300",
              selected
                ? "scale-110 opacity-100 bg-slate-900 border-slate-700"
                : "scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-slate-900/80 border-slate-800"
            )}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
              {config.label}
            </span>

            {selected && (
              <button
                onClick={handleDelete}
                className="p-1 rounded-full bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                title="删除关联"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  },
);

CustomEdge.displayName = "CustomEdge";

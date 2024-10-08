import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { RxEnterFullScreen } from "react-icons/rx";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaSearch } from "react-icons/fa";

interface ChartRef {
  zoomIn: () => void;
  zoomOut: () => void;
  layout: (position: string) => ChartRef;
  render: () => ChartRef;
  fit: () => void;
  clearHighlighting: () => void;
  data: () => {
    id: number;
    name: string;
    _expanded: boolean;
    _highlighted: boolean;
  }[];
  setCentered: (id: number) => ChartRef;
  getChartState: () => { data: { id: number; parentId: number | null }[] };
}

interface Action {
  id: number;
  parentId: number | null;
}

interface ToolsProps {
  dragEnabled: boolean;
  setDragEnabled: (enabled: boolean) => void;
  chartRef: React.RefObject<ChartRef>;
  undoActions: Action[];
  setUndoActions: React.Dispatch<React.SetStateAction<Action[]>>;
  redoActions: Action[];
  setRedoActions: React.Dispatch<React.SetStateAction<Action[]>>;
}

export default function Tools(props: ToolsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const positions = ["top", "right", "left"];

  const handleRotate = () => {
    const nextIndex = (currentIndex + 1) % positions.length;
    props.chartRef.current?.layout(positions[nextIndex]).render().fit();
    setCurrentIndex(nextIndex);
  };

  function filterChart(value: string) {
    if (!value.trim()) {
      props.chartRef.current?.clearHighlighting();
    } else {
      const data = props.chartRef.current?.data() || [];
      props.chartRef.current?.clearHighlighting();
      data.forEach((d) => (d._expanded = false));
      const item = data.find((d) =>
        d.name.toLowerCase().includes(value.trim().toLowerCase()),
      );
      if (item) {
        item._expanded = true;
        item._highlighted = true;
        props.chartRef.current?.setCentered(item.id).render();
      }
    }
  }

  function cancelDrag() {
    if (props.undoActions.length === 0) {
      disableDrag();
      return;
    }

    const data = props.chartRef.current?.getChartState().data || [];
    props.undoActions.forEach((action) => {
      const node = data.find((x) => x.id === action.id);
      if (node) {
        node.parentId = action.parentId;
      }
    });

    disableDrag();
    props.chartRef.current?.render();
  }

  function undo() {
    const action = props.undoActions[props.undoActions.length - 1];
    if (action) {
      props.setUndoActions((prev) => prev.slice(0, prev.length - 1));
      const data = props.chartRef.current?.getChartState().data || [];
      const node = data.find((x) => x.id === action.id);
      if (node) {
        const currentParentId = node.parentId;
        node.parentId = action.parentId;
        const newAction = { id: action.id, parentId: currentParentId };
        props.setRedoActions((prev) => [...prev, newAction]);
        props.chartRef.current?.render();
      }
    }
  }

  function redo() {
    const action = props.redoActions[props.redoActions.length - 1];
    if (action) {
      props.setRedoActions((prev) => prev.slice(0, prev.length - 1));
      const data = props.chartRef.current?.getChartState().data || [];
      const node = data.find((x) => x.id === action.id);
      if (node) {
        const currentParentId = node.parentId;
        node.parentId = action.parentId;
        const newAction = { id: action.id, parentId: currentParentId };
        props.setUndoActions((prev) => [...prev, newAction]);
        props.chartRef.current?.render();
      }
    }
  }

  function disableDrag() {
    props.setDragEnabled(false);
    props.setUndoActions([]);
    props.setRedoActions([]);
  }

  return (
    <div className="absolute flex flex-col items-end text-end gap-5 top-7 right-7 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={"icon"}
              onClick={() => props.chartRef.current?.zoomIn()}
            >
              <FiZoomIn size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"left"}>
            <p>Zoom in</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={"icon"}
              onClick={() => props.chartRef.current?.zoomOut()}
            >
              <FiZoomOut size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"left"}>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size={"icon"} onClick={handleRotate}>
              <FaArrowRotateLeft size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"left"}>
            <p>Rotate</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size={"icon"} onClick={() => props.chartRef.current?.fit()}>
              <RxEnterFullScreen size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"left"}>
            <p>Fit to the screen</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {props.dragEnabled ? (
        <div className="flex gap-2">
          <Button onClick={disableDrag}>Done</Button>
          <Button disabled={props.undoActions.length <= 0} onClick={undo}>
            Undo
          </Button>
          <Button disabled={props.redoActions.length <= 0} onClick={redo}>
            Redo
          </Button>
          <Button onClick={cancelDrag}>Cancel</Button>
        </div>
      ) : (
        <Button onClick={() => props.setDragEnabled(true)}>Organize</Button>
      )}
      <div className="flex gap-2">
        <Label
          htmlFor="input"
          className=" inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 w-9"
        >
          <FaSearch size={18} />
        </Label>
        <Input
          type="search"
          id="input"
          placeholder="search by name"
          className="bg-primary w-40 text-primary-foreground shadow hover:bg-primary/90 placeholder:text-white"
          onChange={(e) => filterChart(e.target.value)}
        />
      </div>
    </div>
  );
}

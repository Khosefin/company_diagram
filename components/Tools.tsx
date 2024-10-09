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
import { FaCheck } from "react-icons/fa";
import { GrRedo, GrUndo } from "react-icons/gr";
import { MdCancel } from "react-icons/md";
import { IoSearch } from "react-icons/io5";
import { toast } from "@/hooks/use-toast";

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
    toast({
      title: "Drag canceled.",
      description: "All changes returned to the initial state .",
    });
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
    <div className="absolute z-[200] grid grid-cols-4 items-end text-end gap-1 bottom-7 right-7 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={"icon"}
              onClick={() => props.chartRef.current?.zoomIn()}
            >
              <FiZoomIn size={18} color={"black"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"top"}>
            <p>Zoom in</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={"icon"}
              onClick={() => props.chartRef.current?.zoomOut()}
            >
              <FiZoomOut size={18} color={"black"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"top"}>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size={"icon"} onClick={handleRotate}>
              <FaArrowRotateLeft size={18} color={"black"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"top"}>
            <p>Rotate</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size={"icon"} onClick={() => props.chartRef.current?.fit()}>
              <RxEnterFullScreen size={18} color={"black"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"top"}>
            <p>Fit to the screen</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {props.dragEnabled ? (
        <>
          <Button
            size="icon"
            className="!bg-green-500"
            onClick={() => {
              disableDrag();
              toast({
                title: "Drag done.",
                description: "All changes saved .",
              });
            }}
          >
            <FaCheck size={18} color={"white"} />
          </Button>
          <Button
            size="icon"
            disabled={props.undoActions.length <= 0}
            onClick={undo}
          >
            <GrUndo size={18} color={"black"} />
          </Button>
          <Button
            size="icon"
            disabled={props.redoActions.length <= 0}
            onClick={redo}
          >
            <GrRedo size={18} color={"black"} />
          </Button>
          <Button size="icon" className="!bg-red-500" onClick={cancelDrag}>
            <MdCancel size={18} color={"white"} />
          </Button>
        </>
      ) : (
        <Button
          className={
            "col-span-full !text-rose-400 border-2 border-rose-400 hover:!bg-rose-400 hover:!text-white"
          }
          onClick={() => props.setDragEnabled(true)}
        >
          Organize
        </Button>
      )}
      <div className="flex gap-2 col-span-full">
        <Label
          htmlFor="input"
          className=" inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white text-black shadow hover:bg-primary/10 h-9 w-9"
        >
          <IoSearch size={18} />
        </Label>
        <Input
          type="search"
          id="input"
          placeholder="Search ..."
          className="w-32 shadow bg-white"
          onChange={(e) => filterChart(e.target.value)}
        />
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import NewItem from "@/components/NewItem";
import Tools from "@/components/Tools";
import { toast } from "@/hooks/use-toast";

export const OrgChartComponent = (props) => {
  const d3Container = useRef(null);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [isDragStarting, setIsDragStarting] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [openDialog, setOpenDialog] = useState(null);
  const [undoActions, setUndoActions] = useState([]);
  const [redoActions, setRedoActions] = useState([]);
  let dragNode, dropNode, dragStartX, dragStartY;

  function onDragStart(element, dragEvent) {
    const data = props.chartRef.current.getChartState().data;
    const node = data?.find((x) => x.id === dragEvent.subject.id);
    if (!node) {
      toast({
        variant: "destructive",
        title: "You cant organize this item",
        description: "please try other items.",
      });
      return;
    }
    dragNode = node;
    const width = dragEvent.subject.width;
    const half = width / 2;
    const x = dragEvent.x - half;
    dragStartX = x;
    dragStartY = parseFloat(dragEvent.y);
    setIsDragStarting(true);

    d3.select(element).classed("dragging", true);
  }

  function onDrag(element, dragEvent) {
    if (!dragNode) {
      return;
    }

    const state = props.chartRef.current.getChartState();
    const g = d3.select(element);

    // This condition is designed to run at the start of a drag only
    if (isDragStarting) {
      setIsDragStarting(false);
      // This sets the Z-Index above all other nodes, by moving the dragged node to be the last-child.
      g.raise();

      const descendants = dragEvent.subject.descendants();
      const linksToRemove = [...(descendants || []), dragEvent.subject];
      const nodesToRemove = descendants.filter(
        (x) => x.data.id !== dragEvent.subject.id,
      );

      // Remove all links associated with the dragging node
      state["linksWrapper"]
        .selectAll("path.link")
        .data(linksToRemove, (d) => state.nodeId(d))
        .remove();

      // Remove all descendant nodes associated with the dragging node
      if (nodesToRemove) {
        state["nodesWrapper"]
          .selectAll("g.node")
          .data(nodesToRemove, (d) => state.nodeId(d))
          .remove();
      }
    }

    dropNode = null;
    const cP = {
      width: dragEvent.subject.width,
      height: dragEvent.subject.height,
      left: dragEvent.x,
      right: dragEvent.x + dragEvent.subject.width,
      top: dragEvent.y,
      bottom: dragEvent.y + dragEvent.subject.height,
      midX: dragEvent.x + dragEvent.subject.width / 2,
      midY: dragEvent.y + dragEvent.subject.height / 2,
    };

    const allNodes = d3.selectAll("g.node:not(.dragging)");
    allNodes.select("rect").attr("fill", "none");

    allNodes
      .filter(function (d2) {
        const cPInner = {
          left: d2.x,
          right: d2.x + d2.width,
          top: d2.y,
          bottom: d2.y + d2.height,
        };

        if (
          cP.midX > cPInner.left &&
          cP.midX < cPInner.right &&
          cP.midY > cPInner.top &&
          cP.midY < cPInner.bottom &&
          this.classList.contains("droppable")
        ) {
          dropNode = d2;
          return d2;
        }
      })
      .select("rect")
      .attr("fill", "#e4e1e1");

    dragStartX += parseFloat(dragEvent.dx);
    dragStartY += parseFloat(dragEvent.dy);
    g.attr("transform", "translate(" + dragStartX + "," + dragStartY + ")");
  }

  function onDragEnd(element, dragEvent) {
    setIsDragStarting(false);

    if (!dragNode) {
      return;
    }

    d3.select(element).classed("dragging", false);

    if (!dropNode) {
      props.chartRef.current.render();
      return;
    }

    if (dragEvent.subject.parent.id === dropNode.id) {
      props.chartRef.current.render();
      return;
    }

    d3.select(element).remove();

    const data = props.chartRef.current.getChartState().data;
    const node = data?.find((x) => x.id === dragEvent.subject.id);
    const oldParentId = node.parentId;
    node.parentId = dropNode.id;

    setRedoActions([]);
    setUndoActions((prev) => [
      ...prev,
      {
        id: dragEvent.subject.id,
        parentId: oldParentId,
      },
    ]);

    dropNode = null;
    dragNode = null;
    props.chartRef.current.render();
  }

  function generateContent(d) {
    const imageDiffVert = 25 + 2;
    return `
      <div class="node-container node" 
  style="width:${d.width}px; height:${d.height}px; padding-top:${imageDiffVert - 2}px; padding-left:1px; padding-right:1px;">
  <div class="content-container relative"
    style="font-family: 'Inter', sans-serif; margin-left:-1px; width:${d.width - 2}px; height:${d.height - imageDiffVert}px;
      border-radius:10px; border:${d.data._highlighted || d.data._upToTheRootHighlighted ? "5px solid #E27396" : "1px solid #E4E2E9"}">
        <div class="flex justify-end mt-[5px] mr-2">
          <button type="button" id="remove-button" aria-expanded="true" aria-haspopup="true"
            class="inline-flex justify-end rounded-md p-2 text-sm font-semibold text-gray-900">
             <div class="svg-menu-button"/>
          </button>
          <div class="bin-button">
            <svg fill="#C40018" xmlns="http://www.w3.org/2000/svg"
                 width="14px" height="14px" viewBox="0 0 408.483 408.483"
                 xml:space="preserve">
                <g>
                <g>
                <path d="M87.748,388.784c0.461,11.01,9.521,19.699,20.539,19.699h191.911c11.018,0,20.078-8.689,20.539-19.699l13.705-289.316
                H74.043L87.748,388.784z M247.655,171.329c0-4.61,3.738-8.349,8.35-8.349h13.355c4.609,0,8.35,3.738,8.35,8.349v165.293
                c0,4.611-3.738,8.349-8.35,8.349h-13.355c-4.61,0-8.35-3.736-8.35-8.349V171.329z M189.216,171.329
                c0-4.61,3.738-8.349,8.349-8.349h13.355c4.609,0,8.349,3.738,8.349,8.349v165.293c0,4.611-3.737,8.349-8.349,8.349h-13.355
                c-4.61,0-8.349-3.736-8.349-8.349V171.329L189.216,171.329z M130.775,171.329c0-4.61,3.738-8.349,8.349-8.349h13.356
                c4.61,0,8.349,3.738,8.349,8.349v165.293c0,4.611-3.738,8.349-8.349,8.349h-13.356c-4.61,0-8.349-3.736-8.349-8.349V171.329z"/>
                <path d="M343.567,21.043h-88.535V4.305c0-2.377-1.927-4.305-4.305-4.305h-92.971c-2.377,0-4.304,1.928-4.304,4.305v16.737H64.916
                c-7.125,0-12.9,5.776-12.9,12.901V74.47h304.451V33.944C356.467,26.819,350.692,21.043,343.567,21.043z"/>
                </g>
                </g>
            </svg>
           </div>
          <div class="add-button"><svg width="14px" height="14px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title>ionicons-v5-a</title><line x1="256" y1="112" x2="256" y2="400" style="fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><line x1="400" y1="256" x2="112" y2="256" style="fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg></div>
          <div class="info-button">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="#007DFF" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 7.01002L12 7.00003M12 17L12 10" stroke="#007DFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          </div>
        </div>
    <div class="rounded-full w-12 h-12" style="margin-top:${-imageDiffVert - 20}px; margin-left:15px;"></div>
    <div class="rounded-full w-12 h-12" style="margin-top:${-imageDiffVert - 20}px;">
      <img src="${d.data.image}" class="rounded-full w-12 h-12" style="margin-left:20px;"/>
    </div>
    
    <div class="!text-lg text-[#08011E] ml-5 mt-2">
      ${d.data.name}
    </div>
    
    <div class="!text-xs text-[#716E7B] ml-5 mt-1">
      ${d.data.position}
    </div>
    
    <div class="!text-4xl font-bold text-slate-100 absolute bottom-3 right-1 -rotate-45">${d.data.id}</div>
  </div>
</div>

      `;
  }

  useLayoutEffect(() => {
    if (props.data && d3Container.current) {
      props.chartRef.current
        .pagingStep(() => 8)
        .minPagingVisibleNodes(() => 5)
        .pagingButton((d) => {
          const imageDiffVert = 25 + 2;
          return `
                   <div class="node-container "
                      style="width:${d.width}px; height:${d.height}px; padding-top:${imageDiffVert - 2}px; padding-left:1px; padding-right:1px;">
                      
                      <div class="flex items-center justify-center text-center"
                        style="font-family: 'Inter', sans-serif; margin-left:-1px; width:${d.width - 2}px; height:${d.height - imageDiffVert}px;
                          "
                        >
                        
                        <div class="text-lg font-bold text-zinc-500 w-full py-2 bg-white rounded-xl flex flex-col justify-center text-center items-center animate-bounce">
                          <svg class="rotate-90" stroke="currentColor" fill="currentColor" stroke-width="0" version="1" viewBox="0 0 48 48" enable-background="new 0 0 48 48" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg"><polygon fill=" rgb(113 113 122)" points="17.1,5 14,8.1 29.9,24 14,39.9 17.1,43 36,24"></polygon></svg>
                        </div>
                      </div>
                    </div>
                `;
        })
        .container(d3Container.current)
        .data(props.data)
        .onNodeClick(() => {
          console.log("e");
        })
        .nodeHeight(() => 140)
        .nodeWidth(() => 250 + 2)
        .childrenMargin(() => 50)
        .compactMarginBetween(() => 35)
        .compactMarginPair(() => 30)
        .neighbourMargin(() => 30)
        .linkUpdate(function (d) {
          d3.select(this)
            .attr("stroke", (d) =>
              d.data._upToTheRootHighlighted ? "#fb7185" : "#bdbdbd",
            )
            .attr("stroke-width", (d) =>
              d.data._upToTheRootHighlighted ? 2 : 1,
            );

          if (d.data._upToTheRootHighlighted) {
            d3.select(this).raise();
          }
        })
        .nodeContent(function (d) {
          return generateContent(d);
        })
        .nodeEnter(function (node) {
          updateDragBehavior(this, node);
        })
        .nodeUpdate(function (d) {
          d3.select(this)
            .select(".content-container")
            .style(
              "border",
              d.data._highlighted || d.data._upToTheRootHighlighted
                ? "solid #fb7185 2px"
                : "solid white 2px",
            );
          d3.select(this)
            .select("#remove-button")
            .on("click", () => {
              if (d.id !== "100") {
                d3.select(this)
                  .select(".bin-button")
                  .node()
                  .classList.toggle("show");
                d3.select(this)
                  .select(".info-button")
                  .node()
                  .classList.toggle("show");
              }
              d3.select(this)
                .select("#remove-button")
                .node()
                .classList.toggle("active");
              d3.select(this)
                .select(".add-button")
                .node()
                .classList.toggle("show");
            });
          d3.select(this)
            .select(".add-button")
            .on("click", (e, d) => {
              setOpenDialog(d.id);
            });
          if (d.id !== "100") {
            d3.select(this)
              .select(".bin-button")
              .on("click", (e, d) => {
                setAlertInfo(d.id);
              });
            d3.select(this)
              .select(".info-button")
              .on("click", (e, d) => {
                props.chartRef.current.setUpToTheRootHighlighted(d.id).render();
                setTimeout(() => {
                  props.chartRef.current.clearHighlighting();
                }, [1500]);
              });
          }
          d3.select(this).classed("droppable", true);
          if (d.id === "100") {
            d3.select(this).classed("draggable", false);
          } else {
            d3.select(this).classed("draggable", true);
          }
        })
        .render();
    }
  }, [props.data, d3Container.current]);

  useEffect(() => {
    if (d3Container.current && dragEnabled) {
      const nodes = d3.selectAll("g.node");
      nodes.each(function (node) {
        updateDragBehavior(this, node);
      });
    } else unbindDragBehavior();
  }, [dragEnabled]);

  useEffect(() => {
    if (props.chartRef.current.fit()) {
      props.chartRef.current.fit();
    }
  }, [props.chartRef]);

  function unbindDragBehavior() {
    const nodes = d3.selectAll("g.node");
    nodes.each(function () {
      d3.select(this).on(".drag", null);
    });
  }

  function updateDragBehavior(element) {
    if (dragEnabled && d3.select(element).classed("draggable")) {
      d3.select(element).call(
        d3
          .drag()
          .filter(function () {
            return dragEnabled && this.classList.contains("draggable");
          })
          .on("start", function (d, node) {
            onDragStart(this, d, node);
          })
          .on("drag", function (dragEvent) {
            onDrag(this, dragEvent);
          })
          .on("end", function (d) {
            onDragEnd(this, d);
          }),
      );
    }
  }

  return (
    <div>
      {openDialog && (
        <NewItem
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          data={props.data}
          chartRef={props.chartRef}
        />
      )}
      {alertInfo && (
        <AlertDialog open={alertInfo}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                item and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAlertInfo(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={"!bg-rose-400"}
                onClick={() => {
                  props.chartRef.current.removeNode(alertInfo).render();
                  setAlertInfo(null);
                  toast({
                    title: "item removed successfully",
                  });
                }}
              >
                Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Tools
        chartRef={props.chartRef}
        dragEnabled={dragEnabled}
        redoActions={redoActions}
        setRedoActions={setRedoActions}
        setDragEnabled={setDragEnabled}
        undoActions={undoActions}
        setUndoActions={setUndoActions}
      />
      <div
        ref={d3Container}
        className={`${isDragStarting ? "dragging-active" : ""}${dragEnabled ? "drag-enabled" : ""} w-full h-dvh`}
      />
    </div>
  );
};

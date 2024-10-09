import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ChartRef {
  addNode: (node: {
    image: string;
    _centered: boolean;
    name: string;
    id: number;
    position: string;
    parentId: number | null;
  }) => { render: () => void };
}

interface NewItemProps {
  data: [{ id: string; name: string }];
  chartRef: React.RefObject<ChartRef>;
  openDialog: number | null;
  setOpenDialog: (prev: boolean) => void;
}

export default function NewItem(props: NewItemProps) {
  const [lastId] = useState(() => {
    const ids = props.data.map((item) => +item.id);
    return Math.max(...ids);
  });
  const formSchema = z.object({
    name: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    position: z.string().min(2, {
      message: "Position name must be at least 2 characters.",
    }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      position: "",
    },
  });

  function onSubmit(data: { name: string; position: string }) {
    const newId = lastId + 1;

    if (props.chartRef.current) {
      props.chartRef.current
        .addNode({
          id: newId,
          name: data.name,
          position: data.position,
          parentId: props.openDialog,
          _centered: true,
          image:
            "https://bumbeishvili.github.io/avatars/avatars/portrait28.png",
        })
        .render();
    } else {
      console.error("chartRef is null or undefined.");
    }

    props.setOpenDialog(false);
    toast({
      variant: "success",
      title: "Success",
      description: "New person added successfully.",
    });
  }
  return (
    <Dialog
      open={!!props.openDialog}
      onOpenChange={() => props.setOpenDialog(!props.openDialog)}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new person</DialogTitle>
          <DialogDescription>
            fill the inputs with your information. Click save when you&#39;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your position" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className={"!bg-rose-400 w-full"}>
              submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

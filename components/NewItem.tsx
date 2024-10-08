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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";

interface ChartRef {
  addNode: (node: {
    id: number;
    name: string;
    position: string;
    parentId: number | null;
    _centered: boolean;
  }) => { render: () => void };
}

interface NewItemProps {
  data: [{ id: string; name: string }];
  chartRef: React.RefObject<ChartRef>;
  openDialog: number | null;
  setOpenDialog: (prev: boolean) => void;
}

export default function NewItem(props: NewItemProps) {
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
    const ids = props.data.map((item) => +item.id);
    const lastID = Math.max(...ids);

    if (props.chartRef.current) {
      props.chartRef.current
        .addNode({
          id: lastID + 1,
          name: data.name,
          position: data.position,
          parentId: props.openDialog,
          _centered: true,
        })
        .render();
    } else {
      console.error("chartRef is null or undefined.");
    }

    props.setOpenDialog(false);
  }
  return (
    <Dialog
      open={!!props.openDialog}
      onOpenChange={() => props.setOpenDialog(!props.openDialog)}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&#39;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
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
                  <FormDescription>
                    This is your public display position.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

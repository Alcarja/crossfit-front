"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Field = {
  id: string;
  label: string;
  name: string;
};

const initialFields: Field[] = [
  { id: "field-1", label: "Name", name: "name" },
  { id: "field-2", label: "Email", name: "email" },
  { id: "field-3", label: "Phone", name: "phone" },
];

type FormValues = {
  [key: string]: string;
};

export default function DraggableAccordionForm() {
  const [fields, setFields] = useState<Field[]>(initialFields);

  const form = useForm<FormValues>({
    defaultValues: fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as FormValues),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over?.id);
      setFields(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const onSubmit = (data: FormValues) => {
    const orderedValues = fields.map((field) => ({
      name: field.name,
      label: field.label,
      value: data[field.name],
    }));

    console.log("Ordered Submission:", orderedValues);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Draggable Accordion Form</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="space-y-2">
                {fields.map((field) => (
                  <SortableField key={field.id} id={field.id}>
                    <AccordionItem value={field.id}>
                      <AccordionTrigger className="cursor-move">
                        {field.label}
                      </AccordionTrigger>
                      <AccordionContent>
                        <FormField
                          control={form.control}
                          name={field.name}
                          render={({ field: inputField }) => (
                            <FormItem className="pt-2">
                              <FormLabel>{field.label}</FormLabel>
                              <FormControl>
                                <Input
                                  {...inputField}
                                  placeholder={`Enter ${field.label}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </SortableField>
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </form>
      </Form>
    </div>
  );
}

function SortableField({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded shadow"
    >
      {children}
    </div>
  );
}

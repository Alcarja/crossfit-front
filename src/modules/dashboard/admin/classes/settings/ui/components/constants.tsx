import { TemplateClass } from "./types";

export const DEFAULT_START = 9;
export const DEFAULT_END = 22;

export const typeColors: Record<string, string> = {
  WOD: "bg-blue-200 text-blue-900",
  Gymnastics: "bg-red-200 text-red-900",
  Weightlifting: "bg-purple-200 text-purple-900",
  Endurance: "bg-green-200 text-green-900",
  Foundations: "bg-pink-200 text-pink-900",
  Kids: "bg-yellow-200 text-yellow-900",
  Default: "bg-gray-200 text-gray-800",
};

export const classPalette: TemplateClass[] = [
  {
    id: "template-1",
    name: "WOD",
    duration: 60,
    coach: "",
    zone: "",
    type: "WOD",
    capacity: 20,
  },
  {
    id: "template-2",
    name: "Weightlifting",
    duration: 60,
    coach: "",
    zone: "",
    type: "Weightlifting",
    capacity: 10,
  },
  {
    id: "template-3",
    name: "Gymnastics",
    duration: 45,
    coach: "",
    zone: "",
    type: "Gymnastics",
    capacity: 8,
  },
  {
    id: "template-4",
    name: "Endurance",
    duration: 60,
    coach: "",
    zone: "",
    type: "Endurance",
    capacity: 12,
  },
  {
    id: "template-5",
    name: "Open Box",
    duration: 60,
    coach: "",
    zone: "",
    type: "Open Box",
    capacity: 8,
  },
  {
    id: "template-6",
    name: "Foundations",
    duration: 60,
    coach: "",
    zone: "",
    type: "Foundations",
    capacity: 12,
  },
  {
    id: "template-7",
    name: "Kids",
    duration: 60,
    coach: "",
    zone: "",
    type: "Kids",
    capacity: 12,
  },
];

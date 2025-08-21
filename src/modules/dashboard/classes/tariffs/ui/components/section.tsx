import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="border-none shadow-sm">
    <CardHeader className="flex gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <CardTitle>{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default Section;

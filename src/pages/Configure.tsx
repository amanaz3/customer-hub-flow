import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Manage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configure</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Configuration options have been moved to Configure 1.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Manage;

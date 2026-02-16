import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { title: "Total Events", value: "0", description: "Active events on platform" },
  { title: "Total Venues", value: "0", description: "Registered venues" },
  { title: "Pending Submissions", value: "0", description: "Awaiting review" },
  { title: "Tickets Sold", value: "0", description: "All time" },
];

export default async function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Overview of your platform activity.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  MapPinIcon,
  InboxIcon,
  TicketIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalEvents: number;
    totalVenues: number;
    pendingSubmissions: number;
    ticketsSold: number;
  };
}

const cardConfig = [
  {
    key: "totalEvents" as const,
    title: "Total Events",
    description: "Active events on platform",
    icon: CalendarIcon,
  },
  {
    key: "totalVenues" as const,
    title: "Total Venues",
    description: "Registered venues",
    icon: MapPinIcon,
  },
  {
    key: "pendingSubmissions" as const,
    title: "Pending Submissions",
    description: "Awaiting review",
    icon: InboxIcon,
  },
  {
    key: "ticketsSold" as const,
    title: "Tickets Sold",
    description: "All time",
    icon: TicketIcon,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cardConfig.map((config) => {
        const Icon = config.icon;
        const value = stats[config.key];

        return (
          <Card key={config.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {config.title}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {value.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {config.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

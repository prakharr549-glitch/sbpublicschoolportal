import EmergencyBroadcastClient from "./emergency-broadcast-client";

export default function EmergencyBroadcastsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Emergency Broadcast Analysis
      </h1>
      <EmergencyBroadcastClient />
    </div>
  );
}

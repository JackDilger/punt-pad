import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ActivityOverview = () => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Total Bets</div>
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Win Rate</div>
              <div className="text-2xl font-bold">0%</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Profit/Loss</div>
              <div className="text-2xl font-bold">£0.00</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">ROI</div>
              <div className="text-2xl font-bold">0%</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Recent Activity</h3>
            <div className="text-sm text-muted-foreground text-center py-4">
              No bets recorded yet
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

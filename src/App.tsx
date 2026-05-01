import { AppLayout } from "./components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"

function App() {
  return (
    <AppLayout pageTitle="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Node Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge>Healthy</Badge>
            <Badge variant="destructive">Failing</Badge>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">$12,400</p>
            <p className="text-xs text-muted-foreground mt-1">+18% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clusters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">3</p>
            <p className="text-xs text-muted-foreground mt-1">All clusters healthy</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default App

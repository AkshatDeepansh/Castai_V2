import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"

function App() {
  return (
    <div className="dark min-h-screen bg-background p-8 flex flex-col gap-4">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Node health</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge>Healthy</Badge>
          <Badge variant="destructive">Failing</Badge>
          <Badge variant="outline">Pending</Badge>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button>Primary action</Button>
        <Button variant="outline">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  )
}

export default App
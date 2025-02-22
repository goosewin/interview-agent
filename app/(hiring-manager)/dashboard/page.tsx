import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="w-full">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild className="w-full">
              <Link href="/interviews/new">Schedule New Interview</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/candidates/new">Add New Candidate</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {/* Add a table or list of upcoming interviews here */}
              <p>No upcoming interviews</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

export default function Interviews() {
  // This is dummy data. In a real application, you would fetch this from your API.
  const interviews = [
    { id: 1, candidate: "John Doe", date: "2023-06-15", time: "14:00", status: "Scheduled" },
    { id: 2, candidate: "Jane Smith", date: "2023-06-16", time: "10:00", status: "Completed" },
  ]

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<(typeof interviews)[0] | null>(null)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Interviews</h1>
        <Button asChild>
          <Link href="/interviews/new">Schedule New Interview</Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Candidate</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((interview) => (
              <TableRow key={interview.id}>
                <TableCell>{interview.candidate}</TableCell>
                <TableCell>{interview.date}</TableCell>
                <TableCell>{interview.time}</TableCell>
                <TableCell>{interview.status}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/interviews/${interview.id}/reschedule`}>Reschedule</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setSelectedInterview(interview)
                          setIsCancelDialogOpen(true)
                        }}
                      >
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this interview? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedInterview && (
            <div className="py-4">
              <p>
                <strong>Candidate:</strong> {selectedInterview.candidate}
              </p>
              <p>
                <strong>Date:</strong> {selectedInterview.date}
              </p>
              <p>
                <strong>Time:</strong> {selectedInterview.time}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Interview
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Here you would typically send the cancellation request to your API
                console.log(`Cancelling interview ${selectedInterview?.id}`)
                setIsCancelDialogOpen(false)
                // Optionally, update the local state or refetch the interviews
              }}
            >
              Cancel Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


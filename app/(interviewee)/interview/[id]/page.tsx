"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Interview() {
  const { id } = useParams()
  const [problem, setProblem] = useState("")
  const [code, setCode] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    // Fetch problem details based on the interview ID
    // This is a placeholder and should be replaced with actual API call
    setProblem("Sample problem description")
  }, [])

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setIsRecording(true)
      // Implement actual recording logic here
    } catch (err) {
      console.error("Error accessing media devices:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Technical Interview</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{problem}</p>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea className="min-h-[200px]" value={code} onChange={(e) => setCode(e.target.value)} />
        </CardContent>
      </Card>
      <Button variant={isRecording ? "destructive" : "default"} onClick={startRecording} disabled={isRecording}>
        {isRecording ? "Recording..." : "Start Recording"}
      </Button>
    </div>
  )
}


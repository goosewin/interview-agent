import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor, { type OnMount } from "@monaco-editor/react"
import { Play } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
]

export default function InterviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const editorRef = useRef<any>(null)
  const [timeLeft, setTimeLeft] = useState(45 * 60) // 45 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(
    `function solve(input) {\n  // Your code here\n}\n\n// Example test case\nconsole.log(solve([1, 2, 3]));`,
  )
  const [output, setOutput] = useState("")

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    startCamera()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(timer)
            setIsRunning(false)
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const handleRunCode = () => {
    if (editorRef.current) {
      const editorCode = editorRef.current.getValue()
      try {
        // This is a simple evaluation. In a real-world scenario, you'd want to use a safer method
        // of code execution, possibly on the server-side.
        const result = eval(editorCode)
        setOutput(`Output: ${result}\n`)
      } catch (error) {
        setOutput(`Error: ${error}\n`)
      }
    }
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen rounded-lg">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Camera View */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Candidate</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Profile */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">AI Interviewer</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src=""
                      alt="AI Interviewer"
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timer */}
            <Card>
              <CardContent className="p-4 flex items-center justify-center">
                <span className="font-medium text-muted-foreground mr-2">Time Remaining:</span>
                <span className="font-bold text-xl text-primary">{formatTime(timeLeft)}</span>
              </CardContent>
            </Card>

            {/* Problem Description */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>Problem: Array Sum</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <p className="text-muted-foreground leading-relaxed">
                  Write a function that takes an array of numbers and returns their sum. The function should handle
                  empty arrays by returning 0, and should be able to process both positive and negative numbers.
                  <br />
                  <br />
                  Examples:
                  <br />- solve([1, 2, 3]) → 6
                  <br />- solve([-1, 1]) → 0
                  <br />- solve([]) → 0
                  <br />
                  <br />
                  Additional Requirements:
                  <br />
                  1. Handle invalid inputs gracefully
                  <br />
                  2. Optimize for large arrays
                  <br />
                  3. Consider edge cases like maximum number limits
                  <br />
                  <br />
                  Constraints:
                  <br />- Array length: 0 ≤ n ≤ 10^5
                  <br />- Array elements: -10^9 ≤ arr[i] ≤ 10^9
                </p>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75}>
          <div className="flex h-full flex-col p-4">
            {/* Language Selector */}
            <div className="mb-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ResizablePanelGroup direction="vertical" className="flex-1 rounded-lg border">
              <ResizablePanel defaultSize={70}>
                <div className="h-full bg-zinc-950 p-4">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      automaticLayout: true,
                    }}
                    onMount={handleEditorDidMount}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30}>
                <div className="h-full bg-black p-4 relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleRunCode}
                  >
                    <Play className="h-4 w-4 mr-2" /> Run
                  </Button>
                  <pre className="text-white font-mono mt-8 overflow-auto h-[calc(100%-3rem)]">{output}</pre>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

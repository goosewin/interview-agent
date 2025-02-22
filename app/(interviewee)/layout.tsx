import type React from "react"
export default function IntervieweeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-4">{children}</div>
    </div>
  )
}


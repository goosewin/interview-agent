import PerformanceReview from "@/components/PerformanceReview";

export default function ReviewPage({ params }: { params: { id: string } }) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Interview Performance Review</h1>
        <PerformanceReview interviewId={params.id} />
      </div>
    );
  }
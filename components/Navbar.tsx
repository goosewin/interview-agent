import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          AI Interviewer
        </Link>
        <div className="space-x-4">
          <Link href="/dashboard" className="hover:text-gray-300">
            Dashboard
          </Link>
          <Link href="/candidates" className="hover:text-gray-300">
            Candidates
          </Link>
          <Link href="/interviews" className="hover:text-gray-300">
            Interviews
          </Link>
          <Link href="/problems" className="hover:text-gray-300">
            Problems
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

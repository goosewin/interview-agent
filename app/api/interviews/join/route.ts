import { getInterviewByIdentifier } from '@/lib/db';
import { NextResponse } from 'next/server';

// Hardcoded problem for now
const SAMPLE_PROBLEM = `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers in the array such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

## Example 1:

\`\`\`js
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

## Example 2:

\`\`\`js
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

## Constraints:
* 2 ≤ nums.length ≤ 10⁴
* -10⁹ ≤ nums[i] ≤ 10⁹
* -10⁹ ≤ target ≤ 10⁹
* Only one valid answer exists.
`;

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const interview = await getInterviewByIdentifier(identifier);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Always return the hardcoded problem for now
    return NextResponse.json({
      ...interview,
      problemDescription: SAMPLE_PROBLEM,
    });
  } catch (error) {
    console.error('Error joining interview:', error);
    return NextResponse.json({ error: 'Failed to join interview' }, { status: 500 });
  }
}

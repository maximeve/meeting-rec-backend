// Example usage of the actionable-points API endpoint
// This file demonstrates how to call the API from your React Native app

interface ActionablePoint {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  dueDate: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

interface ActionablePointsResponse {
  ok: boolean;
  actionablePoints: ActionablePoint[];
}

export async function extractActionablePoints(
  transcription: string,
  context?: string
): Promise<ActionablePointsResponse> {
  try {
    const response = await fetch('/api/actionable-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcription,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ActionablePointsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error extracting actionable points:', error);
    throw error;
  }
}

// Example usage:
export async function processMeetingTranscription() {
  const transcription = `
    Today we discussed the Q1 project timeline. John needs to complete the UI design by Friday, 
    and Sarah will review the backend changes next week. We also need to schedule a client 
    presentation for next month. Mike mentioned that the database migration should be done 
    by the end of this week.
  `;

  try {
    const result = await extractActionablePoints(
      transcription,
      'Weekly team standup meeting'
    );

    console.log('Extracted actionable points:', result.actionablePoints);
    
    // Process each actionable point
    result.actionablePoints.forEach((point) => {
      console.log(`- ${point.title} (${point.priority} priority)`);
      console.log(`  Description: ${point.description}`);
      if (point.dueDate) console.log(`  Due: ${point.dueDate}`);
      if (point.assignee) console.log(`  Assignee: ${point.assignee}`);
    });
  } catch (error) {
    console.error('Failed to process transcription:', error);
  }
}

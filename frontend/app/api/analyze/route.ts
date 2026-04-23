export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dreamText = body.dreamText;

    if (!dreamText || !dreamText.trim()) {
      return Response.json(
        { error: "Dream text is required." },
        { status: 400 }
      );
    }

    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: dreamText }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.detail || data.error || "Backend request failed." },
        { status: response.status }
      );
    }
    const sortedEmotions = Object.entries((data.emotions ?? {}) as Record<string, number>).sort(
      (left, right) => right[1] - left[1]
    );
    const [topEmotion, topScore] = sortedEmotions[0] ?? [null, 0];
    const emotionSignals = sortedEmotions
      .filter(([, score]) => score >= 0.1)
      .slice(0, 4)
      .map(([label]) => label);

    return Response.json({
      input_text: dreamText,
      cluster: data.cluster_id,
      confidence: topScore,
      archetype_name: data.archetype,
      emotion: topEmotion
        ? {
            label: topEmotion,
            confidence: topScore,
            signals: emotionSignals,
          }
        : undefined,
      plot_point_2d: data.point ?? { x: 0, y: 0 },
      plot_point_3d: { x: data.point?.x ?? 0, y: data.point?.y ?? 0, z: 0 },
    });
  } catch {
    return Response.json(
      { error: "Something went wrong while analyzing the dream." },
      { status: 500 }
    );
  }
}
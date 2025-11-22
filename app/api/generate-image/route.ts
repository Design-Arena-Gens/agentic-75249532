import { NextResponse } from "next/server";
import { GenerateImagePayload } from "@/lib/types";

const DEFAULT_MODEL = process.env.GOOGLE_IMAGE_MODEL ?? "imagen-3.0-generate";
const API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let payload: GenerateImagePayload;
  try {
    payload = (await request.json()) as GenerateImagePayload;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload.", details: String(error) },
      { status: 400 }
    );
  }

  const {
    prompt,
    history = [],
    baseImage,
    aspectRatio,
    imageSize
  } = payload;

  if (!prompt || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400 }
    );
  }

  const modelId = DEFAULT_MODEL.startsWith("models/")
    ? DEFAULT_MODEL
    : `models/${DEFAULT_MODEL}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`;

  const contextText = history
    .map(({ role, text }) => {
      if (!text) return null;
      const speaker = role === "assistant" ? "Assistant" : "User";
      return `${speaker}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");

  const parts: Array<Record<string, unknown>> = [];

  if (baseImage) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: baseImage.replace(/^data:image\/\w+;base64,/, "")
      }
    });
  }

  const combinedPrompt =
    contextText.length > 0
      ? `${contextText}\nUser (latest request): ${prompt}`
      : prompt;

  parts.push({ text: combinedPrompt });

  const generationConfig: Record<string, unknown> = {
    responseMimeType: "image/png",
    responseModalities: ["IMAGE"]
  };

  const imageConfig: Record<string, string> = {};
  if (aspectRatio) {
    imageConfig.aspectRatio = aspectRatio;
  }
  if (imageSize) {
    imageConfig.imageSize = imageSize;
  }

  if (Object.keys(imageConfig).length > 0) {
    generationConfig.imageConfig = imageConfig;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts
        }
      ],
      generationConfig
    })
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    return NextResponse.json(
      {
        error: "Image generation failed.",
        details: errorBody
      },
      { status: response.status }
    );
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const partsResponse: Array<Record<string, any>> =
    candidate?.content?.parts ?? [];
  const imagePart = partsResponse.find(
    (part) => part?.inlineData?.data
  );

  if (!imagePart) {
    return NextResponse.json(
      {
        error: "No image data returned by the model.",
        details: data
      },
      { status: 502 }
    );
  }

  const altText =
    partsResponse.find((part) => typeof part?.text === "string")?.text ??
    `AI generated artwork inspired by: ${prompt}`;

  return NextResponse.json({
    imageBase64: imagePart.inlineData.data,
    altText,
    modelVersion: data?.modelVersion
  });
}

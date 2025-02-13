// src/app/api/identify/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }
    if (images.length > 4) {
      return NextResponse.json(
        { error: "You can upload up to 4 images only" },
        { status: 400 }
      );
    }

    // Create an array of image messages for the OpenAI API
    const imageMessages = images.map((img: { base64: string; type: string }) => {
      const dataUrl = `data:${img.type};base64,${img.base64}`;
      return {
        type: "image_url",
        image_url: { url: dataUrl },
      };
    });

    // Construct the message with a text prompt and the images
    const messageContent = [
      {
        type: "text",
        text: "Identify all grocery items in these images and return a list.",
      },
      ...imageMessages,
    ];

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "o1", // or change to the model you prefer
      messages: [
        {
          role: "user",
          // Disable the rule for this cast inline
          content: messageContent as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      ],
      store: true, // optional; refer to OpenAI docs for more details
    });

    return NextResponse.json({ result: response.choices[0] });
  } catch (error) {
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    }
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

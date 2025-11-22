"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";

const INTRO_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  text:
    "Hi, I am your generative design partner. Describe what you want to see or how to tweak the current image, and I will regenerate it live for you.",
  createdAt: Date.now()
};

const ASPECT_RATIOS = ["1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [imageSize, setImageSize] = useState<string>("1K");
  const [seedImage, setSeedImage] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const assistantImages = useMemo(
    () => messages.filter((m) => m.role === "assistant" && m.imageBase64),
    [messages]
  );

  const activeImage = useMemo(() => {
    if (seedImage) {
      return { imageBase64: seedImage, id: "upload" };
    }
    if (!activeImageId) return assistantImages[assistantImages.length - 1];
    return assistantImages.find((img) => img.id === activeImageId);
  }, [assistantImages, activeImageId, seedImage]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (isLoading) return;
      const trimmed = input.trim();
      if (!trimmed) return;

      setError(null);
      setIsLoading(true);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
        createdAt: Date.now()
      };

      const optimisticMessages = [...messages, userMessage];
      setMessages(optimisticMessages);
      setInput("");
      scrollToBottom();

      const history = optimisticMessages
        .filter((msg) => msg.text)
        .map((msg) => ({
          role: msg.role,
          text: msg.text
        }));

      const baseImage = seedImage ?? activeImage?.imageBase64 ?? null;

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: trimmed,
            history,
            baseImage,
            aspectRatio,
            imageSize
          })
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to generate image.");
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: payload?.altText,
          imageBase64: payload?.imageBase64,
          createdAt: Date.now()
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setActiveImageId(assistantMessage.id);
        setSeedImage(null);
        scrollToBottom();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeImage?.imageBase64,
      aspectRatio,
      imageSize,
      input,
      isLoading,
      messages,
      scrollToBottom,
      seedImage
    ]
  );

  const handleFileUpload = useCallback(async (file: File) => {
    const toBase64 = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result.split(",").pop() ?? "");
          } else {
            reject(new Error("Unable to read file."));
          }
        };
        reader.onerror = (event) => {
          reject(event instanceof ProgressEvent ? event : new Error("Failed to read file."));
        };
        reader.readAsDataURL(file);
      });

    const fileData = await toBase64();
    setSeedImage(fileData);
    setActiveImageId(null);
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Agentic Image Studio
            </h1>
            <p className="text-sm text-slate-400">
              Conversational AI art generation powered by Google Imagen. Chat with your artwork and iterate live.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            Live session ready
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <section className="flex h-[70vh] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl shadow-black/30 lg:h-[82vh]">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex flex-col gap-3 rounded-xl border border-transparent p-4 transition ${
                  message.role === "assistant"
                    ? "bg-slate-900/60"
                    : "bg-slate-950/50 border-slate-800"
                }`}
              >
                <header className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      message.role === "assistant"
                        ? "text-brand-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {message.role === "assistant" ? "Studio" : "You"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </header>
                {message.text && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {message.text}
                  </p>
                )}
                {message.imageBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageId(message.id);
                      setSeedImage(null);
                    }}
                    className={`group relative overflow-hidden rounded-xl border ${
                      activeImage?.id === message.id
                        ? "border-brand-400 ring-2 ring-brand-500/60"
                        : "border-slate-700 hover:border-brand-400/60"
                    }`}
                  >
                    <Image
                      src={`data:image/png;base64,${message.imageBase64}`}
                      alt={message.text ?? "Generated artwork"}
                      width={1024}
                      height={1024}
                      unoptimized
                      className="h-auto w-full rounded-[inherit] object-cover transition group-hover:scale-[1.01]"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                      Use as base
                    </span>
                  </button>
                )}
              </article>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  activeImage
                    ? "Describe how you'd like to evolve this image..."
                    : "Describe the scene you want to create..."
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                disabled={isLoading}
                className="h-28 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 shadow-inner outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/50 disabled:opacity-70"
              />
              <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-slate-500">
                Press Enter to send
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <label className="flex items-center gap-2">
                  <span className="text-slate-300">Aspect</span>
                  <select
                    value={aspectRatio}
                    onChange={(event) => setAspectRatio(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:border-brand-400 focus:outline-none"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-slate-300">Size</span>
                  <select
                    value={imageSize}
                    onChange={(event) => setImageSize(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:border-brand-400 focus:outline-none"
                  >
                    {IMAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                    Generating…
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 12h13.5m0 0-6.75-6.75M18.75 12l-6.75 6.75"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </form>
        </section>

        <aside className="lg:w-80">
          <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 shadow-inner shadow-black/20">
            <h2 className="text-sm font-semibold text-slate-200">
              Active canvas
            </h2>
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
              {activeImage?.imageBase64 ? (
                <Image
                  src={`data:image/png;base64,${activeImage.imageBase64}`}
                  alt="Active generative canvas"
                  width={1024}
                  height={1024}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                  Generate an image to start iterating.
                </div>
              )}
            </div>
            <label className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-xs text-slate-400 transition hover:border-brand-400/60 hover:text-brand-200">
              <span className="font-semibold text-slate-200">
                Drop in a base image
              </span>
              <span>
                Upload a PNG or JPG to guide the next generation.
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    await handleFileUpload(file);
                  } catch (err) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : "Failed to load image.";
                    setError(message);
                  }
                }}
              />
            </label>
            {assistantImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Session gallery</span>
                  <button
                    type="button"
                    className="text-brand-300 hover:text-brand-200"
                    onClick={() => {
                      setMessages([INTRO_MESSAGE]);
                      setActiveImageId(null);
                      setSeedImage(null);
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {assistantImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => {
                        setActiveImageId(image.id);
                        setSeedImage(null);
                      }}
                      className={`relative overflow-hidden rounded-lg border ${
                        activeImage?.id === image.id
                          ? "border-brand-400 ring-2 ring-brand-400/60"
                          : "border-slate-700 hover:border-brand-400/60"
                      }`}
                    >
                      <Image
                        src={`data:image/png;base64,${image.imageBase64}`}
                        alt={image.text ?? "Generated variation"}
                        width={512}
                        height={512}
                        unoptimized
                        className="h-24 w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                        Use
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

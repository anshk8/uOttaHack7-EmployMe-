"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Application } from "../types";
import Groq from "groq-sdk";
import PdfViewer from "../components/pdfViewer";

// Groq Initialize
const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
);

export default function EmployerViewPosting(props: Application) {
    const [resumeText, setResumeText] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Pending");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        try {
          const response = await fetch('/api/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(props.id),
          });
    
          if (!response.ok) {
            setStatus('Failed to update status');
          }
        } catch (error) {
          console.error('Error updating status:', error);
          setStatus('An error occurred.');
        }
      };

    // Function to fetch the candidate's resume_text
    async function fetchCandidate() {
        try {
            const { data: candidate, error } = await supabase
                .from("candidates")
                .select("resume_text")
                .single();

            if (error) {
                console.error("Error fetching candidate:", error.message);
                return null;
            }

            return candidate?.resume_text;
        } catch (error) {
            console.error("Unexpected error fetching candidate:", error);
            return null;
        }
    }
    async function getSummary(text: string): Promise<string | null> {
        try {
            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `Summarize this resume and present the candidate's skills and strengths. Keep it short and simple highlighting key skills and do not go into super detail about each skill.: ${text}`,
                    },
                ],
                model: "llama-3.3-70b-versatile",
            });

            // Extract the summary content depending on the response structure
            const summaryContent = response.choices?.[0]?.message?.content;

            if (!summaryContent) {
                console.error("No summary returned from Groq.");
                return null;
            }

            return summaryContent; // Return the summary text
        } catch (error) {
            console.error("Error generating summary:", error);
            return null;
        }
    }

    // Fetch the resume_text and generate summary on component mount
    useEffect(() => {
        async function loadResumeAndSummary() {
            const text = await fetchCandidate();
            setResumeText(text);

            if (text) {
                const summaryResult = await getSummary(text);
                setSummary(summaryResult); // Set the summary in the state
            }
        }

        loadResumeAndSummary();
    }, []);

    return (
        <div className="w-[80vw] h-[90vh] bg-white overflow-y-scroll p-4 text-black flex flex-row">
            <div className="resumeSectionLeft flex flex-col gap-2 h-full w-1/2 justify-start flex-grow-1">
                <h2 className="text-black font-semibold text-2xl">Resume</h2>
                <PdfViewer url="/resume.pdf" />
            </div>
            <div className="flex flex-col justify-between w-[40%]">
                <div>
                    <h2 className="text-lg font-bold">Resume Summary</h2>
                    {summary ? (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {summary}
                        </p>
                    ) : (
                        resumeText && (
                            <p className="text-gray-500">
                                Generating summary...
                            </p>
                        )
                    )}
                </div>

                {/* user info */}
                <p className="font-semibold">{props.user.name}</p>
                <p>{props.user.email}</p>
                <p>{props.date}</p>
                <p>{props.user.gender}</p>
                <p>{props.user.description}</p>

                {/* update status */}
                <form className="flex flex-row gap-4" onSubmit={handleSubmit}>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="select select-bordered"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Interview">Interview</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button type="submit" className="btn btn-primary">Update</button>
                </form>
                <button
                    className={"btn btn-secondary"}
                    onClick={() => props.stateSetter("viewAppList")}>
                    Back
                </button>
            </div>
        </div>
    );
}

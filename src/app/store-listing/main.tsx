/**
 * Store Listing Reference Page
 *
 * This page provides all the text content needed for submitting GetShitDone
 * to the Chrome Web Store. Copy and paste the content below into the
 * appropriate fields when creating your store listing.
 *
 * Chrome Web Store fields this page covers:
 * - Short description (132 characters max)
 * - Full description
 * - Single purpose field
 * - Privacy policy URL
 */

import React from "react";
import ReactDOM from "react-dom/client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "~/components/layout/layout";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

/**
 * Copyable text component with copy button
 */
interface CopyableTextProps {
  readonly label: string;
  readonly text: string;
  readonly maxLength?: number;
  readonly className?: string;
}

const CopyableText = ({
  label,
  text,
  maxLength,
  className,
}: CopyableTextProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText =
    maxLength && text.length > maxLength
      ? `${text.slice(0, maxLength)}...`
      : text;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="relative group">
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          {displayText}
        </pre>
        {maxLength && text.length > maxLength && (
          <p className="mt-1 text-xs text-muted-foreground">
            Length: {text.length} / {maxLength} characters
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Main Store Listing Reference Component
 */
const StoreListing = () => {
  // Store listing content
  const shortDescription =
    "AI-powered focus tool that intelligently blocks distractions based on your current task.";

  const fullDescription = `GetShitDone helps you stay focused on what actually matters.

Unlike traditional blockers that use static blocklists, GetShitDone uses AI to understand context and make smart decisions about what content is relevant to your current task.

How it works:
1. Tell the extension what you're working on (e.g., "Building a React dashboard")
2. Browse the web normally - the extension analyzes pages in the background
3. If you land on distracting content, it blocks the page
4. If blocked, chat with the AI to explain why you need access
5. Get time-limited access when you make a good case

Smart features:
Context-aware blocking - The AI understands "fake productivity" (e.g., reading about database optimization when you're working on frontend)
Negotiated access - Chat with the AI assistant when you need temporary access to blocked sites
Selective removal - Keep useful content while removing distractions (e.g., watch a tutorial, hide the sidebar recommendations)
You bring your own API key - No subscriptions, no accounts, your data stays private

Privacy first:
All data stays on your device - We don't have any servers
Your API keys are stored locally in your browser
Chat history is automatically deleted after 24 hours
Open source - You can review the code anytime

Perfect for:
Developers who get lost in documentation rabbit holes
Researchers who fall down article wormholes
Students who "study" by watching productivity videos instead of studying
Anyone who struggles with fake productivity

Stop getting distracted by content that feels productive but isn't. Start getting shit done.`;

  const singlePurpose = `GetShitDone's single purpose is to help users stay focused on their current task by:

1. Analyzing web page content using AI to determine if it's relevant to the user's stated task
2. Blocking or modifying access to distracting content
3. Allowing users to negotiate temporary access through a chat interface

All functionality serves this core productivity purpose. No ads, no tracking, no unrelated features.`;

  const privacyUrl =
    "https://github.com/pstemporowski/getshitdone/blob/main/PRIVACY.md";

  const category = "Productivity";

  const keywords = [
    "focus",
    "productivity",
    "ai",
    "blocker",
    "distraction",
    "work",
    "study",
    "task",
    "ai assistant",
  ].join(", ");

  return (
    <Layout>
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Chrome Web Store Listing
          </h1>
          <p className="text-muted-foreground">
            Copy and paste the content below into your Chrome Web Store
            developer dashboard when submitting GetShitDone.
          </p>
        </div>

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CopyableText
              label="Short Description (max 132 characters)"
              text={shortDescription}
              maxLength={132}
            />
            <Separator />
            <CopyableText label="Full Description" text={fullDescription} />
          </CardContent>
        </Card>

        {/* Category and Keywords */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category & Discovery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CopyableText label="Category" text={category} />
            <Separator />
            <CopyableText label="Keywords (comma-separated)" text={keywords} />
          </CardContent>
        </Card>

        {/* Required Fields */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CopyableText
              label="Single Purpose Field"
              text={singlePurpose}
              className="mb-4"
            />
            <p className="text-sm text-muted-foreground">
              The single purpose field clearly describes the extension's narrow,
              focused functionality. This is required by Chrome Web Store
              policies.
            </p>
            <Separator />
            <CopyableText label="Privacy Policy URL" text={privacyUrl} />
            <p className="text-sm text-muted-foreground">
              Link to your privacy policy or a page that contains privacy
              information. The privacy.html page is also included in this build.
            </p>
          </CardContent>
        </Card>

        {/* Screenshots Guide */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Screenshots Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              You need at least 1 screenshot, maximum 5. Recommended sizes:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
              <li>1280 x 800 pixels (recommended)</li>
              <li>640 x 400 pixels (minimum)</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Suggested screenshots:</strong>
            </p>
            <ol className="ml-6 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Main popup showing task input and extension status</li>
              <li>Blocked page overlay with chat interface</li>
              <li>Settings page with API key configuration</li>
              <li>Side panel with expanded view</li>
              <li>Example of selective element removal</li>
            </ol>
          </CardContent>
        </Card>

        {/* Privacy Policy Link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Privacy Policy Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Your extension includes a built-in Privacy Policy page. You can
              access it at:
            </p>
            <code className="rounded bg-muted px-3 py-2 text-sm">
              chrome-extension://{"/&lt;your-extension-id&gt;/privacy.html"}
            </code>
            <p className="mt-4 text-sm text-muted-foreground">
              After installing the extension, right-click the extension icon and
              inspect the extension ID, then navigate to the privacy.html page
              to view it.
            </p>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                "Short description (132 chars or less)",
                "Full description",
                "Single purpose field filled out",
                "Privacy policy URL provided",
                "At least 1 screenshot (1280x800 or 640x400)",
                "Category: Productivity",
                "ZIP file built and ready (bun run build:chrome)",
                "Developer account info verified",
                "Developer email can receive external emails",
                "Privacy policy page accessible in extension",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="mt-6 rounded-lg bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold text-foreground">
            Quick Tips for Approval
          </h3>
          <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Be honest about what the extension does</li>
            <li>Don't exaggerate features in screenshots</li>
            <li>Make sure your developer email can receive messages</li>
            <li>Double-check your privacy policy is accurate</li>
            <li>Test the extension thoroughly before submitting</li>
            <li>Respond quickly to any review feedback</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StoreListing />
  </React.StrictMode>,
);

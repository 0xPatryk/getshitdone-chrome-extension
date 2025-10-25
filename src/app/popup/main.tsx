import React from "react";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";

import { Settings } from "lucide-react";
import { Layout } from "~/components/layout/layout";
import { AlwaysRemoveInput } from "~/components/popup/always-remove-input";
import { ExtensionToggle } from "~/components/popup/extension-toggle";
import { StatusDisplay } from "~/components/popup/status-display";
import { TaskInput } from "~/components/popup/task-input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

const Popup = () => {
  return (
    <div className="w-[23rem] p-4 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered distraction blocking for better productivity
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <StatusDisplay />
          <ExtensionToggle />
        </div>

        <Separator />

        <TaskInput />

        <Separator />

        <AlwaysRemoveInput />

        <Separator />

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              browser.tabs.create({
                url: `${browser.runtime.getURL("/tabs.html")}#settings`,
              });
            }}
            className="gap-2"
          >
            <Settings className="size-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Layout>
      <Popup />
    </Layout>
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";

import { ExtensionToggle } from "~/components/popup/extension-toggle";
import { StatusDisplay } from "~/components/popup/status-display";
import { TaskInput } from "~/components/popup/task-input";
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
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);

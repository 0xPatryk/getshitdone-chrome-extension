import React from "react";
import ReactDOM from "react-dom/client";

import { Layout } from "~/components/layout/layout";
import { ApiKeySettings } from "~/components/options/api-key-settings";

const Options = () => {
  return (
    <Layout>
      <div className="w-full max-w-2xl">
        <ApiKeySettings />
      </div>
    </Layout>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);

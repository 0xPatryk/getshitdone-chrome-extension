import { Layout } from "@/components/layout/layout";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { SettingsTab } from "./settings";

const router = createHashRouter([
  {
    children: [
      {
        path: "settings",
        element: <SettingsTab />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Layout>
    <RouterProvider router={router} />,
  </Layout>,
);

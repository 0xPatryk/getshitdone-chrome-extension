import { StorageKey, useStorage } from "@/lib/storage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const ExtensionToggle = () => {
  const { data: isEnabled, set: setEnabled } = useStorage(StorageKey.EXTENSION_ENABLED);

  const handleToggle = async (enabled: boolean) => {
    try {
      await setEnabled(enabled);
    } catch (error) {
      console.error("Error toggling extension:", error);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="extension-toggle" className="text-base font-medium">
          Enable Focus Mode
        </Label>
        <p className="text-xs text-muted-foreground">
          {isEnabled 
            ? "AI analysis is active and will block distractions"
            : "Extension is paused - no content analysis"
          }
        </p>
      </div>
      <Switch
        id="extension-toggle"
        checked={isEnabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};
import { Intent, OverlayToaster } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useRef } from "react";

export function Updater() {
  const toasterRef = useRef<OverlayToaster>(null);

  const checkForUpdates = async (manual = false) => {
    try {
      const update = await check();
      if (update) {
        const toastKey = "updater-toast";

        toasterRef.current?.show(
          {
            message: `An update to version ${update.version} is available.`,
            intent: Intent.PRIMARY,
            icon: "cloud-download",
            timeout: 0,
            action: {
              text: "Update",
              onClick: async () => {
                toasterRef.current?.show(
                  {
                    message: "Downloading update...",
                    intent: Intent.PRIMARY,
                    icon: "cloud-download",
                    timeout: 0,
                  },
                  toastKey,
                );

                let downloaded = 0;
                let contentLength: number | undefined = 0;

                try {
                  await update.downloadAndInstall((event) => {
                    switch (event.event) {
                      case "Started":
                        contentLength = event.data.contentLength;
                        break;
                      case "Progress":
                        downloaded += event.data.chunkLength;
                        if (contentLength) {
                          const percent = Math.round(
                            (downloaded / contentLength) * 100,
                          );
                          toasterRef.current?.show(
                            {
                              message: `Downloading update... ${percent}%`,
                              intent: Intent.PRIMARY,
                              icon: "cloud-download",
                              timeout: 0,
                            },
                            toastKey,
                          );
                        }
                        break;
                      case "Finished":
                        toasterRef.current?.show(
                          {
                            message: "Update installed. Restarting...",
                            intent: Intent.SUCCESS,
                            icon: "tick",
                            timeout: 2000,
                          },
                          toastKey,
                        );
                        break;
                    }
                  });

                  await relaunch();
                } catch (e) {
                  toasterRef.current?.show({
                    message: `Update failed: ${e}`,
                    intent: Intent.DANGER,
                    icon: "error",
                  });
                }
              },
            },
          },
          toastKey,
        );
      } else if (manual) {
        toasterRef.current?.show({
          message: "You are up to date!",
          intent: Intent.SUCCESS,
          icon: "tick",
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      if (manual) {
        toasterRef.current?.show({
          message: "Failed to check for updates.",
          intent: Intent.DANGER,
          icon: "error",
        });
      }
    }
  };

  useEffect(() => {
    checkForUpdates();

    const setupListener = async () => {
      const unlisten = await listen("menu-check-update", () => {
        console.log("menu-check-update event received");
        checkForUpdates(true);
      });
      return unlisten;
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then((unlisten) => unlisten());
    };
  }, []);

  return <OverlayToaster ref={toasterRef} position="bottom-right" />;
}
